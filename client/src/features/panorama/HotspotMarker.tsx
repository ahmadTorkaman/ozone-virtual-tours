import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { Hotspot } from '@/services/tauri';
import { usePanoramaStore } from '@/stores/panoramaStore';

interface HotspotMarkerProps {
  hotspot: Hotspot;
  onClick?: () => void;
}

export function HotspotMarker({ hotspot, onClick }: HotspotMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { selectedHotspotId, isEditing } = usePanoramaStore();
  const isSelected = selectedHotspotId === hotspot.id;
  const [isHovered, setIsHovered] = useState(false);

  // Convert yaw/pitch to 3D position on sphere
  const phi = THREE.MathUtils.degToRad(90 - hotspot.pitch);
  const theta = THREE.MathUtils.degToRad(hotspot.yaw);

  const distance = 50; // Distance from center
  const position = new THREE.Vector3(
    distance * Math.sin(phi) * Math.sin(theta),
    distance * Math.cos(phi),
    distance * Math.sin(phi) * Math.cos(theta)
  );

  // Billboard effect - always face camera
  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  // Get color based on hotspot type
  const getColor = () => {
    if (isSelected) return '#22c55e'; // Green when selected
    if (isHovered) return '#fbbf24'; // Yellow when hovered
    if (hotspot.color) return hotspot.color;

    switch (hotspot.hotspot_type) {
      case 'navigation':
        return '#ffffff';
      case 'info':
        return '#3b82f6'; // Blue
      case 'media':
        return '#8b5cf6'; // Purple
      case 'link':
        return '#f59e0b'; // Amber
      default:
        return '#ffffff';
    }
  };

  // Get icon based on hotspot type
  const getIconGeometry = () => {
    switch (hotspot.hotspot_type) {
      case 'navigation':
        // Arrow/chevron shape
        return (
          <mesh position={[0, 0, 0.02]}>
            <coneGeometry args={[0.8, 1.2, 3]} />
            <meshBasicMaterial
              color={getColor()}
              transparent
              opacity={0.9}
            />
          </mesh>
        );
      case 'info':
        // "i" icon - circle with dot
        return (
          <>
            <mesh position={[0, 0.4, 0.02]}>
              <circleGeometry args={[0.25, 16]} />
              <meshBasicMaterial color={getColor()} />
            </mesh>
            <mesh position={[0, -0.2, 0.02]}>
              <planeGeometry args={[0.3, 0.8]} />
              <meshBasicMaterial color={getColor()} />
            </mesh>
          </>
        );
      case 'media':
        // Play button triangle
        return (
          <mesh position={[0.1, 0, 0.02]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.6, 1, 3]} />
            <meshBasicMaterial color={getColor()} />
          </mesh>
        );
      case 'link':
        // External link icon (simplified arrow)
        return (
          <mesh position={[0, 0, 0.02]} rotation={[0, 0, Math.PI / 4]}>
            <coneGeometry args={[0.5, 1, 3]} />
            <meshBasicMaterial color={getColor()} />
          </mesh>
        );
      default:
        return null;
    }
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.();
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setIsHovered(false);
    document.body.style.cursor = 'grab';
  };

  const scale = (isHovered || isSelected) ? 1.2 : 1;

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Outer ring */}
      <mesh>
        <ringGeometry args={[1.5, 2, 32]} />
        <meshBasicMaterial
          color={getColor()}
          transparent
          opacity={isSelected ? 1 : 0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner fill */}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial
          color={getColor()}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Type-specific icon */}
      {getIconGeometry()}

      {/* Selection indicator in edit mode */}
      {isEditing && isSelected && (
        <mesh position={[0, 0, -0.01]}>
          <ringGeometry args={[2.5, 3, 32]} />
          <meshBasicMaterial
            color="#22c55e"
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Pulse animation ring when hovered */}
      {isHovered && (
        <PulseRing color={getColor()} />
      )}
    </group>
  );
}

function PulseRing({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime();
      const scale = 1 + Math.sin(t * 4) * 0.1;
      meshRef.current.scale.setScalar(scale);
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(t * 4) * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, -0.02]}>
      <ringGeometry args={[2.2, 2.5, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
