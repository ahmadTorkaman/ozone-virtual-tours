import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getAssetUrl } from '@/lib/tauri-file';

const THUMB_SIZE = 512;

let renderer: THREE.WebGLRenderer | null = null;

function getRenderer(): THREE.WebGLRenderer {
  if (!renderer) {
    const canvas = document.createElement('canvas');
    canvas.width = THUMB_SIZE;
    canvas.height = THUMB_SIZE;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(THUMB_SIZE, THUMB_SIZE);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
  }
  return renderer;
}

/**
 * Capture a thumbnail of a GLB scene by loading it offscreen.
 * @param glbFilePath Absolute local file path to the GLB file
 * @returns Base64 data URL (image/webp)
 */
export async function captureSceneThumbnail(glbFilePath: string): Promise<string> {
  const r = getRenderer();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(5, 10, 7);
  scene.add(dirLight);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

  // Load GLB
  const loader = new GLTFLoader();
  const url = getAssetUrl(glbFilePath);

  const gltf = await new Promise<{ scene: THREE.Group }>((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });

  scene.add(gltf.scene);

  // Fit camera to scene bounds
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  const distance = maxDim * 1.5;

  camera.position.set(
    center.x + distance * 0.6,
    center.y + distance * 0.4,
    center.z + distance * 0.6,
  );
  camera.lookAt(center);
  camera.updateProjectionMatrix();

  r.render(scene, camera);
  const dataUrl = r.domElement.toDataURL('image/webp', 0.85);

  // Dispose loaded scene objects
  gltf.scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material?.dispose();
      }
    }
  });
  scene.clear();

  return dataUrl;
}

/**
 * Capture a thumbnail of a 360 panorama image.
 * @param imageFilePath Absolute local file path to the panorama image
 * @returns Base64 data URL (image/webp)
 */
export async function capturePanoramaThumbnail(imageFilePath: string): Promise<string> {
  const r = getRenderer();
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
  camera.position.set(0, 0, 0);
  camera.lookAt(0, 0, -1);

  // Load equirectangular texture
  const url = getAssetUrl(imageFilePath);
  const textureLoader = new THREE.TextureLoader();

  const texture = await new Promise<THREE.Texture>((resolve, reject) => {
    textureLoader.load(url, resolve, undefined, reject);
  });

  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.SphereGeometry(50, 60, 40);
  geometry.scale(-1, 1, 1);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);

  r.render(scene, camera);
  const dataUrl = r.domElement.toDataURL('image/webp', 0.85);

  // Cleanup
  texture.dispose();
  geometry.dispose();
  material.dispose();
  scene.clear();

  return dataUrl;
}

/**
 * Dispose the shared capture renderer.
 * Call when the publish flow is complete.
 */
export function disposeCaptureRenderer(): void {
  if (renderer) {
    renderer.dispose();
    renderer = null;
  }
}
