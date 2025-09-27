use anyhow::Result;
use chrono::Utc;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;
use uuid::Uuid;

use crate::database::{models::*, storage::DatabaseStorage};

type DatabaseState = Arc<Mutex<DatabaseStorage>>;

#[tauri::command]
pub async fn init_database(storage: State<'_, DatabaseState>) -> Result<(), String> {
    let storage = storage.lock().await;
    storage.init().await.map_err(|e| e.to_string())
}

// Campaign commands
#[tauri::command]
pub async fn get_campaigns(storage: State<'_, DatabaseState>) -> Result<Vec<Campaign>, String> {
    let storage = storage.lock().await;
    let data = storage.get_campaigns().await.map_err(|e| e.to_string())?;
    Ok(data.campaigns)
}

#[tauri::command]
pub async fn create_campaign(
    storage: State<'_, DatabaseState>,
    name: String,
    subject: String,
    from_email: String,
    from_name: String,
) -> Result<Campaign, String> {
    let storage = storage.lock().await;
    let mut data = storage.get_campaigns().await.map_err(|e| e.to_string())?;

    let campaign = Campaign {
        id: Uuid::new_v4(),
        name,
        subject,
        template_id: None,
        contact_list_ids: vec![],
        status: CampaignStatus::Draft,
        scheduled_at: None,
        created_at: Utc::now(),
        updated_at: Utc::now(),
        settings: CampaignSettings {
            from_email,
            from_name,
            reply_to: None,
        },
    };

    data.campaigns.push(campaign.clone());
    storage
        .save_campaigns(&data)
        .await
        .map_err(|e| e.to_string())?;
    Ok(campaign)
}

#[tauri::command]
pub async fn update_campaign(
    storage: State<'_, DatabaseState>,
    id: String,
    name: Option<String>,
    subject: Option<String>,
    status: Option<String>,
) -> Result<Campaign, String> {
    let storage = storage.lock().await;
    let mut data = storage.get_campaigns().await.map_err(|e| e.to_string())?;

    let campaign_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;

    if let Some(campaign) = data.campaigns.iter_mut().find(|c| c.id == campaign_id) {
        if let Some(name) = name {
            campaign.name = name;
        }
        if let Some(subject) = subject {
            campaign.subject = subject;
        }
        if let Some(status_str) = status {
            campaign.status = match status_str.as_str() {
                "draft" => CampaignStatus::Draft,
                "scheduled" => CampaignStatus::Scheduled,
                "sending" => CampaignStatus::Sending,
                "sent" => CampaignStatus::Sent,
                "paused" => CampaignStatus::Paused,
                _ => return Err("Invalid status".to_string()),
            };
        }
        campaign.updated_at = Utc::now();

        let updated_campaign = campaign.clone();
        storage
            .save_campaigns(&data)
            .await
            .map_err(|e| e.to_string())?;
        Ok(updated_campaign)
    } else {
        Err("Campaign not found".to_string())
    }
}

#[tauri::command]
pub async fn delete_campaign(storage: State<'_, DatabaseState>, id: String) -> Result<(), String> {
    let storage = storage.lock().await;
    let mut data = storage.get_campaigns().await.map_err(|e| e.to_string())?;

    let campaign_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    data.campaigns.retain(|c| c.id != campaign_id);

    storage
        .save_campaigns(&data)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

// Contact List commands
#[tauri::command]
pub async fn get_contact_lists(
    storage: State<'_, DatabaseState>,
) -> Result<Vec<ContactList>, String> {
    let storage = storage.lock().await;
    let data = storage.get_contacts().await.map_err(|e| e.to_string())?;
    Ok(data.contact_lists)
}

#[tauri::command]
pub async fn create_contact_list(
    storage: State<'_, DatabaseState>,
    name: String,
    description: String,
) -> Result<ContactList, String> {
    let storage = storage.lock().await;
    let mut data = storage.get_contacts().await.map_err(|e| e.to_string())?;

    let contact_list = ContactList {
        id: Uuid::new_v4(),
        name,
        description,
        created_at: Utc::now(),
        contact_count: 0,
    };

    data.contact_lists.push(contact_list.clone());
    storage
        .save_contacts(&data)
        .await
        .map_err(|e| e.to_string())?;
    Ok(contact_list)
}

// Contact commands
#[tauri::command]
pub async fn get_contacts(storage: State<'_, DatabaseState>) -> Result<Vec<Contact>, String> {
    let storage = storage.lock().await;
    let data = storage.get_contacts().await.map_err(|e| e.to_string())?;
    Ok(data.contacts)
}

#[tauri::command]
pub async fn create_contact(
    storage: State<'_, DatabaseState>,
    email: String,
    first_name: Option<String>,
    last_name: Option<String>,
    list_id: String,
) -> Result<Contact, String> {
    let storage = storage.lock().await;
    let mut data = storage.get_contacts().await.map_err(|e| e.to_string())?;

    let list_uuid = Uuid::parse_str(&list_id).map_err(|e| e.to_string())?;

    let contact = Contact {
        id: Uuid::new_v4(),
        email,
        first_name,
        last_name,
        list_ids: vec![list_uuid],
        status: ContactStatus::Active,
        created_at: Utc::now(),
        custom_fields: std::collections::HashMap::new(),
    };

    data.contacts.push(contact.clone());

    // Update contact count in the list
    if let Some(list) = data.contact_lists.iter_mut().find(|l| l.id == list_uuid) {
        list.contact_count += 1;
    }

    storage
        .save_contacts(&data)
        .await
        .map_err(|e| e.to_string())?;
    Ok(contact)
}

// Template commands
#[tauri::command]
pub async fn get_templates(storage: State<'_, DatabaseState>) -> Result<Vec<Template>, String> {
    let storage = storage.lock().await;
    let data = storage.get_templates().await.map_err(|e| e.to_string())?;
    Ok(data.templates)
}

#[tauri::command]
pub async fn create_template(
    storage: State<'_, DatabaseState>,
    name: String,
    subject: String,
    html_content: String,
    text_content: Option<String>,
) -> Result<Template, String> {
    let storage = storage.lock().await;
    let mut data = storage.get_templates().await.map_err(|e| e.to_string())?;

    let template = Template {
        id: Uuid::new_v4(),
        name,
        subject,
        html_content,
        text_content,
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    data.templates.push(template.clone());
    storage
        .save_templates(&data)
        .await
        .map_err(|e| e.to_string())?;
    Ok(template)
}

#[tauri::command]
pub async fn update_template(
    storage: State<'_, DatabaseState>,
    id: String,
    name: Option<String>,
    subject: Option<String>,
    html_content: Option<String>,
    text_content: Option<String>,
) -> Result<Template, String> {
    let storage = storage.lock().await;
    let mut data = storage.get_templates().await.map_err(|e| e.to_string())?;

    let template_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;

    if let Some(template) = data.templates.iter_mut().find(|t| t.id == template_id) {
        if let Some(name) = name {
            template.name = name;
        }
        if let Some(subject) = subject {
            template.subject = subject;
        }
        if let Some(html_content) = html_content {
            template.html_content = html_content;
        }
        if let Some(text_content) = text_content {
            template.text_content = Some(text_content);
        }
        template.updated_at = Utc::now();

        let updated_template = template.clone();
        storage
            .save_templates(&data)
            .await
            .map_err(|e| e.to_string())?;
        Ok(updated_template)
    } else {
        Err("Template not found".to_string())
    }
}

// Settings commands
#[tauri::command]
pub async fn get_settings(storage: State<'_, DatabaseState>) -> Result<Settings, String> {
    let storage = storage.lock().await;
    storage.get_settings().await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn update_settings(
    storage: State<'_, DatabaseState>,
    ses_access_key: Option<String>,
    ses_secret_key: Option<String>,
    ses_region: Option<String>,
    default_from_email: Option<String>,
    default_from_name: Option<String>,
    theme: Option<String>,
) -> Result<Settings, String> {
    let storage = storage.lock().await;
    let mut settings = storage.get_settings().await.map_err(|e| e.to_string())?;

    if let Some(access_key) = ses_access_key {
        settings.ses_settings.access_key_id = Some(access_key);
    }
    if let Some(secret_key) = ses_secret_key {
        settings.ses_settings.secret_access_key = Some(secret_key);
    }
    if let Some(region) = ses_region {
        settings.ses_settings.region = region;
    }
    if let Some(email) = default_from_email {
        settings.app_settings.default_from_email = Some(email);
    }
    if let Some(name) = default_from_name {
        settings.app_settings.default_from_name = Some(name);
    }
    if let Some(theme_str) = theme {
        settings.app_settings.theme = match theme_str.as_str() {
            "dark" => Theme::Dark,
            _ => Theme::Light,
        };
    }

    storage
        .save_settings(&settings)
        .await
        .map_err(|e| e.to_string())?;
    Ok(settings)
}

// Analytics commands
#[tauri::command]
pub async fn get_campaign_analytics(
    storage: State<'_, DatabaseState>,
    campaign_id: String,
) -> Result<Option<CampaignAnalytics>, String> {
    let storage = storage.lock().await;
    let data = storage.get_analytics().await.map_err(|e| e.to_string())?;

    let campaign_uuid = Uuid::parse_str(&campaign_id).map_err(|e| e.to_string())?;

    Ok(data
        .campaign_analytics
        .into_iter()
        .find(|a| a.campaign_id == campaign_uuid))
}
