// Type declarations for Three.js ecosystem

// Extend JSX.IntrinsicElements for React Three Fiber components
import { Object3DNode, MaterialNode, LightNode } from '@react-three/fiber';
import * as THREE from 'three';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Lights
      ambientLight: LightNode<THREE.AmbientLight, typeof THREE.AmbientLight>;
      directionalLight: LightNode<THREE.DirectionalLight, typeof THREE.DirectionalLight>;
      pointLight: LightNode<THREE.PointLight, typeof THREE.PointLight>;
      spotLight: LightNode<THREE.SpotLight, typeof THREE.SpotLight>;
      hemisphereLight: LightNode<THREE.HemisphereLight, typeof THREE.HemisphereLight>;

      // Objects
      mesh: Object3DNode<THREE.Mesh, typeof THREE.Mesh>;
      group: Object3DNode<THREE.Group, typeof THREE.Group>;
      primitive: { object: THREE.Object3D } & Record<string, unknown>;

      // Geometries
      boxGeometry: Object3DNode<THREE.BoxGeometry, typeof THREE.BoxGeometry>;
      sphereGeometry: Object3DNode<THREE.SphereGeometry, typeof THREE.SphereGeometry>;
      planeGeometry: Object3DNode<THREE.PlaneGeometry, typeof THREE.PlaneGeometry>;

      // Materials
      meshStandardMaterial: MaterialNode<THREE.MeshStandardMaterial, typeof THREE.MeshStandardMaterial>;
      meshPhysicalMaterial: MaterialNode<THREE.MeshPhysicalMaterial, typeof THREE.MeshPhysicalMaterial>;
      meshBasicMaterial: MaterialNode<THREE.MeshBasicMaterial, typeof THREE.MeshBasicMaterial>;
    }
  }
}

export {};
