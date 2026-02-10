use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentGroup {
    pub id: String,
    pub project_id: String,
    pub scene_id: String,
    pub group_name: String,
    pub mesh_names: String,
    pub default_material_id: Option<String>,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateComponentGroupInput {
    pub project_id: String,
    pub scene_id: String,
    pub group_name: String,
    pub mesh_names: Vec<String>,
    pub default_material_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateComponentGroupInput {
    pub group_name: Option<String>,
    pub mesh_names: Option<Vec<String>>,
    pub default_material_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComponentMaterialOption {
    pub id: String,
    pub component_group_id: String,
    pub material_id: String,
    pub sort_order: i32,
}
