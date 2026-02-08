import { invoke } from '@tauri-apps/api/core';

// ============================================
// PROJECT TYPES & COMMANDS
// ============================================

/** A project containing scenes and panoramas */
export interface Project {
  id: string;
  name: string;
  description: string | null;
  thumbnail_path: string | null;
  folder_path: string;
  created_at: string;
  updated_at: string;
  cloud_id: string | null;
  last_synced_at: string | null;
  sync_enabled: boolean;
}

/** Input for creating a new project */
export interface CreateProjectInput {
  name: string;
  description?: string;
}

/** Input for updating an existing project */
export interface UpdateProjectInput {
  name: string;
  description?: string;
}

/**
 * List all projects in the database.
 * @returns Array of all projects, sorted by updated_at descending
 * @throws {TauriError} DATABASE_ERROR if query fails
 */
export const listProjects = () => invoke<Project[]>('list_projects');

/**
 * Get a project by its ID.
 * @param id - The project UUID
 * @returns The project if found, null otherwise
 * @throws {TauriError} DATABASE_ERROR if query fails
 */
export const getProject = (id: string) => invoke<Project | null>('get_project', { id });

/**
 * Create a new project with the given name.
 * Creates the project directory structure automatically.
 * @param input - Project name and optional description
 * @returns The created project
 * @throws {TauriError} VALIDATION_ERROR if name is empty
 * @throws {TauriError} IO_ERROR if directory creation fails
 */
export const createProject = (input: CreateProjectInput) => invoke<Project>('create_project', { input });

/**
 * Update an existing project's name and/or description.
 * @param id - The project UUID
 * @param input - New name and optional description
 * @throws {TauriError} VALIDATION_ERROR if name is empty
 * @throws {TauriError} DATABASE_ERROR if project not found
 */
export const updateProject = (id: string, input: UpdateProjectInput) => invoke<void>('update_project', { id, input });

/**
 * Delete a project and all its files (scenes, panoramas).
 * This operation is irreversible.
 * @param id - The project UUID
 * @throws {TauriError} IO_ERROR if file deletion fails
 */
export const deleteProject = (id: string) => invoke<void>('delete_project', { id });

// ============================================
// SCENE TYPES & COMMANDS
// ============================================

/** A 3D scene (GLB/glTF model) within a project */
export interface Scene {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  glb_path: string;
  glb_size: number;
  thumbnail_path: string | null;
  spawn_x: number;
  spawn_y: number;
  spawn_z: number;
  spawn_rot_y: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** Input for importing a new scene */
export interface CreateSceneInput {
  project_id: string;
  name: string;
  description?: string;
  source_path: string;
}

/** Input for updating scene metadata */
export interface UpdateSceneInput {
  name?: string;
  description?: string;
  spawn_x?: number;
  spawn_y?: number;
  spawn_z?: number;
  spawn_rot_y?: number;
}

/**
 * List all scenes in a project.
 * @param projectId - The project UUID
 * @returns Array of scenes sorted by sort_order
 */
export const listScenes = (projectId: string) => invoke<Scene[]>('list_scenes', { projectId });

/**
 * Get a scene by its ID.
 * @param id - The scene UUID
 * @returns The scene if found, null otherwise
 */
export const getScene = (id: string) => invoke<Scene | null>('get_scene', { id });

/**
 * Import a GLB/glTF file as a new scene.
 * The file is copied to the project's scenes directory.
 * @param input - Project ID, source file path, and scene name
 * @returns The created scene
 * @throws {TauriError} NOT_FOUND if source file doesn't exist
 * @throws {TauriError} IO_ERROR if file copy fails
 */
export const importScene = (input: CreateSceneInput) => invoke<Scene>('import_scene', { input });

/**
 * Update a scene's metadata or spawn position.
 * @param id - The scene UUID
 * @param input - Fields to update
 */
export const updateScene = (id: string, input: UpdateSceneInput) => invoke<void>('update_scene', { id, input });

/**
 * Delete a scene and its GLB file.
 * @param id - The scene UUID
 */
export const deleteScene = (id: string) => invoke<void>('delete_scene', { id });

/**
 * Reorder scenes within a project.
 * @param sceneIds - Scene IDs in the new order
 */
export const reorderScenes = (sceneIds: string[]) => invoke<void>('reorder_scenes', { sceneIds });

/**
 * Get the absolute file path to a scene's GLB file.
 * Use this for loading the model in Three.js.
 * @param id - The scene UUID
 * @returns Absolute path to the GLB file
 */
export const getSceneFilePath = (id: string) => invoke<string>('get_scene_file_path', { id });

// ============================================
// MATERIAL TYPES & COMMANDS
// ============================================

/** A PBR material in the material library */
export interface Material {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  thumbnail_path: string | null;
  /** JSON string of MaterialProperties - use parseMaterialProperties() */
  properties: string;
  created_at: string;
  updated_at: string;
  cloud_id: string | null;
  is_synced: boolean;
}

/** A category for organizing materials */
export interface MaterialCategory {
  id: string;
  name: string;
  sort_order: number;
}

/**
 * PBR material properties for Three.js MeshPhysicalMaterial.
 * @see https://threejs.org/docs/#api/en/materials/MeshPhysicalMaterial
 */
export interface MaterialProperties {
  type: string;
  /** Base color in hex format (e.g., "#ffffff") */
  color?: string;
  /** 0 = dielectric, 1 = metal */
  metalness: number;
  /** 0 = smooth, 1 = rough */
  roughness: number;
  /** 0 = opaque, 1 = fully transparent */
  opacity: number;
  transparent: boolean;
  /** Clearcoat layer intensity */
  clearcoat: number;
  clearcoat_roughness: number;
  sheen: number;
  sheen_roughness: number;
  sheen_color?: string;
  /** 0 = solid, 1 = fully transmissive (glass) */
  transmission: number;
  thickness: number;
  /** Index of refraction (1.5 for glass) */
  ior: number;
  iridescence: number;
  iridescence_ior: number;
  anisotropy: number;
  anisotropy_rotation: number;
  /** Albedo/diffuse texture path (relative) */
  map_path?: string;
  normal_map_path?: string;
  roughness_map_path?: string;
  metalness_map_path?: string;
  ao_map_path?: string;
  emissive_map_path?: string;
}

/** Input for creating a new material */
export interface CreateMaterialInput {
  name: string;
  description?: string;
  category_id?: string;
  properties: MaterialProperties;
}

/** Input for updating material properties */
export interface UpdateMaterialInput {
  name?: string;
  description?: string;
  category_id?: string;
  properties?: MaterialProperties;
}

/** Assignment of a material to a mesh object in a scene */
export interface MaterialMapping {
  id: string;
  scene_id: string;
  material_id: string;
  /** Name of the mesh object in the GLB file */
  object_name: string;
  created_at: string;
}

/** List all materials in the library */
export const listMaterials = () => invoke<Material[]>('list_materials');

/** List materials filtered by category */
export const listMaterialsByCategory = (categoryId?: string) => invoke<Material[]>('list_materials_by_category', { categoryId });

/** Get a material by ID */
export const getMaterial = (id: string) => invoke<Material | null>('get_material', { id });

/**
 * Create a new material with PBR properties.
 * @param input - Material name and properties
 * @returns The created material
 */
export const createMaterial = (input: CreateMaterialInput) => invoke<Material>('create_material', { input });

/** Update a material's properties */
export const updateMaterial = (id: string, input: UpdateMaterialInput) => invoke<void>('update_material', { id, input });

/** Delete a material from the library */
export const deleteMaterial = (id: string) => invoke<void>('delete_material', { id });

/** List all material categories */
export const listMaterialCategories = () => invoke<MaterialCategory[]>('list_material_categories');

/** Create a new material category */
export const createMaterialCategory = (name: string) => invoke<MaterialCategory>('create_material_category', { name });

/** Delete a material category */
export const deleteMaterialCategory = (id: string) => invoke<void>('delete_material_category', { id });

/**
 * Get all material assignments for a scene.
 * Use this to restore materials when loading a scene.
 */
export const getSceneMaterialMappings = (sceneId: string) => invoke<MaterialMapping[]>('get_scene_material_mappings', { sceneId });

/**
 * Assign a material to a mesh object in a scene.
 * Creates or updates the mapping.
 * @param sceneId - The scene UUID
 * @param materialId - The material UUID
 * @param objectName - Name of the mesh in the GLB file
 */
export const setMaterialMapping = (sceneId: string, materialId: string, objectName: string) =>
  invoke<MaterialMapping>('set_material_mapping', { sceneId, materialId, objectName });

/** Remove a material assignment from an object */
export const removeMaterialMapping = (sceneId: string, objectName: string) =>
  invoke<void>('remove_material_mapping', { sceneId, objectName });

/**
 * Upload a texture file for a material.
 * @param materialId - The material UUID
 * @param textureType - Type: 'albedo' | 'normal' | 'roughness' | 'metalness' | 'ao' | 'emissive'
 * @param sourcePath - Absolute path to the texture file
 * @returns Relative path to the uploaded texture
 */
export const uploadMaterialTexture = (materialId: string, textureType: string, sourcePath: string) =>
  invoke<string>('upload_material_texture', { materialId, textureType, sourcePath });

/**
 * Parse material properties from the JSON string stored in the database.
 * @param material - Material with properties as JSON string
 * @returns Parsed MaterialProperties object
 */
export const parseMaterialProperties = (material: Material): MaterialProperties => {
  return JSON.parse(material.properties);
};

// Default material properties
export const defaultMaterialProperties: MaterialProperties = {
  type: 'PHYSICAL',
  color: '#ffffff',
  metalness: 0,
  roughness: 1,
  opacity: 1,
  transparent: false,
  clearcoat: 0,
  clearcoat_roughness: 0,
  sheen: 0,
  sheen_roughness: 1,
  transmission: 0,
  thickness: 0,
  ior: 1.5,
  iridescence: 0,
  iridescence_ior: 1.3,
  anisotropy: 0,
  anisotropy_rotation: 0,
};

// ============================================
// PANORAMA TYPES & COMMANDS
// ============================================

export interface Panorama {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  image_path: string;
  thumbnail_path: string | null;
  initial_yaw: number;
  initial_pitch: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePanoramaInput {
  project_id: string;
  name: string;
  description?: string;
  source_path: string;
  initial_yaw?: number;
  initial_pitch?: number;
}

export interface UpdatePanoramaInput {
  name?: string;
  description?: string;
  initial_yaw?: number;
  initial_pitch?: number;
}

export interface Hotspot {
  id: string;
  panorama_id: string;
  hotspot_type: string;
  yaw: number;
  pitch: number;
  target_panorama_id: string | null;
  content: string | null;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface HotspotContent {
  title?: string;
  description?: string;
  url?: string;
  media_url?: string;
  media_type?: string;
}

export interface CreateHotspotInput {
  panorama_id: string;
  hotspot_type: string;
  yaw: number;
  pitch: number;
  target_panorama_id?: string;
  content?: HotspotContent;
  icon?: string;
  color?: string;
}

export const listPanoramas = (projectId: string) => invoke<Panorama[]>('list_panoramas', { projectId });
export const getPanorama = (id: string) => invoke<Panorama | null>('get_panorama', { id });
export const importPanorama = (input: CreatePanoramaInput) => invoke<Panorama>('import_panorama', { input });
export const updatePanorama = (id: string, input: UpdatePanoramaInput) => invoke<void>('update_panorama', { id, input });
export const deletePanorama = (id: string) => invoke<void>('delete_panorama', { id });
export const reorderPanoramas = (panoramaIds: string[]) => invoke<void>('reorder_panoramas', { panoramaIds });
export const getPanoramaFilePath = (id: string) => invoke<string>('get_panorama_file_path', { id });

export const listHotspots = (panoramaId: string) => invoke<Hotspot[]>('list_hotspots', { panoramaId });
export const createHotspot = (input: CreateHotspotInput) => invoke<Hotspot>('create_hotspot', { input });
export const updateHotspot = (
  id: string,
  yaw?: number,
  pitch?: number,
  targetPanoramaId?: string,
  content?: string
) => invoke<void>('update_hotspot', { id, yaw, pitch, targetPanoramaId, content });
export const deleteHotspot = (id: string) => invoke<void>('delete_hotspot', { id });

// Helper to parse hotspot content from JSON string
export const parseHotspotContent = (hotspot: Hotspot): HotspotContent | null => {
  if (!hotspot.content) return null;
  return JSON.parse(hotspot.content);
};

// ============================================
// FILE TYPES & COMMANDS
// ============================================

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
}

export const getAppDataPath = () => invoke<string>('get_app_data_path');
export const getDocumentsPath = () => invoke<string>('get_documents_path');
export const ensureDirectory = (path: string) => invoke<void>('ensure_directory', { path });
export const readFile = (path: string) => invoke<number[]>('read_file', { path });
export const writeFile = (path: string, contents: number[]) => invoke<void>('write_file', { path, contents });
export const copyFile = (source: string, destination: string) => invoke<void>('copy_file', { source, destination });
export const deleteFile = (path: string) => invoke<void>('delete_file', { path });
export const listDirectory = (path: string) => invoke<FileEntry[]>('list_directory', { path });

// ============================================
// SETTINGS COMMANDS
// ============================================

export interface AppSettings {
  data_path: string;
}

export const getSettings = () => invoke<AppSettings>('get_settings');
export const getSetting = (key: string) => invoke<string | null>('get_setting', { key });
export const setSetting = (key: string, value: string) => invoke<void>('set_setting', { key, value });
export const getAllSettings = () => invoke<{ key: string; value: string }[]>('get_all_settings');

// ============================================
// EXPORT/IMPORT COMMANDS
// ============================================

export const exportProject = (projectId: string, destination: string) =>
  invoke<string>('export_project', { projectId, destination });
export const importProject = (source: string) =>
  invoke<string>('import_project', { source });

// ============================================
// LICENSE TYPES & COMMANDS
// ============================================

export type LicenseTier = 'trial' | 'professional' | 'enterprise';

export interface License {
  key: string;
  email: string | null;
  tier: LicenseTier;
  seats: number;
  valid_until: number | null;
  features: string[];
  activated_at: number;
  machine_id: string;
}

export interface LicenseStatus {
  isActive: boolean;
  tier: LicenseTier;
  message: string;
  daysRemaining: number | null;
  maxProjects: number;
  maxScenesPerProject: number;
  canExport: boolean;
  canUseVr: boolean;
  hasCloudSync: boolean;
}

export const getLicense = () => invoke<License | null>('get_license');
export const getLicenseStatus = () => invoke<LicenseStatus>('get_license_status');
export const activateLicense = (key: string, email?: string) =>
  invoke<License>('activate_license', { key, email });
export const deactivateLicense = () => invoke<void>('deactivate_license');
export const checkFeature = (feature: string) => invoke<boolean>('check_feature', { feature });
export const getMachineId = () => invoke<string>('get_machine_id_cmd');
