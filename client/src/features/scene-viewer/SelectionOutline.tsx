import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '@/stores/sceneStore';

export function SelectionOutline() {
  const { scene } = useThree();
  const outlineRef = useRef<THREE.LineSegments | null>(null);
  const { selectedObjectName, sceneData } = useSceneStore();

  useEffect(() => {
    // Cleanup old outline
    if (outlineRef.current) {
      scene.remove(outlineRef.current);
      outlineRef.current.geometry.dispose();
      (outlineRef.current.material as THREE.Material).dispose();
      outlineRef.current = null;
    }

    // Create new outline for selected object
    if (selectedObjectName && sceneData) {
      const mesh = sceneData.meshes.get(selectedObjectName);
      if (mesh) {
        const edges = new THREE.EdgesGeometry(mesh.geometry, 30);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 })
        );

        // Match transform
        line.position.copy(mesh.getWorldPosition(new THREE.Vector3()));
        line.quaternion.copy(mesh.getWorldQuaternion(new THREE.Quaternion()));
        line.scale.copy(mesh.getWorldScale(new THREE.Vector3()));

        scene.add(line);
        outlineRef.current = line;
      }
    }

    return () => {
      if (outlineRef.current) {
        scene.remove(outlineRef.current);
        outlineRef.current.geometry.dispose();
        (outlineRef.current.material as THREE.Material).dispose();
      }
    };
  }, [selectedObjectName, sceneData, scene]);

  // Update outline position each frame (in case object moves)
  useFrame(() => {
    if (outlineRef.current && selectedObjectName && sceneData) {
      const mesh = sceneData.meshes.get(selectedObjectName);
      if (mesh) {
        outlineRef.current.position.copy(mesh.getWorldPosition(new THREE.Vector3()));
        outlineRef.current.quaternion.copy(mesh.getWorldQuaternion(new THREE.Quaternion()));
        outlineRef.current.scale.copy(mesh.getWorldScale(new THREE.Vector3()));
      }
    }
  });

  return null;
}
