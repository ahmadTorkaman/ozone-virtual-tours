# Phase 2: Database & Local Storage

> **Scope**: Complete SQLite CRUD operations, file management, and data layer
> **Prerequisites**: Phase 1 complete (Tauri skeleton working)
> **Outputs**: Full data layer with all Rust commands for projects, scenes, materials, panoramas

---

## Overview

This phase completes the data layer:

1. Full CRUD commands for all entities
2. Scene import/export operations
3. Material management with textures
4. Panorama and hotspot management
5. File operations (copy, move, delete)
6. Thumbnail generation
7. Project export/import (.ozone packages)

---

## Context for New Sessions

If you're starting a new Claude session:

- **Project**: Ozone Studio - Desktop 3D scene viewer
- **Current State**: Phase 1 complete (basic Tauri app with SQLite)
- **Database**: SQLite in `Documents/Ozone Studio/database.sqlite`
- **Working Directory**: `C:/Users/Lion/ozone-virtual-tours`

Read `/docs/ARCHITECTURE.md` for full context.

---

## Task Checklist

### 2.1 Add Scene Commands

Create `src-tauri/src/models/scene.rs`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scene {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub glb_path: String,
    pub glb_size: i64,
    pub thumbnail_path: Option<String>,
    pub spawn_x: f64,
    pub spawn_y: f64,
    pub spawn_z: f64,
    pub spawn_rot_y: f64,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSceneInput {
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub source_path: String, // Path to GLB file to import
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateSceneInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub spawn_x: Option<f64>,
    pub spawn_y: Option<f64>,
    pub spawn_z: Option<f64>,
    pub spawn_rot_y: Option<f64>,
}
```

Add to `src-tauri/src/db/queries.rs`:

```rust
// ============================================
// SCENES
// ============================================

pub fn get_scenes_by_project(conn: &Connection, project_id: &str) -> Result<Vec<Scene>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, description, glb_path, glb_size,
                thumbnail_path, spawn_x, spawn_y, spawn_z, spawn_rot_y,
                sort_order, created_at, updated_at
         FROM scenes WHERE project_id = ?1 ORDER BY sort_order, created_at"
    )?;

    let scenes = stmt.query_map([project_id], |row| {
        Ok(Scene {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            glb_path: row.get(4)?,
            glb_size: row.get(5)?,
            thumbnail_path: row.get(6)?,
            spawn_x: row.get(7)?,
            spawn_y: row.get(8)?,
            spawn_z: row.get(9)?,
            spawn_rot_y: row.get(10)?,
            sort_order: row.get(11)?,
            created_at: row.get(12)?,
            updated_at: row.get(13)?,
        })
    })?;

    scenes.collect()
}

pub fn get_scene(conn: &Connection, id: &str) -> Result<Option<Scene>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, description, glb_path, glb_size,
                thumbnail_path, spawn_x, spawn_y, spawn_z, spawn_rot_y,
                sort_order, created_at, updated_at
         FROM scenes WHERE id = ?1"
    )?;

    let mut rows = stmt.query([id])?;

    if let Some(row) = rows.next()? {
        Ok(Some(Scene {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            glb_path: row.get(4)?,
            glb_size: row.get(5)?,
            thumbnail_path: row.get(6)?,
            spawn_x: row.get(7)?,
            spawn_y: row.get(8)?,
            spawn_z: row.get(9)?,
            spawn_rot_y: row.get(10)?,
            sort_order: row.get(11)?,
            created_at: row.get(12)?,
            updated_at: row.get(13)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn create_scene(conn: &Connection, scene: &Scene) -> Result<()> {
    conn.execute(
        "INSERT INTO scenes (id, project_id, name, description, glb_path, glb_size,
                             thumbnail_path, spawn_x, spawn_y, spawn_z, spawn_rot_y,
                             sort_order, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
        params![
            scene.id, scene.project_id, scene.name, scene.description,
            scene.glb_path, scene.glb_size, scene.thumbnail_path,
            scene.spawn_x, scene.spawn_y, scene.spawn_z, scene.spawn_rot_y,
            scene.sort_order, scene.created_at, scene.updated_at
        ],
    )?;
    Ok(())
}

pub fn update_scene(conn: &Connection, id: &str, name: Option<&str>, description: Option<&str>,
                    spawn_x: Option<f64>, spawn_y: Option<f64>, spawn_z: Option<f64>,
                    spawn_rot_y: Option<f64>) -> Result<()> {
    let mut updates = vec!["updated_at = datetime('now')".to_string()];
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![];

    if let Some(n) = name {
        updates.push(format!("name = ?{}", params.len() + 1));
        params.push(Box::new(n.to_string()));
    }
    if let Some(d) = description {
        updates.push(format!("description = ?{}", params.len() + 1));
        params.push(Box::new(d.to_string()));
    }
    if let Some(x) = spawn_x {
        updates.push(format!("spawn_x = ?{}", params.len() + 1));
        params.push(Box::new(x));
    }
    if let Some(y) = spawn_y {
        updates.push(format!("spawn_y = ?{}", params.len() + 1));
        params.push(Box::new(y));
    }
    if let Some(z) = spawn_z {
        updates.push(format!("spawn_z = ?{}", params.len() + 1));
        params.push(Box::new(z));
    }
    if let Some(r) = spawn_rot_y {
        updates.push(format!("spawn_rot_y = ?{}", params.len() + 1));
        params.push(Box::new(r));
    }

    params.push(Box::new(id.to_string()));

    let sql = format!(
        "UPDATE scenes SET {} WHERE id = ?{}",
        updates.join(", "),
        params.len()
    );

    conn.execute(&sql, rusqlite::params_from_iter(params.iter().map(|p| p.as_ref())))?;
    Ok(())
}

pub fn delete_scene(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM scenes WHERE id = ?1", [id])?;
    Ok(())
}

pub fn reorder_scenes(conn: &Connection, scene_ids: &[String]) -> Result<()> {
    for (index, id) in scene_ids.iter().enumerate() {
        conn.execute(
            "UPDATE scenes SET sort_order = ?1 WHERE id = ?2",
            params![index as i32, id],
        )?;
    }
    Ok(())
}
```

Create `src-tauri/src/commands/scenes.rs`:

```rust
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
    let project = queries::get_project(&conn, &input.project_id)
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
    let project_dir = paths::get_project_dir(&project.id).map_err(|e| e.to_string())?;
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
        &conn, &id,
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

/// Get the full filesystem path to a scene's GLB file
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
```

### 2.2 Add Material Commands

Create `src-tauri/src/models/material.rs`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Material {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub category_id: Option<String>,
    pub thumbnail_path: Option<String>,
    pub properties: String, // JSON string
    pub created_at: String,
    pub updated_at: String,
    pub cloud_id: Option<String>,
    pub is_synced: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialCategory {
    pub id: String,
    pub name: String,
    pub sort_order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialProperties {
    #[serde(rename = "type")]
    pub material_type: String, // PHYSICAL, STANDARD, BASIC

    // Core PBR
    pub color: Option<String>,
    pub metalness: f64,
    pub roughness: f64,
    pub opacity: f64,
    pub transparent: bool,

    // Clearcoat
    pub clearcoat: f64,
    pub clearcoat_roughness: f64,

    // Sheen
    pub sheen: f64,
    pub sheen_roughness: f64,
    pub sheen_color: Option<String>,

    // Transmission
    pub transmission: f64,
    pub thickness: f64,
    pub ior: f64,

    // Iridescence
    pub iridescence: f64,
    pub iridescence_ior: f64,

    // Anisotropy
    pub anisotropy: f64,
    pub anisotropy_rotation: f64,

    // Texture paths (relative to materials/textures/{materialId}/)
    pub map_path: Option<String>,
    pub normal_map_path: Option<String>,
    pub roughness_map_path: Option<String>,
    pub metalness_map_path: Option<String>,
    pub ao_map_path: Option<String>,
    pub emissive_map_path: Option<String>,
}

impl Default for MaterialProperties {
    fn default() -> Self {
        Self {
            material_type: "PHYSICAL".to_string(),
            color: Some("#ffffff".to_string()),
            metalness: 0.0,
            roughness: 1.0,
            opacity: 1.0,
            transparent: false,
            clearcoat: 0.0,
            clearcoat_roughness: 0.0,
            sheen: 0.0,
            sheen_roughness: 1.0,
            sheen_color: None,
            transmission: 0.0,
            thickness: 0.0,
            ior: 1.5,
            iridescence: 0.0,
            iridescence_ior: 1.3,
            anisotropy: 0.0,
            anisotropy_rotation: 0.0,
            map_path: None,
            normal_map_path: None,
            roughness_map_path: None,
            metalness_map_path: None,
            ao_map_path: None,
            emissive_map_path: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMaterialInput {
    pub name: String,
    pub description: Option<String>,
    pub category_id: Option<String>,
    pub properties: MaterialProperties,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateMaterialInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub category_id: Option<String>,
    pub properties: Option<MaterialProperties>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialMapping {
    pub id: String,
    pub scene_id: String,
    pub material_id: String,
    pub object_name: String,
    pub created_at: String,
}
```

Create `src-tauri/src/commands/materials.rs`:

```rust
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use crate::AppState;
use crate::db::queries;
use crate::models::material::{
    Material, MaterialCategory, MaterialProperties,
    CreateMaterialInput, UpdateMaterialInput, MaterialMapping
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
        &conn, &id,
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
    state: State<AppState>
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
    texture_type: String, // "map", "normal", "roughness", etc.
    source_path: String,
) -> Result<String, String> {
    let materials_dir = paths::get_materials_dir().map_err(|e| e.to_string())?;
    let texture_dir = materials_dir.join("textures").join(&material_id);
    paths::ensure_dir(&texture_dir).map_err(|e| e.to_string())?;

    let source = std::path::PathBuf::from(&source_path);
    let ext = source.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg");

    let dest_filename = format!("{}.{}", texture_type, ext);
    let dest_path = texture_dir.join(&dest_filename);

    std::fs::copy(&source_path, &dest_path).map_err(|e| e.to_string())?;

    // Return relative path
    Ok(format!("{}/{}", material_id, dest_filename))
}
```

### 2.3 Add Panorama Commands

Create `src-tauri/src/models/panorama.rs`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Panorama {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub image_path: String,
    pub thumbnail_path: Option<String>,
    pub initial_yaw: f64,
    pub initial_pitch: f64,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Hotspot {
    pub id: String,
    pub panorama_id: String,
    pub hotspot_type: String, // NAVIGATION, INFO, MEDIA, LINK
    pub yaw: f64,
    pub pitch: f64,
    pub target_panorama_id: Option<String>,
    pub content: Option<String>, // JSON
    pub icon: Option<String>,
    pub color: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotspotContent {
    pub title: Option<String>,
    pub description: Option<String>,
    pub url: Option<String>,
    pub media_url: Option<String>,
    pub media_type: Option<String>, // "image" or "video"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreatePanoramaInput {
    pub project_id: String,
    pub name: String,
    pub description: Option<String>,
    pub source_path: String,
    pub initial_yaw: Option<f64>,
    pub initial_pitch: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateHotspotInput {
    pub panorama_id: String,
    pub hotspot_type: String,
    pub yaw: f64,
    pub pitch: f64,
    pub target_panorama_id: Option<String>,
    pub content: Option<HotspotContent>,
    pub icon: Option<String>,
    pub color: Option<String>,
}
```

Create `src-tauri/src/commands/panoramas.rs`:

```rust
use std::path::PathBuf;
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

use crate::AppState;
use crate::db::queries;
use crate::models::panorama::{Panorama, Hotspot, CreatePanoramaInput, CreateHotspotInput};
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
    let project = queries::get_project(&conn, &input.project_id)
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
    let project_dir = paths::get_project_dir(&project.id).map_err(|e| e.to_string())?;
    let panoramas_dir = project_dir.join("panoramas");
    paths::ensure_dir(&panoramas_dir).map_err(|e| e.to_string())?;

    let ext = source_path.extension()
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
pub fn delete_panorama(id: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    // Get panorama to find file path
    if let Some(panorama) = queries::get_panorama(&conn, &id).map_err(|e| e.to_string())? {
        if let Ok(project_dir) = paths::get_project_dir(&panorama.project_id) {
            let image_path = project_dir.join(&panorama.image_path);
            if image_path.exists() {
                let _ = std::fs::remove_file(&image_path);
            }
        }
    }

    queries::delete_panorama(&conn, &id).map_err(|e| e.to_string())
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
    state: State<AppState>
) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::update_hotspot(&conn, &id, yaw, pitch, target_panorama_id.as_deref(), content.as_deref())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_hotspot(id: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::delete_hotspot(&conn, &id).map_err(|e| e.to_string())
}
```

### 2.4 Add Project Export/Import

Create `src-tauri/src/commands/export.rs`:

```rust
use std::io::{Read, Write};
use std::path::PathBuf;
use std::fs::File;
use zip::write::FileOptions;
use zip::ZipArchive;
use tauri::State;

use crate::AppState;
use crate::db::queries;
use crate::utils::paths;

/// Export a project to a .ozone file (zip archive)
#[tauri::command]
pub fn export_project(project_id: String, destination: String, state: State<AppState>) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    // Get project data
    let project = queries::get_project(&conn, &project_id)
        .map_err(|e| e.to_string())?
        .ok_or("Project not found")?;

    let scenes = queries::get_scenes_by_project(&conn, &project_id).map_err(|e| e.to_string())?;
    let panoramas = queries::get_panoramas_by_project(&conn, &project_id).map_err(|e| e.to_string())?;

    // Get material mappings for all scenes
    let mut all_mappings = Vec::new();
    for scene in &scenes {
        let mappings = queries::get_material_mappings(&conn, &scene.id).map_err(|e| e.to_string())?;
        all_mappings.extend(mappings);
    }

    // Get hotspots for all panoramas
    let mut all_hotspots = Vec::new();
    for panorama in &panoramas {
        let hotspots = queries::get_hotspots_by_panorama(&conn, &panorama.id).map_err(|e| e.to_string())?;
        all_hotspots.extend(hotspots);
    }

    // Create manifest
    let manifest = serde_json::json!({
        "version": "1.0",
        "project": project,
        "scenes": scenes,
        "panoramas": panoramas,
        "material_mappings": all_mappings,
        "hotspots": all_hotspots,
    });

    // Create zip file
    let dest_path = PathBuf::from(&destination);
    let file = File::create(&dest_path).map_err(|e| e.to_string())?;
    let mut zip = zip::ZipWriter::new(file);

    let options = FileOptions::default().compression_method(zip::CompressionMethod::Deflated);

    // Add manifest
    zip.start_file("manifest.json", options).map_err(|e| e.to_string())?;
    zip.write_all(serde_json::to_string_pretty(&manifest).unwrap().as_bytes())
        .map_err(|e| e.to_string())?;

    // Add files
    let project_dir = paths::get_project_dir(&project_id).map_err(|e| e.to_string())?;

    // Add scene GLB files
    for scene in &scenes {
        let file_path = project_dir.join(&scene.glb_path);
        if file_path.exists() {
            let mut f = File::open(&file_path).map_err(|e| e.to_string())?;
            let mut buffer = Vec::new();
            f.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

            zip.start_file(&scene.glb_path, options).map_err(|e| e.to_string())?;
            zip.write_all(&buffer).map_err(|e| e.to_string())?;
        }
    }

    // Add panorama images
    for panorama in &panoramas {
        let file_path = project_dir.join(&panorama.image_path);
        if file_path.exists() {
            let mut f = File::open(&file_path).map_err(|e| e.to_string())?;
            let mut buffer = Vec::new();
            f.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

            zip.start_file(&panorama.image_path, options).map_err(|e| e.to_string())?;
            zip.write_all(&buffer).map_err(|e| e.to_string())?;
        }
    }

    zip.finish().map_err(|e| e.to_string())?;

    Ok(dest_path.to_string_lossy().to_string())
}

/// Import a project from a .ozone file
#[tauri::command]
pub fn import_project(source: String, state: State<AppState>) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    let file = File::open(&source).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

    // Read manifest
    let manifest: serde_json::Value = {
        let mut manifest_file = archive.by_name("manifest.json").map_err(|e| e.to_string())?;
        let mut contents = String::new();
        manifest_file.read_to_string(&mut contents).map_err(|e| e.to_string())?;
        serde_json::from_str(&contents).map_err(|e| e.to_string())?
    };

    // Parse project from manifest
    let project: crate::models::project::Project = serde_json::from_value(manifest["project"].clone())
        .map_err(|e| e.to_string())?;

    // Generate new IDs (to avoid conflicts)
    let new_project_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();

    let mut new_project = project.clone();
    new_project.id = new_project_id.clone();
    new_project.folder_path = new_project_id.clone();
    new_project.created_at = now.clone();
    new_project.updated_at = now.clone();
    new_project.name = format!("{} (Imported)", project.name);

    // Create project directory
    let project_dir = paths::get_project_dir(&new_project_id).map_err(|e| e.to_string())?;
    paths::ensure_dir(&project_dir).map_err(|e| e.to_string())?;
    paths::ensure_dir(&project_dir.join("scenes")).map_err(|e| e.to_string())?;
    paths::ensure_dir(&project_dir.join("panoramas")).map_err(|e| e.to_string())?;

    // Extract files and create database entries
    // (simplified - full implementation would handle ID mapping)

    // Save project to database
    queries::create_project(&conn, &new_project).map_err(|e| e.to_string())?;

    // Extract all files
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = file.name().to_string();

        if name == "manifest.json" {
            continue;
        }

        let dest_path = project_dir.join(&name);
        if let Some(parent) = dest_path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }

        let mut outfile = File::create(&dest_path).map_err(|e| e.to_string())?;
        std::io::copy(&mut file, &mut outfile).map_err(|e| e.to_string())?;
    }

    Ok(new_project_id)
}
```

### 2.5 Update lib.rs with All Commands

Update `src-tauri/src/lib.rs`:

```rust
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
            let app_data_dir = utils::paths::get_app_data_dir()?;
            let db_path = app_data_dir.join("database.sqlite");

            if let Some(parent) = db_path.parent() {
                std::fs::create_dir_all(parent)?;
            }

            let conn = db::connection::open_database(&db_path)?;
            db::migrations::run_migrations(&conn)?;

            app.manage(AppState {
                db: Mutex::new(conn),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Projects
            commands::projects::list_projects,
            commands::projects::get_project,
            commands::projects::create_project,
            commands::projects::update_project,
            commands::projects::delete_project,

            // Scenes
            commands::scenes::list_scenes,
            commands::scenes::get_scene,
            commands::scenes::import_scene,
            commands::scenes::update_scene,
            commands::scenes::delete_scene,
            commands::scenes::reorder_scenes,
            commands::scenes::get_scene_file_path,

            // Materials
            commands::materials::list_materials,
            commands::materials::list_materials_by_category,
            commands::materials::get_material,
            commands::materials::create_material,
            commands::materials::update_material,
            commands::materials::delete_material,
            commands::materials::list_material_categories,
            commands::materials::create_material_category,
            commands::materials::get_scene_material_mappings,
            commands::materials::set_material_mapping,
            commands::materials::remove_material_mapping,
            commands::materials::upload_material_texture,

            // Panoramas
            commands::panoramas::list_panoramas,
            commands::panoramas::get_panorama,
            commands::panoramas::import_panorama,
            commands::panoramas::delete_panorama,
            commands::panoramas::get_panorama_file_path,
            commands::panoramas::list_hotspots,
            commands::panoramas::create_hotspot,
            commands::panoramas::update_hotspot,
            commands::panoramas::delete_hotspot,

            // Files
            commands::files::get_app_data_path,
            commands::files::get_documents_path,
            commands::files::ensure_directory,
            commands::files::read_file,
            commands::files::write_file,
            commands::files::copy_file,
            commands::files::delete_file,
            commands::files::list_directory,

            // Settings
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::settings::get_all_settings,

            // Export/Import
            commands::export::export_project,
            commands::export::import_project,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 2.6 Update Cargo.toml for New Dependencies

Add to `src-tauri/Cargo.toml`:

```toml
[dependencies]
# ... existing deps ...
tauri-plugin-dialog = "2.0.0-beta"
zip = "0.6"
```

---

## Frontend Service Updates

Update `src/services/tauri/index.ts` with all new commands:

```typescript
import { invoke } from '@tauri-apps/api/core';

// ... existing types ...

// Scene types
export interface Scene {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  glb_path: string;
  glb_size: number;
  thumbnail_path: string | null;
  spawn_x: number;
  spawn_y: number;
  spawn_z: number;
  spawn_rot_y: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSceneInput {
  project_id: string;
  name: string;
  description?: string;
  source_path: string;
}

// Material types
export interface Material {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  thumbnail_path: string | null;
  properties: string; // JSON
  created_at: string;
  updated_at: string;
}

export interface MaterialProperties {
  type: string;
  color?: string;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;
  // ... all other properties
}

// Scene commands
export const listScenes = (projectId: string) =>
  invoke<Scene[]>('list_scenes', { projectId });

export const getScene = (id: string) =>
  invoke<Scene | null>('get_scene', { id });

export const importScene = (input: CreateSceneInput) =>
  invoke<Scene>('import_scene', { input });

export const updateScene = (id: string, input: Partial<Scene>) =>
  invoke<void>('update_scene', { id, input });

export const deleteScene = (id: string) =>
  invoke<void>('delete_scene', { id });

export const getSceneFilePath = (id: string) =>
  invoke<string>('get_scene_file_path', { id });

// Material commands
export const listMaterials = () =>
  invoke<Material[]>('list_materials');

export const getMaterial = (id: string) =>
  invoke<Material | null>('get_material', { id });

export const createMaterial = (input: any) =>
  invoke<Material>('create_material', { input });

export const updateMaterial = (id: string, input: any) =>
  invoke<void>('update_material', { id, input });

export const deleteMaterial = (id: string) =>
  invoke<void>('delete_material', { id });

// Export/Import
export const exportProject = (projectId: string, destination: string) =>
  invoke<string>('export_project', { projectId, destination });

export const importProject = (source: string) =>
  invoke<string>('import_project', { source });
```

---

## Verification Checklist

After completing Phase 2, verify:

- [ ] All Rust commands compile without errors
- [ ] Scene import works (copy GLB to project folder)
- [ ] Scene appears in project scene list
- [ ] Material CRUD works
- [ ] Material categories are populated
- [ ] Material mappings can be set/removed
- [ ] Panorama import works
- [ ] Hotspot CRUD works
- [ ] Project export creates .ozone file
- [ ] Project import extracts and creates new project
- [ ] File dialog opens for import/export

---

## Common Issues

### File Permission Errors
- Ensure Documents folder is writable
- Check antivirus isn't blocking file operations

### SQLite Locked
- Only one connection should be active
- Use `Mutex` for thread safety

### Path Handling on Windows
- Use `PathBuf` for cross-platform paths
- Convert to string with `to_string_lossy()`

---

## Next Phase

After Phase 2 is complete, proceed to **Phase 3: Scene Viewer** which covers:
- React Three Fiber setup
- GLB loading from local filesystem
- First-person controls
- Object selection
- Scene hierarchy panel
