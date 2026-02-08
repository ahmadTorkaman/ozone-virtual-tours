use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use crate::AppState;
use crate::db::queries;
use crate::models::material::{
    Material, MaterialCategory, MaterialMapping,
    CreateMaterialInput, UpdateMaterialInput,
};
use crate::utils::paths;

#[tauri::command]
pub fn list_materials(state: State<AppState>) -> Result<Vec<Material>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_all_materials(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_materials_by_category(category_id: Option<String>, state: State<AppState>) -> Result<Vec<Material>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_materials_by_category(&conn, category_id.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_material(id: String, state: State<AppState>) -> Result<Option<Material>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_material(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_material(input: CreateMaterialInput, state: State<AppState>) -> Result<Material, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();
    let properties_json = serde_json::to_string(&input.properties).map_err(|e| e.to_string())?;

    let material = Material {
        id: id.clone(),
        name: input.name,
        description: input.description,
        category_id: input.category_id,
        thumbnail_path: None,
        properties: properties_json,
        created_at: now.clone(),
        updated_at: now,
        cloud_id: None,
        is_synced: false,
    };

    queries::create_material(&conn, &material).map_err(|e| e.to_string())?;

    Ok(material)
}

#[tauri::command]
pub fn update_material(id: String, input: UpdateMaterialInput, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let properties_json = input.properties
        .map(|p| serde_json::to_string(&p))
        .transpose()
        .map_err(|e| e.to_string())?;

    queries::update_material(
        &conn,
        &id,
        input.name.as_deref(),
        input.description.as_deref(),
        input.category_id.as_deref(),
        properties_json.as_deref(),
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_material(id: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    // Delete texture directory if exists
    if let Ok(materials_dir) = paths::get_materials_dir() {
        let texture_dir = materials_dir.join("textures").join(&id);
        if texture_dir.exists() {
            let _ = std::fs::remove_dir_all(&texture_dir);
        }
    }

    queries::delete_material(&conn, &id).map_err(|e| e.to_string())
}

// Material Categories
#[tauri::command]
pub fn list_material_categories(state: State<AppState>) -> Result<Vec<MaterialCategory>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_all_categories(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_material_category(name: String, state: State<AppState>) -> Result<MaterialCategory, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let category = MaterialCategory {
        id: id.clone(),
        name,
        sort_order: 0,
    };

    queries::create_category(&conn, &category).map_err(|e| e.to_string())?;

    Ok(category)
}

#[tauri::command]
pub fn delete_material_category(id: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::delete_category(&conn, &id).map_err(|e| e.to_string())
}

// Material Mappings
#[tauri::command]
pub fn get_scene_material_mappings(scene_id: String, state: State<AppState>) -> Result<Vec<MaterialMapping>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_material_mappings(&conn, &scene_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_material_mapping(
    scene_id: String,
    material_id: String,
    object_name: String,
    state: State<AppState>,
) -> Result<MaterialMapping, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    let mapping = MaterialMapping {
        id: id.clone(),
        scene_id,
        material_id,
        object_name,
        created_at: now,
    };

    queries::upsert_material_mapping(&conn, &mapping).map_err(|e| e.to_string())?;

    Ok(mapping)
}

#[tauri::command]
pub fn remove_material_mapping(scene_id: String, object_name: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::delete_material_mapping(&conn, &scene_id, &object_name).map_err(|e| e.to_string())
}

// Texture upload
#[tauri::command]
pub fn upload_material_texture(
    material_id: String,
    texture_type: String,
    source_path: String,
) -> Result<String, String> {
    let materials_dir = paths::get_materials_dir().map_err(|e| e.to_string())?;
    let texture_dir = materials_dir.join("textures").join(&material_id);
    paths::ensure_dir(&texture_dir).map_err(|e| e.to_string())?;

    let source = std::path::PathBuf::from(&source_path);
    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg");

    let dest_filename = format!("{}.{}", texture_type, ext);
    let dest_path = texture_dir.join(&dest_filename);

    std::fs::copy(&source_path, &dest_path).map_err(|e| e.to_string())?;

    // Return relative path
    Ok(format!("{}/{}", material_id, dest_filename))
}
