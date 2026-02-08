use std::path::PathBuf;
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use crate::AppState;
use crate::db::queries;
use crate::models::scene::{Scene, CreateSceneInput, UpdateSceneInput};
use crate::utils::paths;

#[tauri::command]
pub fn list_scenes(project_id: String, state: State<AppState>) -> Result<Vec<Scene>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_scenes_by_project(&conn, &project_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_scene(id: String, state: State<AppState>) -> Result<Option<Scene>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_scene(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_scene(input: CreateSceneInput, state: State<AppState>) -> Result<Scene, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    // Verify project exists
    let _project = queries::get_project(&conn, &input.project_id)
        .map_err(|e| e.to_string())?
        .ok_or("Project not found")?;

    // Source file
    let source_path = PathBuf::from(&input.source_path);
    if !source_path.exists() {
        return Err("Source file not found".to_string());
    }

    let file_size = std::fs::metadata(&source_path)
        .map_err(|e| e.to_string())?
        .len() as i64;

    // Generate IDs and paths
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    // Destination path
    let project_dir = paths::get_project_dir(&input.project_id).map_err(|e| e.to_string())?;
    let scenes_dir = project_dir.join("scenes");
    paths::ensure_dir(&scenes_dir).map_err(|e| e.to_string())?;

    let dest_filename = format!("{}.glb", id);
    let dest_path = scenes_dir.join(&dest_filename);

    // Copy file
    std::fs::copy(&source_path, &dest_path).map_err(|e| e.to_string())?;

    // Relative path for database
    let glb_path = format!("scenes/{}", dest_filename);

    let scene = Scene {
        id: id.clone(),
        project_id: input.project_id,
        name: input.name,
        description: input.description,
        glb_path,
        glb_size: file_size,
        thumbnail_path: None,
        spawn_x: 0.0,
        spawn_y: 0.0,
        spawn_z: 0.0,
        spawn_rot_y: 0.0,
        sort_order: 0,
        created_at: now.clone(),
        updated_at: now,
    };

    queries::create_scene(&conn, &scene).map_err(|e| e.to_string())?;

    Ok(scene)
}

#[tauri::command]
pub fn update_scene(id: String, input: UpdateSceneInput, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    queries::update_scene(
        &conn,
        &id,
        input.name.as_deref(),
        input.description.as_deref(),
        input.spawn_x,
        input.spawn_y,
        input.spawn_z,
        input.spawn_rot_y,
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_scene(id: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    // Get scene to find file path
    if let Some(scene) = queries::get_scene(&conn, &id).map_err(|e| e.to_string())? {
        // Get project directory
        if let Ok(project_dir) = paths::get_project_dir(&scene.project_id) {
            let glb_path = project_dir.join(&scene.glb_path);
            if glb_path.exists() {
                let _ = std::fs::remove_file(&glb_path);
            }

            // Remove thumbnail if exists
            if let Some(thumb_path) = scene.thumbnail_path {
                let thumb_full = project_dir.join(&thumb_path);
                if thumb_full.exists() {
                    let _ = std::fs::remove_file(&thumb_full);
                }
            }
        }
    }

    queries::delete_scene(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reorder_scenes(scene_ids: Vec<String>, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::reorder_scenes(&conn, &scene_ids).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_scene_file_path(id: String, state: State<AppState>) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let scene = queries::get_scene(&conn, &id)
        .map_err(|e| e.to_string())?
        .ok_or("Scene not found")?;

    let project_dir = paths::get_project_dir(&scene.project_id).map_err(|e| e.to_string())?;
    let glb_path = project_dir.join(&scene.glb_path);

    Ok(glb_path.to_string_lossy().to_string())
}
