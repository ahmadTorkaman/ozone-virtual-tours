import { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  OrbitControls,
  Environment,
  ContactShadows,
  useTexture,
  Center,
  Float,
  PresentationControls,
} from '@react-three/drei';
import * as THREE from 'three';

// Environment presets
const ENVIRONMENTS = {
  studio: 'studio',
  sunset: 'sunset',
  warehouse: 'warehouse',
  forest: 'forest',
  night: 'night',
  city: 'city',
  dawn: 'dawn',
  apartment: 'apartment',
  lobby: 'lobby',
  park: 'park',
};

// Shape components
function PreviewSphere({ material, autoRotate }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <sphereGeometry args={[1, 64, 64]} />
      <MaterialShader material={material} />
    </mesh>
  );
}

function PreviewCube({ material, autoRotate }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <boxGeometry args={[1.4, 1.4, 1.4]} />
      <MaterialShader material={material} />
    </mesh>
  );
}

function PreviewTorus({ material, autoRotate }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
      meshRef.current.rotation.x += delta * 0.15;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <torusGeometry args={[0.8, 0.35, 32, 64]} />
      <MaterialShader material={material} />
    </mesh>
  );
}

function PreviewPlane({ material, autoRotate }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 6, 0, 0]} castShadow receiveShadow>
      <planeGeometry args={[2, 2, 32, 32]} />
      <MaterialShader material={material} />
    </mesh>
  );
}

function PreviewTorusKnot({ material, autoRotate }) {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (autoRotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <torusKnotGeometry args={[0.6, 0.25, 128, 32]} />
      <MaterialShader material={material} />
    </mesh>
  );
}

// Material shader component that handles texture loading
function MaterialShader({ material }) {
  // Load textures if they exist
  const textureUrls = useMemo(() => {
    const urls = {};
    if (material.map) urls.map = material.map;
    if (material.normalMap) urls.normalMap = material.normalMap;
    if (material.roughnessMap) urls.roughnessMap = material.roughnessMap;
    if (material.metalnessMap) urls.metalnessMap = material.metalnessMap;
    if (material.aoMap) urls.aoMap = material.aoMap;
    if (material.emissiveMap) urls.emissiveMap = material.emissiveMap;
    if (material.heightMap) urls.displacementMap = material.heightMap;
    return urls;
  }, [material]);

  const hasTextures = Object.keys(textureUrls).length > 0;

  if (hasTextures) {
    return <TexturedMaterial material={material} textureUrls={textureUrls} />;
  }

  return (
    <meshPhysicalMaterial
      color={material.color}
      metalness={material.metalness}
      roughness={material.roughness}
      transparent={material.transparent}
      opacity={material.opacity}
      emissive={material.emissive}
      emissiveIntensity={material.emissiveIntensity}
      clearcoat={material.clearcoat || 0}
      clearcoatRoughness={material.clearcoatRoughness || 0}
      side={THREE.DoubleSide}
      envMapIntensity={1}
    />
  );
}

// Separate component for textured materials to handle async loading
function TexturedMaterial({ material, textureUrls }) {
  const textures = useTexture(textureUrls);

  // Configure textures
  Object.values(textures).forEach(texture => {
    if (texture) {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    }
  });

  return (
    <meshPhysicalMaterial
      color={material.color}
      metalness={material.metalness}
      roughness={material.roughness}
      transparent={material.transparent}
      opacity={material.opacity}
      emissive={material.emissive}
      emissiveIntensity={material.emissiveIntensity}
      map={textures.map}
      normalMap={textures.normalMap}
      normalScale={new THREE.Vector2(material.normalScale || 1, material.normalScale || 1)}
      roughnessMap={textures.roughnessMap}
      metalnessMap={textures.metalnessMap}
      aoMap={textures.aoMap}
      aoMapIntensity={material.aoIntensity || 1}
      displacementMap={textures.displacementMap}
      displacementScale={material.displacementScale || 0.1}
      emissiveMap={textures.emissiveMap}
      side={THREE.DoubleSide}
      envMapIntensity={1}
    />
  );
}

// Shape selector component
function PreviewShape({ shape, material, autoRotate }) {
  const shapes = {
    sphere: PreviewSphere,
    cube: PreviewCube,
    torus: PreviewTorus,
    plane: PreviewPlane,
    torusKnot: PreviewTorusKnot,
  };

  const ShapeComponent = shapes[shape] || PreviewSphere;

  return (
    <Center>
      <ShapeComponent material={material} autoRotate={autoRotate} />
    </Center>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#333" wireframe />
    </mesh>
  );
}

// Main Preview Component
export default function MaterialPreview3D({
  material,
  shape = 'sphere',
  environment = 'studio',
  autoRotate = true,
  showShadow = true,
  showControls = true,
  className = '',
  style = {},
  compact = false,
}) {
  // Default material if none provided
  const mat = material || {
    color: '#888888',
    metalness: 0,
    roughness: 0.5,
    opacity: 1,
    transparent: false,
    emissive: '#000000',
    emissiveIntensity: 0,
  };

  return (
    <div className={`material-preview-3d ${className}`} style={{ width: '100%', height: '100%', minHeight: compact ? 150 : 300, ...style }}>
      <Canvas
        shadows
        camera={{ position: [0, 0, 4], fov: 45 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1,
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Lighting */}
          <ambientLight intensity={0.3} />
          <spotLight
            position={[10, 10, 10]}
            angle={0.15}
            penumbra={1}
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          {/* Environment map for reflections */}
          <Environment preset={ENVIRONMENTS[environment] || 'studio'} />

          {/* The preview shape */}
          {showControls ? (
            <PresentationControls
              global
              config={{ mass: 2, tension: 500 }}
              snap={{ mass: 4, tension: 1500 }}
              rotation={[0, 0.3, 0]}
              polar={[-Math.PI / 3, Math.PI / 3]}
              azimuth={[-Math.PI / 1.4, Math.PI / 2]}
            >
              <Float rotationIntensity={autoRotate ? 0.4 : 0} floatIntensity={0.2}>
                <PreviewShape shape={shape} material={mat} autoRotate={false} />
              </Float>
            </PresentationControls>
          ) : (
            <PreviewShape shape={shape} material={mat} autoRotate={autoRotate} />
          )}

          {/* Contact shadow for grounding */}
          {showShadow && (
            <ContactShadows
              position={[0, -1.5, 0]}
              opacity={0.4}
              scale={5}
              blur={2.5}
              far={4}
            />
          )}

          {/* Orbit controls for full control */}
          {!showControls && (
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              minDistance={2}
              maxDistance={8}
              autoRotate={autoRotate}
              autoRotateSpeed={2}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}

// Mini preview for cards (simpler, lighter)
export function MaterialPreviewMini({ material, className = '' }) {
  const mat = material || {
    color: '#888888',
    metalness: 0,
    roughness: 0.5,
  };

  return (
    <div className={`material-preview-mini ${className}`} style={{ width: '100%', height: '100%', minHeight: 100 }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <Environment preset="studio" />
          <mesh>
            <sphereGeometry args={[1, 32, 32]} />
            <meshPhysicalMaterial
              color={mat.color}
              metalness={mat.metalness}
              roughness={mat.roughness}
              transparent={mat.transparent}
              opacity={mat.opacity}
              emissive={mat.emissive || '#000000'}
              emissiveIntensity={mat.emissiveIntensity || 0}
            />
          </mesh>
        </Suspense>
      </Canvas>
    </div>
  );
}

// Compare view - two materials side by side
export function MaterialCompareView({ materialA, materialB, shape = 'sphere', environment = 'studio' }) {
  return (
    <div className="material-compare-view" style={{ display: 'flex', width: '100%', height: '100%', gap: '2px' }}>
      <div style={{ flex: 1 }}>
        <MaterialPreview3D
          material={materialA}
          shape={shape}
          environment={environment}
          autoRotate={true}
          showControls={false}
        />
      </div>
      <div style={{ flex: 1 }}>
        <MaterialPreview3D
          material={materialB}
          shape={shape}
          environment={environment}
          autoRotate={true}
          showControls={false}
        />
      </div>
    </div>
  );
}
