use tauri::State;

use crate::AppState;
use crate::db::queries;
use crate::models::project::Project;
use crate::utils::errors::AppError;

#[tauri::command]
pub fn toggle_scene_publish(project_id: String, published: bool, state: State<AppState>) -> Result<Project, String> {
    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;

    let project = queries::update_project_publish_scene(&conn, &project_id, published)
        .map_err(|e| String::from(AppError::Database(e)))?
        .ok_or_else(|| String::from(AppError::NotFound(format!("Project {} not found", project_id))))?;

    Ok(project)
}

#[tauri::command]
pub fn toggle_panorama_publish(project_id: String, published: bool, state: State<AppState>) -> Result<Project, String> {
    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;

    let project = queries::update_project_publish_panorama(&conn, &project_id, published)
        .map_err(|e| String::from(AppError::Database(e)))?
        .ok_or_else(|| String::from(AppError::NotFound(format!("Project {} not found", project_id))))?;

    Ok(project)
}

#[tauri::command]
pub fn update_publish_slug(project_id: String, slug: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;
    queries::update_project_publish_slug(&conn, &project_id, &slug)
        .map_err(|e| String::from(AppError::Database(e)))
}
