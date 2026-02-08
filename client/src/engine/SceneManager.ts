import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export interface LoadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface SceneData {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  meshes: Map<string, THREE.Mesh>;
  materials: Map<string, THREE.Material>;
}

// Singleton DRACO loader
let dracoLoader: DRACOLoader | null = null;

function getDracoLoader(): DRACOLoader {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader();
    // Use CDN-hosted DRACO decoders for reliability
    // Alternative: copy decoders to public/draco/ and use '/draco/'
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });
  }
  return dracoLoader;
}

/**
 * Load a GLB file from a local asset URL (converted via Tauri's convertFileSrc).
 * @param assetUrl - The asset:// URL from getAssetUrl()
 * @param onProgress - Optional progress callback
 */
export async function loadGLB(
  assetUrl: string,
  onProgress?: (progress: LoadProgress) => void
): Promise<SceneData> {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(getDracoLoader());

  return new Promise((resolve, reject) => {
    loader.load(
      assetUrl,
      (gltf: GLTF) => {
        const meshes = new Map<string, THREE.Mesh>();
        const materials = new Map<string, THREE.Material>();

        // Traverse and catalog all meshes and materials
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Store mesh by name (or generate name if unnamed)
            const name = child.name || `mesh_${meshes.size}`;
            meshes.set(name, child);

            // Store original material
            if (child.material) {
              const mat = child.material as THREE.Material;
              if (!materials.has(mat.name)) {
                materials.set(mat.name || `material_${materials.size}`, mat);
              }
            }

            // Enable shadows
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        resolve({
          scene: gltf.scene,
          animations: gltf.animations,
          meshes,
          materials,
        });
      },
      (event) => {
        if (onProgress && event.total > 0) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percent: Math.round((event.loaded / event.total) * 100),
          });
        }
      },
      (error) => {
        reject(new Error(`Failed to load GLB: ${error}`));
      }
    );
  });
}

export function disposeScene(sceneData: SceneData): void {
  sceneData.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry?.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material?.dispose();
      }
    }
  });

  sceneData.meshes.clear();
  sceneData.materials.clear();
}

/**
 * Get a list of all mesh names in the scene.
 * Useful for building the object hierarchy panel.
 */
export function getMeshList(sceneData: SceneData): string[] {
  return Array.from(sceneData.meshes.keys());
}

/**
 * Find a mesh by name in the scene data.
 */
export function getMeshByName(sceneData: SceneData, name: string): THREE.Mesh | undefined {
  return sceneData.meshes.get(name);
}
