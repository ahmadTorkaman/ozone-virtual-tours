import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Panorama, Hotspot } from '@/services/tauri';

interface PanoramaState {
  // Current panorama
  currentPanoramaId: string | null;
  panoramas: Panorama[];
  hotspots: Hotspot[];

  // Camera state
  yaw: number;
  pitch: number;
  fov: number;

  // UI state
  isLoading: boolean;
  isTransitioning: boolean;
  isEditing: boolean;
  selectedHotspotId: string | null;

  // Actions
  setPanoramas: (panoramas: Panorama[]) => void;
  setHotspots: (hotspots: Hotspot[]) => void;
  setCurrentPanorama: (id: string | null) => void;
  setCamera: (yaw: number, pitch: number, fov?: number) => void;
  setLoading: (loading: boolean) => void;
  setTransitioning: (transitioning: boolean) => void;
  setEditing: (editing: boolean) => void;
  setSelectedHotspot: (id: string | null) => void;
  addHotspot: (hotspot: Hotspot) => void;
  updateHotspot: (id: string, updates: Partial<Hotspot>) => void;
  removeHotspot: (id: string) => void;
  reset: () => void;
}

const initialState = {
  currentPanoramaId: null,
  panoramas: [],
  hotspots: [],
  yaw: 0,
  pitch: 0,
  fov: 75,
  isLoading: false,
  isTransitioning: false,
  isEditing: false,
  selectedHotspotId: null,
};

export const usePanoramaStore = create<PanoramaState>()(
  devtools(
    (set) => ({
      ...initialState,

      setPanoramas: (panoramas) => set({ panoramas }),

      setHotspots: (hotspots) => set({ hotspots }),

      setCurrentPanorama: (id) => set({ currentPanoramaId: id }),

      setCamera: (yaw, pitch, fov) =>
        set((state) => ({ yaw, pitch, fov: fov ?? state.fov })),

      setLoading: (loading) => set({ isLoading: loading }),

      setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),

      setEditing: (editing) => set({ isEditing: editing }),

      setSelectedHotspot: (id) => set({ selectedHotspotId: id }),

      addHotspot: (hotspot) =>
        set((state) => ({ hotspots: [...state.hotspots, hotspot] })),

      updateHotspot: (id, updates) =>
        set((state) => ({
          hotspots: state.hotspots.map((h) =>
            h.id === id ? { ...h, ...updates } : h
          ),
        })),

      removeHotspot: (id) =>
        set((state) => ({
          hotspots: state.hotspots.filter((h) => h.id !== id),
          selectedHotspotId:
            state.selectedHotspotId === id ? null : state.selectedHotspotId,
        })),

      reset: () => set(initialState),
    }),
    { name: 'panorama-store' }
  )
);
