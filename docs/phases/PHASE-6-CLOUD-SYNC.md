# Phase 6: Cloud Sync & License System

> **Scope**: Optional cloud backup, license validation, user accounts
> **Prerequisites**: Phase 5 complete (VR mode working)
> **Outputs**: Optional cloud sync and B2B license management

---

## Overview

This phase adds optional cloud capabilities to the offline-first Tauri app:

1. License key validation system
2. Optional user accounts
3. Cloud backup for projects
4. Sync between devices
5. License management API

### Key Principle: Offline-First

The app works **100% offline** by default. Cloud features are optional enhancements:
- Local SQLite database is the source of truth
- Cloud sync is user-initiated or manual
- License validation can work offline after initial activation

---

## Context for New Sessions

If you're starting a new Claude session to work on this phase:

- **Project**: Ozone Studio - 3D scene viewer (Tauri desktop app)
- **Current State**: Phase 5 complete (fully functional offline app)
- **Working Directory**: `C:/Users/Lion/ozone-virtual-tours`
- **Focus**: Adding optional cloud features and licensing
- **Auth Strategy**: License keys for B2B, optional user accounts for cloud sync

Read `/docs/ARCHITECTURE.md` for full context.

---

## Task Checklist

### 6.1 License Key System (Rust Backend)

Create `src-tauri/src/license/mod.rs`:

```rust
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

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

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LicenseTier {
    Trial,
    Professional,
    Enterprise,
}

impl LicenseTier {
    pub fn max_projects(&self) -> usize {
        match self {
            LicenseTier::Trial => 3,
            LicenseTier::Professional => 50,
            LicenseTier::Enterprise => usize::MAX,
        }
    }

    pub fn max_scenes_per_project(&self) -> usize {
        match self {
            LicenseTier::Trial => 5,
            LicenseTier::Professional => 100,
            LicenseTier::Enterprise => usize::MAX,
        }
    }

    pub fn can_export(&self) -> bool {
        matches!(self, LicenseTier::Professional | LicenseTier::Enterprise)
    }

    pub fn has_cloud_sync(&self) -> bool {
        matches!(self, LicenseTier::Enterprise)
    }
}

/// Get a unique machine identifier
pub fn get_machine_id() -> String {
    // Use machine-specific info (simplified - production should use proper fingerprinting)
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        let output = Command::new("wmic")
            .args(["csproduct", "get", "uuid"])
            .output()
            .ok();

        if let Some(out) = output {
            let uuid = String::from_utf8_lossy(&out.stdout);
            let lines: Vec<&str> = uuid.lines().collect();
            if lines.len() > 1 {
                return lines[1].trim().to_string();
            }
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
    format!("{:x}", hasher.finish())
}

/// Validate a license key (offline check)
pub fn validate_license_format(key: &str) -> bool {
    // License format: XXXX-XXXX-XXXX-XXXX
    let parts: Vec<&str> = key.split('-').collect();
    if parts.len() != 4 {
        return false;
    }
    parts.iter().all(|p| p.len() == 4 && p.chars().all(|c| c.is_alphanumeric()))
}

/// Check if license is expired
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
```

### 6.2 License Commands (Tauri)

Create `src-tauri/src/commands/license.rs`:

```rust
use crate::db::Database;
use crate::license::{License, LicenseTier, get_machine_id, validate_license_format, is_license_expired};
use tauri::State;
use std::sync::Mutex;

#[tauri::command]
pub fn get_license(db: State<Mutex<Database>>) -> Result<Option<License>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_license().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_license_status(db: State<Mutex<Database>>) -> Result<LicenseStatus, String> {
    let db = db.lock().map_err(|e| e.to_string())?;

    match db.get_license() {
        Ok(Some(license)) => {
            if is_license_expired(&license) {
                Ok(LicenseStatus {
                    is_active: false,
                    tier: license.tier,
                    message: "License expired".to_string(),
                    days_remaining: None,
                })
            } else {
                let days_remaining = license.valid_until.map(|until| {
                    let now = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap()
                        .as_secs();
                    ((until - now) / 86400) as i32
                });

                Ok(LicenseStatus {
                    is_active: true,
                    tier: license.tier,
                    message: "License active".to_string(),
                    days_remaining,
                })
            }
        }
        Ok(None) => Ok(LicenseStatus {
            is_active: false,
            tier: LicenseTier::Trial,
            message: "No license activated".to_string(),
            days_remaining: Some(14), // Trial period
        }),
        Err(e) => Err(e.to_string()),
    }
}

#[derive(serde::Serialize)]
pub struct LicenseStatus {
    pub is_active: bool,
    pub tier: LicenseTier,
    pub message: String,
    pub days_remaining: Option<i32>,
}

#[tauri::command]
pub async fn activate_license(
    key: String,
    email: Option<String>,
    db: State<'_, Mutex<Database>>,
) -> Result<License, String> {
    // Validate format
    if !validate_license_format(&key) {
        return Err("Invalid license key format".to_string());
    }

    let machine_id = get_machine_id();

    // In production, validate against license server
    // For now, use offline validation with encoded key
    let license = validate_key_online(&key, &email, &machine_id).await?;

    // Store license locally
    {
        let db = db.lock().map_err(|e| e.to_string())?;
        db.save_license(&license).map_err(|e| e.to_string())?;
    }

    Ok(license)
}

async fn validate_key_online(
    key: &str,
    email: &Option<String>,
    machine_id: &str,
) -> Result<License, String> {
    // In production, call license server API
    // Example:
    // let response = reqwest::Client::new()
    //     .post("https://license.ozone.studio/api/activate")
    //     .json(&serde_json::json!({
    //         "key": key,
    //         "email": email,
    //         "machine_id": machine_id,
    //     }))
    //     .send()
    //     .await
    //     .map_err(|e| e.to_string())?;

    // For development, create a mock license
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs();

    // Decode tier from key prefix (simplified)
    let tier = if key.starts_with("ENT-") {
        LicenseTier::Enterprise
    } else if key.starts_with("PRO-") {
        LicenseTier::Professional
    } else {
        LicenseTier::Trial
    };

    Ok(License {
        key: key.to_string(),
        email: email.clone(),
        tier,
        seats: 1,
        valid_until: Some(now + 365 * 86400), // 1 year
        features: vec!["vr".to_string(), "export".to_string()],
        activated_at: now,
        machine_id: machine_id.to_string(),
    })
}

#[tauri::command]
pub fn deactivate_license(db: State<Mutex<Database>>) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.remove_license().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn check_feature(feature: String, db: State<Mutex<Database>>) -> Result<bool, String> {
    let db = db.lock().map_err(|e| e.to_string())?;

    match db.get_license() {
        Ok(Some(license)) => {
            if is_license_expired(&license) {
                return Ok(false);
            }
            Ok(license.features.contains(&feature))
        }
        Ok(None) => Ok(false),
        Err(e) => Err(e.to_string()),
    }
}
```

### 6.3 Cloud Sync Service (Optional)

Create `src-tauri/src/cloud/sync.rs`:

```rust
use serde::{Deserialize, Serialize};
use reqwest::Client;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncConfig {
    pub api_url: String,
    pub auth_token: Option<String>,
    pub enabled: bool,
    pub auto_sync: bool,
    pub sync_interval_minutes: u32,
}

impl Default for SyncConfig {
    fn default() -> Self {
        Self {
            api_url: "https://api.ozone.studio".to_string(),
            auth_token: None,
            enabled: false,
            auto_sync: false,
            sync_interval_minutes: 30,
        }
    }
}

pub struct CloudSync {
    config: SyncConfig,
    client: Client,
}

impl CloudSync {
    pub fn new(config: SyncConfig) -> Self {
        Self {
            config,
            client: Client::new(),
        }
    }

    pub async fn upload_project(&self, project_id: &str, data: Vec<u8>) -> Result<(), String> {
        if !self.config.enabled {
            return Err("Cloud sync not enabled".to_string());
        }

        let token = self.config.auth_token.as_ref()
            .ok_or("Not authenticated")?;

        self.client
            .post(format!("{}/sync/projects/{}", self.config.api_url, project_id))
            .bearer_auth(token)
            .body(data)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub async fn download_project(&self, project_id: &str) -> Result<Vec<u8>, String> {
        if !self.config.enabled {
            return Err("Cloud sync not enabled".to_string());
        }

        let token = self.config.auth_token.as_ref()
            .ok_or("Not authenticated")?;

        let response = self.client
            .get(format!("{}/sync/projects/{}", self.config.api_url, project_id))
            .bearer_auth(token)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let bytes = response.bytes().await.map_err(|e| e.to_string())?;
        Ok(bytes.to_vec())
    }

    pub async fn list_remote_projects(&self) -> Result<Vec<RemoteProject>, String> {
        if !self.config.enabled {
            return Err("Cloud sync not enabled".to_string());
        }

        let token = self.config.auth_token.as_ref()
            .ok_or("Not authenticated")?;

        let response = self.client
            .get(format!("{}/sync/projects", self.config.api_url))
            .bearer_auth(token)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let projects: Vec<RemoteProject> = response.json().await.map_err(|e| e.to_string())?;
        Ok(projects)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoteProject {
    pub id: String,
    pub name: String,
    pub updated_at: String,
    pub size_bytes: u64,
}
```

### 6.4 Frontend License Service

Create `client/src/services/licenseService.ts`:

```typescript
import { invoke } from '@tauri-apps/api/core';

export type LicenseTier = 'trial' | 'professional' | 'enterprise';

export interface License {
  key: string;
  email?: string;
  tier: LicenseTier;
  seats: number;
  validUntil?: number;
  features: string[];
  activatedAt: number;
  machineId: string;
}

export interface LicenseStatus {
  isActive: boolean;
  tier: LicenseTier;
  message: string;
  daysRemaining?: number;
}

export const licenseService = {
  async getLicense(): Promise<License | null> {
    return invoke<License | null>('get_license');
  },

  async getStatus(): Promise<LicenseStatus> {
    return invoke<LicenseStatus>('get_license_status');
  },

  async activate(key: string, email?: string): Promise<License> {
    return invoke<License>('activate_license', { key, email });
  },

  async deactivate(): Promise<void> {
    return invoke('deactivate_license');
  },

  async checkFeature(feature: string): Promise<boolean> {
    return invoke<boolean>('check_feature', { feature });
  },
};
```

### 6.5 License Store

Create `client/src/stores/licenseStore.ts`:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { License, LicenseStatus, LicenseTier } from '@/services/licenseService';

interface LicenseState {
  license: License | null;
  status: LicenseStatus | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setLicense: (license: License | null) => void;
  setStatus: (status: LicenseStatus | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed helpers
  canUseFeature: (feature: string) => boolean;
  getTier: () => LicenseTier;
}

export const useLicenseStore = create<LicenseState>()(
  devtools(
    (set, get) => ({
      license: null,
      status: null,
      isLoading: false,
      error: null,

      setLicense: (license) => set({ license }),
      setStatus: (status) => set({ status }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      canUseFeature: (feature) => {
        const { license, status } = get();
        if (!license || !status?.isActive) return false;
        return license.features.includes(feature);
      },

      getTier: () => {
        const { status } = get();
        return status?.tier ?? 'trial';
      },
    }),
    { name: 'license-store' }
  )
);
```

### 6.6 License Settings UI

Create `client/src/features/settings/LicenseSettings.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { Key, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useLicenseStore } from '@/stores/licenseStore';
import { licenseService } from '@/services/licenseService';

export function LicenseSettings() {
  const { license, status, isLoading, error, setLicense, setStatus, setLoading, setError } =
    useLicenseStore();

  const [licenseKey, setLicenseKey] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    loadLicenseStatus();
  }, []);

  const loadLicenseStatus = async () => {
    setLoading(true);
    try {
      const [lic, stat] = await Promise.all([
        licenseService.getLicense(),
        licenseService.getStatus(),
      ]);
      setLicense(lic);
      setStatus(stat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load license');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!licenseKey) return;

    setLoading(true);
    setError(null);

    try {
      const newLicense = await licenseService.activate(licenseKey, email || undefined);
      setLicense(newLicense);
      const stat = await licenseService.getStatus();
      setStatus(stat);
      setLicenseKey('');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Deactivate your license? You can reactivate it later.')) return;

    setLoading(true);
    try {
      await licenseService.deactivate();
      setLicense(null);
      const stat = await licenseService.getStatus();
      setStatus(stat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deactivation failed');
    } finally {
      setLoading(false);
    }
  };

  const tierColors = {
    trial: 'text-gray-400',
    professional: 'text-blue-400',
    enterprise: 'text-purple-400',
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={24} className="text-primary-400" />
        <h2 className="text-xl font-semibold text-white">License</h2>
      </div>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Status</span>
          <div className="flex items-center gap-2">
            {status?.isActive ? (
              <CheckCircle size={16} className="text-green-400" />
            ) : (
              <AlertCircle size={16} className="text-yellow-400" />
            )}
            <span className={status?.isActive ? 'text-green-400' : 'text-yellow-400'}>
              {status?.message || 'Loading...'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400">Tier</span>
          <span className={`font-medium capitalize ${tierColors[status?.tier ?? 'trial']}`}>
            {status?.tier ?? 'Trial'}
          </span>
        </div>

        {status?.daysRemaining !== undefined && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Days Remaining</span>
            <span className="text-white">
              {status.daysRemaining === -1 ? 'Perpetual' : status.daysRemaining}
            </span>
          </div>
        )}

        {license && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 font-mono">{license.key}</p>
            {license.email && (
              <p className="text-xs text-gray-500">{license.email}</p>
            )}
          </div>
        )}
      </div>

      {/* Activate License */}
      {!license && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">License Key</label>
            <div className="relative">
              <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            onClick={handleActivate}
            disabled={isLoading || !licenseKey}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white py-2 rounded-lg"
          >
            {isLoading ? 'Activating...' : 'Activate License'}
          </button>
        </div>
      )}

      {/* Deactivate */}
      {license && (
        <button
          onClick={handleDeactivate}
          disabled={isLoading}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
        >
          Deactivate License
        </button>
      )}

      {/* Tier Features */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h3 className="text-white font-medium mb-3">License Tiers</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Trial</span>
            <span className="text-gray-500">3 projects, 5 scenes each, 14 days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-400">Professional</span>
            <span className="text-gray-500">50 projects, 100 scenes, export</span>
          </div>
          <div className="flex justify-between">
            <span className="text-purple-400">Enterprise</span>
            <span className="text-gray-500">Unlimited, cloud sync, priority support</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 6.7 Export Feature

Create `client/src/features/settings/index.ts`:

```typescript
export { LicenseSettings } from './LicenseSettings';
```

---

## Verification Checklist

After completing Phase 6, verify:

- [ ] License key can be activated
- [ ] License status displays correctly
- [ ] License tier affects available features
- [ ] License can be deactivated
- [ ] Expired licenses are detected
- [ ] Trial limitations are enforced
- [ ] Machine ID is generated consistently
- [ ] Settings persist after restart

---

## Future: Full Cloud Sync Implementation

For a complete cloud sync solution:

1. **Backend API** (separate service):
   - User registration/login
   - Project storage (S3 or similar)
   - Sync conflict resolution
   - Webhook for real-time updates

2. **Sync Logic**:
   - Last-write-wins or merge strategies
   - Delta sync for large files
   - Offline queue with retry

3. **UI**:
   - Sync status indicator
   - Conflict resolution UI
   - Selective sync (choose which projects)

---

## Next Phase

After Phase 6 is complete, proceed to **Phase 7: Panorama Viewer** which covers:
- 360° panorama viewing
- Hotspot system for navigation
- Info popups and media hotspots
