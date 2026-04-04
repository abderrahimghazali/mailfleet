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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplatesData {
    pub templates: Vec<Template>,
}

impl Default for TemplatesData {
    fn default() -> Self {
        use chrono::TimeZone;
        let ts = Utc.with_ymd_and_hms(2026, 4, 1, 10, 0, 0).unwrap();
        Self {
            templates: vec![
                Template {
                    id: Uuid::new_v4(), name: "Welcome Email".into(),
                    subject: "Welcome to the team, {{first_name}}!".into(),
                    html_content: "<img src=\"https://placehold.co/600x200/4f46e5/ffffff?text=Welcome+to+the+Team\" alt=\"Welcome banner\" style=\"width:100%;border-radius:8px;margin-bottom:16px\"/><h2>Welcome aboard, {{first_name}}!</h2><p>We are excited to have you with us. Here is what you can do next:</p><ul><li>Complete your profile</li><li>Explore the dashboard</li><li>Connect with the team</li></ul><p>If you have any questions, just reply to this email.</p><p>Cheers,<br/>The Team</p>".into(),
                    text_content: None, created_at: ts, updated_at: ts,
                },
                Template {
                    id: Uuid::new_v4(), name: "Monthly Newsletter".into(),
                    subject: "Your Monthly Update".into(),
                    html_content: "<h2>Monthly Newsletter</h2><p>Hi {{first_name}},</p><p>Here is what happened this month:</p><h3>Highlights</h3><ul><li>Feature update #1</li><li>Feature update #2</li><li>Feature update #3</li></ul><h3>Coming Soon</h3><p>We are working on some exciting things. Stay tuned for more updates next month.</p><p>Best,<br/>The Team</p>".into(),
                    text_content: None, created_at: ts, updated_at: ts,
                },
                Template {
                    id: Uuid::new_v4(), name: "Product Announcement".into(),
                    subject: "Big news: Check out what is new".into(),
                    html_content: "<img src=\"https://placehold.co/600x250/0ea5e9/ffffff?text=New+Release\" alt=\"Product announcement\" style=\"width:100%;border-radius:8px;margin-bottom:16px\"/><h1>Something new is here</h1><p>Hi {{first_name}},</p><p>We have been working hard and are thrilled to share our latest update with you.</p><img src=\"https://placehold.co/600x300/f4f4f5/71717a?text=Product+Screenshot\" alt=\"Product screenshot\" style=\"width:100%;border-radius:8px;margin:16px 0\"/><p><strong>What is new:</strong></p><ul><li>Faster performance</li><li>New integrations</li><li>Redesigned dashboard</li></ul><p>Try it out today and let us know what you think.</p>".into(),
                    text_content: None, created_at: ts, updated_at: ts,
                },
                Template {
                    id: Uuid::new_v4(), name: "Win Back".into(),
                    subject: "We miss you, {{first_name}}".into(),
                    html_content: "<h2>It has been a while, {{first_name}}</h2><p>We noticed you have not been around lately. A lot has changed since your last visit!</p><ul><li>New features launched</li><li>Performance improvements</li><li>Updated pricing plans</li></ul><p>Come back and take a look. We think you will like what you see.</p>".into(),
                    text_content: None, created_at: ts, updated_at: ts,
                },
                Template {
                    id: Uuid::new_v4(), name: "Event Invitation".into(),
                    subject: "You are invited: Join us live".into(),
                    html_content: "<img src=\"https://placehold.co/600x220/7c3aed/ffffff?text=You're+Invited\" alt=\"Event banner\" style=\"width:100%;border-radius:8px;margin-bottom:16px\"/><h2>You are invited!</h2><p>Hi {{first_name}},</p><p>We would love for you to join us at our upcoming event.</p><h3>Event Details</h3><ul><li><strong>Date:</strong> TBD</li><li><strong>Time:</strong> TBD</li><li><strong>Where:</strong> Online</li></ul><p>Space is limited, so make sure to save your spot.</p><p>See you there!</p>".into(),
                    text_content: None, created_at: ts, updated_at: ts,
                },
                Template {
                    id: Uuid::new_v4(), name: "Simple Text Email".into(),
                    subject: "Quick update from us".into(),
                    html_content: "<p>Hi {{first_name}},</p><p>Just a quick note to let you know about a few things:</p><p>First, we shipped a handful of improvements this week based on your feedback. Nothing flashy, just things that make the experience smoother.</p><p>Second, we are planning something bigger for next month. More details soon.</p><p>Thanks for being part of this.</p><p>Best,<br/>The Team</p>".into(),
                    text_content: None, created_at: ts, updated_at: ts,
                },
            ],
        }
    }
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
