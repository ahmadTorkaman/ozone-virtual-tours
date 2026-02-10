use rusqlite::{Connection, Result, params};
use crate::models::project::Project;
use crate::models::settings::Setting;
use crate::models::scene::Scene;
use crate::models::material::{Material, MaterialCategory, MaterialMapping};
use crate::models::panorama::{Panorama, Hotspot};
use crate::models::firm::{FirmProfile, UpdateFirmProfileInput};
use crate::models::configurator::{ComponentGroup, ComponentMaterialOption, UpdateComponentGroupInput};
use crate::license::{License, LicenseTier};
use crate::utils::slug::slugify;

// ============================================
// PROJECTS
// ============================================

pub fn get_all_projects(conn: &Connection) -> Result<Vec<Project>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, thumbnail_path, folder_path,
                created_at, updated_at, cloud_id, last_synced_at, sync_enabled,
                scene_published, panorama_published, publish_version, published_at, publish_slug
         FROM projects ORDER BY updated_at DESC"
    )?;

    let projects = stmt.query_map([], |row| {
        Ok(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            thumbnail_path: row.get(3)?,
            folder_path: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
            cloud_id: row.get(7)?,
            last_synced_at: row.get(8)?,
            sync_enabled: row.get(9)?,
            scene_published: row.get(10)?,
            panorama_published: row.get(11)?,
            publish_version: row.get(12)?,
            published_at: row.get(13)?,
            publish_slug: row.get(14)?,
        })
    })?;

    projects.collect()
}

pub fn get_project(conn: &Connection, id: &str) -> Result<Option<Project>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, thumbnail_path, folder_path,
                created_at, updated_at, cloud_id, last_synced_at, sync_enabled,
                scene_published, panorama_published, publish_version, published_at, publish_slug
         FROM projects WHERE id = ?1"
    )?;

    let mut rows = stmt.query([id])?;

    if let Some(row) = rows.next()? {
        Ok(Some(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            thumbnail_path: row.get(3)?,
            folder_path: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
            cloud_id: row.get(7)?,
            last_synced_at: row.get(8)?,
            sync_enabled: row.get(9)?,
            scene_published: row.get(10)?,
            panorama_published: row.get(11)?,
            publish_version: row.get(12)?,
            published_at: row.get(13)?,
            publish_slug: row.get(14)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn create_project(conn: &Connection, project: &Project) -> Result<()> {
    conn.execute(
        "INSERT INTO projects (id, name, description, thumbnail_path, folder_path,
                               created_at, updated_at, cloud_id, last_synced_at, sync_enabled,
                               scene_published, panorama_published, publish_version, published_at, publish_slug)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
        params![
            project.id,
            project.name,
            project.description,
            project.thumbnail_path,
            project.folder_path,
            project.created_at,
            project.updated_at,
            project.cloud_id,
            project.last_synced_at,
            project.sync_enabled,
            project.scene_published,
            project.panorama_published,
            project.publish_version,
            project.published_at,
            project.publish_slug,
        ],
    )?;
    Ok(())
}

pub fn update_project(conn: &Connection, id: &str, name: &str, description: Option<&str>) -> Result<()> {
    conn.execute(
        "UPDATE projects SET name = ?1, description = ?2, updated_at = datetime('now')
         WHERE id = ?3",
        params![name, description, id],
    )?;
    Ok(())
}

pub fn delete_project(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM projects WHERE id = ?1", [id])?;
    Ok(())
}

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

pub fn update_scene(
    conn: &Connection,
    id: &str,
    name: Option<&str>,
    description: Option<&str>,
    spawn_x: Option<f64>,
    spawn_y: Option<f64>,
    spawn_z: Option<f64>,
    spawn_rot_y: Option<f64>,
) -> Result<()> {
    let mut updates = vec!["updated_at = datetime('now')".to_string()];
    let mut param_values: Vec<String> = vec![];
    let mut param_index = 1;

    if let Some(n) = name {
        updates.push(format!("name = ?{}", param_index));
        param_values.push(n.to_string());
        param_index += 1;
    }
    if let Some(d) = description {
        updates.push(format!("description = ?{}", param_index));
        param_values.push(d.to_string());
        param_index += 1;
    }

    // For numeric values, we need to build a dynamic query
    let sql = if spawn_x.is_some() || spawn_y.is_some() || spawn_z.is_some() || spawn_rot_y.is_some() {
        let mut numeric_updates = vec![];
        if let Some(x) = spawn_x {
            numeric_updates.push(format!("spawn_x = {}", x));
        }
        if let Some(y) = spawn_y {
            numeric_updates.push(format!("spawn_y = {}", y));
        }
        if let Some(z) = spawn_z {
            numeric_updates.push(format!("spawn_z = {}", z));
        }
        if let Some(r) = spawn_rot_y {
            numeric_updates.push(format!("spawn_rot_y = {}", r));
        }
        updates.extend(numeric_updates);
        format!(
            "UPDATE scenes SET {} WHERE id = ?{}",
            updates.join(", "),
            param_index
        )
    } else {
        format!(
            "UPDATE scenes SET {} WHERE id = ?{}",
            updates.join(", "),
            param_index
        )
    };

    param_values.push(id.to_string());

    let params: Vec<&dyn rusqlite::ToSql> = param_values
        .iter()
        .map(|s| s as &dyn rusqlite::ToSql)
        .collect();

    conn.execute(&sql, params.as_slice())?;
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

// ============================================
// MATERIALS
// ============================================

pub fn get_all_materials(conn: &Connection) -> Result<Vec<Material>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, category_id, thumbnail_path,
                properties, created_at, updated_at, cloud_id, is_synced
         FROM materials ORDER BY name"
    )?;

    let materials = stmt.query_map([], |row| {
        Ok(Material {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            category_id: row.get(3)?,
            thumbnail_path: row.get(4)?,
            properties: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
            cloud_id: row.get(8)?,
            is_synced: row.get(9)?,
        })
    })?;

    materials.collect()
}

pub fn get_materials_by_category(conn: &Connection, category_id: Option<&str>) -> Result<Vec<Material>> {
    let sql = match category_id {
        Some(_) => "SELECT id, name, description, category_id, thumbnail_path,
                           properties, created_at, updated_at, cloud_id, is_synced
                    FROM materials WHERE category_id = ?1 ORDER BY name",
        None => "SELECT id, name, description, category_id, thumbnail_path,
                        properties, created_at, updated_at, cloud_id, is_synced
                 FROM materials WHERE category_id IS NULL ORDER BY name",
    };

    let mut stmt = conn.prepare(sql)?;

    let row_mapper = |row: &rusqlite::Row| -> rusqlite::Result<Material> {
        Ok(Material {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            category_id: row.get(3)?,
            thumbnail_path: row.get(4)?,
            properties: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
            cloud_id: row.get(8)?,
            is_synced: row.get(9)?,
        })
    };

    let materials: Vec<Material> = if let Some(cat_id) = category_id {
        stmt.query_map([cat_id], row_mapper)?.collect::<rusqlite::Result<Vec<_>>>()?
    } else {
        stmt.query_map([], row_mapper)?.collect::<rusqlite::Result<Vec<_>>>()?
    };

    Ok(materials)
}

pub fn get_material(conn: &Connection, id: &str) -> Result<Option<Material>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, category_id, thumbnail_path,
                properties, created_at, updated_at, cloud_id, is_synced
         FROM materials WHERE id = ?1"
    )?;

    let mut rows = stmt.query([id])?;

    if let Some(row) = rows.next()? {
        Ok(Some(Material {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            category_id: row.get(3)?,
            thumbnail_path: row.get(4)?,
            properties: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
            cloud_id: row.get(8)?,
            is_synced: row.get(9)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn create_material(conn: &Connection, material: &Material) -> Result<()> {
    conn.execute(
        "INSERT INTO materials (id, name, description, category_id, thumbnail_path,
                                properties, created_at, updated_at, cloud_id, is_synced)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
        params![
            material.id,
            material.name,
            material.description,
            material.category_id,
            material.thumbnail_path,
            material.properties,
            material.created_at,
            material.updated_at,
            material.cloud_id,
            material.is_synced,
        ],
    )?;
    Ok(())
}

pub fn update_material(
    conn: &Connection,
    id: &str,
    name: Option<&str>,
    description: Option<&str>,
    category_id: Option<&str>,
    properties: Option<&str>,
) -> Result<()> {
    let mut updates = vec!["updated_at = datetime('now')".to_string()];
    let mut param_values: Vec<Option<String>> = vec![];
    let mut param_index = 1;

    if let Some(n) = name {
        updates.push(format!("name = ?{}", param_index));
        param_values.push(Some(n.to_string()));
        param_index += 1;
    }
    if let Some(d) = description {
        updates.push(format!("description = ?{}", param_index));
        param_values.push(Some(d.to_string()));
        param_index += 1;
    }
    if let Some(c) = category_id {
        updates.push(format!("category_id = ?{}", param_index));
        param_values.push(Some(c.to_string()));
        param_index += 1;
    }
    if let Some(p) = properties {
        updates.push(format!("properties = ?{}", param_index));
        param_values.push(Some(p.to_string()));
        param_index += 1;
    }

    param_values.push(Some(id.to_string()));

    let sql = format!(
        "UPDATE materials SET {} WHERE id = ?{}",
        updates.join(", "),
        param_index
    );

    let params: Vec<&dyn rusqlite::ToSql> = param_values
        .iter()
        .map(|s| s as &dyn rusqlite::ToSql)
        .collect();

    conn.execute(&sql, params.as_slice())?;
    Ok(())
}

pub fn delete_material(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM materials WHERE id = ?1", [id])?;
    Ok(())
}

// ============================================
// MATERIAL CATEGORIES
// ============================================

pub fn get_all_categories(conn: &Connection) -> Result<Vec<MaterialCategory>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, sort_order FROM material_categories ORDER BY sort_order, name"
    )?;

    let categories = stmt.query_map([], |row| {
        Ok(MaterialCategory {
            id: row.get(0)?,
            name: row.get(1)?,
            sort_order: row.get(2)?,
        })
    })?;

    categories.collect()
}

pub fn create_category(conn: &Connection, category: &MaterialCategory) -> Result<()> {
    conn.execute(
        "INSERT INTO material_categories (id, name, sort_order) VALUES (?1, ?2, ?3)",
        params![category.id, category.name, category.sort_order],
    )?;
    Ok(())
}

pub fn delete_category(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM material_categories WHERE id = ?1", [id])?;
    Ok(())
}

// ============================================
// MATERIAL MAPPINGS
// ============================================

pub fn get_material_mappings(conn: &Connection, scene_id: &str) -> Result<Vec<MaterialMapping>> {
    let mut stmt = conn.prepare(
        "SELECT id, scene_id, material_id, object_name, created_at
         FROM material_mappings WHERE scene_id = ?1"
    )?;

    let mappings = stmt.query_map([scene_id], |row| {
        Ok(MaterialMapping {
            id: row.get(0)?,
            scene_id: row.get(1)?,
            material_id: row.get(2)?,
            object_name: row.get(3)?,
            created_at: row.get(4)?,
        })
    })?;

    mappings.collect()
}

pub fn upsert_material_mapping(conn: &Connection, mapping: &MaterialMapping) -> Result<()> {
    conn.execute(
        "INSERT INTO material_mappings (id, scene_id, material_id, object_name, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(scene_id, object_name) DO UPDATE SET
            material_id = excluded.material_id,
            id = excluded.id",
        params![
            mapping.id,
            mapping.scene_id,
            mapping.material_id,
            mapping.object_name,
            mapping.created_at,
        ],
    )?;
    Ok(())
}

pub fn delete_material_mapping(conn: &Connection, scene_id: &str, object_name: &str) -> Result<()> {
    conn.execute(
        "DELETE FROM material_mappings WHERE scene_id = ?1 AND object_name = ?2",
        params![scene_id, object_name],
    )?;
    Ok(())
}

// ============================================
// PANORAMAS
// ============================================

pub fn get_panoramas_by_project(conn: &Connection, project_id: &str) -> Result<Vec<Panorama>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, description, image_path, thumbnail_path,
                initial_yaw, initial_pitch, sort_order, created_at, updated_at
         FROM panoramas WHERE project_id = ?1 ORDER BY sort_order, created_at"
    )?;

    let panoramas = stmt.query_map([project_id], |row| {
        Ok(Panorama {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            image_path: row.get(4)?,
            thumbnail_path: row.get(5)?,
            initial_yaw: row.get(6)?,
            initial_pitch: row.get(7)?,
            sort_order: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })
    })?;

    panoramas.collect()
}

pub fn get_panorama(conn: &Connection, id: &str) -> Result<Option<Panorama>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, name, description, image_path, thumbnail_path,
                initial_yaw, initial_pitch, sort_order, created_at, updated_at
         FROM panoramas WHERE id = ?1"
    )?;

    let mut rows = stmt.query([id])?;

    if let Some(row) = rows.next()? {
        Ok(Some(Panorama {
            id: row.get(0)?,
            project_id: row.get(1)?,
            name: row.get(2)?,
            description: row.get(3)?,
            image_path: row.get(4)?,
            thumbnail_path: row.get(5)?,
            initial_yaw: row.get(6)?,
            initial_pitch: row.get(7)?,
            sort_order: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn create_panorama(conn: &Connection, panorama: &Panorama) -> Result<()> {
    conn.execute(
        "INSERT INTO panoramas (id, project_id, name, description, image_path,
                                thumbnail_path, initial_yaw, initial_pitch,
                                sort_order, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            panorama.id,
            panorama.project_id,
            panorama.name,
            panorama.description,
            panorama.image_path,
            panorama.thumbnail_path,
            panorama.initial_yaw,
            panorama.initial_pitch,
            panorama.sort_order,
            panorama.created_at,
            panorama.updated_at,
        ],
    )?;
    Ok(())
}

pub fn update_panorama(
    conn: &Connection,
    id: &str,
    name: Option<&str>,
    description: Option<&str>,
    initial_yaw: Option<f64>,
    initial_pitch: Option<f64>,
) -> Result<()> {
    let mut updates = vec!["updated_at = datetime('now')".to_string()];
    let mut param_values: Vec<String> = vec![];
    let mut param_index = 1;

    if let Some(n) = name {
        updates.push(format!("name = ?{}", param_index));
        param_values.push(n.to_string());
        param_index += 1;
    }
    if let Some(d) = description {
        updates.push(format!("description = ?{}", param_index));
        param_values.push(d.to_string());
        param_index += 1;
    }
    if let Some(y) = initial_yaw {
        updates.push(format!("initial_yaw = {}", y));
    }
    if let Some(p) = initial_pitch {
        updates.push(format!("initial_pitch = {}", p));
    }

    param_values.push(id.to_string());

    let sql = format!(
        "UPDATE panoramas SET {} WHERE id = ?{}",
        updates.join(", "),
        param_index
    );

    let params: Vec<&dyn rusqlite::ToSql> = param_values
        .iter()
        .map(|s| s as &dyn rusqlite::ToSql)
        .collect();

    conn.execute(&sql, params.as_slice())?;
    Ok(())
}

pub fn delete_panorama(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM panoramas WHERE id = ?1", [id])?;
    Ok(())
}

pub fn reorder_panoramas(conn: &Connection, panorama_ids: &[String]) -> Result<()> {
    for (index, id) in panorama_ids.iter().enumerate() {
        conn.execute(
            "UPDATE panoramas SET sort_order = ?1 WHERE id = ?2",
            params![index as i32, id],
        )?;
    }
    Ok(())
}

// ============================================
// HOTSPOTS
// ============================================

pub fn get_hotspots_by_panorama(conn: &Connection, panorama_id: &str) -> Result<Vec<Hotspot>> {
    let mut stmt = conn.prepare(
        "SELECT id, panorama_id, type, yaw, pitch, target_panorama_id,
                content, icon, color, created_at, updated_at
         FROM hotspots WHERE panorama_id = ?1"
    )?;

    let hotspots = stmt.query_map([panorama_id], |row| {
        Ok(Hotspot {
            id: row.get(0)?,
            panorama_id: row.get(1)?,
            hotspot_type: row.get(2)?,
            yaw: row.get(3)?,
            pitch: row.get(4)?,
            target_panorama_id: row.get(5)?,
            content: row.get(6)?,
            icon: row.get(7)?,
            color: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        })
    })?;

    hotspots.collect()
}

pub fn get_hotspot(conn: &Connection, id: &str) -> Result<Option<Hotspot>> {
    let mut stmt = conn.prepare(
        "SELECT id, panorama_id, type, yaw, pitch, target_panorama_id,
                content, icon, color, created_at, updated_at
         FROM hotspots WHERE id = ?1"
    )?;

    let mut rows = stmt.query([id])?;

    if let Some(row) = rows.next()? {
        Ok(Some(Hotspot {
            id: row.get(0)?,
            panorama_id: row.get(1)?,
            hotspot_type: row.get(2)?,
            yaw: row.get(3)?,
            pitch: row.get(4)?,
            target_panorama_id: row.get(5)?,
            content: row.get(6)?,
            icon: row.get(7)?,
            color: row.get(8)?,
            created_at: row.get(9)?,
            updated_at: row.get(10)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn create_hotspot(conn: &Connection, hotspot: &Hotspot) -> Result<()> {
    conn.execute(
        "INSERT INTO hotspots (id, panorama_id, type, yaw, pitch, target_panorama_id,
                               content, icon, color, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            hotspot.id,
            hotspot.panorama_id,
            hotspot.hotspot_type,
            hotspot.yaw,
            hotspot.pitch,
            hotspot.target_panorama_id,
            hotspot.content,
            hotspot.icon,
            hotspot.color,
            hotspot.created_at,
            hotspot.updated_at,
        ],
    )?;
    Ok(())
}

pub fn update_hotspot(
    conn: &Connection,
    id: &str,
    yaw: Option<f64>,
    pitch: Option<f64>,
    target_panorama_id: Option<&str>,
    content: Option<&str>,
) -> Result<()> {
    let mut updates = vec!["updated_at = datetime('now')".to_string()];

    if let Some(y) = yaw {
        updates.push(format!("yaw = {}", y));
    }
    if let Some(p) = pitch {
        updates.push(format!("pitch = {}", p));
    }
    if let Some(t) = target_panorama_id {
        updates.push(format!("target_panorama_id = '{}'", t));
    }
    if let Some(c) = content {
        updates.push(format!("content = '{}'", c.replace("'", "''")));
    }

    let sql = format!(
        "UPDATE hotspots SET {} WHERE id = ?1",
        updates.join(", ")
    );

    conn.execute(&sql, [id])?;
    Ok(())
}

pub fn delete_hotspot(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM hotspots WHERE id = ?1", [id])?;
    Ok(())
}

// ============================================
// SETTINGS
// ============================================

pub fn get_setting(conn: &Connection, key: &str) -> Result<Option<String>> {
    let mut stmt = conn.prepare("SELECT value FROM settings WHERE key = ?1")?;
    let mut rows = stmt.query([key])?;

    if let Some(row) = rows.next()? {
        Ok(Some(row.get(0)?))
    } else {
        Ok(None)
    }
}

pub fn set_setting(conn: &Connection, key: &str, value: &str) -> Result<()> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value",
        params![key, value],
    )?;
    Ok(())
}

pub fn get_all_settings(conn: &Connection) -> Result<Vec<Setting>> {
    let mut stmt = conn.prepare("SELECT key, value FROM settings")?;

    let settings = stmt.query_map([], |row| {
        Ok(Setting {
            key: row.get(0)?,
            value: row.get(1)?,
        })
    })?;

    settings.collect()
}

// ============================================
// LICENSE
// ============================================

pub fn get_license(conn: &Connection) -> Result<Option<License>> {
    let mut stmt = conn.prepare(
        "SELECT license_key, user_email, activated_at, expires_at, features
         FROM license WHERE id = 1"
    )?;

    let mut rows = stmt.query([])?;

    if let Some(row) = rows.next()? {
        let license_key: Option<String> = row.get(0)?;

        // If no license key stored, return None
        if license_key.is_none() {
            return Ok(None);
        }

        let key = license_key.unwrap();
        let email: Option<String> = row.get(1)?;
        let activated_at_str: Option<String> = row.get(2)?;
        let expires_at_str: Option<String> = row.get(3)?;
        let features_json: Option<String> = row.get(4)?;

        // Parse activated_at timestamp
        let activated_at = activated_at_str
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(0);

        // Parse expires_at timestamp
        let valid_until = expires_at_str
            .and_then(|s| s.parse::<u64>().ok());

        // Parse features JSON array
        let features: Vec<String> = features_json
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default();

        // Determine tier from key prefix
        let first_part = key.split('-').next().unwrap_or("");
        let tier = match first_part.to_uppercase().as_str() {
            s if s.starts_with("ENT") => LicenseTier::Enterprise,
            s if s.starts_with("PRO") => LicenseTier::Professional,
            _ => LicenseTier::Trial,
        };

        // Get machine ID (we store it but regenerate if needed)
        let machine_id = crate::license::get_machine_id();

        Ok(Some(License {
            key,
            email,
            tier,
            seats: 1,
            valid_until,
            features,
            activated_at,
            machine_id,
        }))
    } else {
        Ok(None)
    }
}

pub fn save_license(conn: &Connection, license: &License) -> Result<()> {
    let features_json = serde_json::to_string(&license.features)
        .unwrap_or_else(|_| "[]".to_string());

    let expires_at = license.valid_until
        .map(|ts| ts.to_string());

    conn.execute(
        "INSERT INTO license (id, license_key, user_email, activated_at, expires_at, features)
         VALUES (1, ?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(id) DO UPDATE SET
            license_key = excluded.license_key,
            user_email = excluded.user_email,
            activated_at = excluded.activated_at,
            expires_at = excluded.expires_at,
            features = excluded.features",
        params![
            license.key,
            license.email,
            license.activated_at.to_string(),
            expires_at,
            features_json,
        ],
    )?;
    Ok(())
}

pub fn remove_license(conn: &Connection) -> Result<()> {
    conn.execute(
        "UPDATE license SET license_key = NULL, user_email = NULL,
         activated_at = NULL, expires_at = NULL, features = NULL
         WHERE id = 1",
        [],
    )?;
    Ok(())
}

// ============================================
// PUBLISH
// ============================================

pub fn update_project_publish_scene(conn: &Connection, id: &str, published: bool) -> Result<Option<Project>> {
    if published {
        // Auto-generate slug if null
        let current_slug: Option<String> = conn.query_row(
            "SELECT publish_slug FROM projects WHERE id = ?1",
            [id],
            |row| row.get(0),
        )?;

        if current_slug.is_none() {
            let name: String = conn.query_row(
                "SELECT name FROM projects WHERE id = ?1",
                [id],
                |row| row.get(0),
            )?;
            let slug = slugify(&name);
            conn.execute(
                "UPDATE projects SET publish_slug = ?1 WHERE id = ?2",
                params![slug, id],
            )?;
        }

        conn.execute(
            "UPDATE projects SET scene_published = 1,
                publish_version = publish_version + 1,
                published_at = datetime('now'),
                updated_at = datetime('now')
             WHERE id = ?1",
            [id],
        )?;
    } else {
        conn.execute(
            "UPDATE projects SET scene_published = 0, updated_at = datetime('now') WHERE id = ?1",
            [id],
        )?;
    }

    get_project(conn, id)
}

pub fn update_project_publish_panorama(conn: &Connection, id: &str, published: bool) -> Result<Option<Project>> {
    if published {
        let current_slug: Option<String> = conn.query_row(
            "SELECT publish_slug FROM projects WHERE id = ?1",
            [id],
            |row| row.get(0),
        )?;

        if current_slug.is_none() {
            let name: String = conn.query_row(
                "SELECT name FROM projects WHERE id = ?1",
                [id],
                |row| row.get(0),
            )?;
            let slug = slugify(&name);
            conn.execute(
                "UPDATE projects SET publish_slug = ?1 WHERE id = ?2",
                params![slug, id],
            )?;
        }

        conn.execute(
            "UPDATE projects SET panorama_published = 1,
                publish_version = publish_version + 1,
                published_at = datetime('now'),
                updated_at = datetime('now')
             WHERE id = ?1",
            [id],
        )?;
    } else {
        conn.execute(
            "UPDATE projects SET panorama_published = 0, updated_at = datetime('now') WHERE id = ?1",
            [id],
        )?;
    }

    get_project(conn, id)
}

pub fn update_project_publish_slug(conn: &Connection, id: &str, slug: &str) -> Result<()> {
    conn.execute(
        "UPDATE projects SET publish_slug = ?1, updated_at = datetime('now') WHERE id = ?2",
        params![slug, id],
    )?;
    Ok(())
}

// ============================================
// FIRM PROFILE
// ============================================

pub fn get_firm_profile(conn: &Connection) -> Result<FirmProfile> {
    conn.query_row(
        "SELECT id, firm_name, subdomain, logo_path, file_server_url, created_at, updated_at
         FROM firm_profile WHERE id = 1",
        [],
        |row| {
            Ok(FirmProfile {
                id: row.get(0)?,
                firm_name: row.get(1)?,
                subdomain: row.get(2)?,
                logo_path: row.get(3)?,
                file_server_url: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        },
    )
}

pub fn update_firm_profile(conn: &Connection, input: &UpdateFirmProfileInput) -> Result<FirmProfile> {
    conn.execute(
        "UPDATE firm_profile SET firm_name = ?1, subdomain = ?2, logo_path = ?3,
                file_server_url = ?4, updated_at = datetime('now')
         WHERE id = 1",
        params![input.firm_name, input.subdomain, input.logo_path, input.file_server_url],
    )?;
    get_firm_profile(conn)
}

// ============================================
// COMPONENT GROUPS
// ============================================

pub fn get_component_groups_by_scene(conn: &Connection, scene_id: &str) -> Result<Vec<ComponentGroup>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, scene_id, group_name, mesh_names, default_material_id,
                sort_order, created_at, updated_at
         FROM component_groups WHERE scene_id = ?1 ORDER BY sort_order"
    )?;

    let groups = stmt.query_map([scene_id], |row| {
        Ok(ComponentGroup {
            id: row.get(0)?,
            project_id: row.get(1)?,
            scene_id: row.get(2)?,
            group_name: row.get(3)?,
            mesh_names: row.get(4)?,
            default_material_id: row.get(5)?,
            sort_order: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;

    groups.collect()
}

pub fn get_component_groups_by_project(conn: &Connection, project_id: &str) -> Result<Vec<ComponentGroup>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, scene_id, group_name, mesh_names, default_material_id,
                sort_order, created_at, updated_at
         FROM component_groups WHERE project_id = ?1 ORDER BY sort_order"
    )?;

    let groups = stmt.query_map([project_id], |row| {
        Ok(ComponentGroup {
            id: row.get(0)?,
            project_id: row.get(1)?,
            scene_id: row.get(2)?,
            group_name: row.get(3)?,
            mesh_names: row.get(4)?,
            default_material_id: row.get(5)?,
            sort_order: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    })?;

    groups.collect()
}

pub fn get_component_group(conn: &Connection, id: &str) -> Result<Option<ComponentGroup>> {
    let mut stmt = conn.prepare(
        "SELECT id, project_id, scene_id, group_name, mesh_names, default_material_id,
                sort_order, created_at, updated_at
         FROM component_groups WHERE id = ?1"
    )?;

    let mut rows = stmt.query([id])?;

    if let Some(row) = rows.next()? {
        Ok(Some(ComponentGroup {
            id: row.get(0)?,
            project_id: row.get(1)?,
            scene_id: row.get(2)?,
            group_name: row.get(3)?,
            mesh_names: row.get(4)?,
            default_material_id: row.get(5)?,
            sort_order: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        }))
    } else {
        Ok(None)
    }
}

pub fn create_component_group(conn: &Connection, group: &ComponentGroup) -> Result<()> {
    conn.execute(
        "INSERT INTO component_groups (id, project_id, scene_id, group_name, mesh_names,
                                        default_material_id, sort_order, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            group.id, group.project_id, group.scene_id, group.group_name,
            group.mesh_names, group.default_material_id, group.sort_order,
            group.created_at, group.updated_at
        ],
    )?;
    Ok(())
}

pub fn update_component_group(conn: &Connection, id: &str, input: &UpdateComponentGroupInput) -> Result<()> {
    let mut updates = vec!["updated_at = datetime('now')".to_string()];
    let mut param_values: Vec<String> = vec![];
    let mut param_index = 1;

    if let Some(ref name) = input.group_name {
        updates.push(format!("group_name = ?{}", param_index));
        param_values.push(name.clone());
        param_index += 1;
    }
    if let Some(ref meshes) = input.mesh_names {
        let json = serde_json::to_string(meshes).unwrap_or_else(|_| "[]".to_string());
        updates.push(format!("mesh_names = ?{}", param_index));
        param_values.push(json);
        param_index += 1;
    }
    if let Some(ref mat_id) = input.default_material_id {
        updates.push(format!("default_material_id = ?{}", param_index));
        param_values.push(mat_id.clone());
        param_index += 1;
    }

    param_values.push(id.to_string());

    let sql = format!(
        "UPDATE component_groups SET {} WHERE id = ?{}",
        updates.join(", "),
        param_index
    );

    let params: Vec<&dyn rusqlite::ToSql> = param_values
        .iter()
        .map(|s| s as &dyn rusqlite::ToSql)
        .collect();

    conn.execute(&sql, params.as_slice())?;
    Ok(())
}

pub fn delete_component_group(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM component_groups WHERE id = ?1", [id])?;
    Ok(())
}

pub fn reorder_component_groups(conn: &Connection, ids: &[String]) -> Result<()> {
    for (index, id) in ids.iter().enumerate() {
        conn.execute(
            "UPDATE component_groups SET sort_order = ?1 WHERE id = ?2",
            params![index as i32, id],
        )?;
    }
    Ok(())
}

// ============================================
// COMPONENT MATERIAL OPTIONS
// ============================================

pub fn get_material_options(conn: &Connection, component_group_id: &str) -> Result<Vec<ComponentMaterialOption>> {
    let mut stmt = conn.prepare(
        "SELECT id, component_group_id, material_id, sort_order
         FROM component_material_options WHERE component_group_id = ?1 ORDER BY sort_order"
    )?;

    let options = stmt.query_map([component_group_id], |row| {
        Ok(ComponentMaterialOption {
            id: row.get(0)?,
            component_group_id: row.get(1)?,
            material_id: row.get(2)?,
            sort_order: row.get(3)?,
        })
    })?;

    options.collect()
}

pub fn add_material_option(conn: &Connection, option: &ComponentMaterialOption) -> Result<()> {
    conn.execute(
        "INSERT INTO component_material_options (id, component_group_id, material_id, sort_order)
         VALUES (?1, ?2, ?3, ?4)",
        params![option.id, option.component_group_id, option.material_id, option.sort_order],
    )?;
    Ok(())
}

pub fn remove_material_option(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM component_material_options WHERE id = ?1", [id])?;
    Ok(())
}

pub fn reorder_material_options(conn: &Connection, ids: &[String]) -> Result<()> {
    for (index, id) in ids.iter().enumerate() {
        conn.execute(
            "UPDATE component_material_options SET sort_order = ?1 WHERE id = ?2",
            params![index as i32, id],
        )?;
    }
    Ok(())
}
