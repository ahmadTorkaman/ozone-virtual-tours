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
    pub source_path: String,
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
