import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SceneData } from '@/engine/SceneManager';

interface SceneState {
  // Current project/scene info
  currentProjectId: string | null;
  currentSceneId: string | null;

  // Scene data
  sceneData: SceneData | null;
  isLoading: boolean;
  loadProgress: number;
  error: string | null;

  // Selection
  selectedObjectName: string | null;
  hoveredObjectName: string | null;

  // Camera
  isPointerLocked: boolean;

  // Material mappings (objectName -> materialId)
  materialMappings: Record<string, string>;

  // Actions
  setCurrentProject: (projectId: string | null) => void;
  setCurrentScene: (sceneId: string | null) => void;
  setSceneData: (data: SceneData | null) => void;
  setLoading: (loading: boolean) => void;
  setLoadProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setSelectedObject: (name: string | null) => void;
  setHoveredObject: (name: string | null) => void;
  setPointerLocked: (locked: boolean) => void;
  setMaterialMapping: (objectName: string, materialId: string) => void;
  setMaterialMappings: (mappings: Record<string, string>) => void;
  removeMaterialMapping: (objectName: string) => void;
  clearMaterialMappings: () => void;
  reset: () => void;
}

const initialState = {
  currentProjectId: null,
  currentSceneId: null,
  sceneData: null,
  isLoading: false,
  loadProgress: 0,
  error: null,
  selectedObjectName: null,
  hoveredObjectName: null,
  isPointerLocked: false,
  materialMappings: {},
};

export const useSceneStore = create<SceneState>()(
  devtools(
    (set) => ({
      ...initialState,

      setCurrentProject: (projectId) => set({ currentProjectId: projectId }),

      setCurrentScene: (sceneId) => set({ currentSceneId: sceneId }),

      setSceneData: (data) => set({ sceneData: data, error: null }),

      setLoading: (loading) => set({ isLoading: loading }),

      setLoadProgress: (progress) => set({ loadProgress: progress }),

      setError: (error) => set({ error, isLoading: false }),

      setSelectedObject: (name) => set({ selectedObjectName: name }),

      setHoveredObject: (name) => set({ hoveredObjectName: name }),

      setPointerLocked: (locked) => set({ isPointerLocked: locked }),

      setMaterialMapping: (objectName, materialId) =>
        set((state) => ({
          materialMappings: {
            ...state.materialMappings,
            [objectName]: materialId,
          },
        })),

      setMaterialMappings: (mappings) => set({ materialMappings: mappings }),

      removeMaterialMapping: (objectName) =>
        set((state) => {
          const { [objectName]: _, ...rest } = state.materialMappings;
          return { materialMappings: rest };
        }),

      clearMaterialMappings: () => set({ materialMappings: {} }),

      reset: () => set(initialState),
    }),
    { name: 'scene-store' }
  )
);
