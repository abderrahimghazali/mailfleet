use anyhow::{Context, Result};
use futures::StreamExt;
use log::{error, info};
use once_cell::sync::Lazy;
use serde_json::Value;
use tauri::Emitter;

static HTTP_CLIENT: Lazy<reqwest::Client> = Lazy::new(|| {
    reqwest::Client::builder()
        .connect_timeout(std::time::Duration::from_secs(15))
        .timeout(std::time::Duration::from_secs(180))
        .build()
        .expect("Failed to build HTTP client")
});

/// Resolve API key from Claude Code's local session
fn resolve_claude_code_key() -> Option<String> {
    // 1. Check ANTHROPIC_API_KEY env var
    if let Ok(key) = std::env::var("ANTHROPIC_API_KEY") {
        if !key.is_empty() {
            return Some(key);
        }
    }

    // 2. Read from macOS keychain: "Claude Code-credentials"
    #[cfg(target_os = "macos")]
    {
        let output = std::process::Command::new("security")
            .args(["find-generic-password", "-s", "Claude Code-credentials", "-w"])
            .output()
            .ok()?;

        if output.status.success() {
            let creds_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&creds_str) {
                if let Some(token) = json
                    .get("claudeAiOauth")
                    .and_then(|o| o.get("accessToken"))
                    .and_then(|v| v.as_str())
                {
                    if !token.is_empty() {
                        return Some(token.to_string());
                    }
                }
            }
        }
    }

    // 3. Fallback: check config files
    if let Some(home) = dirs::home_dir() {
        for path in [home.join(".claude.json"), home.join(".claude/config.json")] {
            if path.exists() {
                if let Ok(content) = std::fs::read_to_string(&path) {
                    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                        for key_name in ["apiKey", "primaryApiKey"] {
                            if let Some(key) = json.get(key_name).and_then(|v| v.as_str()) {
                                if !key.is_empty() {
                                    return Some(key.to_string());
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    None
}

fn user_friendly_error(status: reqwest::StatusCode, raw: &str) -> String {
    error!("AI API error {}: {}", status, raw);
    match status.as_u16() {
        401 => "Invalid API key. Check your AI provider settings.".to_string(),
        403 => "Access denied. Your API key may not have the required permissions.".to_string(),
        429 => "Rate limit reached. Please wait a moment and try again.".to_string(),
        500..=599 => "The AI provider is experiencing issues. Try again later.".to_string(),
        _ => format!("AI API error ({}). Check the logs for details.", status),
    }
}

use super::models::{AIProvider, AIProviderSettings, AgentStreamChunk, MessageRole};

struct ChatMessage {
    role: String,
    content: String,
}

pub async fn send_message(
    app_handle: &tauri::AppHandle,
    settings: &AIProviderSettings,
    session_id: &str,
    system_prompt: &str,
    messages: &[(MessageRole, String)],
) -> Result<String> {
    // Claude Code: use CLI subprocess instead of API
    if settings.provider == AIProvider::ClaudeCode {
        return send_claude_code_cli(app_handle, system_prompt, messages, session_id).await;
    }

    let api_key = settings
        .api_key
        .as_ref()
        .context("AI API key not configured. Add it in Settings.")?;

    let chat_messages: Vec<ChatMessage> = messages
        .iter()
        .map(|(role, content)| ChatMessage {
            role: match role {
                MessageRole::User => "user".to_string(),
                MessageRole::Assistant => "assistant".to_string(),
            },
            content: content.clone(),
        })
        .collect();

    match settings.provider {
        AIProvider::Anthropic | AIProvider::ClaudeCode => {
            send_anthropic(
                app_handle,
                api_key,
                &settings.model,
                system_prompt,
                &chat_messages,
                session_id,
            )
            .await
        }
        AIProvider::OpenAI => {
            let endpoint = "https://api.openai.com/v1/chat/completions";
            send_openai_compatible(
                app_handle,
                api_key,
                &settings.model,
                endpoint,
                system_prompt,
                &chat_messages,
                session_id,
            )
            .await
        }
        AIProvider::Custom => {
            let endpoint = settings
                .custom_endpoint
                .as_deref()
                .context("Custom endpoint URL not configured")?;
            send_openai_compatible(
                app_handle,
                api_key,
                &settings.model,
                endpoint,
                system_prompt,
                &chat_messages,
                session_id,
            )
            .await
        }
    }
}

async fn send_anthropic(
    app_handle: &tauri::AppHandle,
    api_key: &str,
    model: &str,
    system_prompt: &str,
    messages: &[ChatMessage],
    session_id: &str,
) -> Result<String> {
    info!("Calling Anthropic API with model {}", model);

    let client = &*HTTP_CLIENT;

    let msgs: Vec<Value> = messages
        .iter()
        .map(|m| {
            serde_json::json!({
                "role": m.role,
                "content": m.content,
            })
        })
        .collect();

    let body = serde_json::json!({
        "model": model,
        "max_tokens": 4096,
        "system": system_prompt,
        "messages": msgs,
        "stream": true,
    });

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .context("Failed to connect to Anthropic API")?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        anyhow::bail!("{}", user_friendly_error(status, &text));
    }

    let mut full_response = String::new();
    let mut stream = response.bytes_stream();

    let mut buffer = String::new();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.context("Stream error")?;
        let text = String::from_utf8_lossy(&chunk);
        buffer.push_str(&text);

        // Process complete SSE lines
        while let Some(pos) = buffer.find('\n') {
            let line = buffer[..pos].trim().to_string();
            buffer = buffer[pos + 1..].to_string();

            if !line.starts_with("data: ") {
                continue;
            }

            let data = &line[6..];
            if data == "[DONE]" {
                continue;
            }

            if let Ok(event) = serde_json::from_str::<Value>(data) {
                // Extract text delta from content_block_delta events
                if event.get("type").and_then(|t| t.as_str()) == Some("content_block_delta") {
                    if let Some(delta_text) = event
                        .get("delta")
                        .and_then(|d| d.get("text"))
                        .and_then(|t| t.as_str())
                    {
                        full_response.push_str(delta_text);
                        let _ = app_handle.emit(
                            "agent-stream",
                            AgentStreamChunk {
                                session_id: session_id.to_string(),
                                chunk: delta_text.to_string(),
                                done: false,
                                full_response: None,
                            },
                        );
                    }
                }
            }
        }
    }

    // Emit done
    let _ = app_handle.emit(
        "agent-stream",
        AgentStreamChunk {
            session_id: session_id.to_string(),
            chunk: String::new(),
            done: true,
            full_response: Some(full_response.clone()),
        },
    );

    Ok(full_response)
}

async fn send_openai_compatible(
    app_handle: &tauri::AppHandle,
    api_key: &str,
    model: &str,
    endpoint: &str,
    system_prompt: &str,
    messages: &[ChatMessage],
    session_id: &str,
) -> Result<String> {
    info!("Calling OpenAI-compatible API at {} with model {}", endpoint, model);

    let client = &*HTTP_CLIENT;

    let mut msgs: Vec<Value> = vec![serde_json::json!({
        "role": "system",
        "content": system_prompt,
    })];

    for m in messages {
        msgs.push(serde_json::json!({
            "role": m.role,
            "content": m.content,
        }));
    }

    let body = serde_json::json!({
        "model": model,
        "messages": msgs,
        "max_tokens": 4096,
        "stream": true,
    });

    let response = client
        .post(endpoint)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .context("Failed to connect to AI API")?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        anyhow::bail!("{}", user_friendly_error(status, &text));
    }

    let mut full_response = String::new();
    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.context("Stream error")?;
        let text = String::from_utf8_lossy(&chunk);
        buffer.push_str(&text);

        while let Some(pos) = buffer.find('\n') {
            let line = buffer[..pos].trim().to_string();
            buffer = buffer[pos + 1..].to_string();

            if !line.starts_with("data: ") {
                continue;
            }

            let data = &line[6..];
            if data == "[DONE]" {
                continue;
            }

            if let Ok(event) = serde_json::from_str::<Value>(data) {
                if let Some(delta_text) = event
                    .get("choices")
                    .and_then(|c| c.get(0))
                    .and_then(|c| c.get("delta"))
                    .and_then(|d| d.get("content"))
                    .and_then(|t| t.as_str())
                {
                    full_response.push_str(delta_text);
                    let _ = app_handle.emit(
                        "agent-stream",
                        AgentStreamChunk {
                            session_id: session_id.to_string(),
                            chunk: delta_text.to_string(),
                            done: false,
                            full_response: None,
                        },
                    );
                }
            }
        }
    }

    let _ = app_handle.emit(
        "agent-stream",
        AgentStreamChunk {
            session_id: session_id.to_string(),
            chunk: String::new(),
            done: true,
            full_response: Some(full_response.clone()),
        },
    );

    Ok(full_response)
}

/// Use Claude Code CLI as a subprocess — uses the user's logged-in session
async fn send_claude_code_cli(
    app_handle: &tauri::AppHandle,
    system_prompt: &str,
    messages: &[(MessageRole, String)],
    session_id: &str,
) -> Result<String> {
    info!("Calling Claude Code CLI");

    let mut full_prompt = format!("{}\n\n---\n\nConversation:\n", system_prompt);
    for (role, content) in messages.iter().take(messages.len().saturating_sub(1)) {
        let role_str = match role {
            MessageRole::User => "User",
            MessageRole::Assistant => "Assistant",
        };
        full_prompt.push_str(&format!("\n{}: {}\n", role_str, content));
    }
    if let Some((_, content)) = messages.last() {
        full_prompt.push_str(&format!("\nUser: {}\n\nRespond as the assistant:", content));
    }

    let claude_bin = find_claude_binary().context(
        "Claude Code CLI not found. Install it with: npm install -g @anthropic-ai/claude-code",
    )?;

    let output = tokio::process::Command::new(&claude_bin)
        .args(["-p", &full_prompt, "--output-format", "text"])
        .env("CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", "1")
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .output()
        .await
        .context("Failed to run Claude Code CLI")?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        error!("Claude Code CLI error: {}", stderr);
        let short: String = stderr.chars().take(200).collect();
        anyhow::bail!("Claude Code error: {}", short);
    }

    let response = String::from_utf8_lossy(&output.stdout).trim().to_string();
    if response.is_empty() {
        anyhow::bail!("Claude Code returned an empty response");
    }

    let _ = app_handle.emit(
        "agent-stream",
        AgentStreamChunk {
            session_id: session_id.to_string(),
            chunk: String::new(),
            done: true,
            full_response: Some(response.clone()),
        },
    );

    Ok(response)
}

pub fn find_claude_binary() -> Option<String> {
    if let Ok(output) = std::process::Command::new("which").arg("claude").output() {
        if output.status.success() {
            let path = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !path.is_empty() {
                return Some(path);
            }
        }
    }
    let home = dirs::home_dir()?;
    for path in [
        home.join(".npm-global/bin/claude"),
        std::path::PathBuf::from("/usr/local/bin/claude"),
        std::path::PathBuf::from("/opt/homebrew/bin/claude"),
    ] {
        if path.exists() {
            return Some(path.to_string_lossy().to_string());
        }
    }
    None
}
