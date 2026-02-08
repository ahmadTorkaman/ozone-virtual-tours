import * as THREE from 'three';
import { getAssetUrl } from '@/lib/tauri-file';

export interface PhysicalMaterialParams {
  color?: string;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  transparent?: boolean;

  // Clearcoat
  clearcoat?: number;
  clearcoatRoughness?: number;

  // Sheen
  sheen?: number;
  sheenRoughness?: number;
  sheenColor?: string;

  // Transmission
  transmission?: number;
  thickness?: number;
  ior?: number;

  // Iridescence
  iridescence?: number;
  iridescenceIOR?: number;

  // Anisotropy
  anisotropy?: number;
  anisotropyRotation?: number;

  // Texture file paths (local paths, will be converted to asset URLs)
  mapPath?: string;
  normalMapPath?: string;
  roughnessMapPath?: string;
  metalnessMapPath?: string;
  aoMapPath?: string;
  emissiveMapPath?: string;
}

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();

/**
 * Load a texture from a local file path.
 * @param filePath - Local file path (will be converted to asset:// URL)
 */
async function loadTexture(filePath: string): Promise<THREE.Texture> {
  const assetUrl = getAssetUrl(filePath);

  if (textureCache.has(assetUrl)) {
    return textureCache.get(assetUrl)!;
  }

  return new Promise((resolve, reject) => {
    textureLoader.load(
      assetUrl,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        textureCache.set(assetUrl, texture);
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

export async function createPhysicalMaterial(
  params: PhysicalMaterialParams
): Promise<THREE.MeshPhysicalMaterial> {
  const material = new THREE.MeshPhysicalMaterial({
    color: params.color ? new THREE.Color(params.color) : undefined,
    metalness: params.metalness ?? 0,
    roughness: params.roughness ?? 1,
    opacity: params.opacity ?? 1,
    transparent: params.transparent ?? false,

    clearcoat: params.clearcoat ?? 0,
    clearcoatRoughness: params.clearcoatRoughness ?? 0,

    sheen: params.sheen ?? 0,
    sheenRoughness: params.sheenRoughness ?? 1,
    sheenColor: params.sheenColor ? new THREE.Color(params.sheenColor) : undefined,

    transmission: params.transmission ?? 0,
    thickness: params.thickness ?? 0,
    ior: params.ior ?? 1.5,

    iridescence: params.iridescence ?? 0,
    iridescenceIOR: params.iridescenceIOR ?? 1.3,

    anisotropy: params.anisotropy ?? 0,
    anisotropyRotation: params.anisotropyRotation ?? 0,
  });

  // Load textures in parallel
  const texturePromises: Promise<void>[] = [];

  if (params.mapPath) {
    texturePromises.push(
      loadTexture(params.mapPath).then((t) => {
        material.map = t;
      })
    );
  }

  if (params.normalMapPath) {
    texturePromises.push(
      loadTexture(params.normalMapPath).then((t) => {
        t.colorSpace = THREE.NoColorSpace;
        material.normalMap = t;
      })
    );
  }

  if (params.roughnessMapPath) {
    texturePromises.push(
      loadTexture(params.roughnessMapPath).then((t) => {
        t.colorSpace = THREE.NoColorSpace;
        material.roughnessMap = t;
      })
    );
  }

  if (params.metalnessMapPath) {
    texturePromises.push(
      loadTexture(params.metalnessMapPath).then((t) => {
        t.colorSpace = THREE.NoColorSpace;
        material.metalnessMap = t;
      })
    );
  }

  if (params.aoMapPath) {
    texturePromises.push(
      loadTexture(params.aoMapPath).then((t) => {
        t.colorSpace = THREE.NoColorSpace;
        material.aoMap = t;
      })
    );
  }

  if (params.emissiveMapPath) {
    texturePromises.push(
      loadTexture(params.emissiveMapPath).then((t) => {
        material.emissiveMap = t;
        material.emissive = new THREE.Color(0xffffff);
      })
    );
  }

  await Promise.all(texturePromises);
  material.needsUpdate = true;

  return material;
}

export function applyMaterialToMesh(
  mesh: THREE.Mesh,
  material: THREE.Material
): THREE.Material | null {
  const oldMaterial = mesh.material as THREE.Material;
  mesh.material = material;
  return oldMaterial;
}

export function clearTextureCache(): void {
  textureCache.forEach((texture) => texture.dispose());
  textureCache.clear();
}
