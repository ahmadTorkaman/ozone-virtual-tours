use std::path::PathBuf;

/// Get the app data directory (Documents/Ozone Studio)
pub fn get_app_data_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let documents = dirs::document_dir()
        .ok_or("Could not find Documents directory")?;

    Ok(documents.join("Ozone Studio"))
}

/// Get the projects directory
pub fn get_projects_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
    Ok(get_app_data_dir()?.join("projects"))
}

/// Get the materials directory
pub fn get_materials_dir() -> Result<PathBuf, Box<dyn std::error::Error>> {
    Ok(get_app_data_dir()?.join("materials"))
}

/// Get a project's directory
pub fn get_project_dir(project_id: &str) -> Result<PathBuf, Box<dyn std::error::Error>> {
    Ok(get_projects_dir()?.join(project_id))
}

/// Ensure a directory exists
pub fn ensure_dir(path: &PathBuf) -> Result<(), Box<dyn std::error::Error>> {
    if !path.exists() {
        std::fs::create_dir_all(path)?;
    }
    Ok(())
}
