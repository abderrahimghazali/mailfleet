mod agent;
mod database;
mod email;

use database::{commands::*, storage::DatabaseStorage};
use std::sync::Arc;
use tauri_plugin_log::{Target, TargetKind, TimezoneStrategy};
use tokio::sync::Mutex;

type DatabaseState = Arc<Mutex<DatabaseStorage>>;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let storage = DatabaseStorage::new().expect("Failed to initialize database storage");
    let storage_state: DatabaseState = Arc::new(Mutex::new(storage));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::LogDir {
                        file_name: Some("mailfleet".into()),
                    }),
                    Target::new(TargetKind::Stdout),
                ])
                .timezone_strategy(TimezoneStrategy::UseLocal)
                .max_file_size(5_000_000)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepOne)
                .build(),
        )
        .manage(storage_state)
        .invoke_handler(tauri::generate_handler![
            init_database,
            get_campaigns,
            get_campaign_by_id,
            create_campaign,
            update_campaign,
            delete_campaign,
            get_contact_lists,
            create_contact_list,
            get_contact_list_by_id,
            update_contact_list,
            delete_contact_list,
            get_contacts,
            get_contacts_by_list_id,
            create_contact,
            delete_contact,
            get_templates,
            get_template_by_id,
            create_template,
            update_template,
            delete_template,
            get_settings,
            update_settings,
            get_campaign_analytics,
            get_all_analytics,
            update_campaign_contact_lists,
            update_campaign_status,
            verify_ses_credentials,
            send_test_email,
            send_campaign,
            import_contacts_csv,
            setup_tracking,
            poll_tracking_events,
            validate_emails,
            validate_contact_list,
            get_log_path,
            agent::commands::get_agent_sessions,
            agent::commands::create_agent_session,
            agent::commands::delete_agent_session,
            agent::commands::rename_agent_session,
            agent::commands::send_agent_message,
            agent::commands::get_ai_provider_models,
            agent::commands::check_claude_code_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
