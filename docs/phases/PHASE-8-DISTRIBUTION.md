# Phase 8: Distribution & Updates

> **Scope**: Windows installer, auto-updates, code signing, release workflow
> **Prerequisites**: Phase 7 complete (all features working)
> **Outputs**: Production-ready installer with automatic updates

---

## Overview

This phase prepares Ozone Studio for distribution:

1. Windows installer (MSI/NSIS)
2. Auto-update system via Tauri
3. Code signing for Windows
4. Release workflow (GitHub Actions)
5. Version management

---

## Context for New Sessions

If you're starting a new Claude session to work on this phase:

- **Project**: Ozone Studio - 3D scene viewer (Tauri desktop app)
- **Current State**: Phase 7 complete (fully functional app)
- **Working Directory**: `C:/Users/Lion/ozone-virtual-tours`
- **Focus**: Packaging and distribution
- **Target**: Windows primary (via direct download)

Read `/docs/ARCHITECTURE.md` for full context.

---

## Task Checklist

### 8.1 Configure Tauri for Production

Update `src-tauri/tauri.conf.json`:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Ozone Studio",
  "version": "1.0.0",
  "identifier": "studio.ozone.app",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../client/dist"
  },
  "app": {
    "windows": [
      {
        "title": "Ozone Studio",
        "width": 1400,
        "height": 900,
        "minWidth": 1024,
        "minHeight": 768,
        "resizable": true,
        "fullscreen": false,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; img-src 'self' asset: data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.ozone.studio https://*.tauri.app",
      "assetProtocol": {
        "enable": true,
        "scope": ["$DOCUMENT/*", "$APPDATA/*", "$RESOURCE/*"]
      }
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis"],
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "resources": ["draco/*"],
    "windows": {
      "certificateThumbprint": null,
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com",
      "wix": {
        "language": "en-US",
        "upgradeCode": "YOUR-UPGRADE-CODE-UUID"
      },
      "nsis": {
        "installMode": "currentUser",
        "languages": ["English"],
        "displayLanguageSelector": false
      }
    },
    "category": "Graphics",
    "shortDescription": "3D Scene Viewer for Interior Designers",
    "longDescription": "Ozone Studio is a professional 3D scene viewer designed for interior designers. View, edit, and present GLB models with custom materials and VR support."
  },
  "plugins": {
    "updater": {
      "endpoints": [
        "https://releases.ozone.studio/{{target}}/{{arch}}/{{current_version}}"
      ],
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

### 8.2 Create App Icons

Create icons in multiple sizes at `src-tauri/icons/`:

```
icons/
├── 32x32.png
├── 128x128.png
├── 128x128@2x.png
├── icon.ico          (Windows - multi-size)
├── icon.icns         (macOS - multi-size)
└── Square*.png       (Windows Store, if needed)
```

Use a tool like https://tauri.app/v1/guides/features/icons to generate all sizes from a single source.

### 8.3 Configure Auto-Updates

Create `src-tauri/src/updater.rs`:

```rust
use tauri_plugin_updater::UpdaterExt;
use tauri::Manager;

pub fn setup_updater(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let handle = app.handle().clone();

    tauri::async_runtime::spawn(async move {
        // Check for updates on startup (with delay)
        tokio::time::sleep(std::time::Duration::from_secs(5)).await;

        match handle.updater().check().await {
            Ok(update) => {
                if let Some(update) = update {
                    println!("Update available: {}", update.version);

                    // Emit event to frontend
                    let _ = handle.emit("update-available", UpdateInfo {
                        version: update.version.clone(),
                        body: update.body.clone(),
                    });
                }
            }
            Err(e) => {
                eprintln!("Update check failed: {}", e);
            }
        }
    });

    Ok(())
}

#[derive(Clone, serde::Serialize)]
struct UpdateInfo {
    version: String,
    body: Option<String>,
}

#[tauri::command]
pub async fn check_for_updates(app: tauri::AppHandle) -> Result<Option<UpdateInfo>, String> {
    match app.updater().check().await {
        Ok(update) => {
            if let Some(update) = update {
                Ok(Some(UpdateInfo {
                    version: update.version.clone(),
                    body: update.body.clone(),
                }))
            } else {
                Ok(None)
            }
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    match app.updater().check().await {
        Ok(Some(update)) => {
            // Download and install
            update.download_and_install(|progress, total| {
                println!("Download progress: {}/{:?}", progress, total);
            }, || {
                println!("Download finished");
            }).await.map_err(|e| e.to_string())?;

            // Restart app
            app.restart();

            Ok(())
        }
        Ok(None) => Err("No update available".to_string()),
        Err(e) => Err(e.to_string()),
    }
}
```

### 8.4 Frontend Update UI

Create `client/src/features/settings/UpdateChecker.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { Download, RefreshCw, CheckCircle } from 'lucide-react';

interface UpdateInfo {
  version: string;
  body?: string;
}

export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for update events from backend
    const unlisten = listen<UpdateInfo>('update-available', (event) => {
      setUpdateAvailable(event.payload);
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  const checkForUpdates = async () => {
    setIsChecking(true);
    setError(null);

    try {
      const update = await invoke<UpdateInfo | null>('check_for_updates');
      setUpdateAvailable(update);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check for updates');
    } finally {
      setIsChecking(false);
    }
  };

  const installUpdate = async () => {
    if (!updateAvailable) return;

    setIsInstalling(true);
    setError(null);

    try {
      await invoke('install_update');
      // App will restart, so this code won't continue
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to install update');
      setIsInstalling(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">Updates</h3>
        <button
          onClick={checkForUpdates}
          disabled={isChecking || isInstalling}
          className="text-gray-400 hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm mb-4">{error}</p>
      )}

      {updateAvailable ? (
        <div className="space-y-4">
          <div className="bg-primary-900/50 border border-primary-500 rounded-lg p-3">
            <p className="text-primary-300 font-medium">
              Version {updateAvailable.version} available
            </p>
            {updateAvailable.body && (
              <p className="text-gray-400 text-sm mt-1">{updateAvailable.body}</p>
            )}
          </div>

          <button
            onClick={installUpdate}
            disabled={isInstalling}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white py-2 rounded-lg"
          >
            {isInstalling ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Installing...
              </>
            ) : (
              <>
                <Download size={18} />
                Install Update
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-gray-400">
          <CheckCircle size={18} className="text-green-400" />
          <span>You're up to date</span>
        </div>
      )}
    </div>
  );
}
```

### 8.5 Create Release Script

Create `scripts/release.ps1` (Windows PowerShell):

```powershell
# Release Script for Ozone Studio
param(
    [Parameter(Mandatory=$true)]
    [string]$Version,

    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Validate version format
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Error "Invalid version format. Use semantic versioning (e.g., 1.0.0)"
    exit 1
}

Write-Host "Preparing release v$Version..." -ForegroundColor Green

# Update version in tauri.conf.json
$tauriConfig = Get-Content -Path "src-tauri/tauri.conf.json" | ConvertFrom-Json
$tauriConfig.version = $Version
$tauriConfig | ConvertTo-Json -Depth 10 | Set-Content -Path "src-tauri/tauri.conf.json"

# Update version in Cargo.toml
$cargoToml = Get-Content -Path "src-tauri/Cargo.toml"
$cargoToml = $cargoToml -replace 'version = "\d+\.\d+\.\d+"', "version = `"$Version`""
Set-Content -Path "src-tauri/Cargo.toml" -Value $cargoToml

# Update version in package.json
$packageJson = Get-Content -Path "client/package.json" | ConvertFrom-Json
$packageJson.version = $Version
$packageJson | ConvertTo-Json -Depth 10 | Set-Content -Path "client/package.json"

Write-Host "Updated version to $Version in all config files" -ForegroundColor Yellow

if ($DryRun) {
    Write-Host "Dry run - skipping build and commit" -ForegroundColor Cyan
    exit 0
}

# Build the app
Write-Host "Building release..." -ForegroundColor Green
Set-Location -Path "client"
pnpm build
Set-Location -Path ".."

Set-Location -Path "src-tauri"
cargo tauri build
Set-Location -Path ".."

# Get built artifacts
$msiPath = Get-ChildItem -Path "src-tauri/target/release/bundle/msi/*.msi" | Select-Object -First 1
$nsisPath = Get-ChildItem -Path "src-tauri/target/release/bundle/nsis/*.exe" | Select-Object -First 1

Write-Host "Build artifacts:" -ForegroundColor Green
Write-Host "  MSI: $($msiPath.FullName)"
Write-Host "  NSIS: $($nsisPath.FullName)"

# Commit and tag
git add .
git commit -m "Release v$Version"
git tag -a "v$Version" -m "Release v$Version"

Write-Host "Created git tag v$Version" -ForegroundColor Green
Write-Host "Run 'git push && git push --tags' to publish" -ForegroundColor Yellow
```

### 8.6 GitHub Actions Workflow

Create `.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

env:
  CARGO_TERM_COLOR: always

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Setup Rust
        uses: dtolnay/rust-action@stable

      - name: Install dependencies
        run: |
          cd client
          pnpm install

      - name: Build frontend
        run: |
          cd client
          pnpm build

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          projectPath: src-tauri
          tagName: ${{ github.ref_name }}
          releaseName: 'Ozone Studio ${{ github.ref_name }}'
          releaseBody: 'See the assets to download and install this version.'
          releaseDraft: true
          prerelease: false
          includeUpdaterJson: true

  create-update-json:
    needs: build-windows
    runs-on: ubuntu-latest
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4

      - name: Generate update manifest
        run: |
          VERSION="${{ github.ref_name }}"
          VERSION="${VERSION#v}"

          cat > latest.json << EOF
          {
            "version": "$VERSION",
            "notes": "See release notes on GitHub",
            "pub_date": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
            "platforms": {
              "windows-x86_64": {
                "signature": "$(cat *.sig | head -1)",
                "url": "https://github.com/${{ github.repository }}/releases/download/${{ github.ref_name }}/Ozone-Studio_${VERSION}_x64-setup.exe"
              }
            }
          }
          EOF

      - name: Upload update manifest
        uses: actions/upload-artifact@v4
        with:
          name: update-manifest
          path: latest.json
```

### 8.7 Code Signing Setup

For Windows code signing:

1. **Get a code signing certificate** from a CA (Sectigo, DigiCert, etc.)

2. **Store certificate securely** in GitHub Secrets:
   - `WINDOWS_CERTIFICATE`: Base64-encoded .pfx file
   - `WINDOWS_CERTIFICATE_PASSWORD`: Password for the .pfx

3. **Update tauri.conf.json**:
```json
{
  "bundle": {
    "windows": {
      "certificateThumbprint": "YOUR_CERT_THUMBPRINT",
      "digestAlgorithm": "sha256",
      "timestampUrl": "http://timestamp.digicert.com"
    }
  }
}
```

### 8.8 Update Server Setup

For self-hosted updates:

1. **Create update endpoint** at `https://releases.ozone.studio/`

2. **Serve JSON manifest** for each platform:
```json
{
  "version": "1.0.1",
  "notes": "Bug fixes and performance improvements",
  "pub_date": "2024-01-15T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "BASE64_SIGNATURE",
      "url": "https://releases.ozone.studio/downloads/ozone-studio_1.0.1_x64.msi"
    }
  }
}
```

3. **Generate update signing key**:
```bash
# On development machine
cargo tauri signer generate -w ~/.tauri/ozone-studio.key
# Store public key in tauri.conf.json and private key in secrets
```

---

## Verification Checklist

After completing Phase 8, verify:

- [ ] App builds without errors (`cargo tauri build`)
- [ ] MSI installer works on Windows
- [ ] NSIS installer works on Windows
- [ ] App icon displays correctly
- [ ] Update check works
- [ ] Update download and install works
- [ ] Code signing is valid (check with signtool)
- [ ] GitHub Actions workflow runs successfully

---

## Testing the Installer

1. Build locally: `cargo tauri build`
2. Find installers in `src-tauri/target/release/bundle/`
3. Test MSI: Run installer, verify install location
4. Test NSIS: Run installer, verify shortcuts
5. Uninstall and verify cleanup

---

## Future Platforms

### macOS (Future)
- Update `bundle.targets` to include `"dmg", "app"`
- Add macOS code signing via Apple Developer account
- Update GitHub Actions with macOS runner

### Linux (Future)
- Update `bundle.targets` to include `"deb", "appimage"`
- AppImage for portable distribution
- Deb package for Ubuntu/Debian

---

## Conclusion

Phase 8 completes the development cycle by enabling:
- Professional Windows distribution
- Seamless automatic updates
- Secure code signing
- Automated release workflow

The app is now ready for production distribution to users via direct download.
