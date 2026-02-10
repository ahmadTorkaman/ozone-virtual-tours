use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use crate::AppState;
use crate::db::queries;
use crate::models::configurator::{
    ComponentGroup, CreateComponentGroupInput, UpdateComponentGroupInput, ComponentMaterialOption,
};
use crate::utils::errors::AppError;

#[tauri::command]
pub fn list_component_groups(scene_id: String, state: State<AppState>) -> Result<Vec<ComponentGroup>, String> {
    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;
    queries::get_component_groups_by_scene(&conn, &scene_id)
        .map_err(|e| String::from(AppError::Database(e)))
}

#[tauri::command]
pub fn get_component_group(id: String, state: State<AppState>) -> Result<Option<ComponentGroup>, String> {
    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;
    queries::get_component_group(&conn, &id)
        .map_err(|e| String::from(AppError::Database(e)))
}

#[tauri::command]
pub fn create_component_group(input: CreateComponentGroupInput, state: State<AppState>) -> Result<ComponentGroup, String> {
    if input.group_name.trim().is_empty() {
        return Err(String::from(AppError::ValidationError("Group name cannot be empty".to_string())));
    }

    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;

    let now = Utc::now().to_rfc3339();
    let mesh_names_json = serde_json::to_string(&input.mesh_names)
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;

    // Get next sort_order
    let existing = queries::get_component_groups_by_scene(&conn, &input.scene_id)
        .map_err(|e| String::from(AppError::Database(e)))?;
    let sort_order = existing.len() as i32;

    let group = ComponentGroup {
        id: Uuid::new_v4().to_string(),
        project_id: input.project_id,
        scene_id: input.scene_id,
        group_name: input.group_name,
        mesh_names: mesh_names_json,
        default_material_id: input.default_material_id,
        sort_order,
        created_at: now.clone(),
        updated_at: now,
    };

    queries::create_component_group(&conn, &group)
        .map_err(|e| String::from(AppError::Database(e)))?;

    Ok(group)
}

#[tauri::command]
pub fn update_component_group(id: String, input: UpdateComponentGroupInput, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;
    queries::update_component_group(&conn, &id, &input)
        .map_err(|e| String::from(AppError::Database(e)))
}

#[tauri::command]
pub fn delete_component_group(id: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;
    queries::delete_component_group(&conn, &id)
        .map_err(|e| String::from(AppError::Database(e)))
}

#[tauri::command]
pub fn reorder_component_groups(ids: Vec<String>, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;
    queries::reorder_component_groups(&conn, &ids)
        .map_err(|e| String::from(AppError::Database(e)))
}

#[tauri::command]
pub fn add_material_option(component_group_id: String, material_id: String, state: State<AppState>) -> Result<ComponentMaterialOption, String> {
    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;

    // Get next sort_order
    let existing = queries::get_material_options(&conn, &component_group_id)
        .map_err(|e| String::from(AppError::Database(e)))?;
    let sort_order = existing.len() as i32;

    let option = ComponentMaterialOption {
        id: Uuid::new_v4().to_string(),
        component_group_id,
        material_id,
        sort_order,
    };

    queries::add_material_option(&conn, &option)
        .map_err(|e| String::from(AppError::Database(e)))?;

    Ok(option)
}

#[tauri::command]
pub fn remove_material_option(id: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;
    queries::remove_material_option(&conn, &id)
        .map_err(|e| String::from(AppError::Database(e)))
}

#[tauri::command]
pub fn reorder_material_options(ids: Vec<String>, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;
    queries::reorder_material_options(&conn, &ids)
        .map_err(|e| String::from(AppError::Database(e)))
}

#[tauri::command]
pub fn list_material_options(component_group_id: String, state: State<AppState>) -> Result<Vec<ComponentMaterialOption>, String> {
    let conn = state.db.lock()
        .map_err(|e| String::from(AppError::Internal(e.to_string())))?;
    queries::get_material_options(&conn, &component_group_id)
        .map_err(|e| String::from(AppError::Database(e)))
}
