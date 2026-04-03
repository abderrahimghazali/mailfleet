use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Campaign {
    pub id: Uuid,
    pub name: String,
    pub subject: String,
    pub content: Option<String>,
    pub template_id: Option<Uuid>,
    pub contact_list_ids: Vec<Uuid>,
    pub status: CampaignStatus,
    pub scheduled_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub settings: CampaignSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CampaignStatus {
    Draft,
    Scheduled,
    Sending,
    Sent,
    Paused,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CampaignSettings {
    pub from_email: String,
    pub from_name: String,
    pub reply_to: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContactList {
    pub id: Uuid,
    pub name: String,
    pub description: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub contact_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Contact {
    pub id: Uuid,
    pub email: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub list_ids: Vec<Uuid>,
    pub status: ContactStatus,
    pub created_at: DateTime<Utc>,
    pub custom_fields: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ContactStatus {
    Active,
    Unsubscribed,
    Bounced,
    Complained,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Template {
    pub id: Uuid,
    pub name: String,
    pub subject: String,
    pub html_content: String,
    pub text_content: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SesSettings {
    pub access_key_id: Option<String>,
    pub secret_access_key: Option<String>,
    pub region: String,
    pub verified: bool,
    #[serde(default)]
    pub tracking_config_set: Option<String>,
    #[serde(default)]
    pub tracking_queue_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub theme: Theme,
    pub default_from_email: Option<String>,
    pub default_from_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Theme {
    Light,
    Dark,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub ses_settings: SesSettings,
    pub app_settings: AppSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CampaignAnalytics {
    pub campaign_id: Uuid,
    pub sent: u32,
    pub delivered: u32,
    pub opened: u32,
    pub clicked: u32,
    pub bounced: u32,
    pub complained: u32,
    pub unsubscribed: u32,
    pub events: Vec<AnalyticsEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsEvent {
    pub event_type: EventType,
    pub timestamp: DateTime<Utc>,
    pub contact_id: Uuid,
    pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventType {
    Sent,
    Delivered,
    Opened,
    Clicked,
    Bounced,
    Complained,
    Unsubscribed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SuppressedEmail {
    pub email: String,
    pub reason: SuppressionReason,
    pub timestamp: DateTime<Utc>,
    pub campaign_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum SuppressionReason {
    Unsubscribed,
    Bounced,
    Complained,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportResult {
    pub imported: u32,
    pub skipped: u32,
    pub errors: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmailValidationResult {
    pub email: String,
    pub valid_format: bool,
    pub has_mx: bool,
    pub is_disposable: bool,
    pub is_role_based: bool,
    pub status: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationSummary {
    pub total: u32,
    pub valid: u32,
    pub invalid: u32,
    pub risky: u32,
    pub results: Vec<EmailValidationResult>,
}

// Database container structs
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CampaignsData {
    pub campaigns: Vec<Campaign>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ContactsData {
    pub contact_lists: Vec<ContactList>,
    pub contacts: Vec<Contact>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TemplatesData {
    pub templates: Vec<Template>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AnalyticsData {
    pub campaign_analytics: Vec<CampaignAnalytics>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SuppressionData {
    pub suppressed_emails: Vec<SuppressedEmail>,
}

// Default implementations
impl Default for Settings {
    fn default() -> Self {
        Self {
            ses_settings: SesSettings {
                access_key_id: None,
                secret_access_key: None,
                region: "us-east-1".to_string(),
                verified: false,
                tracking_config_set: None,
                tracking_queue_url: None,
            },
            app_settings: AppSettings {
                theme: Theme::Light,
                default_from_email: None,
                default_from_name: None,
            },
        }
    }
}

impl Default for CampaignSettings {
    fn default() -> Self {
        Self {
            from_email: "".to_string(),
            from_name: "".to_string(),
            reply_to: None,
        }
    }
}
