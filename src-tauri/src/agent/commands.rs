use chrono::Utc;
use log::{error, info};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;
use uuid::Uuid;

use super::models::*;
use super::{context, providers};
use crate::database::models::*;
use crate::database::storage::DatabaseStorage;

type DatabaseState = Arc<Mutex<DatabaseStorage>>;

#[tauri::command]
pub async fn get_agent_sessions(
    storage: State<'_, DatabaseState>,
) -> Result<Vec<AgentSession>, String> {
    let storage = storage.lock().await;
    let data = storage
        .get_agent_sessions()
        .await
        .map_err(|e| e.to_string())?;
    Ok(data.sessions)
}

#[tauri::command]
pub async fn create_agent_session(
    storage: State<'_, DatabaseState>,
    title: String,
) -> Result<AgentSession, String> {
    let storage = storage.lock().await;
    let mut data = storage
        .get_agent_sessions()
        .await
        .map_err(|e| e.to_string())?;

    let session = AgentSession {
        id: Uuid::new_v4(),
        title,
        messages: Vec::new(),
        created_at: Utc::now(),
        updated_at: Utc::now(),
    };

    data.sessions.insert(0, session.clone());
    storage
        .save_agent_sessions(&data)
        .await
        .map_err(|e| e.to_string())?;
    Ok(session)
}

#[tauri::command]
pub async fn delete_agent_session(
    storage: State<'_, DatabaseState>,
    id: String,
) -> Result<(), String> {
    let storage = storage.lock().await;
    let mut data = storage
        .get_agent_sessions()
        .await
        .map_err(|e| e.to_string())?;
    let session_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;
    data.sessions.retain(|s| s.id != session_id);
    storage
        .save_agent_sessions(&data)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn rename_agent_session(
    storage: State<'_, DatabaseState>,
    id: String,
    title: String,
) -> Result<AgentSession, String> {
    let storage = storage.lock().await;
    let mut data = storage
        .get_agent_sessions()
        .await
        .map_err(|e| e.to_string())?;
    let session_id = Uuid::parse_str(&id).map_err(|e| e.to_string())?;

    if let Some(session) = data.sessions.iter_mut().find(|s| s.id == session_id) {
        session.title = title;
        session.updated_at = Utc::now();
        let updated = session.clone();
        storage
            .save_agent_sessions(&data)
            .await
            .map_err(|e| e.to_string())?;
        Ok(updated)
    } else {
        Err("Session not found".to_string())
    }
}

#[tauri::command]
pub async fn check_claude_code_status() -> Result<serde_json::Value, String> {
    let claude_bin = super::providers::find_claude_binary().ok_or("Claude Code CLI not found")?;

    let home_dir = dirs::home_dir().unwrap_or_default();
    let expanded_path = format!(
        "/opt/homebrew/bin:/usr/local/bin:{}/.npm-global/bin:{}",
        home_dir.display(),
        std::env::var("PATH").unwrap_or_default()
    );

    let output = tokio::process::Command::new(&claude_bin)
        .args(["auth", "status"])
        .env("PATH", &expanded_path)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .output()
        .await
        .map_err(|e| format!("Failed to run claude: {}", e))?;

    if !output.status.success() {
        return Ok(serde_json::json!({ "loggedIn": false }));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    serde_json::from_str(&stdout).map_err(|_| "Invalid response from Claude Code".to_string())
}

#[tauri::command]
pub async fn get_ai_provider_models(provider: String) -> Result<Vec<String>, String> {
    Ok(match provider.as_str() {
        "Anthropic" | "ClaudeCode" => vec![
            "claude-sonnet-4-20250514".to_string(),
            "claude-opus-4-20250514".to_string(),
            "claude-haiku-4-20250414".to_string(),
        ],
        "OpenAI" => vec![
            "gpt-5".to_string(),
            "gpt-5-mini".to_string(),
            "gpt-4.1".to_string(),
            "gpt-4.1-mini".to_string(),
            "gpt-4.1-nano".to_string(),
            "gpt-4o".to_string(),
            "gpt-4o-mini".to_string(),
            "o3".to_string(),
            "o3-mini".to_string(),
            "o3-pro".to_string(),
            "o4-mini".to_string(),
        ],
        _ => vec!["custom-model".to_string()],
    })
}

#[tauri::command]
pub async fn send_agent_message(
    app: tauri::AppHandle,
    storage: State<'_, DatabaseState>,
    session_id: String,
    message: String,
) -> Result<AgentMessage, String> {
    info!("Agent message in session {}", session_id);
    let session_uuid = Uuid::parse_str(&session_id).map_err(|e| e.to_string())?;

    // Phase 1: Load data under lock
    let (_sessions_data, settings, system_prompt, history) = {
        let s = storage.lock().await;

        let sessions_data = s.get_agent_sessions().await.map_err(|e| e.to_string())?;
        let settings = s.get_settings().await.map_err(|e| e.to_string())?;
        let system_prompt = context::build_system_prompt(&s)
            .await
            .map_err(|e| e.to_string())?;

        let session = sessions_data
            .sessions
            .iter()
            .find(|s| s.id == session_uuid)
            .ok_or("Session not found")?;

        let all_messages: Vec<(MessageRole, String)> = session
            .messages
            .iter()
            .map(|m| (m.role.clone(), m.content.clone()))
            .collect();

        // Sliding window: keep last 20 messages to control token usage
        let max_history = 20;
        let mut history: Vec<(MessageRole, String)> = if all_messages.len() > max_history {
            all_messages[all_messages.len() - max_history..].to_vec()
        } else {
            all_messages
        };
        history.push((MessageRole::User, message.clone()));

        (sessions_data, settings, system_prompt, history)
        // lock released
    };

    // Add user message to session
    let user_msg = AgentMessage {
        id: Uuid::new_v4(),
        role: MessageRole::User,
        content: message,
        timestamp: Utc::now(),
    };

    // Save user message — re-read fresh to avoid race condition
    {
        let s = storage.lock().await;
        let mut fresh_data = s.get_agent_sessions().await.map_err(|e| e.to_string())?;
        if let Some(session) = fresh_data
            .sessions
            .iter_mut()
            .find(|s| s.id == session_uuid)
        {
            session.messages.push(user_msg);
            session.updated_at = Utc::now();
        }
        s.save_agent_sessions(&fresh_data)
            .await
            .map_err(|e| e.to_string())?;
    }

    // Phase 2: Call AI API (no lock held)
    let ai_response = providers::send_message(
        &app,
        &settings.ai_settings,
        &session_id,
        &system_prompt,
        &history,
    )
    .await
    .map_err(|e| {
        error!("AI API call failed: {}", e);
        format!("AI error: {}", e)
    })?;

    // Phase 3: Parse actions and execute under lock
    let mut final_response = ai_response.clone();

    // Check for [ACTION] blocks
    if let Some(action_start) = ai_response.find("[ACTION]") {
        if let Some(action_end) = ai_response.find("[/ACTION]") {
            let action_json = &ai_response[action_start + 8..action_end];
            match serde_json::from_str::<AgentAction>(action_json) {
                Ok(action) => {
                    let s = storage.lock().await;
                    match action {
                        AgentAction::CreateTemplate {
                            name,
                            subject,
                            html_content,
                            text_content,
                        } => {
                            let mut templates =
                                s.get_templates().await.map_err(|e| e.to_string())?;
                            let template = Template {
                                id: Uuid::new_v4(),
                                name: name.clone(),
                                subject,
                                html_content,
                                text_content,
                                created_at: Utc::now(),
                                updated_at: Utc::now(),
                            };
                            templates.templates.push(template);
                            s.save_templates(&templates)
                                .await
                                .map_err(|e| e.to_string())?;
                            info!("Agent created template: {}", name);
                            final_response.push_str("\n\n> Template created successfully.");
                        }
                        AgentAction::CreateCampaign {
                            name,
                            subject,
                            from_email,
                            from_name,
                            contact_list_names,
                            html_content,
                        } => {
                            let mut campaigns =
                                s.get_campaigns().await.map_err(|e| e.to_string())?;
                            let contacts_data =
                                s.get_contacts().await.map_err(|e| e.to_string())?;

                            // Resolve contact list names to IDs
                            let contact_list_ids: Vec<Uuid> = contact_list_names
                                .iter()
                                .filter_map(|name| {
                                    contacts_data
                                        .contact_lists
                                        .iter()
                                        .find(|l| l.name.to_lowercase() == name.to_lowercase())
                                        .map(|l| l.id)
                                })
                                .collect();

                            let campaign = Campaign {
                                id: Uuid::new_v4(),
                                name: name.clone(),
                                subject,
                                content: html_content,
                                template_id: None,
                                contact_list_ids,
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
                            campaigns.campaigns.push(campaign);
                            s.save_campaigns(&campaigns)
                                .await
                                .map_err(|e| e.to_string())?;
                            info!("Agent created campaign: {}", name);
                            final_response.push_str("\n\n> Campaign created successfully.");
                        }
                    }
                }
                Err(e) => {
                    error!("Failed to parse ACTION block: {} — raw: {}", e, action_json);
                    final_response.push_str("\n\n> Warning: I tried to create something but the request could not be processed. Please try again.");
                }
            }
        }
    }

    // Strip [ACTION] blocks from stored content to prevent re-sending to AI
    let stored_content = final_response
        .replace(
            &final_response
                .find("[ACTION]")
                .and_then(|start| {
                    final_response
                        .find("[/ACTION]")
                        .map(|end| final_response[start..end + 9].to_string())
                })
                .unwrap_or_default(),
            "",
        )
        .trim()
        .to_string();

    // Save assistant message (cleaned for history, full response returned to frontend)
    let assistant_msg = AgentMessage {
        id: Uuid::new_v4(),
        role: MessageRole::Assistant,
        content: stored_content,
        timestamp: Utc::now(),
    };

    {
        let s = storage.lock().await;
        let mut sessions_data = s.get_agent_sessions().await.map_err(|e| e.to_string())?;
        if let Some(session) = sessions_data
            .sessions
            .iter_mut()
            .find(|s| s.id == session_uuid)
        {
            session.messages.push(assistant_msg.clone());
            session.updated_at = Utc::now();

            // Auto-title: use first user message as title if still default
            if session.title == "New Chat" && session.messages.len() <= 2 {
                if let Some(first_user) = session
                    .messages
                    .iter()
                    .find(|m| matches!(m.role, MessageRole::User))
                {
                    let title = if first_user.content.chars().count() > 40 {
                        let truncated: String = first_user.content.chars().take(40).collect();
                        format!("{}...", truncated)
                    } else {
                        first_user.content.clone()
                    };
                    session.title = title;
                }
            }
        }
        s.save_agent_sessions(&sessions_data)
            .await
            .map_err(|e| e.to_string())?;
    }

    // Return full response to frontend (includes [ACTION]/[QUESTION] for rendering)
    let frontend_msg = AgentMessage {
        id: assistant_msg.id,
        role: MessageRole::Assistant,
        content: final_response,
        timestamp: assistant_msg.timestamp,
    };

    Ok(frontend_msg)
}
