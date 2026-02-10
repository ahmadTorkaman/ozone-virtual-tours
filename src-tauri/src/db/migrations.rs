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

        // Migration 2: Publish & Configurator tables
        r#"
        -- Add publish columns to projects
        ALTER TABLE projects ADD COLUMN scene_published INTEGER DEFAULT 0;
        ALTER TABLE projects ADD COLUMN panorama_published INTEGER DEFAULT 0;
        ALTER TABLE projects ADD COLUMN publish_version INTEGER DEFAULT 0;
        ALTER TABLE projects ADD COLUMN published_at TEXT;
        ALTER TABLE projects ADD COLUMN publish_slug TEXT;

        -- Firm profile (singleton)
        CREATE TABLE firm_profile (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            firm_name TEXT NOT NULL DEFAULT '',
            subdomain TEXT NOT NULL DEFAULT '',
            logo_path TEXT,
            file_server_url TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        -- Insert default empty row
        INSERT INTO firm_profile (id, firm_name, subdomain) VALUES (1, '', '');

        -- Configurable component groups
        CREATE TABLE component_groups (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
            scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
            group_name TEXT NOT NULL,
            mesh_names TEXT NOT NULL,
            default_material_id TEXT REFERENCES materials(id) ON DELETE SET NULL,
            sort_order INTEGER DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        -- Allowed materials per component group
        CREATE TABLE component_material_options (
            id TEXT PRIMARY KEY,
            component_group_id TEXT NOT NULL REFERENCES component_groups(id) ON DELETE CASCADE,
            material_id TEXT NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
            sort_order INTEGER DEFAULT 0
        );

        -- Indexes
        CREATE INDEX idx_component_groups_project ON component_groups(project_id);
        CREATE INDEX idx_component_groups_scene ON component_groups(scene_id);
        CREATE INDEX idx_component_material_options_group ON component_material_options(component_group_id);
        CREATE UNIQUE INDEX idx_publish_slug ON projects(publish_slug) WHERE publish_slug IS NOT NULL;
        "#,
    ]
}
