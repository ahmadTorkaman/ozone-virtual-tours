use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

/// License information stored locally
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct License {
    pub key: String,
    pub email: Option<String>,
    pub tier: LicenseTier,
    pub seats: u32,
    pub valid_until: Option<u64>, // Unix timestamp, None = perpetual
    pub features: Vec<String>,
    pub activated_at: u64,
    pub machine_id: String,
}

/// License tier levels
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LicenseTier {
    Trial,
    Professional,
    Enterprise,
}

impl LicenseTier {
    /// Maximum number of projects allowed
    pub fn max_projects(&self) -> usize {
        match self {
            LicenseTier::Trial => 3,
            LicenseTier::Professional => 50,
            LicenseTier::Enterprise => usize::MAX,
        }
    }

    /// Maximum scenes per project
    pub fn max_scenes_per_project(&self) -> usize {
        match self {
            LicenseTier::Trial => 5,
            LicenseTier::Professional => 100,
            LicenseTier::Enterprise => usize::MAX,
        }
    }

    /// Whether export feature is available
    pub fn can_export(&self) -> bool {
        matches!(self, LicenseTier::Professional | LicenseTier::Enterprise)
    }

    /// Whether VR mode is available
    pub fn can_use_vr(&self) -> bool {
        matches!(self, LicenseTier::Professional | LicenseTier::Enterprise)
    }

    /// Whether cloud sync is available
    pub fn has_cloud_sync(&self) -> bool {
        matches!(self, LicenseTier::Enterprise)
    }

    /// Get tier from string
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "professional" | "pro" => LicenseTier::Professional,
            "enterprise" | "ent" => LicenseTier::Enterprise,
            _ => LicenseTier::Trial,
        }
    }
}

impl Default for LicenseTier {
    fn default() -> Self {
        LicenseTier::Trial
    }
}

/// License status response
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LicenseStatus {
    pub is_active: bool,
    pub tier: LicenseTier,
    pub message: String,
    pub days_remaining: Option<i32>,
    pub max_projects: usize,
    pub max_scenes_per_project: usize,
    pub can_export: bool,
    pub can_use_vr: bool,
    pub has_cloud_sync: bool,
}

impl LicenseStatus {
    /// Create a trial status (no license activated)
    pub fn trial() -> Self {
        let tier = LicenseTier::Trial;
        Self {
            is_active: true,
            tier: tier.clone(),
            message: "Trial mode - 14 days remaining".to_string(),
            days_remaining: Some(14),
            max_projects: tier.max_projects(),
            max_scenes_per_project: tier.max_scenes_per_project(),
            can_export: tier.can_export(),
            can_use_vr: tier.can_use_vr(),
            has_cloud_sync: tier.has_cloud_sync(),
        }
    }

    /// Create status from license
    pub fn from_license(license: &License, is_expired: bool) -> Self {
        let tier = &license.tier;

        if is_expired {
            return Self {
                is_active: false,
                tier: tier.clone(),
                message: "License expired".to_string(),
                days_remaining: Some(0),
                max_projects: LicenseTier::Trial.max_projects(),
                max_scenes_per_project: LicenseTier::Trial.max_scenes_per_project(),
                can_export: false,
                can_use_vr: false,
                has_cloud_sync: false,
            };
        }

        let days_remaining = license.valid_until.map(|until| {
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_secs();
            if until > now {
                ((until - now) / 86400) as i32
            } else {
                0
            }
        });

        Self {
            is_active: true,
            tier: tier.clone(),
            message: format!("{:?} license active", tier),
            days_remaining,
            max_projects: tier.max_projects(),
            max_scenes_per_project: tier.max_scenes_per_project(),
            can_export: tier.can_export(),
            can_use_vr: tier.can_use_vr(),
            has_cloud_sync: tier.has_cloud_sync(),
        }
    }
}

/// Get a unique machine identifier for license binding
pub fn get_machine_id() -> String {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;

        // Try to get Windows UUID via wmic
        let output = Command::new("wmic")
            .args(["csproduct", "get", "uuid"])
            .output()
            .ok();

        if let Some(out) = output {
            let uuid = String::from_utf8_lossy(&out.stdout);
            let lines: Vec<&str> = uuid.lines().collect();
            if lines.len() > 1 {
                let uuid_line = lines[1].trim();
                if !uuid_line.is_empty() && uuid_line != "UUID" {
                    return uuid_line.to_string();
                }
            }
        }

        // Fallback: try PowerShell
        let ps_output = Command::new("powershell")
            .args(["-Command", "(Get-WmiObject -Class Win32_ComputerSystemProduct).UUID"])
            .output()
            .ok();

        if let Some(out) = ps_output {
            let uuid = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !uuid.is_empty() {
                return uuid;
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        use std::process::Command;

        let output = Command::new("ioreg")
            .args(["-rd1", "-c", "IOPlatformExpertDevice"])
            .output()
            .ok();

        if let Some(out) = output {
            let data = String::from_utf8_lossy(&out.stdout);
            for line in data.lines() {
                if line.contains("IOPlatformUUID") {
                    if let Some(uuid) = line.split('"').nth(3) {
                        return uuid.to_string();
                    }
                }
            }
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(uuid) = std::fs::read_to_string("/etc/machine-id") {
            return uuid.trim().to_string();
        }
        if let Ok(uuid) = std::fs::read_to_string("/var/lib/dbus/machine-id") {
            return uuid.trim().to_string();
        }
    }

    // Fallback: use hostname hash
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};

    let hostname = hostname::get()
        .map(|h| h.to_string_lossy().to_string())
        .unwrap_or_else(|_| "unknown".to_string());

    let mut hasher = DefaultHasher::new();
    hostname.hash(&mut hasher);
    format!("{:016x}", hasher.finish())
}

/// Validate license key format (XXXX-XXXX-XXXX-XXXX)
pub fn validate_license_format(key: &str) -> bool {
    let parts: Vec<&str> = key.split('-').collect();
    if parts.len() != 4 {
        return false;
    }
    parts.iter().all(|p| {
        p.len() == 4 && p.chars().all(|c| c.is_ascii_alphanumeric())
    })
}

/// Check if a license is expired
pub fn is_license_expired(license: &License) -> bool {
    if let Some(valid_until) = license.valid_until {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs();
        return now > valid_until;
    }
    false // Perpetual license
}

/// Get the current Unix timestamp
pub fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_license_format() {
        assert!(validate_license_format("ABCD-1234-EFGH-5678"));
        assert!(validate_license_format("PRO1-ABCD-1234-EFGH"));
        assert!(!validate_license_format("ABCD-1234-EFGH")); // Too few parts
        assert!(!validate_license_format("ABCDE-1234-EFGH-5678")); // Part too long
        assert!(!validate_license_format("ABC-1234-EFGH-5678")); // Part too short
        assert!(!validate_license_format("ABCD_1234_EFGH_5678")); // Wrong separator
    }

    #[test]
    fn test_tier_limits() {
        let trial = LicenseTier::Trial;
        assert_eq!(trial.max_projects(), 3);
        assert_eq!(trial.max_scenes_per_project(), 5);
        assert!(!trial.can_export());
        assert!(!trial.can_use_vr());
        assert!(!trial.has_cloud_sync());

        let pro = LicenseTier::Professional;
        assert_eq!(pro.max_projects(), 50);
        assert_eq!(pro.max_scenes_per_project(), 100);
        assert!(pro.can_export());
        assert!(pro.can_use_vr());
        assert!(!pro.has_cloud_sync());

        let ent = LicenseTier::Enterprise;
        assert_eq!(ent.max_projects(), usize::MAX);
        assert!(ent.can_export());
        assert!(ent.can_use_vr());
        assert!(ent.has_cloud_sync());
    }

    #[test]
    fn test_machine_id_not_empty() {
        let id = get_machine_id();
        assert!(!id.is_empty());
    }
}
