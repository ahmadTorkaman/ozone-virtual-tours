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
