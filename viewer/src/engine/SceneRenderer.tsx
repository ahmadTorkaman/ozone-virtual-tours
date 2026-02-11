import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import type { ConfigurableComponent } from '@/types/manifest';

const DRACO_CDN = 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';

export interface SceneRendererHandle {
  getComponentMeshes: (componentId: string) => THREE.Mesh[];
  getMeshComponentId: (mesh: THREE.Mesh) => string | undefined;
  getModel: () => THREE.Group | null;
}

interface SceneRendererProps {
  glbUrl: string;
  components: ConfigurableComponent[];
  onProgress: (progress: number) => void;
  onLoaded: () => void;
  onError: (error: string) => void;
}

// Singleton DRACO loader
let dracoLoader: DRACOLoader | null = null;
function getDracoLoader(): DRACOLoader {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DRACO_CDN);
    dracoLoader.setDecoderConfig({ type: 'js' });
  }
  return dracoLoader;
}

export const SceneRenderer = forwardRef<SceneRendererHandle, SceneRendererProps>(
  function SceneRenderer({ glbUrl, components, onProgress, onLoaded, onError }, ref) {
    const { scene: threeScene, camera } = useThree();
    const modelRef = useRef<THREE.Group | null>(null);
    const componentMeshMapRef = useRef<Map<string, THREE.Mesh[]>>(new Map());
    const meshToComponentRef = useRef<Map<THREE.Mesh, string>>(new Map());

    useImperativeHandle(ref, () => ({
      getComponentMeshes: (componentId: string) =>
        componentMeshMapRef.current.get(componentId) || [],
      getMeshComponentId: (mesh: THREE.Mesh) =>
        meshToComponentRef.current.get(mesh),
      getModel: () => modelRef.current,
    }));

    useEffect(() => {
      const loader = new GLTFLoader();
      loader.setDRACOLoader(getDracoLoader());

      loader.load(
        glbUrl,
        (gltf) => {
          // Clean up previous model
          if (modelRef.current) {
            threeScene.remove(modelRef.current);
          }

          const model = gltf.scene;
          modelRef.current = model;

          // Enable shadows
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          // Build component-mesh mappings
          componentMeshMapRef.current.clear();
          meshToComponentRef.current.clear();

          for (const comp of components) {
            const meshes: THREE.Mesh[] = [];
            model.traverse((child) => {
              if (child instanceof THREE.Mesh && comp.mesh_names.includes(child.name)) {
                meshes.push(child);
                meshToComponentRef.current.set(child, comp.id);
              }
            });
            componentMeshMapRef.current.set(comp.id, meshes);
          }

          // Auto-fit camera
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
          const dist = (maxDim / (2 * Math.tan(fov / 2))) * 1.5;

          camera.position.set(
            center.x + dist * 0.5,
            center.y + dist * 0.3,
            center.z + dist
          );
          camera.lookAt(center);

          threeScene.add(model);
          onLoaded();
        },
        (event) => {
          if (event.total > 0) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
        () => {
          onError('Failed to load 3D scene');
        }
      );

      return () => {
        if (modelRef.current) {
          threeScene.remove(modelRef.current);
          modelRef.current.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry?.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material?.dispose();
              }
            }
          });
          modelRef.current = null;
        }
      };
    }, [glbUrl]);

    return (
      <>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={100}
          shadow-camera-near={0.1}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        <hemisphereLight args={['#fff', '#444', 0.6]} />

        {/* IBL environment for reflections */}
        <Environment preset="apartment" />

        {/* Orbit controls */}
        <OrbitControls
          enablePan
          enableDamping
          dampingFactor={0.1}
          touches={{
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN,
          }}
        />
      </>
    );
  }
);
