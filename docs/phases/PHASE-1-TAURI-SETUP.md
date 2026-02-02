# Phase 1: Tauri Project Setup

> **Scope**: Initialize Tauri 2.0 project with Rust backend and React frontend
> **Prerequisites**: Rust installed, Node.js 20+, pnpm
> **Outputs**: Working Tauri app with basic SQLite database and file system access

---

## Overview

This phase establishes the Tauri desktop application foundation:

1. Create new Tauri 2.0 project
2. Set up Rust backend structure
3. Configure SQLite database
4. Create basic Tauri commands (invoke from frontend)
5. Set up React + TypeScript + Vite frontend
6. Establish folder conventions

**Important**: This phase focuses on the Tauri skeleton. No feature UI is built yet.

---

## Context for New Sessions

If you're starting a new Claude session:

- **Project**: Ozone Studio - Desktop app for 3D scene viewing
- **Framework**: Tauri 2.0 (Rust backend + React frontend)
- **Database**: SQLite (local, offline-first)
- **Working Directory**: `C:/Users/Lion/ozone-virtual-tours`

Read `/docs/ARCHITECTURE.md` for full architectural context.

---

## Prerequisites

Before starting, ensure these are installed:

```powershell
# Check Rust
rustc --version    # Should be 1.75+
cargo --version

# Check Node.js
node --version     # Should be 20+
pnpm --version     # Should be 8+

# Install Tauri CLI
cargo install tauri-cli --version "^2.0.0-beta"

# Windows-specific: Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/visual-cpp-build-tools/
# Install "Desktop development with C++"
```

---

## Task Checklist

### 1.1 Initialize Tauri Project

Create new Tauri project with React template:

```powershell
# From parent directory (not inside ozone-virtual-tours)
cd C:/Users/Lion

# Create new Tauri project
pnpm create tauri-app ozone-studio --template react-ts --manager pnpm --beta

# This creates:
# ozone-studio/
# ├── src/           (React frontend)
# ├── src-tauri/     (Rust backend)
# ├── package.json
# └── ...
```

**Note**: We're creating a fresh project, then we'll migrate documentation and customize.

### 1.2 Configure Tauri (tauri.conf.json)

Update `src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2.0.0-beta",
  "productName": "Ozone Studio",
  "version": "1.0.0",
  "identifier": "com.ozone.studio",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Ozone Studio",
        "width": 1400,
        "height": 900,
        "minWidth": 1024,
        "minHeight": 768,
        "resizable": true,
        "fullscreen": false,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: asset: https://asset.localhost; connect-src 'self' https:; font-src 'self' data:"
    }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis", "msi"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": ""
    }
  },
  "plugins": {}
}
```

### 1.3 Set Up Rust Dependencies

Update `src-tauri/Cargo.toml`:

```toml
[package]
name = "ozone-studio"
version = "1.0.0"
description = "3D Scene Viewer for Interior Designers"
authors = ["Ozone Team"]
edition = "2021"

[build-dependencies]
tauri-build = { version = "2.0.0-beta", features = [] }

[dependencies]
tauri = { version = "2.0.0-beta", features = ["devtools"] }
tauri-plugin-shell = "2.0.0-beta"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# Database
rusqlite = { version = "0.30", features = ["bundled"] }

# Utilities
uuid = { version = "1.6", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
dirs = "5.0"
thiserror = "1.0"

# Async (for future cloud sync)
tokio = { version = "1", features = ["full"] }

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]

[profile.release]
panic = "abort"
codegen-units = 1
lto = true
opt-level = "s"
strip = true
```

### 1.4 Create Rust Backend Structure

Create the following Rust file structure:

```
src-tauri/
├── src/
│   ├── main.rs
│   ├── lib.rs
│   ├── commands/
│   │   ├── mod.rs
│   │   ├── projects.rs
│   │   ├── files.rs
│   │   └── settings.rs
│   ├── db/
│   │   ├── mod.rs
│   │   ├── connection.rs
│   │   ├── migrations.rs
│   │   └── queries.rs
│   ├── models/
│   │   ├── mod.rs
│   │   ├── project.rs
│   │   └── settings.rs
│   └── utils/
│       ├── mod.rs
│       ├── paths.rs
│       └── errors.rs
├── Cargo.toml
├── tauri.conf.json
├── build.rs
└── icons/
```

### 1.5 Implement Core Rust Files

**`src-tauri/src/main.rs`**:

```rust
// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    ozone_studio_lib::run();
}
```

**`src-tauri/src/lib.rs`**:

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
        .setup(|app| {
            // Initialize database
            let app_data_dir = utils::paths::get_app_data_dir()?;
            let db_path = app_data_dir.join("database.sqlite");

            // Create directory if needed
            if let Some(parent) = db_path.parent() {
                std::fs::create_dir_all(parent)?;
            }

            // Open/create database
            let conn = db::connection::open_database(&db_path)?;

            // Run migrations
            db::migrations::run_migrations(&conn)?;

            // Store in app state
            app.manage(AppState {
                db: Mutex::new(conn),
            });

            println!("Ozone Studio initialized");
            println!("Database: {:?}", db_path);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Project commands
            commands::projects::list_projects,
            commands::projects::get_project,
            commands::projects::create_project,
            commands::projects::update_project,
            commands::projects::delete_project,

            // File commands
            commands::files::get_app_data_path,
            commands::files::get_documents_path,
            commands::files::ensure_directory,
            commands::files::read_file,
            commands::files::write_file,
            commands::files::copy_file,
            commands::files::delete_file,
            commands::files::list_directory,

            // Settings commands
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::settings::get_all_settings,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**`src-tauri/src/utils/mod.rs`**:

```rust
pub mod errors;
pub mod paths;
```

**`src-tauri/src/utils/paths.rs`**:

```rust
use std::path::PathBuf;

/// Get the app data directory (Documents/Ozone Studio)
pub fn get_app_data_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let documents = dirs::document_dir()
        .ok_or("Could not find Documents directory")?;

    Ok(documents.join("Ozone Studio"))
}

/// Get the projects directory
pub fn get_projects_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
    Ok(get_app_data_dir()?.join("projects"))
}

/// Get the materials directory
pub fn get_materials_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
    Ok(get_app_data_dir()?.join("materials"))
}

/// Get a project's directory
pub fn get_project_dir(project_id: &str) -> Result<PathBuf, Box<dyn std::error::Error>> {
    Ok(get_projects_dir()?.join(project_id))
}

/// Ensure a directory exists
pub fn ensure_dir(path: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    if !path.exists() {
        std::fs::create_dir_all(path)?;
    }
    Ok(())
}
```

**`src-tauri/src/utils/errors.rs`**:

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
}

// Convert AppError to String for Tauri commands
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        err.to_string()
    }
}
```

### 1.6 Implement Database Layer

**`src-tauri/src/db/mod.rs`**:

```rust
pub mod connection;
pub mod migrations;
pub mod queries;
```

**`src-tauri/src/db/connection.rs`**:

```rust
use rusqlite::{Connection, Result};
use std::path::Path;

pub fn open_database(path: &Path) -> Result<Connection> {
    let conn = Connection::open(path)?;

    // Enable foreign keys
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;

    // Enable WAL mode for better concurrency
    conn.execute_batch("PRAGMA journal_mode = WAL;")?;

    Ok(conn)
}
```

**`src-tauri/src/db/migrations.rs`**:

```rust
use rusqlite::{Connection, Result};

pub fn run_migrations(conn: &Connection) -> Result<()> {
    // Create migrations table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL
        )",
        [],
    )?;

    // Check current version
    let current_version: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    // Run migrations
    let migrations = get_migrations();

    for (version, sql) in migrations.iter().enumerate() {
        let version = (version + 1) as i32;

        if version > current_version {
            println!("Running migration v{}", version);
            conn.execute_batch(sql)?;

            conn.execute(
                "INSERT INTO schema_migrations (version, applied_at) VALUES (?1, datetime('now'))",
                [version],
            )?;
        }
    }

    Ok(())
}

fn get_migrations() -> Vec<&'static str> {
    vec![
        // Migration 1: Core tables
        r#"
        -- Projects
        CREATE TABLE projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            thumbnail_path TEXT,
            folder_path TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            cloud_id TEXT,
            last_synced_at TEXT,
            sync_enabled INTEGER DEFAULT 0
        );

        -- Scenes
        CREATE TABLE scenes (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            glb_path TEXT NOT NULL,
            glb_size INTEGER NOT NULL,
            thumbnail_path TEXT,
            spawn_x REAL DEFAULT 0,
            spawn_y REAL DEFAULT 0,
            spawn_z REAL DEFAULT 0,
            spawn_rot_y REAL DEFAULT 0,
            sort_order INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        -- Material categories
        CREATE TABLE material_categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0
        );

        -- Materials
        CREATE TABLE materials (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category_id TEXT REFERENCES material_categories(id) ON DELETE SET NULL,
            thumbnail_path TEXT,
            properties TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            cloud_id TEXT,
            is_synced INTEGER DEFAULT 0
        );

        -- Material mappings
        CREATE TABLE material_mappings (
            id TEXT PRIMARY KEY,
            scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
            material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
            object_name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            UNIQUE(scene_id, object_name)
        );

        -- Panoramas
        CREATE TABLE panoramas (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            image_path TEXT NOT NULL,
            thumbnail_path TEXT,
            initial_yaw REAL DEFAULT 0,
            initial_pitch REAL DEFAULT 0,
            sort_order INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        -- Hotspots
        CREATE TABLE hotspots (
            id TEXT PRIMARY KEY,
            panorama_id TEXT NOT NULL REFERENCES panoramas(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK(type IN ('NAVIGATION', 'INFO', 'MEDIA', 'LINK')),
            yaw REAL NOT NULL,
            pitch REAL NOT NULL,
            target_panorama_id TEXT REFERENCES panoramas(id) ON DELETE SET NULL,
            content TEXT,
            icon TEXT,
            color TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        -- Settings
        CREATE TABLE settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        -- Recent projects
        CREATE TABLE recent_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            opened_at TEXT NOT NULL,
            UNIQUE(project_id)
        );

        -- License
        CREATE TABLE license (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            license_key TEXT,
            activated_at TEXT,
            expires_at TEXT,
            user_email TEXT,
            features TEXT
        );

        -- Sync queue
        CREATE TABLE sync_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entity_type TEXT NOT NULL,
            entity_id TEXT NOT NULL,
            action TEXT NOT NULL,
            payload TEXT NOT NULL,
            created_at TEXT NOT NULL,
            retry_count INTEGER DEFAULT 0
        );

        -- Indexes
        CREATE INDEX idx_scenes_project ON scenes(project_id);
        CREATE INDEX idx_panoramas_project ON panoramas(project_id);
        CREATE INDEX idx_hotspots_panorama ON hotspots(panorama_id);
        CREATE INDEX idx_materials_category ON materials(category_id);
        CREATE INDEX idx_material_mappings_scene ON material_mappings(scene_id);
        CREATE INDEX idx_recent_projects_opened ON recent_projects(opened_at DESC);

        -- Default material categories
        INSERT INTO material_categories (id, name, sort_order) VALUES
            ('cat_metals', 'Metals', 1),
            ('cat_woods', 'Woods', 2),
            ('cat_fabrics', 'Fabrics', 3),
            ('cat_glass', 'Glass', 4),
            ('cat_stone', 'Stone', 5),
            ('cat_plastics', 'Plastics', 6),
            ('cat_custom', 'Custom', 99);
        "#,
    ]
}
```

**`src-tauri/src/db/queries.rs`**:

```rust
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
```

### 1.7 Implement Models

**`src-tauri/src/models/mod.rs`**:

```rust
pub mod project;
pub mod settings;
```

**`src-tauri/src/models/project.rs`**:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub thumbnail_path: Option<String>,
    pub folder_path: String,
    pub created_at: String,
    pub updated_at: String,
    pub cloud_id: Option<String>,
    pub last_synced_at: Option<String>,
    pub sync_enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectInput {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProjectInput {
    pub name: String,
    pub description: Option<String>,
}
```

**`src-tauri/src/models/settings.rs`**:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Setting {
    pub key: String,
    pub value: String,
}
```

### 1.8 Implement Commands

**`src-tauri/src/commands/mod.rs`**:

```rust
pub mod files;
pub mod projects;
pub mod settings;
```

**`src-tauri/src/commands/projects.rs`**:

```rust
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
```

**`src-tauri/src/commands/files.rs`**:

```rust
use std::path::PathBuf;
use crate::utils::paths;

#[tauri::command]
pub fn get_app_data_path() -> Result<String, String> {
    paths::get_app_data_dir()
        .map(|p| p.to_string_lossy().to_string())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_documents_path() -> Result<String, String> {
    dirs::document_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not find Documents directory".to_string())
}

#[tauri::command]
pub fn ensure_directory(path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    paths::ensure_dir(&path_buf).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn read_file(path: String) -> Result<Vec<u8>, String> {
    std::fs::read(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = PathBuf::from(&path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    std::fs::write(&path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn copy_file(source: String, destination: String) -> Result<(), String> {
    // Ensure parent directory exists
    if let Some(parent) = PathBuf::from(&destination).parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    std::fs::copy(&source, &destination)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_file(path: String) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);

    if path_buf.is_dir() {
        std::fs::remove_dir_all(&path).map_err(|e| e.to_string())
    } else {
        std::fs::remove_file(&path).map_err(|e| e.to_string())
    }
}

#[derive(serde::Serialize)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
}

#[tauri::command]
pub fn list_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let entries = std::fs::read_dir(&path).map_err(|e| e.to_string())?;

    let mut result = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;

        result.push(FileEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
            size: metadata.len(),
        });
    }

    Ok(result)
}
```

**`src-tauri/src/commands/settings.rs`**:

```rust
use tauri::State;
use crate::AppState;
use crate::db::queries;
use crate::models::settings::Setting;

#[tauri::command]
pub fn get_setting(key: String, state: State<AppState>) -> Result<Option<String>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_setting(&conn, &key).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_setting(key: String, value: String, state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::set_setting(&conn, &key, &value).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_all_settings(state: State<AppState>) -> Result<Vec<Setting>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_all_settings(&conn).map_err(|e| e.to_string())
}
```

### 1.9 Set Up Frontend

Update `package.json`:

```json
{
  "name": "ozone-studio",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "lint": "eslint src --ext .ts,.tsx --fix",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "@tauri-apps/api": "^2.0.0-beta",
    "@tauri-apps/plugin-shell": "^2.0.0-beta",
    "@tanstack/react-query": "^5.17.0",
    "zustand": "^4.4.7",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.312.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.47",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.11",
    "typescript": "^5.3.3",
    "tailwindcss": "^3.4.1",
    "postcss": "^8.4.33",
    "autoprefixer": "^10.4.17",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0"
  }
}
```

Create `src/services/tauri/index.ts`:

```typescript
import { invoke } from '@tauri-apps/api/core';

// Types
export interface Project {
  id: string;
  name: string;
  description: string | null;
  thumbnail_path: string | null;
  folder_path: string;
  created_at: string;
  updated_at: string;
  cloud_id: string | null;
  last_synced_at: string | null;
  sync_enabled: boolean;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface UpdateProjectInput {
  name: string;
  description?: string;
}

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
}

// Project commands
export const listProjects = () => invoke<Project[]>('list_projects');
export const getProject = (id: string) => invoke<Project | null>('get_project', { id });
export const createProject = (input: CreateProjectInput) => invoke<Project>('create_project', { input });
export const updateProject = (id: string, input: UpdateProjectInput) => invoke<void>('update_project', { id, input });
export const deleteProject = (id: string) => invoke<void>('delete_project', { id });

// File commands
export const getAppDataPath = () => invoke<string>('get_app_data_path');
export const getDocumentsPath = () => invoke<string>('get_documents_path');
export const ensureDirectory = (path: string) => invoke<void>('ensure_directory', { path });
export const readFile = (path: string) => invoke<number[]>('read_file', { path });
export const writeFile = (path: string, contents: number[]) => invoke<void>('write_file', { path, contents });
export const copyFile = (source: string, destination: string) => invoke<void>('copy_file', { source, destination });
export const deleteFile = (path: string) => invoke<void>('delete_file', { path });
export const listDirectory = (path: string) => invoke<FileEntry[]>('list_directory', { path });

// Settings commands
export const getSetting = (key: string) => invoke<string | null>('get_setting', { key });
export const setSetting = (key: string, value: string) => invoke<void>('set_setting', { key, value });
export const getAllSettings = () => invoke<{ key: string; value: string }[]>('get_all_settings');
```

Create `src/App.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { listProjects, createProject, type Project } from './services/tauri';

function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const data = await listProjects();
      setProjects(data);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      const project = await createProject({
        name: `New Project ${projects.length + 1}`,
        description: 'Created from Ozone Studio',
      });
      setProjects([project, ...projects]);
    } catch (err) {
      setError(err as string);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Ozone Studio</h1>
            <p className="text-gray-400 mt-1">3D Scene Viewer for Interior Designers</p>
          </div>
          <button
            onClick={handleCreateProject}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
          >
            New Project
          </button>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No projects yet</p>
            <p className="text-gray-500 mt-2">Create your first project to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors"
              >
                <h3 className="font-medium text-lg">{project.name}</h3>
                {project.description && (
                  <p className="text-gray-400 text-sm mt-1">{project.description}</p>
                )}
                <p className="text-gray-500 text-xs mt-2">
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Phase 1 Complete - Tauri Foundation Ready</p>
          <p className="mt-1">SQLite + Rust Backend + React Frontend</p>
        </div>
      </div>
    </div>
  );
}

export default App;
```

---

## Verification Checklist

After completing Phase 1, verify:

- [ ] `pnpm install` runs without errors
- [ ] `pnpm tauri dev` starts the app
- [ ] Window opens with "Ozone Studio" title
- [ ] SQLite database created at `Documents/Ozone Studio/database.sqlite`
- [ ] Can create a new project (click "New Project")
- [ ] Project appears in the list
- [ ] Project folder created at `Documents/Ozone Studio/projects/{id}/`
- [ ] App restarts without losing data (SQLite persistence)
- [ ] `pnpm tauri build` creates installer (optional, for testing)

---

## Common Issues

### Windows Build Fails
- Ensure Visual Studio Build Tools are installed
- Run from "x64 Native Tools Command Prompt"

### SQLite Errors
- Check file permissions on Documents folder
- Ensure `bundled` feature is enabled in rusqlite

### Tauri Commands Not Found
- Verify all commands are registered in `invoke_handler`
- Check command function names match exactly

---

## Next Phase

After Phase 1 is complete, proceed to **Phase 2: Database & Storage** which covers:
- Complete CRUD for scenes, materials, panoramas
- File import/export operations
- Material properties management
- Thumbnail generation
