use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Material {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub category_id: Option<String>,
    pub thumbnail_path: Option<String>,
    pub properties: String,
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
    pub material_type: String,

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

    // Texture paths
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
