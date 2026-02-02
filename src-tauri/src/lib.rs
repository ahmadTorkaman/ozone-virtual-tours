mod commands;
mod db;
mod models;
mod utils;

use std::sync::Mutex;
use tauri::Manager;

pub struct AppState {
    pub db: Mutex<rusqlite::Connection>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // Initialize database
            let app_data_dir = utils::paths::get_app_data_dir()
                .map_err(|e| format!("Failed to get app data dir: {}", e))?;
            let db_path = app_data_dir.join("database.sqlite");

            // Create directory if needed
            if let Some(parent) = db_path.parent() {
                std::fs::create_dir_all(parent)
                    .map_err(|e| format!("Failed to create app data dir: {}", e))?;
            }

            // Open/create database
            let conn = db::connection::open_database(&db_path)
                .map_err(|e| format!("Failed to open database: {}", e))?;

            // Run migrations
            db::migrations::run_migrations(&conn)
                .map_err(|e| format!("Failed to run migrations: {}", e))?;

            // Store in app state
            app.manage(AppState {
                db: Mutex::new(conn),
            });

            println!("Ozone Studio initialized");
            println!("Database: {:?}", db_path);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Project commands
            commands::projects::list_projects,
            commands::projects::get_project,
            commands::projects::create_project,
            commands::projects::update_project,
            commands::projects::delete_project,

            // File commands
            commands::files::get_app_data_path,
            commands::files::get_documents_path,
            commands::files::ensure_directory,
            commands::files::read_file,
            commands::files::write_file,
            commands::files::copy_file,
            commands::files::delete_file,
            commands::files::list_directory,

            // Settings commands
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::settings::get_all_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
