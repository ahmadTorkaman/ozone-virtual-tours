use std::path::PathBuf;
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use crate::AppState;
use crate::db::queries;
use crate::models::panorama::{Panorama, Hotspot, CreatePanoramaInput, UpdatePanoramaInput, CreateHotspotInput};
use crate::utils::paths;

#[tauri::command]
pub fn list_panoramas(project_id: String, state: State<AppState>) -> Result<Vec<Panorama>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_panoramas_by_project(&conn, &project_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_panorama(id: String, state: State<AppState>) -> Result<Option<Panorama>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_panorama(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_panorama(input: CreatePanoramaInput, state: State<AppState>) -> Result<Panorama, String> {
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

    // Generate IDs and paths
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    // Destination path
    let project_dir = paths::get_project_dir(&input.project_id).map_err(|e| e.to_string())?;
    let panoramas_dir = project_dir.join("panoramas");
    paths::ensure_dir(&panoramas_dir).map_err(|e| e.to_string())?;

    let ext = source_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg");
    let dest_filename = format!("{}.{}", id, ext);
    let dest_path = panoramas_dir.join(&dest_filename);

    // Copy file
    std::fs::copy(&source_path, &dest_path).map_err(|e| e.to_string())?;

    // Relative path for database
    let image_path = format!("panoramas/{}", dest_filename);

    let panorama = Panorama {
        id: id.clone(),
        project_id: input.project_id,
        name: input.name,
        description: input.description,
        image_path,
        thumbnail_path: None,
        initial_yaw: input.initial_yaw.unwrap_or(0.0),
        initial_pitch: input.initial_pitch.unwrap_or(0.0),
        sort_order: 0,
        created_at: now.clone(),
        updated_at: now,
    };

    queries::create_panorama(&conn, &panorama).map_err(|e| e.to_string())?;

    Ok(panorama)
}

#[tauri::command]
pub fn update_panorama(id: String, input: UpdatePanoramaInput, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    queries::update_panorama(
        &conn,
        &id,
        input.name.as_deref(),
        input.description.as_deref(),
        input.initial_yaw,
        input.initial_pitch,
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_panorama(id: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    // Get panorama to find file path
    if let Some(panorama) = queries::get_panorama(&conn, &id).map_err(|e| e.to_string())? {
        if let Ok(project_dir) = paths::get_project_dir(&panorama.project_id) {
            let image_path = project_dir.join(&panorama.image_path);
            if image_path.exists() {
                let _ = std::fs::remove_file(&image_path);
            }

            // Remove thumbnail if exists
            if let Some(thumb_path) = panorama.thumbnail_path {
                let thumb_full = project_dir.join(&thumb_path);
                if thumb_full.exists() {
                    let _ = std::fs::remove_file(&thumb_full);
                }
            }
        }
    }

    queries::delete_panorama(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn reorder_panoramas(panorama_ids: Vec<String>, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::reorder_panoramas(&conn, &panorama_ids).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_panorama_file_path(id: String, state: State<AppState>) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let panorama = queries::get_panorama(&conn, &id)
        .map_err(|e| e.to_string())?
        .ok_or("Panorama not found")?;

    let project_dir = paths::get_project_dir(&panorama.project_id).map_err(|e| e.to_string())?;
    let image_path = project_dir.join(&panorama.image_path);

    Ok(image_path.to_string_lossy().to_string())
}

// Hotspots
#[tauri::command]
pub fn list_hotspots(panorama_id: String, state: State<AppState>) -> Result<Vec<Hotspot>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_hotspots_by_panorama(&conn, &panorama_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_hotspot(input: CreateHotspotInput, state: State<AppState>) -> Result<Hotspot, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let content_json = input.content
        .map(|c| serde_json::to_string(&c))
        .transpose()
        .map_err(|e| e.to_string())?;

    let hotspot = Hotspot {
        id: id.clone(),
        panorama_id: input.panorama_id,
        hotspot_type: input.hotspot_type,
        yaw: input.yaw,
        pitch: input.pitch,
        target_panorama_id: input.target_panorama_id,
        content: content_json,
        icon: input.icon,
        color: input.color,
        created_at: now.clone(),
        updated_at: now,
    };

    queries::create_hotspot(&conn, &hotspot).map_err(|e| e.to_string())?;

    Ok(hotspot)
}

#[tauri::command]
pub fn update_hotspot(
    id: String,
    yaw: Option<f64>,
    pitch: Option<f64>,
    target_panorama_id: Option<String>,
    content: Option<String>,
    state: State<AppState>,
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::update_hotspot(
        &conn,
        &id,
        yaw,
        pitch,
        target_panorama_id.as_deref(),
        content.as_deref(),
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_hotspot(id: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::delete_hotspot(&conn, &id).map_err(|e| e.to_string())
}
