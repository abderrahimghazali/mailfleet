use anyhow::{Context, Result};
use chrono::Utc;
use log::{error, info};
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

/// Sanitize a string for use in email headers — strip newlines to prevent header injection
fn sanitize_header(s: &str) -> String {
    s.replace(['\r', '\n'], "")
}

/// Load all data needed for sending, validate, update status to Sending.
/// Returns the data needed for the send loop. Storage lock can be released after this.
pub async fn prepare_campaign(
    storage: &DatabaseStorage,
    campaign_id: Uuid,
) -> Result<PreparedCampaign> {
    let mut campaigns_data = storage.get_campaigns().await?;
    let campaign = campaigns_data
        .campaigns
        .iter()
        .find(|c| c.id == campaign_id)
        .context("Campaign not found")?
        .clone();

    match campaign.status {
        CampaignStatus::Draft | CampaignStatus::Scheduled | CampaignStatus::Paused => {}
        _ => anyhow::bail!(
            "Campaign cannot be sent — current status: {:?}",
            campaign.status
        ),
    }

    if campaign
        .content
        .as_ref()
        .is_none_or(|c| c.trim().is_empty())
    {
        anyhow::bail!("Campaign has no email content");
    }

    if campaign.contact_list_ids.is_empty() {
        anyhow::bail!("Campaign has no contact lists assigned");
    }

    let settings = storage.get_settings().await?;
    let access_key = settings
        .ses_settings
        .access_key_id
        .clone()
        .context("AWS SES Access Key not configured")?;
    let secret_key = settings
        .ses_settings
        .secret_access_key
        .clone()
        .context("AWS SES Secret Key not configured")?;
    let region = settings.ses_settings.region.clone();
    let config_set = settings.ses_settings.tracking_config_set.clone();

    let contacts_data = storage.get_contacts().await?;
    let suppression_data = storage.get_suppression().await?;
    let suppressed_emails: std::collections::HashSet<String> = suppression_data
        .suppressed_emails
        .iter()
        .map(|s| s.email.to_lowercase())
        .collect();

    let mut seen_emails = std::collections::HashSet::new();
    let mut contacts_to_send: Vec<Contact> = Vec::new();

    for contact in &contacts_data.contacts {
        let in_assigned_list = contact
            .list_ids
            .iter()
            .any(|lid| campaign.contact_list_ids.contains(lid));

        if !in_assigned_list || !matches!(contact.status, ContactStatus::Active) {
            continue;
        }

        let email_lower = contact.email.to_lowercase();
        if suppressed_emails.contains(&email_lower) {
            continue;
        }

        if seen_emails.insert(email_lower) {
            contacts_to_send.push(contact.clone());
        }
    }

    info!(
        "Campaign {}: {} contacts to send",
        campaign_id,
        contacts_to_send.len()
    );

    // Update status to Sending
    if let Some(c) = campaigns_data
        .campaigns
        .iter_mut()
        .find(|c| c.id == campaign_id)
    {
        c.status = CampaignStatus::Sending;
        c.updated_at = Utc::now();
    }
    storage.save_campaigns(&campaigns_data).await?;

    Ok(PreparedCampaign {
        campaign,
        contacts: contacts_to_send,
        access_key,
        secret_key,
        region,
        config_set,
    })
}

pub struct PreparedCampaign {
    pub campaign: Campaign,
    pub contacts: Vec<Contact>,
    pub access_key: String,
    pub secret_key: String,
    pub region: String,
    pub config_set: Option<String>,
}

/// Send emails — does NOT hold any storage lock. Pure network I/O.
pub async fn execute_send(
    prepared: &PreparedCampaign,
) -> Result<(CampaignSendResult, Vec<AnalyticsEvent>)> {
    let client =
        ses::build_ses_client(&prepared.access_key, &prepared.secret_key, &prepared.region).await?;

    let config_set = prepared.config_set.as_deref();
    let campaign_id_str = prepared.campaign.id.to_string();
    let from_address = format!(
        "{} <{}>",
        sanitize_header(&prepared.campaign.settings.from_name),
        sanitize_header(&prepared.campaign.settings.from_email)
    );
    let content = prepared.campaign.content.as_deref().unwrap_or("");

    let mut result = CampaignSendResult {
        sent: 0,
        skipped: 0,
        errors: Vec::new(),
    };
    let mut analytics_events: Vec<AnalyticsEvent> = Vec::new();
    let batch_size = 14;

    for (i, contact) in prepared.contacts.iter().enumerate() {
        let mut personalized_content = content.to_string();
        personalized_content = personalized_content
            .replace(
                "{{first_name}}",
                contact.first_name.as_deref().unwrap_or(""),
            )
            .replace("{{last_name}}", contact.last_name.as_deref().unwrap_or(""))
            .replace("{{email}}", &contact.email);

        let mut personalized_subject = prepared.campaign.subject.clone();
        personalized_subject = personalized_subject
            .replace(
                "{{first_name}}",
                contact.first_name.as_deref().unwrap_or(""),
            )
            .replace("{{last_name}}", contact.last_name.as_deref().unwrap_or(""))
            .replace("{{email}}", &contact.email);

        let unsubscribe_url = format!(
            "mailto:{}?subject=Unsubscribe&body=Please%20unsubscribe%20{}",
            sanitize_header(&prepared.campaign.settings.from_email),
            contact.email
        );
        personalized_content =
            personalized_content.replace("{{unsubscribe_url}}", &unsubscribe_url);

        if !personalized_content.contains("unsubscribe") {
            personalized_content.push_str(&format!(
                "<br/><hr style=\"border:none;border-top:1px solid #eee;margin:24px 0\"/><p style=\"font-size:12px;color:#999;text-align:center\">You received this email because you're subscribed. <a href=\"{}\" style=\"color:#999\">Unsubscribe</a></p>",
                unsubscribe_url
            ));
        }

        // Sanitize subject to prevent header injection
        let safe_subject = sanitize_header(&personalized_subject);

        match ses::send_email(
            &client,
            &from_address,
            &contact.email,
            &safe_subject,
            &personalized_content,
            None,
            config_set,
            Some(&campaign_id_str),
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
                error!("Send failed: {}", err_msg);
                result.errors.push(err_msg);
            }
        }

        if (i + 1) % batch_size == 0 && i + 1 < prepared.contacts.len() {
            tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        }
    }

    Ok((result, analytics_events))
}

/// Save results back to storage — re-acquires data from disk.
pub async fn finalize_campaign(
    storage: &DatabaseStorage,
    campaign_id: Uuid,
    result: &CampaignSendResult,
    analytics_events: Vec<AnalyticsEvent>,
) -> Result<()> {
    // Update campaign status
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
            delivered: 0,
            opened: 0,
            clicked: 0,
            bounced: result.errors.len() as u32,
            complained: 0,
            unsubscribed: 0,
            events: analytics_events,
        });
    }
    storage.save_analytics(&analytics_data).await?;

    Ok(())
}
