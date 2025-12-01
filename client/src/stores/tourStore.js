import { create } from 'zustand';

export const useTourStore = create((set, get) => ({
  // Current tour data
  tour: null,
  currentSceneId: null,
  isLoading: false,
  error: null,

  // UI State
  showFloorPlan: true,
  showThumbnails: true,
  isGuidedMode: false,
  infoModal: null,

  // VR State
  isVRMode: false,
  vrSupported: false,

  // Settings
  settings: {
    autoRotate: false,
    autoRotateSpeed: 0.5,
    defaultFov: 80,
    transitionDuration: 300,
    vrEnabled: true,
    guidedTourDelay: 8000
  },

  // Actions
  setTour: (tour) => {
    set({
      tour,
      currentSceneId: tour?.scenes?.[0]?.id || null,
      error: null
    });
  },

  setCurrentScene: (sceneId) => {
    const { tour } = get();
    if (tour?.scenes?.some(s => s.id === sceneId)) {
      set({ currentSceneId: sceneId });
    }
  },

  navigateToScene: (sceneId) => {
    const { tour, currentSceneId } = get();
    if (!tour || sceneId === currentSceneId) return;

    const scene = tour.scenes.find(s => s.id === sceneId);
    if (scene) {
      set({ currentSceneId: sceneId });
    }
  },

  nextScene: () => {
    const { tour, currentSceneId } = get();
    if (!tour) return;

    const currentIndex = tour.scenes.findIndex(s => s.id === currentSceneId);
    const nextIndex = (currentIndex + 1) % tour.scenes.length;
    set({ currentSceneId: tour.scenes[nextIndex].id });
  },

  prevScene: () => {
    const { tour, currentSceneId } = get();
    if (!tour) return;

    const currentIndex = tour.scenes.findIndex(s => s.id === currentSceneId);
    const prevIndex = currentIndex === 0 ? tour.scenes.length - 1 : currentIndex - 1;
    set({ currentSceneId: tour.scenes[prevIndex].id });
  },

  // UI toggles
  toggleFloorPlan: () => set(state => ({ showFloorPlan: !state.showFloorPlan })),
  toggleThumbnails: () => set(state => ({ showThumbnails: !state.showThumbnails })),
  toggleGuidedMode: () => set(state => ({ isGuidedMode: !state.isGuidedMode })),

  setInfoModal: (hotspot) => set({ infoModal: hotspot }),
  closeInfoModal: () => set({ infoModal: null }),

  // VR
  setVRMode: (isVR) => set({ isVRMode: isVR }),
  setVRSupported: (supported) => set({ vrSupported: supported }),

  // Settings
  updateSettings: (newSettings) => set(state => ({
    settings: { ...state.settings, ...newSettings }
  })),

  // Loading states
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),

  // Helpers
  getCurrentScene: () => {
    const { tour, currentSceneId } = get();
    return tour?.scenes?.find(s => s.id === currentSceneId) || null;
  },

  getSceneIndex: () => {
    const { tour, currentSceneId } = get();
    return tour?.scenes?.findIndex(s => s.id === currentSceneId) ?? -1;
  }
}));

export default useTourStore;
