use tauri::State;
use serde::Serialize;
use crate::AppState;
use crate::db::queries;
use crate::models::settings::Setting;
use crate::utils::paths;

#[derive(Serialize)]
pub struct AppSettings {
    pub data_path: String,
}

#[tauri::command]
pub fn get_settings() -> Result<AppSettings, String> {
    let data_path = paths::get_app_data_dir()
        .map_err(|e| e.to_string())?
        .to_string_lossy()
        .to_string();

    Ok(AppSettings { data_path })
}

#[tauri::command]
pub fn get_setting(key: String, state: State<AppState>) -> Result<Option<String>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_setting(&conn, &key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_setting(key: String, value: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::set_setting(&conn, &key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_settings(state: State<AppState>) -> Result<Vec<Setting>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_all_settings(&conn).map_err(|e| e.to_string())
}
