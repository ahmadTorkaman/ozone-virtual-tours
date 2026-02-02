use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use crate::AppState;
use crate::db::queries;
use crate::models::project::{Project, CreateProjectInput, UpdateProjectInput};
use crate::utils::paths;

#[tauri::command]
pub fn list_projects(state: State<AppState>) -> Result<Vec<Project>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_all_projects(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_project(id: String, state: State<AppState>) -> Result<Option<Project>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_project(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_project(input: CreateProjectInput, state: State<AppState>) -> Result<Project, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let folder_path = id.clone(); // Relative path

    // Create project directory
    let project_dir = paths::get_project_dir(&id).map_err(|e| e.to_string())?;
    paths::ensure_dir(&project_dir).map_err(|e| e.to_string())?;

    // Create scenes and panoramas subdirectories
    paths::ensure_dir(&project_dir.join("scenes")).map_err(|e| e.to_string())?;
    paths::ensure_dir(&project_dir.join("panoramas")).map_err(|e| e.to_string())?;

    let project = Project {
        id: id.clone(),
        name: input.name,
        description: input.description,
        thumbnail_path: None,
        folder_path,
        created_at: now.clone(),
        updated_at: now,
        cloud_id: None,
        last_synced_at: None,
        sync_enabled: false,
    };

    queries::create_project(&conn, &project).map_err(|e| e.to_string())?;

    Ok(project)
}

#[tauri::command]
pub fn update_project(id: String, input: UpdateProjectInput, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::update_project(&conn, &id, &input.name, input.description.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_project(id: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    // Delete project directory
    if let Ok(project_dir) = paths::get_project_dir(&id) {
        if project_dir.exists() {
            std::fs::remove_dir_all(&project_dir).map_err(|e| e.to_string())?;
        }
    }

    queries::delete_project(&conn, &id).map_err(|e| e.to_string())
}
