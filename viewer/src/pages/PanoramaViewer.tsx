import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ArrowLeft } from 'lucide-react';
import { useViewerStore } from '@/stores/viewerStore';
import { fetchManifest, resolveAssetUrl } from '@/services/assetLoader';
import { LoadingScreen } from '@/components/LoadingScreen';

export function PanoramaViewer() {
  const { panoramaId } = useParams<{ panoramaId: string }>();
  const navigate = useNavigate();

  const manifest = useViewerStore((s) => s.manifest);
  const setManifest = useViewerStore((s) => s.setManifest);
  const setManifestLoading = useViewerStore((s) => s.setManifestLoading);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch manifest if direct navigation
  useEffect(() => {
    if (!manifest) {
      setManifestLoading(true);
      fetchManifest()
        .then(setManifest)
        .catch(() => setError('Failed to load project data'));
    }
  }, []);

  const panorama = useMemo(
    () => manifest?.panoramas.find((p) => p.id === panoramaId),
    [manifest, panoramaId]
  );

  const allPanoramas = manifest?.panoramas || [];

  if (!manifest) {
    return <LoadingScreen progress={20} message="Loading..." />;
  }

  if (!panorama) {
    return (
      <div className="h-[100dvh] w-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-txt-secondary mb-4">Panorama not found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-accent text-white text-sm rounded-md"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-screen relative overflow-hidden bg-black touch-none">
      {loading && <LoadingScreen progress={50} message="Loading panorama..." />}

      <Canvas camera={{ fov: 75, near: 0.1, far: 1000, position: [0, 0, 0.1] }} gl={{ antialias: true }}>
        <PanoramaSphere
          imageUrl={resolveAssetUrl(panorama.file)}
          onLoad={() => setLoading(false)}
          onError={() => setError('Failed to load panorama image')}
        />
        <PanoramaControls />
      </Canvas>

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-50 bg-base flex items-center justify-center">
          <div className="text-center">
            <p className="text-txt-secondary mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-accent text-white text-sm rounded-md"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}

      {/* Overlays */}
      {!loading && !error && (
        <>
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 z-30 glass border border-border/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-hovr transition-colors"
          >
            <ArrowLeft size={18} className="text-txt-primary" />
          </button>

          {/* Panorama name */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
            <div className="glass border border-border/50 rounded-full px-4 py-1.5">
              <span className="text-sm font-medium text-txt-primary">
                {panorama.name}
              </span>
            </div>
          </div>

          {/* Navigation hint */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
            <span className="text-xs text-txt-tertiary glass border border-border/30 rounded-full px-3 py-1">
              Drag to look around
            </span>
          </div>

          {/* Thumbnail strip for multiple panoramas */}
          {allPanoramas.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 safe-bottom">
              <div className="glass border border-border/50 rounded-lg p-1.5 flex gap-1.5">
                {allPanoramas.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/panorama/${p.id}`)}
                    className={`w-14 h-10 rounded overflow-hidden border-2 transition-colors ${
                      p.id === panoramaId
                        ? 'border-accent'
                        : 'border-transparent hover:border-border'
                    }`}
                  >
                    <img
                      src={resolveAssetUrl(p.thumbnail)}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Co-branding */}
          {manifest.branding.firm_name && (
            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2 opacity-50">
              {manifest.branding.firm_logo && (
                <img
                  src={resolveAssetUrl(manifest.branding.firm_logo)}
                  alt=""
                  className="w-5 h-5 object-contain"
                />
              )}
              <span className="text-[10px] text-txt-tertiary">
                Powered by Ozone Studio
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- Panorama sphere ---

interface PanoramaSphereProps {
  imageUrl: string;
  onLoad: () => void;
  onError: () => void;
}

function PanoramaSphere({ imageUrl, onLoad, onError }: PanoramaSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  onLoadRef.current = onLoad;
  onErrorRef.current = onError;

  useEffect(() => {
    const loader = new THREE.TextureLoader();

    loader.load(
      imageUrl,
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        if (meshRef.current) {
          const material = meshRef.current.material as THREE.MeshBasicMaterial;
          if (textureRef.current) {
            textureRef.current.dispose();
          }
          textureRef.current = texture;
          material.map = texture;
          material.needsUpdate = true;
        }
        onLoadRef.current();
      },
      undefined,
      () => {
        onErrorRef.current();
      }
    );

    return () => {
      if (textureRef.current) {
        textureRef.current.dispose();
        textureRef.current = null;
      }
    };
  }, [imageUrl]);

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial side={THREE.BackSide} />
    </mesh>
  );
}

// --- Touch/mouse panorama controls ---

function PanoramaControls() {
  const { camera, gl } = useThree();

  const isDragging = useRef(false);
  const prevMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ yaw: 0, pitch: 0 });
  const currentFov = useRef(75);

  // Touch state
  const touchStart = useRef<{ x: number; y: number; distance?: number }>({ x: 0, y: 0 });

  // Pointer handlers
  const handlePointerDown = useCallback((e: PointerEvent) => {
    isDragging.current = true;
    prevMouse.current = { x: e.clientX, y: e.clientY };
    gl.domElement.setPointerCapture(e.pointerId);
    gl.domElement.style.cursor = 'grabbing';
  }, [gl.domElement]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - prevMouse.current.x;
    const dy = e.clientY - prevMouse.current.y;
    const sensitivity = 0.2 * (currentFov.current / 75);
    rotation.current.yaw -= dx * sensitivity;
    rotation.current.pitch = Math.max(-85, Math.min(85, rotation.current.pitch + dy * sensitivity));
    prevMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handlePointerUp = useCallback((e: PointerEvent) => {
    isDragging.current = false;
    gl.domElement.releasePointerCapture(e.pointerId);
    gl.domElement.style.cursor = 'grab';
  }, [gl.domElement]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * 0.05;
    const newFov = Math.max(30, Math.min(100, currentFov.current + delta));
    currentFov.current = newFov;
    (camera as THREE.PerspectiveCamera).fov = newFov;
    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
  }, [camera]);

  // Touch handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStart.current.distance = Math.sqrt(dx * dx + dy * dy);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const dx = e.touches[0].clientX - touchStart.current.x;
      const dy = e.touches[0].clientY - touchStart.current.y;
      const sensitivity = 0.3 * (currentFov.current / 75);
      rotation.current.yaw -= dx * sensitivity;
      rotation.current.pitch = Math.max(-85, Math.min(85, rotation.current.pitch + dy * sensitivity));
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && touchStart.current.distance) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const delta = (touchStart.current.distance - distance) * 0.1;
      const newFov = Math.max(30, Math.min(100, currentFov.current + delta));
      currentFov.current = newFov;
      (camera as THREE.PerspectiveCamera).fov = newFov;
      (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      touchStart.current.distance = distance;
    }
  }, [camera]);

  useEffect(() => {
    const el = gl.domElement;
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('pointerleave', handlePointerUp);
    el.addEventListener('wheel', handleWheel, { passive: false });
    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);
      el.removeEventListener('pointerleave', handlePointerUp);
      el.removeEventListener('wheel', handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gl.domElement, handlePointerDown, handlePointerMove, handlePointerUp, handleWheel, handleTouchStart, handleTouchMove]);

  // Update camera look direction every frame
  useFrame(() => {
    const { yaw, pitch } = rotation.current;
    const phi = THREE.MathUtils.degToRad(90 - pitch);
    const theta = THREE.MathUtils.degToRad(yaw);

    const target = new THREE.Vector3(
      Math.sin(phi) * Math.sin(theta),
      Math.cos(phi),
      Math.sin(phi) * Math.cos(theta)
    );
    camera.lookAt(target);
  });

  return null;
}
