// Material TypeScript types for Phase 4

export interface Material {
  id: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  thumbnailPath: string | null;

  // Core PBR
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;

  // Clearcoat
  clearcoat: number;
  clearcoatRoughness: number;

  // Sheen
  sheen: number;
  sheenRoughness: number;
  sheenColor: string;

  // Transmission (glass)
  transmission: number;
  thickness: number;
  ior: number;

  // Iridescence
  iridescence: number;
  iridescenceIor: number;

  // Anisotropy (brushed metal)
  anisotropy: number;
  anisotropyRotation: number;

  // Texture paths (relative to materials directory)
  mapPath: string | null;
  normalMapPath: string | null;
  roughnessMapPath: string | null;
  metalnessMapPath: string | null;
  aoMapPath: string | null;
  emissiveMapPath: string | null;

  // Meta
  createdAt: string;
  updatedAt: string;
  cloudId: string | null;
  isSynced: boolean;
}

export interface MaterialProperties {
  type: string;
  color?: string;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;
  clearcoat: number;
  clearcoat_roughness: number;
  sheen: number;
  sheen_roughness: number;
  sheen_color?: string;
  transmission: number;
  thickness: number;
  ior: number;
  iridescence: number;
  iridescence_ior: number;
  anisotropy: number;
  anisotropy_rotation: number;
  map_path?: string;
  normal_map_path?: string;
  roughness_map_path?: string;
  metalness_map_path?: string;
  ao_map_path?: string;
  emissive_map_path?: string;
}

export interface CreateMaterialInput {
  name: string;
  description?: string;
  categoryId?: string;
  properties: MaterialProperties;
}

export interface UpdateMaterialInput {
  name?: string;
  description?: string;
  categoryId?: string;
  properties?: MaterialProperties;
}

export interface MaterialCategory {
  id: string;
  name: string;
  sortOrder: number;
}

export interface MaterialMapping {
  id: string;
  sceneId: string;
  materialId: string;
  objectName: string;
  createdAt: string;
}

// Default material properties for new materials
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
  sheen_color: '#ffffff',
  transmission: 0,
  thickness: 0,
  ior: 1.5,
  iridescence: 0,
  iridescence_ior: 1.3,
  anisotropy: 0,
  anisotropy_rotation: 0,
};

// Convert backend Material to frontend Material with parsed properties
export function parseMaterial(rawMaterial: {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  thumbnail_path: string | null;
  properties: string;
  created_at: string;
  updated_at: string;
  cloud_id: string | null;
  is_synced: boolean;
}): Material {
  const props: MaterialProperties = JSON.parse(rawMaterial.properties);

  return {
    id: rawMaterial.id,
    name: rawMaterial.name,
    description: rawMaterial.description,
    categoryId: rawMaterial.category_id,
    thumbnailPath: rawMaterial.thumbnail_path,

    color: props.color || '#ffffff',
    metalness: props.metalness,
    roughness: props.roughness,
    opacity: props.opacity,
    transparent: props.transparent,
    clearcoat: props.clearcoat,
    clearcoatRoughness: props.clearcoat_roughness,
    sheen: props.sheen,
    sheenRoughness: props.sheen_roughness,
    sheenColor: props.sheen_color || '#ffffff',
    transmission: props.transmission,
    thickness: props.thickness,
    ior: props.ior,
    iridescence: props.iridescence,
    iridescenceIor: props.iridescence_ior,
    anisotropy: props.anisotropy,
    anisotropyRotation: props.anisotropy_rotation,
    mapPath: props.map_path || null,
    normalMapPath: props.normal_map_path || null,
    roughnessMapPath: props.roughness_map_path || null,
    metalnessMapPath: props.metalness_map_path || null,
    aoMapPath: props.ao_map_path || null,
    emissiveMapPath: props.emissive_map_path || null,

    createdAt: rawMaterial.created_at,
    updatedAt: rawMaterial.updated_at,
    cloudId: rawMaterial.cloud_id,
    isSynced: rawMaterial.is_synced,
  };
}

// Convert frontend Material to backend properties format
export function materialToProperties(material: Partial<Material>): MaterialProperties {
  return {
    type: 'PHYSICAL',
    color: material.color,
    metalness: material.metalness ?? 0,
    roughness: material.roughness ?? 1,
    opacity: material.opacity ?? 1,
    transparent: material.transparent ?? false,
    clearcoat: material.clearcoat ?? 0,
    clearcoat_roughness: material.clearcoatRoughness ?? 0,
    sheen: material.sheen ?? 0,
    sheen_roughness: material.sheenRoughness ?? 1,
    sheen_color: material.sheenColor,
    transmission: material.transmission ?? 0,
    thickness: material.thickness ?? 0,
    ior: material.ior ?? 1.5,
    iridescence: material.iridescence ?? 0,
    iridescence_ior: material.iridescenceIor ?? 1.3,
    anisotropy: material.anisotropy ?? 0,
    anisotropy_rotation: material.anisotropyRotation ?? 0,
    map_path: material.mapPath || undefined,
    normal_map_path: material.normalMapPath || undefined,
    roughness_map_path: material.roughnessMapPath || undefined,
    metalness_map_path: material.metalnessMapPath || undefined,
    ao_map_path: material.aoMapPath || undefined,
    emissive_map_path: material.emissiveMapPath || undefined,
  };
}

// Get default values for a new material (frontend format)
export function getDefaultMaterial(): Partial<Material> {
  return {
    name: 'New Material',
    description: null,
    categoryId: null,
    color: '#ffffff',
    metalness: 0,
    roughness: 1,
    opacity: 1,
    transparent: false,
    clearcoat: 0,
    clearcoatRoughness: 0,
    sheen: 0,
    sheenRoughness: 1,
    sheenColor: '#ffffff',
    transmission: 0,
    thickness: 0,
    ior: 1.5,
    iridescence: 0,
    iridescenceIor: 1.3,
    anisotropy: 0,
    anisotropyRotation: 0,
    mapPath: null,
    normalMapPath: null,
    roughnessMapPath: null,
    metalnessMapPath: null,
    aoMapPath: null,
    emissiveMapPath: null,
  };
}
