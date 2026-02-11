mod commands;
mod db;
mod license;
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
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
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

            // Check for updates on startup
            commands::updater::setup_auto_update_check(app);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Project commands
            commands::projects::list_projects,
            commands::projects::get_project,
            commands::projects::create_project,
            commands::projects::update_project,
            commands::projects::delete_project,

            // Scene commands
            commands::scenes::list_scenes,
            commands::scenes::get_scene,
            commands::scenes::import_scene,
            commands::scenes::update_scene,
            commands::scenes::delete_scene,
            commands::scenes::reorder_scenes,
            commands::scenes::get_scene_file_path,

            // Material commands
            commands::materials::list_materials,
            commands::materials::list_materials_by_category,
            commands::materials::get_material,
            commands::materials::create_material,
            commands::materials::update_material,
            commands::materials::delete_material,
            commands::materials::list_material_categories,
            commands::materials::create_material_category,
            commands::materials::delete_material_category,
            commands::materials::get_scene_material_mappings,
            commands::materials::set_material_mapping,
            commands::materials::remove_material_mapping,
            commands::materials::upload_material_texture,

            // Panorama commands
            commands::panoramas::list_panoramas,
            commands::panoramas::get_panorama,
            commands::panoramas::import_panorama,
            commands::panoramas::update_panorama,
            commands::panoramas::delete_panorama,
            commands::panoramas::reorder_panoramas,
            commands::panoramas::get_panorama_file_path,
            commands::panoramas::list_hotspots,
            commands::panoramas::create_hotspot,
            commands::panoramas::update_hotspot,
            commands::panoramas::delete_hotspot,

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
            commands::settings::get_settings,
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::settings::get_all_settings,

            // Export/Import commands
            commands::export::export_project,
            commands::export::import_project,

            // License commands
            commands::license::get_license,
            commands::license::get_license_status,
            commands::license::activate_license,
            commands::license::deactivate_license,
            commands::license::check_feature,
            commands::license::get_machine_id_cmd,

            // Updater commands
            commands::updater::check_for_updates,
            commands::updater::install_update,
            commands::updater::get_current_version,

            // Publish commands
            commands::publish::toggle_scene_publish,
            commands::publish::toggle_panorama_publish,
            commands::publish::update_publish_slug,

            // Configurator commands
            commands::configurator::list_component_groups,
            commands::configurator::get_component_group,
            commands::configurator::create_component_group,
            commands::configurator::update_component_group,
            commands::configurator::delete_component_group,
            commands::configurator::reorder_component_groups,
            commands::configurator::add_material_option,
            commands::configurator::remove_material_option,
            commands::configurator::reorder_material_options,
            commands::configurator::list_material_options,

            // Firm commands
            commands::firm::get_firm_profile,
            commands::firm::update_firm_profile,

            // Publish packaging commands
            commands::publish_packaging::save_thumbnail,
            commands::publish_packaging::publish_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
