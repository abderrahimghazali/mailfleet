use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Default)]
pub enum AIProvider {
    #[default]
    Anthropic,
    ClaudeCode,
    OpenAI,
    Custom,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIProviderSettings {
    pub provider: AIProvider,
    pub api_key: Option<String>,
    pub model: String,
    pub custom_endpoint: Option<String>,
}

impl Default for AIProviderSettings {
    fn default() -> Self {
        Self {
            provider: AIProvider::Anthropic,
            api_key: None,
            model: "claude-sonnet-4-20250514".to_string(),
            custom_endpoint: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageRole {
    User,
    Assistant,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentMessage {
    pub id: Uuid,
    pub role: MessageRole,
    pub content: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentSession {
    pub id: Uuid,
    pub title: String,
    pub messages: Vec<AgentMessage>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AgentSessionsData {
    pub sessions: Vec<AgentSession>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "action")]
pub enum AgentAction {
    CreateTemplate {
        name: String,
        subject: String,
        html_content: String,
        text_content: Option<String>,
    },
    CreateCampaign {
        name: String,
        subject: String,
        from_email: String,
        from_name: String,
        #[serde(default)]
        contact_list_names: Vec<String>,
        #[serde(default)]
        html_content: Option<String>,
    },
}

#[derive(Debug, Clone, Serialize)]
pub struct AgentStreamChunk {
    pub session_id: String,
    pub chunk: String,
    pub done: bool,
    pub full_response: Option<String>,
}
