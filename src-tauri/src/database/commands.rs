use anyhow::Result;
use chrono::Utc;
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;
use uuid::Uuid;

use crate::database::{models::*, storage::DatabaseStorage};
use crate::email::{self, sender::CampaignSendResult};

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
pub async fn get_campaign_by_id(
    storage: State<'_, DatabaseState>,
    id: String,
) -> Result<Option<Campaign>, String> {
    let storage = storage.lock().await;
    let data = storage.get_campaigns().await.map_err(|e| e.to_string())?;

    let campaign_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    Ok(data.campaigns.into_iter().find(|c| c.id == campaign_id))
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
        content: None,
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
    content: Option<String>,
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
        if let Some(content) = content {
            campaign.content = Some(content);
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
        updated_at: Utc::now(),
        contact_count: 0,
    };

    data.contact_lists.push(contact_list.clone());
    storage
        .save_contacts(&data)
        .await
        .map_err(|e| e.to_string())?;
    Ok(contact_list)
}

#[tauri::command]
pub async fn get_contact_list_by_id(
    storage: State<'_, DatabaseState>,
    id: String,
) -> Result<Option<ContactList>, String> {
    let storage = storage.lock().await;
    let data = storage.get_contacts().await.map_err(|e| e.to_string())?;

    let list_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    Ok(data.contact_lists.into_iter().find(|l| l.id == list_id))
}

#[tauri::command]
pub async fn update_contact_list(
    storage: State<'_, DatabaseState>,
    id: String,
    name: String,
    description: String,
) -> Result<ContactList, String> {
    let storage = storage.lock().await;
    let mut data = storage.get_contacts().await.map_err(|e| e.to_string())?;

    let list_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;

    if let Some(list) = data.contact_lists.iter_mut().find(|l| l.id == list_id) {
        list.name = name;
        list.description = description;
        list.updated_at = Utc::now();

        let updated_list = list.clone();

        storage
            .save_contacts(&data)
            .await
            .map_err(|e| e.to_string())?;

        Ok(updated_list)
    } else {
        Err("Contact list not found".to_string())
    }
}

#[tauri::command]
pub async fn delete_contact_list(
    storage: State<'_, DatabaseState>,
    id: String,
) -> Result<(), String> {
    let storage = storage.lock().await;
    let mut data = storage.get_contacts().await.map_err(|e| e.to_string())?;

    let list_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;

    // Remove the contact list
    let initial_len = data.contact_lists.len();
    data.contact_lists.retain(|l| l.id != list_id);

    if data.contact_lists.len() == initial_len {
        return Err("Contact list not found".to_string());
    }

    // Remove the list ID from all contacts
    for contact in &mut data.contacts {
        contact
            .list_ids
            .retain(|&list_id_ref| list_id_ref != list_id);
    }

    storage
        .save_contacts(&data)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn get_contacts_by_list_id(
    storage: State<'_, DatabaseState>,
    list_id: String,
) -> Result<Vec<Contact>, String> {
    let storage = storage.lock().await;
    let data = storage.get_contacts().await.map_err(|e| e.to_string())?;

    let list_uuid = Uuid::parse_str(&list_id).map_err(|e| e.to_string())?;
    let filtered_contacts: Vec<Contact> = data
        .contacts
        .into_iter()
        .filter(|contact| contact.list_ids.contains(&list_uuid))
        .collect();

    Ok(filtered_contacts)
}

#[tauri::command]
pub async fn delete_contact(storage: State<'_, DatabaseState>, id: String) -> Result<(), String> {
    let storage = storage.lock().await;
    let mut data = storage.get_contacts().await.map_err(|e| e.to_string())?;
    let contact_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;

    // Remove the contact
    let initial_len = data.contacts.len();
    data.contacts.retain(|c| c.id != contact_id);

    if data.contacts.len() == initial_len {
        return Err("Contact not found".to_string());
    }

    // Update contact counts for all lists
    for list in &mut data.contact_lists {
        let contacts_in_list = data
            .contacts
            .iter()
            .filter(|c| c.list_ids.contains(&list.id))
            .count();
        list.contact_count = contacts_in_list;
    }

    storage
        .save_contacts(&data)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
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

#[tauri::command]
pub async fn get_all_analytics(
    storage: State<'_, DatabaseState>,
) -> Result<Vec<CampaignAnalytics>, String> {
    let storage = storage.lock().await;
    let data = storage.get_analytics().await.map_err(|e| e.to_string())?;
    Ok(data.campaign_analytics)
}

// Template commands
#[tauri::command]
pub async fn get_template_by_id(
    storage: State<'_, DatabaseState>,
    id: String,
) -> Result<Option<Template>, String> {
    let storage = storage.lock().await;
    let data = storage.get_templates().await.map_err(|e| e.to_string())?;
    let template_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    Ok(data.templates.into_iter().find(|t| t.id == template_id))
}

#[tauri::command]
pub async fn delete_template(storage: State<'_, DatabaseState>, id: String) -> Result<(), String> {
    let storage = storage.lock().await;
    let mut data = storage.get_templates().await.map_err(|e| e.to_string())?;
    let template_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    data.templates.retain(|t| t.id != template_id);
    storage
        .save_templates(&data)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

// Campaign enhancement commands
#[tauri::command]
pub async fn update_campaign_contact_lists(
    storage: State<'_, DatabaseState>,
    id: String,
    list_ids: Vec<String>,
) -> Result<Campaign, String> {
    let storage = storage.lock().await;
    let mut data = storage.get_campaigns().await.map_err(|e| e.to_string())?;
    let campaign_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;

    let parsed_ids: Vec<Uuid> = list_ids
        .iter()
        .map(|s| Uuid::parse_str(s))
        .collect::<std::result::Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    if let Some(campaign) = data.campaigns.iter_mut().find(|c| c.id == campaign_id) {
        campaign.contact_list_ids = parsed_ids;
        campaign.updated_at = Utc::now();
        let updated = campaign.clone();
        storage
            .save_campaigns(&data)
            .await
            .map_err(|e| e.to_string())?;
        Ok(updated)
    } else {
        Err("Campaign not found".to_string())
    }
}

#[tauri::command]
pub async fn update_campaign_status(
    storage: State<'_, DatabaseState>,
    id: String,
    status: String,
    scheduled_at: Option<String>,
) -> Result<Campaign, String> {
    let storage = storage.lock().await;
    let mut data = storage.get_campaigns().await.map_err(|e| e.to_string())?;
    let campaign_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;

    if let Some(campaign) = data.campaigns.iter_mut().find(|c| c.id == campaign_id) {
        campaign.status = match status.to_lowercase().as_str() {
            "draft" => CampaignStatus::Draft,
            "scheduled" => CampaignStatus::Scheduled,
            "sending" => CampaignStatus::Sending,
            "sent" => CampaignStatus::Sent,
            "paused" => CampaignStatus::Paused,
            _ => return Err("Invalid status".to_string()),
        };

        if let Some(ref at) = scheduled_at {
            campaign.scheduled_at = Some(
                chrono::DateTime::parse_from_rfc3339(at)
                    .map_err(|e| format!("Invalid date: {}", e))?
                    .with_timezone(&Utc),
            );
        }

        campaign.updated_at = Utc::now();
        let updated = campaign.clone();
        storage
            .save_campaigns(&data)
            .await
            .map_err(|e| e.to_string())?;
        Ok(updated)
    } else {
        Err("Campaign not found".to_string())
    }
}

// SES commands
#[tauri::command]
pub async fn verify_ses_credentials(
    access_key: String,
    secret_key: String,
    region: String,
) -> Result<bool, String> {
    let client = email::ses::build_ses_client(&access_key, &secret_key, &region)
        .await
        .map_err(|e| format!("Failed to build SES client: {}", e))?;

    email::ses::verify_credentials(&client)
        .await
        .map_err(|e| format!("SES verification failed: {}", e))?;

    Ok(true)
}

#[tauri::command]
pub async fn send_test_email(
    storage: State<'_, DatabaseState>,
    to: String,
    subject: String,
    html_content: String,
    from_email: String,
    from_name: String,
) -> Result<String, String> {
    let storage = storage.lock().await;
    let settings = storage.get_settings().await.map_err(|e| e.to_string())?;

    let access_key = settings
        .ses_settings
        .access_key_id
        .as_ref()
        .ok_or("AWS SES Access Key not configured")?;
    let secret_key = settings
        .ses_settings
        .secret_access_key
        .as_ref()
        .ok_or("AWS SES Secret Key not configured")?;

    let client =
        email::ses::build_ses_client(access_key, secret_key, &settings.ses_settings.region)
            .await
            .map_err(|e| format!("Failed to build SES client: {}", e))?;

    let from_address = format!("{} <{}>", from_name, from_email);

    let message_id =
        email::ses::send_email(&client, &from_address, &to, &subject, &html_content, None)
            .await
            .map_err(|e| format!("Failed to send test email: {}", e))?;

    Ok(message_id)
}

#[tauri::command]
pub async fn send_campaign(
    storage: State<'_, DatabaseState>,
    campaign_id: String,
) -> Result<CampaignSendResult, String> {
    let storage_ref = storage.lock().await;
    let campaign_uuid = Uuid::parse_str(&campaign_id).map_err(|e| e.to_string())?;

    email::sender::send_campaign_emails(&storage_ref, campaign_uuid)
        .await
        .map_err(|e| format!("Campaign send failed: {}", e))
}

// CSV Import
#[tauri::command]
pub async fn import_contacts_csv(
    storage: State<'_, DatabaseState>,
    file_path: String,
    list_id: String,
    column_mapping: String,
    has_header: bool,
) -> Result<ImportResult, String> {
    let storage = storage.lock().await;
    let list_uuid = Uuid::parse_str(&list_id).map_err(|e| e.to_string())?;

    // Parse column mapping
    let mapping: std::collections::HashMap<String, usize> =
        serde_json::from_str(&column_mapping)
            .map_err(|e| format!("Invalid column mapping: {}", e))?;

    let email_col = mapping
        .get("email")
        .copied()
        .ok_or("Email column mapping is required")?;
    let first_name_col = mapping.get("first_name").copied();
    let last_name_col = mapping.get("last_name").copied();

    // Read file
    let content = tokio::fs::read_to_string(&file_path)
        .await
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let mut reader = csv::ReaderBuilder::new()
        .has_headers(has_header)
        .from_reader(content.as_bytes());

    let mut contacts_data = storage.get_contacts().await.map_err(|e| e.to_string())?;

    // Build set of existing emails in this list for dedup
    let existing_emails: std::collections::HashSet<String> = contacts_data
        .contacts
        .iter()
        .filter(|c| c.list_ids.contains(&list_uuid))
        .map(|c| c.email.to_lowercase())
        .collect();

    let mut imported: u32 = 0;
    let mut skipped: u32 = 0;
    let mut errors: Vec<String> = Vec::new();

    for (row_idx, record) in reader.records().enumerate() {
        let record = match record {
            Ok(r) => r,
            Err(e) => {
                errors.push(format!("Row {}: {}", row_idx + 1, e));
                continue;
            }
        };

        let email = match record.get(email_col) {
            Some(e) if !e.trim().is_empty() => e.trim().to_string(),
            _ => {
                errors.push(format!("Row {}: missing email", row_idx + 1));
                continue;
            }
        };

        // Basic email validation
        if !email.contains('@') || !email.contains('.') {
            errors.push(format!("Row {}: invalid email '{}'", row_idx + 1, email));
            continue;
        }

        // Check duplicate
        if existing_emails.contains(&email.to_lowercase()) {
            skipped += 1;
            continue;
        }

        let first_name = first_name_col
            .and_then(|col| record.get(col))
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());

        let last_name = last_name_col
            .and_then(|col| record.get(col))
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty());

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

        contacts_data.contacts.push(contact);
        imported += 1;
    }

    // Update contact count
    if let Some(list) = contacts_data
        .contact_lists
        .iter_mut()
        .find(|l| l.id == list_uuid)
    {
        let count = contacts_data
            .contacts
            .iter()
            .filter(|c| c.list_ids.contains(&list_uuid))
            .count();
        list.contact_count = count;
    }

    storage
        .save_contacts(&contacts_data)
        .await
        .map_err(|e| e.to_string())?;

    Ok(ImportResult {
        imported,
        skipped,
        errors,
    })
}
