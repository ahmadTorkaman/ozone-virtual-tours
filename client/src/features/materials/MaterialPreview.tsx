import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Material } from '@/types/material';

interface MaterialPreviewProps {
  material: Partial<Material>;
  size?: number;
  shape?: 'sphere' | 'cube' | 'plane';
  rotate?: boolean;
}

export function MaterialPreview({
  material,
  size = 200,
  shape = 'sphere',
  rotate = true,
}: MaterialPreviewProps) {
  return (
    <div style={{ width: size, height: size }} className="bg-base rounded-lg overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <PreviewScene material={material} shape={shape} rotate={rotate} />
      </Canvas>
    </div>
  );
}

interface PreviewSceneProps {
  material: Partial<Material>;
  shape: 'sphere' | 'cube' | 'plane';
  rotate: boolean;
}

function PreviewScene({ material, shape, rotate }: PreviewSceneProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const threeMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: material.color ? new THREE.Color(material.color) : new THREE.Color('#ffffff'),
      metalness: material.metalness ?? 0,
      roughness: material.roughness ?? 1,
      opacity: material.opacity ?? 1,
      transparent: material.transparent ?? false,
      clearcoat: material.clearcoat ?? 0,
      clearcoatRoughness: material.clearcoatRoughness ?? 0,
      sheen: material.sheen ?? 0,
      sheenRoughness: material.sheenRoughness ?? 1,
      sheenColor: material.sheenColor ? new THREE.Color(material.sheenColor) : undefined,
      transmission: material.transmission ?? 0,
      thickness: material.thickness ?? 0,
      ior: material.ior ?? 1.5,
      iridescence: material.iridescence ?? 0,
      iridescenceIOR: material.iridescenceIor ?? 1.3,
      anisotropy: material.anisotropy ?? 0,
      anisotropyRotation: material.anisotropyRotation ?? 0,
    });
  }, [
    material.color,
    material.metalness,
    material.roughness,
    material.opacity,
    material.transparent,
    material.clearcoat,
    material.clearcoatRoughness,
    material.sheen,
    material.sheenRoughness,
    material.sheenColor,
    material.transmission,
    material.thickness,
    material.ior,
    material.iridescence,
    material.iridescenceIor,
    material.anisotropy,
    material.anisotropyRotation,
  ]);

  useFrame((_, delta) => {
    if (rotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  const geometry = useMemo(() => {
    switch (shape) {
      case 'cube':
        return new THREE.BoxGeometry(1.2, 1.2, 1.2);
      case 'plane':
        return new THREE.PlaneGeometry(2, 2);
      case 'sphere':
      default:
        return new THREE.SphereGeometry(0.9, 64, 64);
    }
  }, [shape]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      <hemisphereLight args={['#ffffff', '#444444', 0.5]} />
      <mesh ref={meshRef} geometry={geometry} material={threeMaterial} />
    </>
  );
}

// Smaller inline preview for cards (no rotation)
interface MaterialPreviewSmallProps {
  material: Partial<Material>;
  size?: number;
}

export function MaterialPreviewSmall({ material, size = 80 }: MaterialPreviewSmallProps) {
  return (
    <MaterialPreview material={material} size={size} rotate={false} shape="sphere" />
  );
}
