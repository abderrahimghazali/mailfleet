use anyhow::{Context, Result};
use aws_config::Region;
use aws_credential_types::Credentials;
use aws_sdk_sesv2::types::{EventDestinationDefinition, EventType as SesEventType, SnsDestination};
use aws_sdk_sns::Client as SnsClient;
use aws_sdk_sqs::Client as SqsClient;
use chrono::Utc;
use serde::Deserialize;
use uuid::Uuid;

use crate::database::models::{ContactStatus, SuppressedEmail, SuppressionReason};
use crate::database::storage::DatabaseStorage;

const CONFIG_SET_NAME: &str = "mailfleet-tracking";
const SNS_TOPIC_NAME: &str = "mailfleet-ses-events";
const SQS_QUEUE_NAME: &str = "mailfleet-ses-events-queue";

/// Build AWS clients with explicit credentials
async fn build_clients(
    access_key: &str,
    secret_key: &str,
    region: &str,
) -> Result<(aws_sdk_sesv2::Client, SnsClient, SqsClient)> {
    let creds = Credentials::new(access_key, secret_key, None, None, "mailfleet");
    let config = aws_config::from_env()
        .credentials_provider(creds)
        .region(Region::new(region.to_string()))
        .load()
        .await;

    Ok((
        aws_sdk_sesv2::Client::new(&config),
        SnsClient::new(&config),
        SqsClient::new(&config),
    ))
}

/// Provision SES Configuration Set + SNS Topic + SQS Queue + wire them together.
/// Returns the SQS queue URL for polling.
pub async fn setup_tracking(
    access_key: &str,
    secret_key: &str,
    region: &str,
) -> Result<TrackingConfig> {
    let (ses, sns, sqs) = build_clients(access_key, secret_key, region).await?;

    // 1. Create SNS topic (idempotent — returns existing if already created)
    let topic_result = sns
        .create_topic()
        .name(SNS_TOPIC_NAME)
        .send()
        .await
        .context("Failed to create SNS topic")?;
    let topic_arn = topic_result
        .topic_arn()
        .context("No topic ARN returned")?
        .to_string();
    eprintln!("[mailfleet] SNS topic: {}", topic_arn);

    // 2. Create SQS queue (idempotent)
    let queue_result = sqs
        .create_queue()
        .queue_name(SQS_QUEUE_NAME)
        .send()
        .await
        .context("Failed to create SQS queue")?;
    let queue_url = queue_result
        .queue_url()
        .context("No queue URL returned")?
        .to_string();
    eprintln!("[mailfleet] SQS queue: {}", queue_url);

    // Get queue ARN for subscription
    let attrs = sqs
        .get_queue_attributes()
        .queue_url(&queue_url)
        .attribute_names(aws_sdk_sqs::types::QueueAttributeName::QueueArn)
        .send()
        .await
        .context("Failed to get queue attributes")?;
    let queue_arn = attrs
        .attributes()
        .and_then(|a| a.get(&aws_sdk_sqs::types::QueueAttributeName::QueueArn))
        .context("No queue ARN")?
        .to_string();

    // 3. Allow SNS to write to SQS
    let policy = format!(
        r#"{{"Version":"2012-10-17","Statement":[{{"Effect":"Allow","Principal":{{"Service":"sns.amazonaws.com"}},"Action":"sqs:SendMessage","Resource":"{}","Condition":{{"ArnEquals":{{"aws:SourceArn":"{}"}}}}}}]}}"#,
        queue_arn, topic_arn
    );
    sqs.set_queue_attributes()
        .queue_url(&queue_url)
        .attributes(aws_sdk_sqs::types::QueueAttributeName::Policy, policy)
        .send()
        .await
        .context("Failed to set SQS policy")?;

    // 4. Subscribe SQS to SNS (idempotent)
    sns.subscribe()
        .topic_arn(&topic_arn)
        .protocol("sqs")
        .endpoint(&queue_arn)
        .send()
        .await
        .context("Failed to subscribe SQS to SNS")?;
    eprintln!("[mailfleet] SQS subscribed to SNS");

    // 5. Create SES Configuration Set (may already exist)
    let cs_exists = ses
        .get_configuration_set()
        .configuration_set_name(CONFIG_SET_NAME)
        .send()
        .await
        .is_ok();

    if !cs_exists {
        ses.create_configuration_set()
            .configuration_set_name(CONFIG_SET_NAME)
            .send()
            .await
            .context("Failed to create SES configuration set")?;
        eprintln!("[mailfleet] Created SES configuration set");
    }

    // 6. Create event destination on the configuration set
    // Delete existing first (to update), ignore errors
    let _ = ses
        .delete_configuration_set_event_destination()
        .configuration_set_name(CONFIG_SET_NAME)
        .event_destination_name("mailfleet-sns")
        .send()
        .await;

    ses.create_configuration_set_event_destination()
        .configuration_set_name(CONFIG_SET_NAME)
        .event_destination_name("mailfleet-sns")
        .event_destination(
            EventDestinationDefinition::builder()
                .enabled(true)
                .matching_event_types(SesEventType::Send)
                .matching_event_types(SesEventType::Delivery)
                .matching_event_types(SesEventType::Open)
                .matching_event_types(SesEventType::Click)
                .matching_event_types(SesEventType::Bounce)
                .matching_event_types(SesEventType::Complaint)
                .sns_destination(
                    SnsDestination::builder()
                        .topic_arn(&topic_arn)
                        .build()
                        .context("Failed to build SNS destination")?,
                )
                .build(),
        )
        .send()
        .await
        .context("Failed to create event destination")?;
    eprintln!("[mailfleet] Event destination configured");

    Ok(TrackingConfig {
        configuration_set_name: CONFIG_SET_NAME.to_string(),
        sns_topic_arn: topic_arn,
        sqs_queue_url: queue_url,
    })
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TrackingConfig {
    pub configuration_set_name: String,
    pub sns_topic_arn: String,
    pub sqs_queue_url: String,
}

/// Poll SQS for SES events and update analytics
pub async fn poll_events(
    storage: &DatabaseStorage,
    access_key: &str,
    secret_key: &str,
    region: &str,
    queue_url: &str,
) -> Result<u32> {
    let creds = Credentials::new(access_key, secret_key, None, None, "mailfleet");
    let config = aws_config::from_env()
        .credentials_provider(creds)
        .region(Region::new(region.to_string()))
        .load()
        .await;
    let sqs = SqsClient::new(&config);

    let response = sqs
        .receive_message()
        .queue_url(queue_url)
        .max_number_of_messages(10)
        .wait_time_seconds(1)
        .send()
        .await
        .context("Failed to receive SQS messages")?;

    let messages = response.messages();
    if messages.is_empty() {
        return Ok(0);
    }

    let mut analytics_data = storage.get_analytics().await?;
    let mut contacts_data = storage.get_contacts().await?;
    let mut suppression_data = storage.get_suppression().await?;
    let mut processed = 0u32;
    let mut contacts_changed = false;
    let mut suppression_changed = false;

    for msg in messages {
        let body = msg.body().unwrap_or("");

        // SNS wraps the SES event in a notification envelope
        if let Ok(sns_notification) = serde_json::from_str::<SnsNotification>(body) {
            if let Ok(ses_event) = serde_json::from_str::<SesEvent>(&sns_notification.message) {
                let campaign_id_str = ses_event
                    .mail
                    .tags
                    .as_ref()
                    .and_then(|t| t.get("mailfleet-campaign-id"))
                    .and_then(|v| v.first())
                    .cloned();

                let recipient_email = ses_event.mail.destination.first().cloned();

                if let Some(cid) = campaign_id_str {
                    if let Ok(campaign_uuid) = Uuid::parse_str(&cid) {
                        let entry = analytics_data
                            .campaign_analytics
                            .iter_mut()
                            .find(|a| a.campaign_id == campaign_uuid);

                        if let Some(analytics) = entry {
                            match ses_event.event_type.as_str() {
                                "Delivery" => analytics.delivered += 1,
                                "Open" => analytics.opened += 1,
                                "Click" => analytics.clicked += 1,
                                "Bounce" => {
                                    analytics.bounced += 1;
                                    // Auto-suppress bounced email
                                    if let Some(ref email) = recipient_email {
                                        let email_lower = email.to_lowercase();
                                        // Update contact status
                                        for contact in &mut contacts_data.contacts {
                                            if contact.email.to_lowercase() == email_lower {
                                                contact.status = ContactStatus::Bounced;
                                                contacts_changed = true;
                                            }
                                        }
                                        // Add to suppression list
                                        if !suppression_data
                                            .suppressed_emails
                                            .iter()
                                            .any(|s| s.email.to_lowercase() == email_lower)
                                        {
                                            suppression_data.suppressed_emails.push(
                                                SuppressedEmail {
                                                    email: email_lower,
                                                    reason: SuppressionReason::Bounced,
                                                    timestamp: Utc::now(),
                                                    campaign_id: Some(campaign_uuid),
                                                },
                                            );
                                            suppression_changed = true;
                                        }
                                    }
                                }
                                "Complaint" => {
                                    analytics.complained += 1;
                                    if let Some(ref email) = recipient_email {
                                        let email_lower = email.to_lowercase();
                                        for contact in &mut contacts_data.contacts {
                                            if contact.email.to_lowercase() == email_lower {
                                                contact.status = ContactStatus::Complained;
                                                contacts_changed = true;
                                            }
                                        }
                                        if !suppression_data
                                            .suppressed_emails
                                            .iter()
                                            .any(|s| s.email.to_lowercase() == email_lower)
                                        {
                                            suppression_data.suppressed_emails.push(
                                                SuppressedEmail {
                                                    email: email_lower,
                                                    reason: SuppressionReason::Complained,
                                                    timestamp: Utc::now(),
                                                    campaign_id: Some(campaign_uuid),
                                                },
                                            );
                                            suppression_changed = true;
                                        }
                                    }
                                }
                                _ => {}
                            }
                            processed += 1;
                        }
                    }
                }
            }
        }

        // Delete message from queue
        if let Some(receipt) = msg.receipt_handle() {
            let _ = sqs
                .delete_message()
                .queue_url(queue_url)
                .receipt_handle(receipt)
                .send()
                .await;
        }
    }

    if processed > 0 {
        storage.save_analytics(&analytics_data).await?;
    }
    if contacts_changed {
        storage.save_contacts(&contacts_data).await?;
    }
    if suppression_changed {
        storage.save_suppression(&suppression_data).await?;
    }

    Ok(processed)
}

#[derive(Deserialize)]
struct SnsNotification {
    #[serde(alias = "Message")]
    message: String,
}

#[derive(Deserialize)]
struct SesEvent {
    #[serde(alias = "eventType")]
    event_type: String,
    mail: SesMail,
}

#[derive(Deserialize)]
struct SesMail {
    tags: Option<std::collections::HashMap<String, Vec<String>>>,
    #[serde(default)]
    destination: Vec<String>,
}
