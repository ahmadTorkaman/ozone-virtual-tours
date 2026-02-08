import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Material, MaterialCategory } from '@/types/material';
import { getDefaultMaterial } from '@/types/material';

interface MaterialState {
  // Library state
  materials: Material[];
  categories: MaterialCategory[];
  isLoading: boolean;
  error: string | null;

  // Filters
  searchQuery: string;
  selectedCategoryId: string | null;

  // Editor state
  editingMaterial: Partial<Material> | null;
  isEditorOpen: boolean;
  isSaving: boolean;

  // Selection (for applying to objects)
  selectedMaterialId: string | null;

  // Actions - Library
  setMaterials: (materials: Material[]) => void;
  setCategories: (categories: MaterialCategory[]) => void;
  addMaterial: (material: Material) => void;
  updateMaterial: (id: string, updates: Partial<Material>) => void;
  removeMaterial: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Filters
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;

  // Actions - Selection
  setSelectedMaterial: (materialId: string | null) => void;

  // Actions - Editor
  openEditor: (material?: Partial<Material>) => void;
  closeEditor: () => void;
  updateEditingMaterial: (updates: Partial<Material>) => void;
  setSaving: (saving: boolean) => void;

  // Computed/Getters
  getFilteredMaterials: () => Material[];
  getMaterialById: (id: string) => Material | undefined;
}

const initialState = {
  materials: [],
  categories: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  selectedCategoryId: null,
  editingMaterial: null,
  isEditorOpen: false,
  isSaving: false,
  selectedMaterialId: null,
};

export const useMaterialStore = create<MaterialState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Library actions
      setMaterials: (materials) => set({ materials }),
      setCategories: (categories) => set({ categories }),

      addMaterial: (material) =>
        set((state) => ({
          materials: [...state.materials, material],
        })),

      updateMaterial: (id, updates) =>
        set((state) => ({
          materials: state.materials.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      removeMaterial: (id) =>
        set((state) => ({
          materials: state.materials.filter((m) => m.id !== id),
          // Clear selection if removed material was selected
          selectedMaterialId:
            state.selectedMaterialId === id ? null : state.selectedMaterialId,
        })),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Filter actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (categoryId) => set({ selectedCategoryId: categoryId }),

      // Selection action
      setSelectedMaterial: (materialId) => set({ selectedMaterialId: materialId }),

      // Editor actions
      openEditor: (material) =>
        set({
          editingMaterial: material || getDefaultMaterial(),
          isEditorOpen: true,
        }),

      closeEditor: () =>
        set({
          editingMaterial: null,
          isEditorOpen: false,
        }),

      updateEditingMaterial: (updates) =>
        set((state) => ({
          editingMaterial: state.editingMaterial
            ? { ...state.editingMaterial, ...updates }
            : null,
        })),

      setSaving: (saving) => set({ isSaving: saving }),

      // Computed/Getters
      getFilteredMaterials: () => {
        const { materials, searchQuery, selectedCategoryId } = get();

        return materials.filter((material) => {
          // Category filter
          if (selectedCategoryId && material.categoryId !== selectedCategoryId) {
            return false;
          }

          // Search filter (name and description)
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesName = material.name.toLowerCase().includes(query);
            const matchesDesc = material.description?.toLowerCase().includes(query);
            if (!matchesName && !matchesDesc) {
              return false;
            }
          }

          return true;
        });
      },

      getMaterialById: (id) => {
        return get().materials.find((m) => m.id === id);
      },
    }),
    { name: 'material-store' }
  )
);
