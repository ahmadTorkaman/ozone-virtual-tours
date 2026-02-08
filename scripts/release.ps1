# Release Script for Ozone Studio
# Usage: .\scripts\release.ps1 -Version "1.0.1" [-DryRun]

param(
    [Parameter(Mandatory=$true)]
    [string]$Version,

    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

# Validate version format (semantic versioning)
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Error "Invalid version format. Use semantic versioning (e.g., 1.0.0, 1.2.3)"
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Ozone Studio Release Script" -ForegroundColor Cyan
Write-Host "  Version: $Version" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Store original location
$originalLocation = Get-Location
$projectRoot = Split-Path -Parent $PSScriptRoot

Set-Location $projectRoot

try {
    # Step 1: Update version in tauri.conf.json
    Write-Host "[1/6] Updating tauri.conf.json..." -ForegroundColor Yellow
    $tauriConfigPath = "src-tauri/tauri.conf.json"
    $tauriConfig = Get-Content -Path $tauriConfigPath -Raw | ConvertFrom-Json
    $tauriConfig.version = $Version
    $tauriConfig | ConvertTo-Json -Depth 20 | Set-Content -Path $tauriConfigPath
    Write-Host "      Updated version to $Version" -ForegroundColor Green

    # Step 2: Update version in Cargo.toml
    Write-Host "[2/6] Updating Cargo.toml..." -ForegroundColor Yellow
    $cargoTomlPath = "src-tauri/Cargo.toml"
    $cargoToml = Get-Content -Path $cargoTomlPath -Raw
    $cargoToml = $cargoToml -replace 'version = "\d+\.\d+\.\d+"', "version = `"$Version`""
    Set-Content -Path $cargoTomlPath -Value $cargoToml -NoNewline
    Write-Host "      Updated version to $Version" -ForegroundColor Green

    # Step 3: Update version in client/package.json
    Write-Host "[3/6] Updating client/package.json..." -ForegroundColor Yellow
    $clientPackagePath = "client/package.json"
    $clientPackage = Get-Content -Path $clientPackagePath -Raw | ConvertFrom-Json
    $clientPackage.version = $Version
    $clientPackage | ConvertTo-Json -Depth 10 | Set-Content -Path $clientPackagePath
    Write-Host "      Updated version to $Version" -ForegroundColor Green

    # Step 4: Update version in root package.json (if exists)
    $rootPackagePath = "package.json"
    if (Test-Path $rootPackagePath) {
        Write-Host "[4/6] Updating root package.json..." -ForegroundColor Yellow
        $rootPackage = Get-Content -Path $rootPackagePath -Raw | ConvertFrom-Json
        $rootPackage.version = $Version
        $rootPackage | ConvertTo-Json -Depth 10 | Set-Content -Path $rootPackagePath
        Write-Host "      Updated version to $Version" -ForegroundColor Green
    } else {
        Write-Host "[4/6] Skipping root package.json (not found)" -ForegroundColor Gray
    }

    Write-Host ""
    Write-Host "Version updated in all config files!" -ForegroundColor Green

    if ($DryRun) {
        Write-Host ""
        Write-Host "DRY RUN - Skipping build and git operations" -ForegroundColor Cyan
        Write-Host ""
        exit 0
    }

    # Step 5: Build the application
    Write-Host ""
    Write-Host "[5/6] Building release..." -ForegroundColor Yellow
    Write-Host "      Building frontend..." -ForegroundColor Gray

    Set-Location "client"
    pnpm build
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend build failed"
    }
    Set-Location $projectRoot

    Write-Host "      Building Tauri application..." -ForegroundColor Gray
    cargo tauri build
    if ($LASTEXITCODE -ne 0) {
        throw "Tauri build failed"
    }

    # Find built artifacts
    $msiPath = Get-ChildItem -Path "src-tauri/target/release/bundle/msi/*.msi" -ErrorAction SilentlyContinue | Select-Object -First 1
    $nsisPath = Get-ChildItem -Path "src-tauri/target/release/bundle/nsis/*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

    Write-Host ""
    Write-Host "Build artifacts:" -ForegroundColor Green
    if ($msiPath) {
        Write-Host "      MSI:  $($msiPath.FullName)" -ForegroundColor White
        Write-Host "            Size: $([math]::Round($msiPath.Length / 1MB, 2)) MB" -ForegroundColor Gray
    }
    if ($nsisPath) {
        Write-Host "      NSIS: $($nsisPath.FullName)" -ForegroundColor White
        Write-Host "            Size: $([math]::Round($nsisPath.Length / 1MB, 2)) MB" -ForegroundColor Gray
    }

    # Step 6: Git operations
    Write-Host ""
    Write-Host "[6/6] Creating git commit and tag..." -ForegroundColor Yellow

    git add .
    git commit -m "Release v$Version"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "      No changes to commit (already committed)" -ForegroundColor Gray
    } else {
        Write-Host "      Created commit: Release v$Version" -ForegroundColor Green
    }

    git tag -a "v$Version" -m "Release v$Version"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to create git tag"
    }
    Write-Host "      Created tag: v$Version" -ForegroundColor Green

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  Release v$Version prepared!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Review the changes: git log -1" -ForegroundColor White
    Write-Host "  2. Push to remote: git push && git push --tags" -ForegroundColor White
    Write-Host "  3. GitHub Actions will create the release" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "ERROR: $_" -ForegroundColor Red
    exit 1
} finally {
    Set-Location $originalLocation
}
