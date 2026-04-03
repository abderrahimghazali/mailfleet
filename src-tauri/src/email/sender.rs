use anyhow::{Context, Result};
use chrono::Utc;
use serde::Serialize;
use uuid::Uuid;

use crate::database::models::*;
use crate::database::storage::DatabaseStorage;
use crate::email::ses;

#[derive(Debug, Clone, Serialize)]
pub struct CampaignSendResult {
    pub sent: u32,
    pub skipped: u32,
    pub errors: Vec<String>,
}

pub async fn send_campaign_emails(
    storage: &DatabaseStorage,
    campaign_id: Uuid,
) -> Result<CampaignSendResult> {
    // Load campaign
    let mut campaigns_data = storage.get_campaigns().await?;
    let campaign = campaigns_data
        .campaigns
        .iter()
        .find(|c| c.id == campaign_id)
        .context("Campaign not found")?
        .clone();

    // Validate campaign can be sent
    match campaign.status {
        CampaignStatus::Draft | CampaignStatus::Scheduled | CampaignStatus::Paused => {}
        _ => anyhow::bail!(
            "Campaign cannot be sent — current status: {:?}",
            campaign.status
        ),
    }

    // Validate campaign has content
    if campaign
        .content
        .as_ref()
        .is_none_or(|c| c.trim().is_empty())
    {
        anyhow::bail!("Campaign has no email content");
    }

    // Validate campaign has contact lists
    if campaign.contact_list_ids.is_empty() {
        anyhow::bail!("Campaign has no contact lists assigned");
    }

    // Load settings and build SES client
    let settings = storage.get_settings().await?;
    let access_key = settings
        .ses_settings
        .access_key_id
        .as_ref()
        .context("AWS SES Access Key not configured")?;
    let secret_key = settings
        .ses_settings
        .secret_access_key
        .as_ref()
        .context("AWS SES Secret Key not configured")?;

    let client =
        ses::build_ses_client(access_key, secret_key, &settings.ses_settings.region).await?;

    // Load contacts and suppression list
    let contacts_data = storage.get_contacts().await?;
    let suppression_data = storage.get_suppression().await?;
    let suppressed_emails: std::collections::HashSet<String> = suppression_data
        .suppressed_emails
        .iter()
        .map(|s| s.email.to_lowercase())
        .collect();

    // Collect all active contacts from assigned lists (deduplicated by email)
    let mut seen_emails = std::collections::HashSet::new();
    let mut contacts_to_send: Vec<&Contact> = Vec::new();

    for contact in &contacts_data.contacts {
        let in_assigned_list = contact
            .list_ids
            .iter()
            .any(|lid| campaign.contact_list_ids.contains(lid));

        if !in_assigned_list {
            continue;
        }

        if !matches!(contact.status, ContactStatus::Active) {
            continue;
        }

        let email_lower = contact.email.to_lowercase();
        if suppressed_emails.contains(&email_lower) {
            continue;
        }

        if seen_emails.insert(email_lower) {
            contacts_to_send.push(contact);
        }
    }

    // Update campaign status to Sending
    if let Some(c) = campaigns_data
        .campaigns
        .iter_mut()
        .find(|c| c.id == campaign_id)
    {
        c.status = CampaignStatus::Sending;
        c.updated_at = Utc::now();
    }
    storage.save_campaigns(&campaigns_data).await?;

    // Send emails with rate limiting
    let from_address = format!(
        "{} <{}>",
        campaign.settings.from_name, campaign.settings.from_email
    );
    let content = campaign.content.as_deref().unwrap_or("");
    let mut result = CampaignSendResult {
        sent: 0,
        skipped: 0,
        errors: Vec::new(),
    };

    let mut analytics_events: Vec<AnalyticsEvent> = Vec::new();
    let batch_size = 14; // SES default sending rate

    for (i, contact) in contacts_to_send.iter().enumerate() {
        match ses::send_email(
            &client,
            &from_address,
            &contact.email,
            &campaign.subject,
            content,
            None,
        )
        .await
        {
            Ok(_message_id) => {
                result.sent += 1;
                analytics_events.push(AnalyticsEvent {
                    event_type: EventType::Sent,
                    timestamp: Utc::now(),
                    contact_id: contact.id,
                    metadata: std::collections::HashMap::new(),
                });
            }
            Err(e) => {
                let err_msg = format!("{}: {}", contact.email, e);
                result.errors.push(err_msg);
            }
        }

        // Rate limit: sleep after each batch
        if (i + 1) % batch_size == 0 && i + 1 < contacts_to_send.len() {
            tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        }
    }

    // Update campaign status to Sent
    let mut campaigns_data = storage.get_campaigns().await?;
    if let Some(c) = campaigns_data
        .campaigns
        .iter_mut()
        .find(|c| c.id == campaign_id)
    {
        c.status = CampaignStatus::Sent;
        c.updated_at = Utc::now();
    }
    storage.save_campaigns(&campaigns_data).await?;

    // Update analytics
    let mut analytics_data = storage.get_analytics().await?;
    let analytics_entry = analytics_data
        .campaign_analytics
        .iter_mut()
        .find(|a| a.campaign_id == campaign_id);

    if let Some(entry) = analytics_entry {
        entry.sent += result.sent;
        entry.events.extend(analytics_events);
    } else {
        analytics_data.campaign_analytics.push(CampaignAnalytics {
            campaign_id,
            sent: result.sent,
            delivered: result.sent, // Assume delivered = sent initially
            opened: 0,
            clicked: 0,
            bounced: result.errors.len() as u32,
            complained: 0,
            unsubscribed: 0,
            events: analytics_events,
        });
    }
    storage.save_analytics(&analytics_data).await?;

    Ok(result)
}
