use serde::Serialize;
use tauri::Emitter;
use tauri_plugin_updater::UpdaterExt;

#[derive(Clone, Serialize)]
pub struct UpdateInfo {
    pub version: String,
    pub body: Option<String>,
    pub date: Option<String>,
}

#[tauri::command]
pub async fn check_for_updates(app: tauri::AppHandle) -> Result<Option<UpdateInfo>, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;

    match updater.check().await {
        Ok(Some(update)) => {
            Ok(Some(UpdateInfo {
                version: update.version.clone(),
                body: update.body.clone(),
                date: update.date.map(|d| d.to_string()),
            }))
        }
        Ok(None) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub async fn install_update(app: tauri::AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;

    let update = match updater.check().await {
        Ok(Some(update)) => update,
        Ok(None) => return Err("No update available".to_string()),
        Err(e) => return Err(e.to_string()),
    };

    // Emit progress events
    let handle = app.clone();

    update
        .download_and_install(
            |progress, total| {
                let _ = handle.emit("update-download-progress", serde_json::json!({
                    "downloaded": progress,
                    "total": total
                }));
            },
            || {
                println!("Download finished, preparing to install...");
            },
        )
        .await
        .map_err(|e| e.to_string())?;

    // Restart the app to apply the update
    app.restart();
}

#[tauri::command]
pub fn get_current_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Check for updates on app startup (called from setup)
pub fn setup_auto_update_check(app: &tauri::App) {
    let handle = app.handle().clone();

    tauri::async_runtime::spawn(async move {
        // Wait a bit before checking for updates
        tokio::time::sleep(std::time::Duration::from_secs(5)).await;

        let updater = match handle.updater() {
            Ok(u) => u,
            Err(e) => {
                eprintln!("Failed to get updater: {}", e);
                return;
            }
        };

        match updater.check().await {
            Ok(Some(update)) => {
                println!("Update available: v{}", update.version);

                let _ = handle.emit("update-available", UpdateInfo {
                    version: update.version.clone(),
                    body: update.body.clone(),
                    date: update.date.map(|d| d.to_string()),
                });
            }
            Ok(None) => {
                println!("App is up to date");
            }
            Err(e) => {
                eprintln!("Update check failed: {}", e);
            }
        }
    });
}
