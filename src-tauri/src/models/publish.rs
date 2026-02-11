use std::collections::HashMap;
use serde::Serialize;

#[derive(Serialize)]
pub struct PublishManifest {
    pub version: u32,
    pub project: ManifestProject,
    pub scenes: Vec<ManifestScene>,
    pub panoramas: Vec<ManifestPanorama>,
    pub configurable_components: Vec<ManifestComponent>,
    pub branding: ManifestBranding,
}

#[derive(Serialize)]
pub struct ManifestProject {
    pub name: String,
    pub slug: String,
}

#[derive(Serialize)]
pub struct ManifestScene {
    pub id: String,
    pub name: String,
    pub file: String,
    pub thumbnail: String,
}

#[derive(Serialize)]
pub struct ManifestPanorama {
    pub id: String,
    pub name: String,
    pub file: String,
    pub thumbnail: String,
}

#[derive(Serialize)]
pub struct ManifestComponent {
    pub id: String,
    pub scene_id: String,
    pub name: String,
    pub mesh_names: Vec<String>,
    pub default_material_id: Option<String>,
    pub materials: Vec<ManifestMaterialOption>,
}

#[derive(Serialize)]
pub struct ManifestMaterialOption {
    pub id: String,
    pub name: String,
    pub thumbnail: String,
    pub maps: HashMap<String, String>,
}

#[derive(Serialize)]
pub struct ManifestBranding {
    pub firm_name: String,
    pub firm_logo: Option<String>,
}
