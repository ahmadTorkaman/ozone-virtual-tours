use tauri::State;

use crate::AppState;
use crate::db::queries;
use crate::models::firm::{FirmProfile, UpdateFirmProfileInput};
use crate::utils::errors::AppError;

#[tauri::command]
pub fn get_firm_profile(state: State<AppState>) -> Result<FirmProfile, String> {
    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;
    queries::get_firm_profile(&conn)
        .map_err(|e| String::from(AppError::Database(e)))
}

#[tauri::command]
pub fn update_firm_profile(input: UpdateFirmProfileInput, state: State<AppState>) -> Result<FirmProfile, String> {
    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;
    queries::update_firm_profile(&conn, &input)
        .map_err(|e| String::from(AppError::Database(e)))
}
