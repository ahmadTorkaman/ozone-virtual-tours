use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FirmProfile {
    pub id: i32,
    pub firm_name: String,
    pub subdomain: String,
    pub logo_path: Option<String>,
    pub file_server_url: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateFirmProfileInput {
    pub firm_name: String,
    pub subdomain: String,
    pub logo_path: Option<String>,
    pub file_server_url: Option<String>,
}
