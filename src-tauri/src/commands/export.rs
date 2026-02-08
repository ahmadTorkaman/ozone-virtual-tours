use std::io::{Read, Write};
use std::path::PathBuf;
use std::fs::File;
use tauri::State;
use zip::write::SimpleFileOptions;
use zip::ZipArchive;

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

    let options = SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated);

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

    // Import scenes with new IDs
    if let Some(scenes) = manifest["scenes"].as_array() {
        for scene_value in scenes {
            let mut scene: crate::models::scene::Scene = serde_json::from_value(scene_value.clone())
                .map_err(|e| e.to_string())?;

            // Update IDs
            scene.id = uuid::Uuid::new_v4().to_string();
            scene.project_id = new_project_id.clone();
            scene.created_at = now.clone();
            scene.updated_at = now.clone();

            queries::create_scene(&conn, &scene).map_err(|e| e.to_string())?;
        }
    }

    // Import panoramas with new IDs
    if let Some(panoramas) = manifest["panoramas"].as_array() {
        for panorama_value in panoramas {
            let mut panorama: crate::models::panorama::Panorama = serde_json::from_value(panorama_value.clone())
                .map_err(|e| e.to_string())?;

            // Update IDs
            panorama.id = uuid::Uuid::new_v4().to_string();
            panorama.project_id = new_project_id.clone();
            panorama.created_at = now.clone();
            panorama.updated_at = now.clone();

            queries::create_panorama(&conn, &panorama).map_err(|e| e.to_string())?;
        }
    }

    Ok(new_project_id)
}
