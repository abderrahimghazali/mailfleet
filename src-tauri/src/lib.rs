mod database;
mod email;

use database::{commands::*, storage::DatabaseStorage};
use std::sync::Arc;
use tokio::sync::Mutex;

type DatabaseState = Arc<Mutex<DatabaseStorage>>;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database storage
    let storage = DatabaseStorage::new().expect("Failed to initialize database storage");
    let storage_state: DatabaseState = Arc::new(Mutex::new(storage));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(storage_state)
        .invoke_handler(tauri::generate_handler![
            greet,
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
            validate_contact_list
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
