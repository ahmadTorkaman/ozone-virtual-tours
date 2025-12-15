import { create } from 'zustand';
import { libraryApi } from '../services/api.js';

// Default material template
const createDefaultMaterial = (id) => ({
  id,
  name: 'New Material',
  category: 'Custom',
  // PBR Properties
  color: '#ffffff',
  metalness: 0,
  roughness: 0.5,
  opacity: 1,
  transparent: false,
  emissive: '#000000',
  emissiveIntensity: 0,
  // Texture Maps
  map: null,              // Albedo/Diffuse map
  normalMap: null,
  roughnessMap: null,
  metalnessMap: null,
  aoMap: null,            // Ambient Occlusion
  heightMap: null,        // Displacement
  emissiveMap: null,
  opacityMap: null,
  // Texture settings
  normalScale: 1,
  aoIntensity: 1,
  displacementScale: 0.1,
  // Metadata
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Material presets for quick start
export const MATERIAL_PRESETS = {
  chrome: {
    name: 'Chrome',
    color: '#ffffff',
    metalness: 1,
    roughness: 0.1,
    category: 'Metals',
  },
  gold: {
    name: 'Gold',
    color: '#ffd700',
    metalness: 1,
    roughness: 0.2,
    category: 'Metals',
  },
  copper: {
    name: 'Copper',
    color: '#b87333',
    metalness: 1,
    roughness: 0.3,
    category: 'Metals',
  },
  brushedSteel: {
    name: 'Brushed Steel',
    color: '#c0c0c0',
    metalness: 0.9,
    roughness: 0.4,
    category: 'Metals',
  },
  rubber: {
    name: 'Rubber',
    color: '#2a2a2a',
    metalness: 0,
    roughness: 0.9,
    category: 'Plastics',
  },
  plastic: {
    name: 'Plastic',
    color: '#ff4444',
    metalness: 0,
    roughness: 0.3,
    category: 'Plastics',
  },
  glass: {
    name: 'Glass',
    color: '#ffffff',
    metalness: 0,
    roughness: 0.05,
    opacity: 0.3,
    transparent: true,
    category: 'Glass',
  },
  frostedGlass: {
    name: 'Frosted Glass',
    color: '#ffffff',
    metalness: 0,
    roughness: 0.5,
    opacity: 0.5,
    transparent: true,
    category: 'Glass',
  },
  wood: {
    name: 'Wood',
    color: '#8b4513',
    metalness: 0,
    roughness: 0.7,
    category: 'Wood',
  },
  marble: {
    name: 'Marble',
    color: '#f0f0f0',
    metalness: 0,
    roughness: 0.2,
    category: 'Stone',
  },
  concrete: {
    name: 'Concrete',
    color: '#808080',
    metalness: 0,
    roughness: 0.9,
    category: 'Stone',
  },
  fabric: {
    name: 'Fabric',
    color: '#4a6fa5',
    metalness: 0,
    roughness: 0.8,
    category: 'Fabric',
  },
  leather: {
    name: 'Leather',
    color: '#8b4513',
    metalness: 0,
    roughness: 0.6,
    category: 'Fabric',
  },
  emissive: {
    name: 'Emissive',
    color: '#ffffff',
    metalness: 0,
    roughness: 0.5,
    emissive: '#00ff00',
    emissiveIntensity: 1,
    category: 'Custom',
  },
};

// Default categories
const DEFAULT_CATEGORIES = ['Metals', 'Plastics', 'Glass', 'Wood', 'Fabric', 'Stone', 'Custom'];

export const useMaterialStore = create((set, get) => ({
  // Library state
  materials: {},
  categories: DEFAULT_CATEGORIES,
  lastSyncedAt: null,
  isLoading: false,
  isSyncing: false,
  error: null,

  // UI State
  selectedMaterialId: null,
  editingMaterial: null,
  isEditorOpen: false,
  searchQuery: '',
  activeCategory: null, // null = all categories

  // Preview state
  previewShape: 'sphere', // 'sphere', 'cube', 'torus', 'plane'
  previewEnvironment: 'studio', // 'studio', 'sunset', 'warehouse', 'forest', 'night'
  previewAutoRotate: true,
  compareMode: false,
  compareMaterialId: null,

  // Actions - Library Management
  fetchLibrary: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await libraryApi.fetch();
      set({
        materials: data.materials || {},
        categories: data.categories?.length ? data.categories : DEFAULT_CATEGORIES,
        lastSyncedAt: data.lastSyncedAt,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  syncLibrary: async () => {
    const { materials, categories } = get();
    set({ isSyncing: true, error: null });
    try {
      const data = await libraryApi.sync(materials, categories);
      set({
        lastSyncedAt: data.lastSyncedAt,
        isSyncing: false,
      });
      return data;
    } catch (error) {
      set({ error: error.message, isSyncing: false });
      throw error;
    }
  },

  // Actions - Material CRUD
  createMaterial: (fromPreset = null) => {
    const id = `mat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let material = createDefaultMaterial(id);

    if (fromPreset && MATERIAL_PRESETS[fromPreset]) {
      material = { ...material, ...MATERIAL_PRESETS[fromPreset] };
    }

    set(state => ({
      materials: { ...state.materials, [id]: material },
      editingMaterial: material,
      isEditorOpen: true,
      selectedMaterialId: id,
    }));

    return material;
  },

  updateMaterial: (id, updates) => {
    set(state => {
      const material = state.materials[id];
      if (!material) return state;

      const updatedMaterial = {
        ...material,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      return {
        materials: { ...state.materials, [id]: updatedMaterial },
        editingMaterial: state.editingMaterial?.id === id ? updatedMaterial : state.editingMaterial,
      };
    });
  },

  deleteMaterial: async (id) => {
    try {
      await libraryApi.deleteMaterial(id);
      set(state => {
        const { [id]: deleted, ...remaining } = state.materials;
        return {
          materials: remaining,
          selectedMaterialId: state.selectedMaterialId === id ? null : state.selectedMaterialId,
          editingMaterial: state.editingMaterial?.id === id ? null : state.editingMaterial,
          isEditorOpen: state.editingMaterial?.id === id ? false : state.isEditorOpen,
        };
      });
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  duplicateMaterial: (id) => {
    const { materials } = get();
    const original = materials[id];
    if (!original) return null;

    const newId = `mat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const duplicate = {
      ...original,
      id: newId,
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set(state => ({
      materials: { ...state.materials, [newId]: duplicate },
    }));

    return duplicate;
  },

  saveMaterial: async (material) => {
    try {
      await libraryApi.saveMaterial(material.id, material);
      set(state => ({
        materials: { ...state.materials, [material.id]: material },
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Actions - Categories
  addCategory: (name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;

    set(state => {
      if (state.categories.includes(trimmed)) return state;
      return { categories: [...state.categories, trimmed] };
    });
    return true;
  },

  removeCategory: (name) => {
    set(state => ({
      categories: state.categories.filter(c => c !== name),
    }));
  },

  renameCategory: (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed) return false;

    set(state => {
      // Update category list
      const categories = state.categories.map(c => c === oldName ? trimmed : c);

      // Update materials with old category
      const materials = { ...state.materials };
      Object.values(materials).forEach(mat => {
        if (mat.category === oldName) {
          mat.category = trimmed;
        }
      });

      return { categories, materials };
    });
    return true;
  },

  updateCategories: async (categories) => {
    try {
      await libraryApi.updateCategories(categories);
      set({ categories });
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Actions - UI
  selectMaterial: (id) => set({ selectedMaterialId: id }),

  openEditor: (material = null) => {
    if (material) {
      set({
        editingMaterial: { ...material },
        isEditorOpen: true,
        selectedMaterialId: material.id,
      });
    } else {
      // Create new material
      get().createMaterial();
    }
  },

  closeEditor: () => set({
    isEditorOpen: false,
    editingMaterial: null,
  }),

  updateEditingMaterial: (updates) => {
    set(state => ({
      editingMaterial: state.editingMaterial
        ? { ...state.editingMaterial, ...updates }
        : null,
    }));
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveCategory: (category) => set({ activeCategory: category }),

  // Actions - Preview
  setPreviewShape: (shape) => set({ previewShape: shape }),
  setPreviewEnvironment: (env) => set({ previewEnvironment: env }),
  togglePreviewAutoRotate: () => set(state => ({ previewAutoRotate: !state.previewAutoRotate })),

  toggleCompareMode: () => set(state => ({
    compareMode: !state.compareMode,
    compareMaterialId: state.compareMode ? null : state.compareMaterialId,
  })),
  setCompareMaterial: (id) => set({ compareMaterialId: id }),

  // Actions - Import/Export
  exportLibrary: () => {
    const { materials, categories } = get();
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      materials,
      categories,
    };
  },

  importLibrary: (data, mode = 'merge') => {
    // mode: 'merge' | 'replace'
    if (!data || !data.materials) {
      throw new Error('Invalid import data');
    }

    set(state => {
      if (mode === 'replace') {
        return {
          materials: data.materials,
          categories: data.categories || DEFAULT_CATEGORIES,
        };
      }

      // Merge mode - add new materials, skip existing
      const mergedMaterials = { ...state.materials };
      Object.entries(data.materials).forEach(([id, mat]) => {
        if (!mergedMaterials[id]) {
          mergedMaterials[id] = mat;
        }
      });

      // Merge categories
      const mergedCategories = [...new Set([...state.categories, ...(data.categories || [])])];

      return {
        materials: mergedMaterials,
        categories: mergedCategories,
      };
    });
  },

  // Selectors / Computed
  getMaterial: (id) => get().materials[id] || null,

  getFilteredMaterials: () => {
    const { materials, searchQuery, activeCategory } = get();
    let filtered = Object.values(materials);

    if (activeCategory) {
      filtered = filtered.filter(m => m.category === activeCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query)
      );
    }

    // Sort by updatedAt (most recent first)
    return filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  getMaterialCount: () => Object.keys(get().materials).length,

  getCategoryCount: (category) => {
    const { materials } = get();
    return Object.values(materials).filter(m => m.category === category).length;
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useMaterialStore;
