use crate::agent::models::AgentSessionsData;
use crate::database::models::*;
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::fs;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

pub struct DatabaseStorage {
    pub data_dir: PathBuf,
}

impl DatabaseStorage {
    pub fn new() -> Result<Self> {
        let data_dir = Self::get_app_data_dir()?;
        Ok(Self { data_dir })
    }

    fn get_app_data_dir() -> Result<PathBuf> {
        let data_dir = dirs::data_dir()
            .context("Could not find data directory")?
            .join("mailfleet")
            .join("data");

        Ok(data_dir)
    }

    pub async fn init(&self) -> Result<()> {
        // Create data directory if it doesn't exist
        fs::create_dir_all(&self.data_dir)
            .await
            .context("Failed to create data directory")?;

        // Restrict directory permissions to owner only
        #[cfg(unix)]
        {
            let perms = std::fs::Permissions::from_mode(0o700);
            fs::set_permissions(&self.data_dir, perms)
                .await
                .context("Failed to set directory permissions")?;
        }

        // Initialize all JSON files if they don't exist
        self.init_file("campaigns.json", &CampaignsData::default())
            .await?;
        self.init_file("contacts.json", &ContactsData::default())
            .await?;
        self.init_file("templates.json", &TemplatesData::default())
            .await?;
        self.init_file("settings.json", &Settings::default())
            .await?;
        self.init_file("analytics.json", &AnalyticsData::default())
            .await?;
        self.init_file("suppression.json", &SuppressionData::default())
            .await?;
        self.init_file("agent_sessions.json", &AgentSessionsData::default())
            .await?;

        Ok(())
    }

    async fn init_file<T: Serialize>(&self, filename: &str, default_data: &T) -> Result<()> {
        let file_path = self.data_dir.join(filename);

        if !file_path.exists() {
            let json_data = serde_json::to_string_pretty(default_data)
                .context("Failed to serialize default data")?;

            fs::write(&file_path, json_data)
                .await
                .context(format!("Failed to create {}", filename))?;

            // Restrict file permissions to owner only (0600)
            #[cfg(unix)]
            {
                let perms = std::fs::Permissions::from_mode(0o600);
                fs::set_permissions(&file_path, perms)
                    .await
                    .context(format!("Failed to set permissions on {}", filename))?;
            }
        }

        Ok(())
    }

    async fn read_file<T>(&self, filename: &str) -> Result<T>
    where
        T: for<'de> Deserialize<'de>,
    {
        let file_path = self.data_dir.join(filename);
        let content = fs::read_to_string(&file_path)
            .await
            .context(format!("Failed to read {}", filename))?;

        let data: T =
            serde_json::from_str(&content).context(format!("Failed to parse {}", filename))?;

        Ok(data)
    }

    async fn write_file<T: Serialize>(&self, filename: &str, data: &T) -> Result<()> {
        let file_path = self.data_dir.join(filename);
        let json_data = serde_json::to_string_pretty(data).context("Failed to serialize data")?;

        // Write to a temporary file first, then rename for atomic operation
        let temp_path = file_path.with_extension("tmp");
        fs::write(&temp_path, json_data)
            .await
            .context(format!("Failed to write temp file for {}", filename))?;

        // Restrict permissions before rename
        #[cfg(unix)]
        {
            let perms = std::fs::Permissions::from_mode(0o600);
            fs::set_permissions(&temp_path, perms)
                .await
                .context("Failed to set file permissions")?;
        }

        fs::rename(&temp_path, &file_path)
            .await
            .context(format!("Failed to rename temp file for {}", filename))?;

        Ok(())
    }

    // Campaign operations
    pub async fn get_campaigns(&self) -> Result<CampaignsData> {
        self.read_file("campaigns.json").await
    }

    pub async fn save_campaigns(&self, data: &CampaignsData) -> Result<()> {
        self.write_file("campaigns.json", data).await
    }

    // Contact operations
    pub async fn get_contacts(&self) -> Result<ContactsData> {
        self.read_file("contacts.json").await
    }

    pub async fn save_contacts(&self, data: &ContactsData) -> Result<()> {
        self.write_file("contacts.json", data).await
    }

    // Template operations
    pub async fn get_templates(&self) -> Result<TemplatesData> {
        self.read_file("templates.json").await
    }

    pub async fn save_templates(&self, data: &TemplatesData) -> Result<()> {
        self.write_file("templates.json", data).await
    }

    // Settings operations
    pub async fn get_settings(&self) -> Result<Settings> {
        self.read_file("settings.json").await
    }

    pub async fn save_settings(&self, data: &Settings) -> Result<()> {
        self.write_file("settings.json", data).await
    }

    // Analytics operations
    pub async fn get_analytics(&self) -> Result<AnalyticsData> {
        self.read_file("analytics.json").await
    }

    pub async fn save_analytics(&self, data: &AnalyticsData) -> Result<()> {
        self.write_file("analytics.json", data).await
    }

    // Suppression operations
    pub async fn get_suppression(&self) -> Result<SuppressionData> {
        self.read_file("suppression.json").await
    }

    pub async fn save_suppression(&self, data: &SuppressionData) -> Result<()> {
        self.write_file("suppression.json", data).await
    }

    // Agent session operations
    pub async fn get_agent_sessions(&self) -> Result<AgentSessionsData> {
        self.read_file("agent_sessions.json").await
    }

    pub async fn save_agent_sessions(&self, data: &AgentSessionsData) -> Result<()> {
        self.write_file("agent_sessions.json", data).await
    }
}
