# Ozone Studio - API Reference

> Complete reference for all Tauri commands available in Ozone Studio.

## Overview

All commands are invoked from the frontend using `@tauri-apps/api/core`:

```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke<ReturnType>('command_name', { param1, param2 });
```

TypeScript wrappers are available in `client/src/services/tauri/index.ts`.

---

## Error Handling

All commands return `Result<T, String>` where errors are JSON-formatted:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Project name cannot be empty",
  "details": "name"
}
```

See `client/src/types/errors.ts` for error handling utilities.

---

## Projects

### `list_projects`

List all projects.

```typescript
const projects = await invoke<Project[]>('list_projects');
```

**Returns:** `Project[]`

---

### `get_project`

Get a project by ID.

```typescript
const project = await invoke<Project | null>('get_project', { id });
```

**Parameters:**
- `id: string` - Project UUID

**Returns:** `Project | null`

---

### `create_project`

Create a new project.

```typescript
const project = await invoke<Project>('create_project', { input });
```

**Parameters:**
- `input.name: string` - Project name (required)
- `input.description?: string` - Optional description

**Returns:** `Project`

**Errors:**
- `VALIDATION_ERROR` - Name is empty

---

### `update_project`

Update a project.

```typescript
await invoke('update_project', { id, input });
```

**Parameters:**
- `id: string` - Project UUID
- `input.name: string` - New name
- `input.description?: string` - New description

**Errors:**
- `VALIDATION_ERROR` - Name is empty
- `DATABASE_ERROR` - Project not found

---

### `delete_project`

Delete a project and all its files.

```typescript
await invoke('delete_project', { id });
```

**Parameters:**
- `id: string` - Project UUID

---

## Scenes

### `list_scenes`

List scenes for a project.

```typescript
const scenes = await invoke<Scene[]>('list_scenes', { projectId });
```

**Parameters:**
- `projectId: string` - Project UUID

**Returns:** `Scene[]` sorted by `sort_order`

---

### `get_scene`

Get a scene by ID.

```typescript
const scene = await invoke<Scene | null>('get_scene', { id });
```

---

### `import_scene`

Import a GLB/glTF file as a new scene.

```typescript
const scene = await invoke<Scene>('import_scene', {
  projectId,
  sourcePath,
  name  // optional
});
```

**Parameters:**
- `projectId: string` - Target project
- `sourcePath: string` - Absolute path to GLB file
- `name?: string` - Display name (defaults to filename)

**Returns:** `Scene`

**Errors:**
- `NOT_FOUND` - Source file doesn't exist
- `IO_ERROR` - Failed to copy file

---

### `update_scene`

Update scene metadata.

```typescript
await invoke('update_scene', { id, input });
```

**Parameters:**
- `id: string` - Scene UUID
- `input.name?: string` - New name
- `input.description?: string` - New description
- `input.spawnX/Y/Z?: number` - Spawn position
- `input.spawnRotY?: number` - Spawn rotation

---

### `delete_scene`

Delete a scene and its files.

```typescript
await invoke('delete_scene', { id });
```

---

### `reorder_scenes`

Reorder scenes within a project.

```typescript
await invoke('reorder_scenes', { projectId, sceneIds });
```

**Parameters:**
- `projectId: string` - Project UUID
- `sceneIds: string[]` - Scene IDs in new order

---

### `get_scene_file_path`

Get the absolute path to a scene's GLB file.

```typescript
const path = await invoke<string>('get_scene_file_path', { id });
```

---

## Materials

### `list_materials`

List all materials in the library.

```typescript
const materials = await invoke<Material[]>('list_materials');
```

---

### `list_materials_by_category`

List materials filtered by category.

```typescript
const materials = await invoke<Material[]>('list_materials_by_category', {
  categoryId
});
```

---

### `get_material`

Get a material by ID.

```typescript
const material = await invoke<Material | null>('get_material', { id });
```

---

### `create_material`

Create a new material.

```typescript
const material = await invoke<Material>('create_material', { input });
```

**Parameters:**
- `input.name: string` - Material name
- `input.description?: string`
- `input.categoryId?: string`
- `input.properties: MaterialProperties` - PBR properties

---

### `update_material`

Update a material.

```typescript
await invoke('update_material', { id, input });
```

---

### `delete_material`

Delete a material.

```typescript
await invoke('delete_material', { id });
```

---

### `list_material_categories`

List material categories.

```typescript
const categories = await invoke<MaterialCategory[]>('list_material_categories');
```

---

### `create_material_category`

Create a material category.

```typescript
const category = await invoke<MaterialCategory>('create_material_category', {
  name
});
```

---

### `get_scene_material_mappings`

Get material assignments for a scene.

```typescript
const mappings = await invoke<MaterialMapping[]>('get_scene_material_mappings', {
  sceneId
});
```

---

### `set_material_mapping`

Assign a material to an object in a scene.

```typescript
await invoke('set_material_mapping', {
  sceneId,
  materialId,
  objectName
});
```

---

### `remove_material_mapping`

Remove a material assignment.

```typescript
await invoke('remove_material_mapping', { mappingId });
```

---

### `upload_material_texture`

Upload a texture file for a material.

```typescript
const relativePath = await invoke<string>('upload_material_texture', {
  materialId,
  sourcePath,
  textureType  // 'albedo' | 'normal' | 'roughness' | etc.
});
```

---

## Panoramas

### `list_panoramas`

List panoramas for a project.

```typescript
const panoramas = await invoke<Panorama[]>('list_panoramas', { projectId });
```

---

### `get_panorama`

Get a panorama by ID.

```typescript
const panorama = await invoke<Panorama | null>('get_panorama', { id });
```

---

### `import_panorama`

Import an equirectangular image as a panorama.

```typescript
const panorama = await invoke<Panorama>('import_panorama', {
  projectId,
  sourcePath,
  name  // optional
});
```

---

### `update_panorama`

Update panorama metadata.

```typescript
await invoke('update_panorama', { id, input });
```

---

### `delete_panorama`

Delete a panorama and its files.

```typescript
await invoke('delete_panorama', { id });
```

---

### `get_panorama_file_path`

Get the absolute path to a panorama's image file.

```typescript
const path = await invoke<string>('get_panorama_file_path', { id });
```

---

## Hotspots

### `list_hotspots`

List hotspots for a panorama.

```typescript
const hotspots = await invoke<Hotspot[]>('list_hotspots', { panoramaId });
```

---

### `create_hotspot`

Create a hotspot on a panorama.

```typescript
const hotspot = await invoke<Hotspot>('create_hotspot', { input });
```

**Parameters:**
- `input.panoramaId: string`
- `input.type: 'NAVIGATION' | 'INFO' | 'MEDIA' | 'LINK'`
- `input.yaw: number` - Horizontal angle (degrees)
- `input.pitch: number` - Vertical angle (degrees)
- `input.targetPanoramaId?: string` - For navigation hotspots
- `input.content?: string` - Text or URL content
- `input.icon?: string`
- `input.color?: string`

---

### `update_hotspot`

Update a hotspot.

```typescript
await invoke('update_hotspot', { id, input });
```

---

### `delete_hotspot`

Delete a hotspot.

```typescript
await invoke('delete_hotspot', { id });
```

---

## License

### `get_license`

Get the current license.

```typescript
const license = await invoke<License | null>('get_license');
```

---

### `get_license_status`

Get computed license status.

```typescript
const status = await invoke<LicenseStatus>('get_license_status');
```

**Returns:**
```typescript
interface LicenseStatus {
  tier: 'trial' | 'professional' | 'enterprise';
  isActive: boolean;
  expiresAt: string | null;
  maxProjects: number;
  maxScenesPerProject: number;
  canExport: boolean;
  canUseVr: boolean;
  hasCloudSync: boolean;
  machineId: string;
}
```

---

### `activate_license`

Activate a license key.

```typescript
const license = await invoke<License>('activate_license', { key });
```

**Parameters:**
- `key: string` - License key (format: `XXXX-XXXX-XXXX-XXXX`)

**Errors:**
- `LICENSE_ERROR` - Invalid key format or validation failed

---

### `deactivate_license`

Deactivate the current license.

```typescript
await invoke('deactivate_license');
```

---

### `check_feature`

Check if a feature is available.

```typescript
const available = await invoke<boolean>('check_feature', { feature });
```

**Parameters:**
- `feature: string` - Feature name ('export', 'vr', 'cloud_sync')

---

## Updates

### `check_for_updates`

Check if an update is available.

```typescript
const update = await invoke<UpdateInfo | null>('check_for_updates');
```

**Returns:**
```typescript
interface UpdateInfo {
  version: string;
  body?: string;
  date?: string;
}
```

---

### `install_update`

Download and install an update. App will restart.

```typescript
await invoke('install_update');
```

**Events emitted:**
- `update-download-progress` - `{ downloaded: number, total: number | null }`

---

### `get_current_version`

Get the current app version.

```typescript
const version = await invoke<string>('get_current_version');
```

---

## Export/Import

### `export_project`

Export a project as a `.ozone` file.

```typescript
const exportPath = await invoke<string>('export_project', {
  projectId,
  outputPath
});
```

**Parameters:**
- `projectId: string` - Project to export
- `outputPath: string` - Destination path (without extension)

**Returns:** Full path to exported file

**Errors:**
- `FEATURE_NOT_AVAILABLE` - Export not available in trial

---

### `import_project`

Import a project from a `.ozone` file.

```typescript
const project = await invoke<Project>('import_project', { sourcePath });
```

**Parameters:**
- `sourcePath: string` - Path to `.ozone` file

---

## Settings

### `get_settings`

Get all settings.

```typescript
const settings = await invoke<Settings>('get_settings');
```

---

### `get_setting`

Get a single setting.

```typescript
const value = await invoke<string | null>('get_setting', { key });
```

---

### `set_setting`

Set a setting value.

```typescript
await invoke('set_setting', { key, value });
```

---

## Files

### `get_app_data_path`

Get the app data directory path.

```typescript
const path = await invoke<string>('get_app_data_path');
```

---

### `get_documents_path`

Get the user's Documents folder path.

```typescript
const path = await invoke<string>('get_documents_path');
```

---

### `ensure_directory`

Create a directory if it doesn't exist.

```typescript
await invoke('ensure_directory', { path });
```

---

### `read_file`

Read a file's contents.

```typescript
const contents = await invoke<string>('read_file', { path });
```

---

### `write_file`

Write contents to a file.

```typescript
await invoke('write_file', { path, contents });
```

---

### `copy_file`

Copy a file.

```typescript
await invoke('copy_file', { source, destination });
```

---

### `delete_file`

Delete a file.

```typescript
await invoke('delete_file', { path });
```

---

### `list_directory`

List files in a directory.

```typescript
const files = await invoke<string[]>('list_directory', { path });
```
