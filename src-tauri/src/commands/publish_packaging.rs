use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tauri::{Emitter, State};
use serde::{Deserialize, Serialize};
use base64::Engine;

use crate::AppState;
use crate::db::queries;
use crate::models::material::MaterialProperties;
use crate::models::publish::*;
use crate::utils::paths;

#[derive(Deserialize)]
pub struct PublishInput {
    pub project_id: String,
    pub destination_folder: String,
    pub scene_thumbnails: HashMap<String, String>,
    pub panorama_thumbnails: HashMap<String, String>,
}

#[derive(Clone, Serialize)]
pub struct PublishProgress {
    pub step: String,
    pub current: u32,
    pub total: u32,
    pub message: String,
}

/// Decode base64 image data and write to disk
#[tauri::command]
pub fn save_thumbnail(base64_data: String, destination_path: String) -> Result<(), String> {
    // Strip data URI prefix if present
    let data = if let Some(pos) = base64_data.find(",") {
        &base64_data[pos + 1..]
    } else {
        &base64_data
    };

    let bytes = base64::engine::general_purpose::STANDARD
        .decode(data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Ensure parent directory exists
    if let Some(parent) = Path::new(&destination_path).parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    std::fs::write(&destination_path, &bytes)
        .map_err(|e| format!("Failed to write thumbnail: {}", e))?;

    Ok(())
}

/// Main publish packaging pipeline
#[tauri::command]
pub fn publish_project(
    input: PublishInput,
    state: State<AppState>,
    app_handle: tauri::AppHandle,
) -> Result<String, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    // 1. Validate
    let project = queries::get_project(&conn, &input.project_id)
        .map_err(|e| e.to_string())?
        .ok_or("Project not found")?;

    if !project.scene_published && !project.panorama_published {
        return Err("No content is marked for publishing. Enable Scene or Panorama publishing first.".to_string());
    }

    let slug = project.publish_slug.clone().unwrap_or_else(|| project.id.clone());
    let dest = PathBuf::from(&input.destination_folder);
    let project_dir = paths::get_project_dir(&input.project_id).map_err(|e| e.to_string())?;
    let materials_dir = paths::get_materials_dir().map_err(|e| e.to_string())?;

    // 2. Create output directories
    std::fs::create_dir_all(dest.join("scenes")).map_err(|e| format!("Failed to create scenes dir: {}", e))?;
    std::fs::create_dir_all(dest.join("panoramas")).map_err(|e| format!("Failed to create panoramas dir: {}", e))?;
    std::fs::create_dir_all(dest.join("materials")).map_err(|e| format!("Failed to create materials dir: {}", e))?;
    std::fs::create_dir_all(dest.join("branding")).map_err(|e| format!("Failed to create branding dir: {}", e))?;

    // 3. Copy scenes
    let scenes = if project.scene_published {
        queries::get_scenes_by_project(&conn, &input.project_id).map_err(|e| e.to_string())?
    } else {
        Vec::new()
    };

    let total_scenes = scenes.len() as u32;
    let mut manifest_scenes: Vec<ManifestScene> = Vec::new();

    for (i, scene) in scenes.iter().enumerate() {
        emit_progress(&app_handle, "copying_scenes", i as u32 + 1, total_scenes, &format!("Copying scene: {}", scene.name));

        let glb_src = project_dir.join(&scene.glb_path);
        let glb_dest = dest.join("scenes").join(format!("{}.glb", scene.id));
        if glb_src.exists() {
            std::fs::copy(&glb_src, &glb_dest)
                .map_err(|e| format!("Failed to copy scene {}: {}", scene.name, e))?;
        }

        // Copy thumbnail if provided
        let thumb_filename = format!("{}-thumb.webp", scene.id);
        if let Some(thumb_path) = input.scene_thumbnails.get(&scene.id) {
            let thumb_src = Path::new(thumb_path);
            let thumb_dest = dest.join("scenes").join(&thumb_filename);
            if thumb_src.exists() {
                std::fs::copy(thumb_src, &thumb_dest)
                    .map_err(|e| format!("Failed to copy scene thumbnail: {}", e))?;
            }
        }

        manifest_scenes.push(ManifestScene {
            id: scene.id.clone(),
            name: scene.name.clone(),
            file: format!("scenes/{}.glb", scene.id),
            thumbnail: format!("scenes/{}", thumb_filename),
        });
    }

    // 4. Copy panoramas
    let panoramas = if project.panorama_published {
        queries::get_panoramas_by_project(&conn, &input.project_id).map_err(|e| e.to_string())?
    } else {
        Vec::new()
    };

    let total_panoramas = panoramas.len() as u32;
    let mut manifest_panoramas: Vec<ManifestPanorama> = Vec::new();

    for (i, panorama) in panoramas.iter().enumerate() {
        emit_progress(&app_handle, "copying_panoramas", i as u32 + 1, total_panoramas, &format!("Copying panorama: {}", panorama.name));

        let img_src = project_dir.join(&panorama.image_path);
        let ext = Path::new(&panorama.image_path)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("jpg");
        let img_filename = format!("{}.{}", panorama.id, ext);
        let img_dest = dest.join("panoramas").join(&img_filename);
        if img_src.exists() {
            std::fs::copy(&img_src, &img_dest)
                .map_err(|e| format!("Failed to copy panorama {}: {}", panorama.name, e))?;
        }

        // Copy thumbnail if provided
        let thumb_filename = format!("{}-thumb.webp", panorama.id);
        if let Some(thumb_path) = input.panorama_thumbnails.get(&panorama.id) {
            let thumb_src = Path::new(thumb_path);
            let thumb_dest = dest.join("panoramas").join(&thumb_filename);
            if thumb_src.exists() {
                std::fs::copy(thumb_src, &thumb_dest)
                    .map_err(|e| format!("Failed to copy panorama thumbnail: {}", e))?;
            }
        }

        manifest_panoramas.push(ManifestPanorama {
            id: panorama.id.clone(),
            name: panorama.name.clone(),
            file: format!("panoramas/{}", img_filename),
            thumbnail: format!("panoramas/{}", thumb_filename),
        });
    }

    // 5. Collect & copy materials for component groups
    let component_groups = queries::get_component_groups_by_project(&conn, &input.project_id)
        .map_err(|e| e.to_string())?;

    let total_groups = component_groups.len() as u32;
    let mut manifest_components: Vec<ManifestComponent> = Vec::new();
    let mut copied_materials: HashMap<String, bool> = HashMap::new();

    for (i, group) in component_groups.iter().enumerate() {
        emit_progress(&app_handle, "copying_materials", i as u32 + 1, total_groups, &format!("Processing: {}", group.group_name));

        let material_options = queries::get_material_options(&conn, &group.id)
            .map_err(|e| e.to_string())?;

        let mesh_names: Vec<String> = serde_json::from_str(&group.mesh_names)
            .unwrap_or_default();

        let mut manifest_materials: Vec<ManifestMaterialOption> = Vec::new();

        for option in &material_options {
            let material = queries::get_material(&conn, &option.material_id)
                .map_err(|e| e.to_string())?;

            if let Some(material) = material {
                let props: MaterialProperties = serde_json::from_str(&material.properties)
                    .unwrap_or_default();

                let mat_dest_dir = dest.join("materials").join(&material.id);

                // Copy texture files if not already copied
                if !copied_materials.contains_key(&material.id) {
                    std::fs::create_dir_all(&mat_dest_dir)
                        .map_err(|e| format!("Failed to create material dir: {}", e))?;

                    let texture_paths = collect_texture_paths(&props);
                    for (_, tex_path) in &texture_paths {
                        let src = materials_dir.join("textures").join(tex_path);
                        if src.exists() {
                            let filename = Path::new(tex_path)
                                .file_name()
                                .and_then(|f| f.to_str())
                                .unwrap_or(tex_path);
                            let dest_file = mat_dest_dir.join(filename);
                            std::fs::copy(&src, &dest_file)
                                .map_err(|e| format!("Failed to copy texture {}: {}", tex_path, e))?;
                        }
                    }

                    // Copy material thumbnail if exists
                    if let Some(ref thumb_path) = material.thumbnail_path {
                        let thumb_src = materials_dir.join(thumb_path);
                        if thumb_src.exists() {
                            let thumb_filename = Path::new(thumb_path)
                                .file_name()
                                .and_then(|f| f.to_str())
                                .unwrap_or("thumbnail.webp");
                            std::fs::copy(&thumb_src, mat_dest_dir.join(thumb_filename)).ok();
                        }
                    }

                    copied_materials.insert(material.id.clone(), true);
                }

                // Build manifest maps (relative paths within the output)
                let mut maps: HashMap<String, String> = HashMap::new();
                let texture_paths = collect_texture_paths(&props);
                for (map_key, tex_path) in &texture_paths {
                    let filename = Path::new(tex_path)
                        .file_name()
                        .and_then(|f| f.to_str())
                        .unwrap_or(tex_path);
                    maps.insert(map_key.clone(), format!("materials/{}/{}", material.id, filename));
                }

                let thumb_rel = material.thumbnail_path.as_ref().map(|p| {
                    let filename = Path::new(p).file_name().and_then(|f| f.to_str()).unwrap_or("thumbnail.webp");
                    format!("materials/{}/{}", material.id, filename)
                }).unwrap_or_default();

                manifest_materials.push(ManifestMaterialOption {
                    id: material.id.clone(),
                    name: material.name.clone(),
                    thumbnail: thumb_rel,
                    maps,
                });
            }
        }

        manifest_components.push(ManifestComponent {
            id: group.id.clone(),
            scene_id: group.scene_id.clone(),
            name: group.group_name.clone(),
            mesh_names,
            default_material_id: group.default_material_id.clone(),
            materials: manifest_materials,
        });
    }

    // 6. Copy branding
    emit_progress(&app_handle, "copying_branding", 1, 1, "Copying branding assets");

    let firm = queries::get_firm_profile(&conn).map_err(|e| e.to_string())?;
    let mut branding_logo: Option<String> = None;

    if let Some(ref logo_path) = firm.logo_path {
        let logo_src = Path::new(logo_path);
        if logo_src.exists() {
            let ext = logo_src.extension().and_then(|e| e.to_str()).unwrap_or("png");
            let logo_filename = format!("firm-logo.{}", ext);
            let logo_dest = dest.join("branding").join(&logo_filename);
            std::fs::copy(logo_src, &logo_dest)
                .map_err(|e| format!("Failed to copy firm logo: {}", e))?;
            branding_logo = Some(format!("branding/{}", logo_filename));
        }
    }

    // 7. Build & write manifest
    emit_progress(&app_handle, "writing_manifest", 1, 1, "Writing manifest.json");

    let manifest = PublishManifest {
        version: (project.publish_version + 1) as u32,
        project: ManifestProject {
            name: project.name.clone(),
            slug: slug.clone(),
        },
        scenes: manifest_scenes,
        panoramas: manifest_panoramas,
        configurable_components: manifest_components,
        branding: ManifestBranding {
            firm_name: firm.firm_name.clone(),
            firm_logo: branding_logo,
        },
    };

    let manifest_json = serde_json::to_string_pretty(&manifest)
        .map_err(|e| format!("Failed to serialize manifest: {}", e))?;
    std::fs::write(dest.join("manifest.json"), manifest_json)
        .map_err(|e| format!("Failed to write manifest: {}", e))?;

    // 8. Bump version
    conn.execute(
        "UPDATE projects SET publish_version = publish_version + 1,
            published_at = datetime('now'),
            updated_at = datetime('now')
         WHERE id = ?1",
        [&input.project_id],
    ).map_err(|e| format!("Failed to update publish version: {}", e))?;

    emit_progress(&app_handle, "done", 1, 1, "Publish complete!");

    Ok(input.destination_folder)
}

fn emit_progress(app_handle: &tauri::AppHandle, step: &str, current: u32, total: u32, message: &str) {
    let _ = app_handle.emit("publish-progress", PublishProgress {
        step: step.to_string(),
        current,
        total,
        message: message.to_string(),
    });
}

fn collect_texture_paths(props: &MaterialProperties) -> Vec<(String, String)> {
    let mut paths = Vec::new();
    if let Some(ref p) = props.map_path { paths.push(("map".to_string(), p.clone())); }
    if let Some(ref p) = props.normal_map_path { paths.push(("normalMap".to_string(), p.clone())); }
    if let Some(ref p) = props.roughness_map_path { paths.push(("roughnessMap".to_string(), p.clone())); }
    if let Some(ref p) = props.metalness_map_path { paths.push(("metalnessMap".to_string(), p.clone())); }
    if let Some(ref p) = props.ao_map_path { paths.push(("aoMap".to_string(), p.clone())); }
    if let Some(ref p) = props.emissive_map_path { paths.push(("emissiveMap".to_string(), p.clone())); }
    paths
}
