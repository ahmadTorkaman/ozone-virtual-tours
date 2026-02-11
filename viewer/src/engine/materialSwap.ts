import * as THREE from 'three';
import type { MaterialOption } from '@/types/manifest';
import { resolveAssetUrl } from '@/services/assetLoader';

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, THREE.Texture>();

// Maps that should use sRGB color space (albedo/diffuse)
const SRGB_MAPS = new Set(['map', 'emissiveMap']);

async function loadTexture(url: string, isSRGB: boolean): Promise<THREE.Texture> {
  if (textureCache.has(url)) {
    return textureCache.get(url)!;
  }

  return new Promise((resolve, reject) => {
    textureLoader.load(
      url,
      (texture) => {
        texture.colorSpace = isSRGB ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        textureCache.set(url, texture);
        resolve(texture);
      },
      undefined,
      (err) => reject(err)
    );
  });
}

export async function loadMaterialFromManifest(
  materialOption: MaterialOption
): Promise<THREE.MeshPhysicalMaterial> {
  const material = new THREE.MeshPhysicalMaterial({
    metalness: 0,
    roughness: 1,
  });

  const promises: Promise<void>[] = [];

  for (const [mapKey, relativePath] of Object.entries(materialOption.maps)) {
    if (!relativePath) continue;

    const url = resolveAssetUrl(relativePath);
    const isSRGB = SRGB_MAPS.has(mapKey);

    promises.push(
      loadTexture(url, isSRGB)
        .then((texture) => {
          (material as any)[mapKey] = texture;
          if (mapKey === 'emissiveMap') {
            material.emissive = new THREE.Color(0xffffff);
          }
        })
        .catch(() => {
          // Graceful degradation: skip failed texture
          console.warn(`Failed to load texture: ${mapKey} from ${url}`);
        })
    );
  }

  await Promise.all(promises);
  material.needsUpdate = true;
  return material;
}

export function applyMaterialToMeshes(
  meshes: THREE.Mesh[],
  material: THREE.Material
): void {
  for (const mesh of meshes) {
    mesh.material = material;
    mesh.material.needsUpdate = true;
  }
}

export function clearTextureCache(): void {
  textureCache.forEach((texture) => texture.dispose());
  textureCache.clear();
}
