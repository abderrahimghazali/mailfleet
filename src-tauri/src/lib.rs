mod database;

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
            get_contacts,
            create_contact,
            get_templates,
            create_template,
            update_template,
            get_settings,
            update_settings,
            get_campaign_analytics
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
