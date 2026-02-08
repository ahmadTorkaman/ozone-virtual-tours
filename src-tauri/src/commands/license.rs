use crate::db::queries;
use crate::license::{
    current_timestamp, get_machine_id, is_license_expired, validate_license_format,
    License, LicenseStatus, LicenseTier,
};
use crate::AppState;
use tauri::State;

/// Get the currently stored license
#[tauri::command]
pub fn get_license(state: State<AppState>) -> Result<Option<License>, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::get_license(&conn).map_err(|e| e.to_string())
}

/// Get the current license status with all tier information
#[tauri::command]
pub fn get_license_status(state: State<AppState>) -> Result<LicenseStatus, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    match queries::get_license(&conn) {
        Ok(Some(license)) => {
            let expired = is_license_expired(&license);
            Ok(LicenseStatus::from_license(&license, expired))
        }
        Ok(None) => Ok(LicenseStatus::trial()),
        Err(e) => Err(e.to_string()),
    }
}

/// Activate a license key
#[tauri::command]
pub async fn activate_license(
    key: String,
    email: Option<String>,
    state: State<'_, AppState>,
) -> Result<License, String> {
    // Validate format
    if !validate_license_format(&key) {
        return Err("Invalid license key format. Expected: XXXX-XXXX-XXXX-XXXX".to_string());
    }

    let machine_id = get_machine_id();

    // In production, this would validate against a license server
    // For now, we use offline validation with encoded key prefixes
    let license = validate_key_offline(&key, &email, &machine_id)?;

    // Store license locally
    {
        let conn = state.db.lock().map_err(|e| e.to_string())?;
        queries::save_license(&conn, &license).map_err(|e| e.to_string())?;
    }

    Ok(license)
}

/// Deactivate the current license
#[tauri::command]
pub fn deactivate_license(state: State<AppState>) -> Result<(), String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;
    queries::remove_license(&conn).map_err(|e| e.to_string())
}

/// Check if a specific feature is available with the current license
#[tauri::command]
pub fn check_feature(feature: String, state: State<AppState>) -> Result<bool, String> {
    let conn = state.db.lock().map_err(|e| e.to_string())?;

    match queries::get_license(&conn) {
        Ok(Some(license)) => {
            if is_license_expired(&license) {
                return Ok(false);
            }

            // Check feature availability based on tier and features list
            let has_feature = match feature.as_str() {
                "export" => license.tier.can_export(),
                "vr" => license.tier.can_use_vr(),
                "cloud_sync" => license.tier.has_cloud_sync(),
                _ => license.features.contains(&feature),
            };

            Ok(has_feature)
        }
        Ok(None) => {
            // Trial mode - limited features
            match feature.as_str() {
                "export" | "vr" | "cloud_sync" => Ok(false),
                _ => Ok(true), // Basic features available in trial
            }
        }
        Err(e) => Err(e.to_string()),
    }
}

/// Get the machine ID for this computer
#[tauri::command]
pub fn get_machine_id_cmd() -> Result<String, String> {
    Ok(get_machine_id())
}

/// Offline license validation (for development/demo purposes)
/// In production, this would call a license server API
fn validate_key_offline(
    key: &str,
    email: &Option<String>,
    machine_id: &str,
) -> Result<License, String> {
    let now = current_timestamp();

    // Decode tier from key prefix (simplified development logic)
    // Format: PREFIX-XXXX-XXXX-XXXX where PREFIX determines the tier
    let first_part = key.split('-').next().unwrap_or("");

    let (tier, valid_days) = match first_part.to_uppercase().as_str() {
        // Enterprise keys
        s if s.starts_with("ENT") => (LicenseTier::Enterprise, 365),
        // Professional keys
        s if s.starts_with("PRO") => (LicenseTier::Professional, 365),
        // Demo/test keys for development
        "TEST" | "DEMO" => (LicenseTier::Professional, 30),
        // Default to trial
        _ => (LicenseTier::Trial, 14),
    };

    // Build features list based on tier
    let features = match tier {
        LicenseTier::Enterprise => vec![
            "export".to_string(),
            "vr".to_string(),
            "cloud_sync".to_string(),
            "unlimited_projects".to_string(),
            "unlimited_scenes".to_string(),
            "priority_support".to_string(),
        ],
        LicenseTier::Professional => vec![
            "export".to_string(),
            "vr".to_string(),
        ],
        LicenseTier::Trial => vec![],
    };

    Ok(License {
        key: key.to_string(),
        email: email.clone(),
        tier,
        seats: 1,
        valid_until: Some(now + (valid_days * 86400)),
        features,
        activated_at: now,
        machine_id: machine_id.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_key_offline_enterprise() {
        let license = validate_key_offline("ENT1-ABCD-1234-EFGH", &None, "test-machine").unwrap();
        assert_eq!(license.tier, LicenseTier::Enterprise);
        assert!(license.features.contains(&"cloud_sync".to_string()));
    }

    #[test]
    fn test_validate_key_offline_professional() {
        let license = validate_key_offline("PRO1-ABCD-1234-EFGH", &None, "test-machine").unwrap();
        assert_eq!(license.tier, LicenseTier::Professional);
        assert!(license.features.contains(&"export".to_string()));
        assert!(license.features.contains(&"vr".to_string()));
        assert!(!license.features.contains(&"cloud_sync".to_string()));
    }

    #[test]
    fn test_validate_key_offline_trial() {
        let license = validate_key_offline("XXXX-ABCD-1234-EFGH", &None, "test-machine").unwrap();
        assert_eq!(license.tier, LicenseTier::Trial);
        assert!(license.features.is_empty());
    }
}
