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
    pub hotspot_type: String,
    pub yaw: f64,
    pub pitch: f64,
    pub target_panorama_id: Option<String>,
    pub content: Option<String>,
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
    pub media_type: Option<String>,
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
pub struct UpdatePanoramaInput {
    pub name: Option<String>,
    pub description: Option<String>,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateHotspotInput {
    pub yaw: Option<f64>,
    pub pitch: Option<f64>,
    pub target_panorama_id: Option<String>,
    pub content: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
}
