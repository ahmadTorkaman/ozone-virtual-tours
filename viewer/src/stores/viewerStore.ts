import { create } from 'zustand';
import type { Manifest } from '@/types/manifest';

export type RendererMode = 'pbr' | 'pathtracer';
export type GpuTier = 'high' | 'medium' | 'low';

interface ViewerState {
  // Manifest
  manifest: Manifest | null;
  manifestLoading: boolean;
  manifestError: string | null;

  // Renderer
  rendererMode: RendererMode;
  gpuTier: GpuTier;
  pathTracerSamples: number;
  pathTracerConverged: boolean;

  // Configurator
  selectedComponentId: string | null;
  materialOverrides: Record<string, string>; // componentId -> materialId
  materialPickerOpen: boolean;

  // Loading
  sceneLoadProgress: number;

  // Actions
  setManifest: (manifest: Manifest) => void;
  setManifestLoading: (loading: boolean) => void;
  setManifestError: (error: string | null) => void;
  setRendererMode: (mode: RendererMode) => void;
  setGpuTier: (tier: GpuTier) => void;
  setPathTracerSamples: (samples: number) => void;
  setPathTracerConverged: (converged: boolean) => void;
  selectComponent: (componentId: string | null) => void;
  setMaterialOverride: (componentId: string, materialId: string) => void;
  resetMaterialOverrides: () => void;
  setMaterialPickerOpen: (open: boolean) => void;
  setSceneLoadProgress: (progress: number) => void;
}

export const useViewerStore = create<ViewerState>((set) => ({
  manifest: null,
  manifestLoading: false,
  manifestError: null,

  rendererMode: 'pbr',
  gpuTier: 'medium',
  pathTracerSamples: 0,
  pathTracerConverged: false,

  selectedComponentId: null,
  materialOverrides: {},
  materialPickerOpen: false,

  sceneLoadProgress: 0,

  setManifest: (manifest) => set({ manifest, manifestLoading: false, manifestError: null }),
  setManifestLoading: (loading) => set({ manifestLoading: loading }),
  setManifestError: (error) => set({ manifestError: error, manifestLoading: false }),
  setRendererMode: (mode) => set({ rendererMode: mode, pathTracerSamples: 0, pathTracerConverged: false }),
  setGpuTier: (tier) => set({ gpuTier: tier }),
  setPathTracerSamples: (samples) => set({ pathTracerSamples: samples }),
  setPathTracerConverged: (converged) => set({ pathTracerConverged: converged }),
  selectComponent: (componentId) => set({ selectedComponentId: componentId, materialPickerOpen: componentId !== null }),
  setMaterialOverride: (componentId, materialId) =>
    set((state) => ({
      materialOverrides: { ...state.materialOverrides, [componentId]: materialId },
    })),
  resetMaterialOverrides: () => set({ materialOverrides: {}, selectedComponentId: null, materialPickerOpen: false }),
  setMaterialPickerOpen: (open) => set({ materialPickerOpen: open, selectedComponentId: open ? undefined : null }),
  setSceneLoadProgress: (progress) => set({ sceneLoadProgress: progress }),
}));
