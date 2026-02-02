use rusqlite::{Connection, Result, params};
use crate::models::project::Project;
use crate::models::settings::Setting;

// ============================================
// PROJECTS
// ============================================

pub fn get_all_projects(conn: &Connection) -> Result<Vec<Project>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, thumbnail_path, folder_path,
                created_at, updated_at, cloud_id, last_synced_at, sync_enabled
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
        })
    })?;

    projects.collect()
}

pub fn get_project(conn: &Connection, id: &str) -> Result<Option<Project>> {
    let mut stmt = conn.prepare(
        "SELECT id, name, description, thumbnail_path, folder_path,
                created_at, updated_at, cloud_id, last_synced_at, sync_enabled
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
        }))
    } else {
        Ok(None)
    }
}

pub fn create_project(conn: &Connection, project: &Project) -> Result<()> {
    conn.execute(
        "INSERT INTO projects (id, name, description, thumbnail_path, folder_path,
                               created_at, updated_at, cloud_id, last_synced_at, sync_enabled)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
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
