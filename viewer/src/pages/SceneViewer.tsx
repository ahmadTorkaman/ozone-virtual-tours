import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ArrowLeft } from 'lucide-react';
import { useViewerStore } from '@/stores/viewerStore';
import { fetchManifest, resolveAssetUrl } from '@/services/assetLoader';
import { SceneRenderer, type SceneRendererHandle } from '@/engine/SceneRenderer';
import { loadMaterialFromManifest, applyMaterialToMeshes } from '@/engine/materialSwap';
import { MaterialPicker } from '@/components/MaterialPicker';
import { RendererToggle } from '@/components/RendererToggle';
import { LoadingScreen } from '@/components/LoadingScreen';
import type { ConfigurableComponent } from '@/types/manifest';

export function SceneViewer() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const navigate = useNavigate();

  const manifest = useViewerStore((s) => s.manifest);
  const setManifest = useViewerStore((s) => s.setManifest);
  const setManifestLoading = useViewerStore((s) => s.setManifestLoading);
  const rendererMode = useViewerStore((s) => s.rendererMode);
  const selectedComponentId = useViewerStore((s) => s.selectedComponentId);
  const materialOverrides = useViewerStore((s) => s.materialOverrides);
  const materialPickerOpen = useViewerStore((s) => s.materialPickerOpen);
  const selectComponent = useViewerStore((s) => s.selectComponent);
  const setMaterialOverride = useViewerStore((s) => s.setMaterialOverride);
  const setMaterialPickerOpen = useViewerStore((s) => s.setMaterialPickerOpen);

  const [sceneLoading, setSceneLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [sceneError, setSceneError] = useState<string | null>(null);

  const sceneRendererRef = useRef<SceneRendererHandle>(null);

  // Fetch manifest if we navigated directly to this URL
  useEffect(() => {
    if (!manifest) {
      setManifestLoading(true);
      fetchManifest()
        .then(setManifest)
        .catch(() => setSceneError('Failed to load project data'));
    }
  }, []);

  const scene = useMemo(
    () => manifest?.scenes.find((s) => s.id === sceneId),
    [manifest, sceneId]
  );

  const components = useMemo(
    () =>
      manifest?.configurable_components.filter((c) => c.scene_id === sceneId) || [],
    [manifest, sceneId]
  );

  const selectedComponent = useMemo(
    () => components.find((c) => c.id === selectedComponentId) || null,
    [components, selectedComponentId]
  );

  const activeMaterialId = selectedComponentId
    ? materialOverrides[selectedComponentId] || selectedComponent?.default_material_id || null
    : null;

  // Handle material selection
  const handleMaterialSelect = useCallback(
    async (materialId: string) => {
      if (!selectedComponentId || !sceneRendererRef.current) return;

      const comp = components.find((c) => c.id === selectedComponentId);
      const matOption = comp?.materials.find((m) => m.id === materialId);
      if (!matOption) return;

      const meshes = sceneRendererRef.current.getComponentMeshes(selectedComponentId);
      if (meshes.length === 0) return;

      try {
        const material = await loadMaterialFromManifest(matOption);
        applyMaterialToMeshes(meshes, material);
        setMaterialOverride(selectedComponentId, materialId);
      } catch (err) {
        console.error('Failed to apply material:', err);
      }
    },
    [selectedComponentId, components, setMaterialOverride]
  );

  if (!manifest) {
    return <LoadingScreen progress={20} message="Loading..." />;
  }

  if (!scene) {
    return (
      <div className="h-[100dvh] w-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-txt-secondary mb-4">Scene not found</p>
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
    <div className="h-[100dvh] w-screen relative overflow-hidden bg-base touch-none">
      {/* Loading overlay */}
      {sceneLoading && (
        <LoadingScreen progress={loadProgress} message="Loading 3D scene..." />
      )}

      {/* Error overlay */}
      {sceneError && (
        <div className="absolute inset-0 z-50 bg-base flex items-center justify-center">
          <div className="text-center">
            <p className="text-txt-secondary mb-4">{sceneError}</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-accent text-white text-sm rounded-md"
            >
              Back to Lobby
            </button>
          </div>
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          powerPreference: 'high-performance',
        }}
        camera={{ fov: 50, near: 0.1, far: 1000 }}
      >
        <SceneRenderer
          ref={sceneRendererRef}
          glbUrl={resolveAssetUrl(scene.file)}
          components={components}
          onProgress={setLoadProgress}
          onLoaded={() => setSceneLoading(false)}
          onError={setSceneError}
        />

        <ClickHandler
          sceneRendererRef={sceneRendererRef}
          onComponentClick={selectComponent}
          onEmptyClick={() => materialPickerOpen && selectComponent(null)}
        />

        {rendererMode === 'pathtracer' && <PathTracerWrapper />}
      </Canvas>

      {/* Overlays */}
      {!sceneLoading && !sceneError && (
        <>
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="absolute top-4 left-4 z-30 glass border border-border/50 rounded-full w-10 h-10 flex items-center justify-center hover:bg-hovr transition-colors"
          >
            <ArrowLeft size={18} className="text-txt-primary" />
          </button>

          {/* Scene name */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
            <div className="glass border border-border/50 rounded-full px-4 py-1.5">
              <span className="text-sm font-medium text-txt-primary">
                {scene.name}
              </span>
            </div>
          </div>

          {/* Renderer toggle */}
          <div className="absolute top-4 right-4 z-30">
            <RendererToggle />
          </div>

          {/* Component hint pills */}
          {!materialPickerOpen && components.length > 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2">
              {components.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => selectComponent(comp.id)}
                  className="glass border border-border/50 rounded-full px-3 py-1.5 text-xs text-txt-secondary hover:text-txt-primary hover:border-accent/50 transition-colors"
                >
                  {comp.name}
                </button>
              ))}
            </div>
          )}

          {/* Material picker bottom sheet */}
          <MaterialPicker
            open={materialPickerOpen}
            component={selectedComponent}
            activeMaterialId={activeMaterialId}
            onSelect={handleMaterialSelect}
            onClose={() => selectComponent(null)}
          />

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

// Raycasting click handler inside Canvas (has access to useThree)
function ClickHandler({
  sceneRendererRef,
  onComponentClick,
  onEmptyClick,
}: {
  sceneRendererRef: React.RefObject<SceneRendererHandle | null>;
  onComponentClick: (componentId: string) => void;
  onEmptyClick: () => void;
}) {
  const { camera, gl } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const pointerDown = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const el = gl.domElement;

    const onDown = (e: PointerEvent) => {
      pointerDown.current = { x: e.clientX, y: e.clientY };
    };

    const onUp = (e: PointerEvent) => {
      // Only handle clicks (not drags)
      const dx = e.clientX - pointerDown.current.x;
      const dy = e.clientY - pointerDown.current.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) return;

      if (!sceneRendererRef.current) return;
      const model = sceneRendererRef.current.getModel();
      if (!model) return;

      const rect = el.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      raycaster.current.setFromCamera(mouse, camera);
      const intersects = raycaster.current.intersectObject(model, true);

      for (const hit of intersects) {
        if (hit.object instanceof THREE.Mesh) {
          const compId = sceneRendererRef.current.getMeshComponentId(hit.object);
          if (compId) {
            onComponentClick(compId);
            return;
          }
        }
      }
      onEmptyClick();
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
    };
  }, [camera, gl, sceneRendererRef, onComponentClick, onEmptyClick]);

  return null;
}

// Dynamic import path tracer to avoid loading unless needed
function PathTracerWrapper() {
  const [PT, setPT] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    import('@/engine/PathTracerRenderer').then((mod) => {
      setPT(() => mod.PathTracerRenderer);
    });
  }, []);

  if (!PT) return null;
  return <PT />;
}
