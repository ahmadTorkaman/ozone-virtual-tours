import { convertFileSrc } from '@tauri-apps/api/core';

/**
 * Convert a local file path to a URL that can be used in the WebView.
 * Tauri uses the `asset://` protocol to serve local files securely.
 */
export function getAssetUrl(filePath: string): string {
  // convertFileSrc handles the platform-specific path conversion
  return convertFileSrc(filePath);
}

/**
 * Get the full path to a file in the app's data directory.
 * Combines with the base data path from settings.
 */
export function getProjectFilePath(
  dataPath: string,
  projectId: string,
  fileName: string
): string {
  // Windows uses backslashes, but we normalize to forward slashes
  return `${dataPath}/projects/${projectId}/${fileName}`.replace(/\\/g, '/');
}

/**
 * Get asset URL for a scene's GLB file.
 */
export function getSceneGlbUrl(dataPath: string, projectId: string, glbFileName: string): string {
  const filePath = getProjectFilePath(dataPath, projectId, glbFileName);
  return getAssetUrl(filePath);
}

/**
 * Get asset URL for a texture file.
 */
export function getTextureUrl(dataPath: string, projectId: string, texturePath: string): string {
  const filePath = getProjectFilePath(dataPath, projectId, texturePath);
  return getAssetUrl(filePath);
}
