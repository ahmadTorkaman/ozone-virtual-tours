# Phase 4: Material System

> **Scope**: Material library, editor, and application to scene objects
> **Prerequisites**: Phase 3 complete (scene viewer working)
> **Outputs**: Full material editing workflow with local storage

---

## Overview

This phase implements the material system for the Tauri desktop app:

1. Material library UI (browse, search, filter)
2. Material editor (create/edit MeshPhysicalMaterial)
3. Apply materials to scene objects
4. Save/load material mappings to SQLite
5. Texture import from local filesystem
6. Material preview (sphere/cube)

---

## Context for New Sessions

If you're starting a new Claude session to work on this phase:

- **Project**: Ozone Studio - 3D scene viewer (Tauri desktop app)
- **Current State**: Phase 3 complete (scene viewer with object selection)
- **Working Directory**: `C:/Users/Lion/ozone-virtual-tours`
- **Focus**: Building the material library and editor
- **Storage**: Local SQLite database via Tauri commands

The material system uses **MeshPhysicalMaterial** with all properties:
- Core: color, metalness, roughness, opacity
- Clearcoat, Sheen, Transmission, Iridescence, Anisotropy
- Texture maps: albedo, normal, roughness, metalness, AO, emissive

Read `/docs/ARCHITECTURE.md` for full context.

---

## Task Checklist

### 4.1 Rust Material Commands

Add to `src-tauri/src/commands/materials.rs`:

```rust
use crate::db::Database;
use crate::models::{Material, MaterialCategory, MaterialMapping, CreateMaterial, UpdateMaterial};
use tauri::State;
use std::sync::Mutex;

// ============================================
// MATERIALS CRUD
// ============================================

#[tauri::command]
pub fn list_materials(db: State<Mutex<Database>>) -> Result<Vec<Material>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.list_materials().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_material(id: &str, db: State<Mutex<Database>>) -> Result<Material, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_material(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_material(data: CreateMaterial, db: State<Mutex<Database>>) -> Result<Material, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.create_material(data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_material(id: &str, data: UpdateMaterial, db: State<Mutex<Database>>) -> Result<Material, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.update_material(id, data).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_material(id: &str, db: State<Mutex<Database>>) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.delete_material(id).map_err(|e| e.to_string())
}

// ============================================
// CATEGORIES
// ============================================

#[tauri::command]
pub fn list_material_categories(db: State<Mutex<Database>>) -> Result<Vec<MaterialCategory>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.list_material_categories().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_material_category(name: &str, db: State<Mutex<Database>>) -> Result<MaterialCategory, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.create_material_category(name).map_err(|e| e.to_string())
}

// ============================================
// MATERIAL MAPPINGS (Scene -> Object -> Material)
// ============================================

#[tauri::command]
pub fn get_scene_material_mappings(scene_id: &str, db: State<Mutex<Database>>) -> Result<Vec<MaterialMapping>, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.get_material_mappings(scene_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_material_mapping(
    scene_id: &str,
    object_name: &str,
    material_id: &str,
    db: State<Mutex<Database>>
) -> Result<MaterialMapping, String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.set_material_mapping(scene_id, object_name, material_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn remove_material_mapping(scene_id: &str, object_name: &str, db: State<Mutex<Database>>) -> Result<(), String> {
    let db = db.lock().map_err(|e| e.to_string())?;
    db.remove_material_mapping(scene_id, object_name).map_err(|e| e.to_string())
}

// ============================================
// TEXTURE FILE IMPORT
// ============================================

#[tauri::command]
pub async fn import_texture(
    source_path: &str,
    material_id: &str,
    texture_type: &str, // "map", "normal", "roughness", "metalness", "ao", "emissive"
    db: State<'_, Mutex<Database>>,
) -> Result<String, String> {
    use std::path::Path;
    use std::fs;

    // Get data path from settings
    let data_path = {
        let db = db.lock().map_err(|e| e.to_string())?;
        db.get_settings().map_err(|e| e.to_string())?.data_path
    };

    // Create textures directory
    let textures_dir = Path::new(&data_path).join("materials").join(material_id);
    fs::create_dir_all(&textures_dir).map_err(|e| e.to_string())?;

    // Get file extension from source
    let source = Path::new(source_path);
    let extension = source.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png");

    // Create destination filename
    let dest_filename = format!("{}_{}.{}", material_id, texture_type, extension);
    let dest_path = textures_dir.join(&dest_filename);

    // Copy file
    fs::copy(source_path, &dest_path).map_err(|e| e.to_string())?;

    // Return the relative path (for storage in DB)
    let relative_path = format!("materials/{}/{}", material_id, dest_filename);

    // Update material in database with texture path
    {
        let db = db.lock().map_err(|e| e.to_string())?;
        let mut update = UpdateMaterial::default();
        match texture_type {
            "map" => update.map_path = Some(Some(relative_path.clone())),
            "normal" => update.normal_map_path = Some(Some(relative_path.clone())),
            "roughness" => update.roughness_map_path = Some(Some(relative_path.clone())),
            "metalness" => update.metalness_map_path = Some(Some(relative_path.clone())),
            "ao" => update.ao_map_path = Some(Some(relative_path.clone())),
            "emissive" => update.emissive_map_path = Some(Some(relative_path.clone())),
            _ => return Err(format!("Unknown texture type: {}", texture_type)),
        }
        db.update_material(material_id, update).map_err(|e| e.to_string())?;
    }

    Ok(relative_path)
}
```

### 4.2 Rust Material Models

Add to `src-tauri/src/models/material.rs`:

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Material {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub thumbnail_path: Option<String>,

    // Core PBR
    pub color: Option<String>,
    pub metalness: f64,
    pub roughness: f64,
    pub opacity: f64,
    pub transparent: bool,

    // Clearcoat
    pub clearcoat: f64,
    pub clearcoat_roughness: f64,

    // Sheen
    pub sheen: f64,
    pub sheen_roughness: f64,
    pub sheen_color: Option<String>,

    // Transmission
    pub transmission: f64,
    pub thickness: f64,
    pub ior: f64,

    // Iridescence
    pub iridescence: f64,
    pub iridescence_ior: f64,

    // Anisotropy
    pub anisotropy: f64,
    pub anisotropy_rotation: f64,

    // Texture paths (relative to data directory)
    pub map_path: Option<String>,
    pub normal_map_path: Option<String>,
    pub roughness_map_path: Option<String>,
    pub metalness_map_path: Option<String>,
    pub ao_map_path: Option<String>,
    pub emissive_map_path: Option<String>,

    // Category
    pub category_id: Option<String>,

    // Timestamps
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMaterial {
    pub name: String,
    pub description: Option<String>,
    pub color: Option<String>,
    pub metalness: Option<f64>,
    pub roughness: Option<f64>,
    pub opacity: Option<f64>,
    pub transparent: Option<bool>,
    pub clearcoat: Option<f64>,
    pub clearcoat_roughness: Option<f64>,
    pub sheen: Option<f64>,
    pub sheen_roughness: Option<f64>,
    pub sheen_color: Option<String>,
    pub transmission: Option<f64>,
    pub thickness: Option<f64>,
    pub ior: Option<f64>,
    pub iridescence: Option<f64>,
    pub iridescence_ior: Option<f64>,
    pub anisotropy: Option<f64>,
    pub anisotropy_rotation: Option<f64>,
    pub category_id: Option<String>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct UpdateMaterial {
    pub name: Option<String>,
    pub description: Option<Option<String>>,
    pub color: Option<Option<String>>,
    pub metalness: Option<f64>,
    pub roughness: Option<f64>,
    pub opacity: Option<f64>,
    pub transparent: Option<bool>,
    pub clearcoat: Option<f64>,
    pub clearcoat_roughness: Option<f64>,
    pub sheen: Option<f64>,
    pub sheen_roughness: Option<f64>,
    pub sheen_color: Option<Option<String>>,
    pub transmission: Option<f64>,
    pub thickness: Option<f64>,
    pub ior: Option<f64>,
    pub iridescence: Option<f64>,
    pub iridescence_ior: Option<f64>,
    pub anisotropy: Option<f64>,
    pub anisotropy_rotation: Option<f64>,
    pub category_id: Option<Option<String>>,
    pub map_path: Option<Option<String>>,
    pub normal_map_path: Option<Option<String>>,
    pub roughness_map_path: Option<Option<String>>,
    pub metalness_map_path: Option<Option<String>>,
    pub ao_map_path: Option<Option<String>>,
    pub emissive_map_path: Option<Option<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialCategory {
    pub id: String,
    pub name: String,
    pub order: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaterialMapping {
    pub id: String,
    pub scene_id: String,
    pub object_name: String,
    pub material_id: String,
    pub created_at: String,
    pub updated_at: String,
}
```

### 4.3 Create Material Types

Create `client/src/types/material.ts`:

```typescript
export interface Material {
  id: string;
  name: string;
  description?: string;
  thumbnailPath?: string;

  // Core
  color?: string;
  metalness: number;
  roughness: number;
  opacity: number;
  transparent: boolean;

  // Clearcoat
  clearcoat: number;
  clearcoatRoughness: number;

  // Sheen
  sheen: number;
  sheenRoughness: number;
  sheenColor?: string;

  // Transmission
  transmission: number;
  thickness: number;
  ior: number;

  // Iridescence
  iridescence: number;
  iridescenceIor: number;

  // Anisotropy
  anisotropy: number;
  anisotropyRotation: number;

  // Texture paths (relative to data directory)
  mapPath?: string;
  normalMapPath?: string;
  roughnessMapPath?: string;
  metalnessMapPath?: string;
  aoMapPath?: string;
  emissiveMapPath?: string;

  // Category
  categoryId?: string;

  // Meta
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaterial {
  name: string;
  description?: string;
  color?: string;
  metalness?: number;
  roughness?: number;
  opacity?: number;
  transparent?: boolean;
  clearcoat?: number;
  clearcoatRoughness?: number;
  sheen?: number;
  sheenRoughness?: number;
  sheenColor?: string;
  transmission?: number;
  thickness?: number;
  ior?: number;
  iridescence?: number;
  iridescenceIor?: number;
  anisotropy?: number;
  anisotropyRotation?: number;
  categoryId?: string;
}

export interface MaterialCategory {
  id: string;
  name: string;
  order: number;
}

export interface MaterialMapping {
  id: string;
  sceneId: string;
  objectName: string;
  materialId: string;
  createdAt: string;
  updatedAt: string;
}

// Default values for new material
export function getDefaultMaterial(): Partial<Material> {
  return {
    name: 'New Material',
    color: '#ffffff',
    metalness: 0,
    roughness: 1,
    opacity: 1,
    transparent: false,
    clearcoat: 0,
    clearcoatRoughness: 0,
    sheen: 0,
    sheenRoughness: 1,
    sheenColor: '#ffffff',
    transmission: 0,
    thickness: 0,
    ior: 1.5,
    iridescence: 0,
    iridescenceIor: 1.3,
    anisotropy: 0,
    anisotropyRotation: 0,
  };
}
```

### 4.4 Create Tauri Material Service

Create `client/src/services/materialService.ts`:

```typescript
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { Material, CreateMaterial, MaterialCategory, MaterialMapping } from '@/types/material';

export const materialService = {
  // ============================================
  // MATERIALS CRUD
  // ============================================

  async list(): Promise<Material[]> {
    return invoke<Material[]>('list_materials');
  },

  async get(id: string): Promise<Material> {
    return invoke<Material>('get_material', { id });
  },

  async create(data: CreateMaterial): Promise<Material> {
    return invoke<Material>('create_material', { data });
  },

  async update(id: string, data: Partial<Material>): Promise<Material> {
    return invoke<Material>('update_material', { id, data });
  },

  async delete(id: string): Promise<void> {
    return invoke('delete_material', { id });
  },

  // ============================================
  // CATEGORIES
  // ============================================

  async listCategories(): Promise<MaterialCategory[]> {
    return invoke<MaterialCategory[]>('list_material_categories');
  },

  async createCategory(name: string): Promise<MaterialCategory> {
    return invoke<MaterialCategory>('create_material_category', { name });
  },

  // ============================================
  // MATERIAL MAPPINGS
  // ============================================

  async getMappings(sceneId: string): Promise<MaterialMapping[]> {
    return invoke<MaterialMapping[]>('get_scene_material_mappings', { sceneId });
  },

  async setMapping(sceneId: string, objectName: string, materialId: string): Promise<MaterialMapping> {
    return invoke<MaterialMapping>('set_material_mapping', { sceneId, objectName, materialId });
  },

  async removeMapping(sceneId: string, objectName: string): Promise<void> {
    return invoke('remove_material_mapping', { sceneId, objectName });
  },

  // ============================================
  // TEXTURE IMPORT
  // ============================================

  /**
   * Open a file dialog to select a texture file and import it.
   */
  async importTexture(
    materialId: string,
    textureType: 'map' | 'normal' | 'roughness' | 'metalness' | 'ao' | 'emissive'
  ): Promise<string | null> {
    // Open file picker
    const selected = await open({
      multiple: false,
      filters: [
        {
          name: 'Images',
          extensions: ['png', 'jpg', 'jpeg', 'webp', 'tga', 'exr'],
        },
      ],
    });

    if (!selected) return null;

    // Import the texture
    const relativePath = await invoke<string>('import_texture', {
      sourcePath: selected,
      materialId,
      textureType,
    });

    return relativePath;
  },
};
```

### 4.5 Create Material Store

Create `client/src/stores/materialStore.ts`:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Material, MaterialCategory } from '@/types/material';
import { getDefaultMaterial } from '@/types/material';

interface MaterialState {
  // Library
  materials: Material[];
  categories: MaterialCategory[];
  isLoading: boolean;
  error: string | null;

  // Filters
  searchQuery: string;
  selectedCategoryId: string | null;

  // Editor
  editingMaterial: Partial<Material> | null;
  isEditorOpen: boolean;
  isSaving: boolean;

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

  // Actions - Editor
  openEditor: (material?: Partial<Material>) => void;
  closeEditor: () => void;
  updateEditingMaterial: (updates: Partial<Material>) => void;
  setSaving: (saving: boolean) => void;

  // Computed
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
        })),

      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Filter actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (categoryId) => set({ selectedCategoryId: categoryId }),

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

      // Computed
      getFilteredMaterials: () => {
        const { materials, searchQuery, selectedCategoryId } = get();

        return materials.filter((material) => {
          // Category filter
          if (selectedCategoryId && material.categoryId !== selectedCategoryId) {
            return false;
          }

          // Search filter
          if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
              material.name.toLowerCase().includes(query) ||
              material.description?.toLowerCase().includes(query)
            );
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
```

### 4.6 Create Material Library Component

Create `client/src/features/materials/MaterialLibrary.tsx`:

```tsx
import { useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { useMaterialStore } from '@/stores/materialStore';
import { materialService } from '@/services/materialService';
import { MaterialCard } from './MaterialCard';
import { MaterialEditor } from './MaterialEditor';

interface MaterialLibraryProps {
  onSelect?: (materialId: string) => void;
  selectedMaterialId?: string | null;
}

export function MaterialLibrary({ onSelect, selectedMaterialId }: MaterialLibraryProps) {
  const {
    categories,
    searchQuery,
    selectedCategoryId,
    isLoading,
    isEditorOpen,
    setMaterials,
    setCategories,
    setSearchQuery,
    setSelectedCategory,
    setLoading,
    openEditor,
    getFilteredMaterials,
  } = useMaterialStore();

  // Load materials and categories on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [materials, cats] = await Promise.all([
          materialService.list(),
          materialService.listCategories(),
        ]);
        setMaterials(materials);
        setCategories(cats);
      } catch (error) {
        console.error('Failed to load materials:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [setMaterials, setCategories, setLoading]);

  const filteredMaterials = getFilteredMaterials();

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Materials</h2>
          <button
            onClick={() => openEditor()}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded text-sm"
          >
            <Plus size={16} />
            New
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="px-4 py-2 border-b border-gray-700 overflow-x-auto">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
              !selectedCategoryId
                ? 'bg-primary-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded text-sm whitespace-nowrap ${
                selectedCategoryId === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Material grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No materials found</p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary-400 hover:underline mt-2"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                isSelected={selectedMaterialId === material.id}
                onClick={() => onSelect?.(material.id)}
                onEdit={() => openEditor(material)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Material Editor Modal */}
      {isEditorOpen && <MaterialEditor />}
    </div>
  );
}
```

Create `client/src/features/materials/MaterialCard.tsx`:

```tsx
import { Pencil } from 'lucide-react';
import type { Material } from '@/types/material';
import { MaterialPreview } from './MaterialPreview';
import { useSettingsStore } from '@/stores/settingsStore';
import { getAssetUrl } from '@/lib/tauri-file';

interface MaterialCardProps {
  material: Material;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
}

export function MaterialCard({ material, isSelected, onClick, onEdit }: MaterialCardProps) {
  const dataPath = useSettingsStore((s) => s.settings?.dataPath);

  // Get thumbnail URL if exists
  const thumbnailUrl = material.thumbnailPath && dataPath
    ? getAssetUrl(`${dataPath}/${material.thumbnailPath}`)
    : null;

  return (
    <div
      className={`relative group rounded-lg overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-primary-500 bg-gray-700'
          : 'bg-gray-700 hover:bg-gray-600'
      }`}
      onClick={onClick}
    >
      {/* Preview */}
      <div className="aspect-square">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={material.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <MaterialPreview material={material} size={120} />
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-white text-sm font-medium truncate">{material.name}</p>
        <p className="text-gray-400 text-xs truncate">
          {material.metalness > 0.5 && 'Metallic'}
          {material.metalness > 0.5 && material.transmission > 0 && ' • '}
          {material.transmission > 0 && 'Glass'}
          {material.metalness <= 0.5 && material.transmission === 0 && 'Standard'}
        </p>
      </div>

      {/* Edit button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.();
        }}
        className="absolute top-2 right-2 p-1.5 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil size={14} className="text-white" />
      </button>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-2 left-2 w-3 h-3 bg-primary-500 rounded-full" />
      )}
    </div>
  );
}
```

### 4.7 Create Material Preview Component

Create `client/src/features/materials/MaterialPreview.tsx`:

```tsx
import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import type { Material } from '@/types/material';

interface MaterialPreviewProps {
  material: Partial<Material>;
  size?: number;
  shape?: 'sphere' | 'cube' | 'plane';
  rotate?: boolean;
}

export function MaterialPreview({
  material,
  size = 200,
  shape = 'sphere',
  rotate = true,
}: MaterialPreviewProps) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        gl={{ preserveDrawingBuffer: true }}
      >
        <PreviewContent material={material} shape={shape} rotate={rotate} />
      </Canvas>
    </div>
  );
}

interface PreviewContentProps {
  material: Partial<Material>;
  shape: 'sphere' | 'cube' | 'plane';
  rotate: boolean;
}

function PreviewContent({ material, shape, rotate }: PreviewContentProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Create Three.js material
  const threeMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: material.color ? new THREE.Color(material.color) : undefined,
      metalness: material.metalness ?? 0,
      roughness: material.roughness ?? 1,
      opacity: material.opacity ?? 1,
      transparent: material.transparent ?? false,
      clearcoat: material.clearcoat ?? 0,
      clearcoatRoughness: material.clearcoatRoughness ?? 0,
      sheen: material.sheen ?? 0,
      sheenRoughness: material.sheenRoughness ?? 1,
      sheenColor: material.sheenColor ? new THREE.Color(material.sheenColor) : undefined,
      transmission: material.transmission ?? 0,
      thickness: material.thickness ?? 0,
      ior: material.ior ?? 1.5,
      iridescence: material.iridescence ?? 0,
      iridescenceIOR: material.iridescenceIor ?? 1.3,
      anisotropy: material.anisotropy ?? 0,
      anisotropyRotation: material.anisotropyRotation ?? 0,
    });
  }, [material]);

  // Rotate mesh
  useFrame((_, delta) => {
    if (rotate && meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  // Geometry based on shape
  const geometry = useMemo(() => {
    switch (shape) {
      case 'cube':
        return new THREE.BoxGeometry(1.2, 1.2, 1.2);
      case 'plane':
        return new THREE.PlaneGeometry(2, 2);
      case 'sphere':
      default:
        return new THREE.SphereGeometry(0.8, 64, 64);
    }
  }, [shape]);

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Environment preset="studio" background={false} />

      <mesh ref={meshRef} geometry={geometry} material={threeMaterial} />
    </>
  );
}
```

### 4.8 Create Material Editor Component

Create `client/src/features/materials/MaterialEditor.tsx`:

```tsx
import { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { useMaterialStore } from '@/stores/materialStore';
import { materialService } from '@/services/materialService';
import { MaterialPreview } from './MaterialPreview';
import { PropertySlider } from './PropertySlider';
import { ColorPicker } from './ColorPicker';
import { TextureUpload } from './TextureUpload';
import type { Material } from '@/types/material';

export function MaterialEditor() {
  const {
    editingMaterial,
    isSaving,
    closeEditor,
    updateEditingMaterial,
    setSaving,
    addMaterial,
    updateMaterial,
    removeMaterial,
  } = useMaterialStore();

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'textures'>('basic');

  const handleSave = async () => {
    if (!editingMaterial || !editingMaterial.name) return;

    setSaving(true);
    try {
      if (editingMaterial.id) {
        // Update existing
        const updated = await materialService.update(editingMaterial.id, editingMaterial);
        updateMaterial(editingMaterial.id, updated);
      } else {
        // Create new
        const created = await materialService.create({
          name: editingMaterial.name,
          description: editingMaterial.description,
          color: editingMaterial.color,
          metalness: editingMaterial.metalness,
          roughness: editingMaterial.roughness,
          opacity: editingMaterial.opacity,
          transparent: editingMaterial.transparent,
          clearcoat: editingMaterial.clearcoat,
          clearcoatRoughness: editingMaterial.clearcoatRoughness,
          sheen: editingMaterial.sheen,
          sheenRoughness: editingMaterial.sheenRoughness,
          sheenColor: editingMaterial.sheenColor,
          transmission: editingMaterial.transmission,
          thickness: editingMaterial.thickness,
          ior: editingMaterial.ior,
          iridescence: editingMaterial.iridescence,
          iridescenceIor: editingMaterial.iridescenceIor,
          anisotropy: editingMaterial.anisotropy,
          anisotropyRotation: editingMaterial.anisotropyRotation,
          categoryId: editingMaterial.categoryId,
        });
        addMaterial(created);
      }
      closeEditor();
    } catch (error) {
      console.error('Failed to save material:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingMaterial?.id) return;
    if (!confirm('Delete this material?')) return;

    try {
      await materialService.delete(editingMaterial.id);
      removeMaterial(editingMaterial.id);
      closeEditor();
    } catch (error) {
      console.error('Failed to delete material:', error);
    }
  };

  if (!editingMaterial) return null;

  const isNew = !editingMaterial.id;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            {isNew ? 'New Material' : 'Edit Material'}
          </h2>
          <button onClick={closeEditor} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Preview panel */}
          <div className="w-64 bg-gray-900 p-4 flex flex-col items-center">
            <MaterialPreview material={editingMaterial} size={200} />

            <input
              type="text"
              value={editingMaterial.name || ''}
              onChange={(e) => updateEditingMaterial({ name: e.target.value })}
              className="w-full mt-4 bg-gray-700 text-white px-3 py-2 rounded text-center"
              placeholder="Material name"
            />

            <textarea
              value={editingMaterial.description || ''}
              onChange={(e) => updateEditingMaterial({ description: e.target.value })}
              className="w-full mt-2 bg-gray-700 text-white px-3 py-2 rounded text-sm resize-none"
              placeholder="Description (optional)"
              rows={3}
            />
          </div>

          {/* Properties panel */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              {(['basic', 'advanced', 'textures'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? 'text-white border-b-2 border-primary-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'basic' && (
                <BasicProperties
                  material={editingMaterial}
                  onChange={updateEditingMaterial}
                />
              )}
              {activeTab === 'advanced' && (
                <AdvancedProperties
                  material={editingMaterial}
                  onChange={updateEditingMaterial}
                />
              )}
              {activeTab === 'textures' && (
                <TextureProperties
                  material={editingMaterial}
                  onChange={updateEditingMaterial}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <div>
            {!isNew && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 text-red-400 hover:text-red-300"
              >
                <Trash2 size={18} />
                Delete
              </button>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={closeEditor}
              className="px-4 py-2 text-gray-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !editingMaterial.name}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white px-4 py-2 rounded"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Basic properties section
function BasicProperties({
  material,
  onChange,
}: {
  material: Partial<Material>;
  onChange: (updates: Partial<Material>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Color</label>
        <ColorPicker
          value={material.color || '#ffffff'}
          onChange={(color) => onChange({ color })}
        />
      </div>

      <PropertySlider
        label="Metalness"
        value={material.metalness ?? 0}
        min={0}
        max={1}
        step={0.01}
        onChange={(metalness) => onChange({ metalness })}
      />

      <PropertySlider
        label="Roughness"
        value={material.roughness ?? 1}
        min={0}
        max={1}
        step={0.01}
        onChange={(roughness) => onChange({ roughness })}
      />

      <PropertySlider
        label="Opacity"
        value={material.opacity ?? 1}
        min={0}
        max={1}
        step={0.01}
        onChange={(opacity) => onChange({ opacity, transparent: opacity < 1 })}
      />
    </div>
  );
}

// Advanced properties section
function AdvancedProperties({
  material,
  onChange,
}: {
  material: Partial<Material>;
  onChange: (updates: Partial<Material>) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Clearcoat */}
      <div>
        <h3 className="text-white font-medium mb-4">Clearcoat</h3>
        <div className="space-y-4 pl-4">
          <PropertySlider
            label="Clearcoat"
            value={material.clearcoat ?? 0}
            min={0}
            max={1}
            step={0.01}
            onChange={(clearcoat) => onChange({ clearcoat })}
          />
          <PropertySlider
            label="Clearcoat Roughness"
            value={material.clearcoatRoughness ?? 0}
            min={0}
            max={1}
            step={0.01}
            onChange={(clearcoatRoughness) => onChange({ clearcoatRoughness })}
          />
        </div>
      </div>

      {/* Sheen */}
      <div>
        <h3 className="text-white font-medium mb-4">Sheen (Fabric)</h3>
        <div className="space-y-4 pl-4">
          <PropertySlider
            label="Sheen"
            value={material.sheen ?? 0}
            min={0}
            max={1}
            step={0.01}
            onChange={(sheen) => onChange({ sheen })}
          />
          <PropertySlider
            label="Sheen Roughness"
            value={material.sheenRoughness ?? 1}
            min={0}
            max={1}
            step={0.01}
            onChange={(sheenRoughness) => onChange({ sheenRoughness })}
          />
          <div>
            <label className="block text-sm text-gray-400 mb-2">Sheen Color</label>
            <ColorPicker
              value={material.sheenColor || '#ffffff'}
              onChange={(sheenColor) => onChange({ sheenColor })}
            />
          </div>
        </div>
      </div>

      {/* Transmission (Glass) */}
      <div>
        <h3 className="text-white font-medium mb-4">Transmission (Glass)</h3>
        <div className="space-y-4 pl-4">
          <PropertySlider
            label="Transmission"
            value={material.transmission ?? 0}
            min={0}
            max={1}
            step={0.01}
            onChange={(transmission) => onChange({ transmission })}
          />
          <PropertySlider
            label="Thickness"
            value={material.thickness ?? 0}
            min={0}
            max={5}
            step={0.1}
            onChange={(thickness) => onChange({ thickness })}
          />
          <PropertySlider
            label="IOR (Index of Refraction)"
            value={material.ior ?? 1.5}
            min={1}
            max={2.5}
            step={0.01}
            onChange={(ior) => onChange({ ior })}
          />
        </div>
      </div>

      {/* Iridescence */}
      <div>
        <h3 className="text-white font-medium mb-4">Iridescence</h3>
        <div className="space-y-4 pl-4">
          <PropertySlider
            label="Iridescence"
            value={material.iridescence ?? 0}
            min={0}
            max={1}
            step={0.01}
            onChange={(iridescence) => onChange({ iridescence })}
          />
          <PropertySlider
            label="Iridescence IOR"
            value={material.iridescenceIor ?? 1.3}
            min={1}
            max={2.5}
            step={0.01}
            onChange={(iridescenceIor) => onChange({ iridescenceIor })}
          />
        </div>
      </div>

      {/* Anisotropy */}
      <div>
        <h3 className="text-white font-medium mb-4">Anisotropy (Brushed Metal)</h3>
        <div className="space-y-4 pl-4">
          <PropertySlider
            label="Anisotropy"
            value={material.anisotropy ?? 0}
            min={-1}
            max={1}
            step={0.01}
            onChange={(anisotropy) => onChange({ anisotropy })}
          />
          <PropertySlider
            label="Rotation"
            value={material.anisotropyRotation ?? 0}
            min={0}
            max={Math.PI}
            step={0.01}
            onChange={(anisotropyRotation) => onChange({ anisotropyRotation })}
          />
        </div>
      </div>
    </div>
  );
}

// Texture properties section
function TextureProperties({
  material,
  onChange,
}: {
  material: Partial<Material>;
  onChange: (updates: Partial<Material>) => void;
}) {
  const handleImport = async (
    textureType: 'map' | 'normal' | 'roughness' | 'metalness' | 'ao' | 'emissive'
  ) => {
    if (!material.id) {
      alert('Please save the material first before adding textures.');
      return;
    }

    const path = await materialService.importTexture(material.id, textureType);
    if (path) {
      const updateKey = `${textureType}Path` as keyof Material;
      onChange({ [updateKey]: path });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      <TextureUpload
        label="Albedo Map"
        value={material.mapPath}
        onImport={() => handleImport('map')}
        onClear={() => onChange({ mapPath: undefined })}
      />
      <TextureUpload
        label="Normal Map"
        value={material.normalMapPath}
        onImport={() => handleImport('normal')}
        onClear={() => onChange({ normalMapPath: undefined })}
      />
      <TextureUpload
        label="Roughness Map"
        value={material.roughnessMapPath}
        onImport={() => handleImport('roughness')}
        onClear={() => onChange({ roughnessMapPath: undefined })}
      />
      <TextureUpload
        label="Metalness Map"
        value={material.metalnessMapPath}
        onImport={() => handleImport('metalness')}
        onClear={() => onChange({ metalnessMapPath: undefined })}
      />
      <TextureUpload
        label="AO Map"
        value={material.aoMapPath}
        onImport={() => handleImport('ao')}
        onClear={() => onChange({ aoMapPath: undefined })}
      />
      <TextureUpload
        label="Emissive Map"
        value={material.emissiveMapPath}
        onImport={() => handleImport('emissive')}
        onClear={() => onChange({ emissiveMapPath: undefined })}
      />
    </div>
  );
}
```

### 4.9 Create Helper Components

Create `client/src/features/materials/PropertySlider.tsx`:

```tsx
interface PropertySliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

export function PropertySlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: PropertySliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-gray-400">{label}</label>
        <span className="text-sm text-white font-mono">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
      />
    </div>
  );
}
```

Create `client/src/features/materials/ColorPicker.tsx`:

```tsx
import { useState } from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const presetColors = [
    '#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080',
    '#c0c0c0', '#808080', '#8b4513', '#228b22', '#4169e1',
  ];

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded border-2 border-gray-600"
          style={{ backgroundColor: value }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-gray-700 text-white px-3 py-2 rounded font-mono text-sm"
          placeholder="#ffffff"
        />
      </div>

      {isOpen && (
        <div className="absolute top-12 left-0 bg-gray-700 rounded-lg p-3 shadow-lg z-10">
          <div className="grid grid-cols-5 gap-2 mb-3">
            {presetColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onChange(color);
                  setIsOpen(false);
                }}
                className="w-8 h-8 rounded border border-gray-500 hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-8 rounded cursor-pointer"
          />
        </div>
      )}
    </div>
  );
}
```

Create `client/src/features/materials/TextureUpload.tsx`:

```tsx
import { Upload, X } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { getAssetUrl } from '@/lib/tauri-file';

interface TextureUploadProps {
  label: string;
  value?: string;
  onImport: () => void;
  onClear: () => void;
}

export function TextureUpload({ label, value, onImport, onClear }: TextureUploadProps) {
  const dataPath = useSettingsStore((s) => s.settings?.dataPath);

  // Get texture URL if exists
  const textureUrl = value && dataPath
    ? getAssetUrl(`${dataPath}/${value}`)
    : null;

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">{label}</label>

      {textureUrl ? (
        <div className="relative group">
          <img
            src={textureUrl}
            alt={label}
            className="w-full h-24 object-cover rounded bg-gray-700"
          />
          <button
            onClick={onClear}
            className="absolute top-1 right-1 p-1 bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} className="text-white" />
          </button>
        </div>
      ) : (
        <button
          onClick={onImport}
          className="w-full h-24 border-2 border-dashed border-gray-600 rounded flex flex-col items-center justify-center text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
        >
          <Upload size={24} />
          <span className="text-xs mt-1">Import</span>
        </button>
      )}
    </div>
  );
}
```

### 4.10 Export Materials Feature

Create `client/src/features/materials/index.ts`:

```typescript
export { MaterialLibrary } from './MaterialLibrary';
export { MaterialCard } from './MaterialCard';
export { MaterialEditor } from './MaterialEditor';
export { MaterialPreview } from './MaterialPreview';
export { PropertySlider } from './PropertySlider';
export { ColorPicker } from './ColorPicker';
export { TextureUpload } from './TextureUpload';
```

---

## Integration with Scene Viewer

Add material application to the scene editor page:

```tsx
// In SceneEditor.tsx, add material panel and application logic
import { MaterialLibrary } from '@/features/materials';
import { createPhysicalMaterial, applyMaterialToMesh } from '@/engine/MaterialSystem';
import { materialService } from '@/services/materialService';

// Handle applying a material to the selected object
const handleApplyMaterial = async (materialId: string) => {
  const objectName = selectedObjectName;
  if (!objectName || !sceneId) return;

  // 1. Get material from store
  const material = useMaterialStore.getState().getMaterialById(materialId);
  if (!material) return;

  // 2. Create Three.js material
  const threeMaterial = await createPhysicalMaterial({
    color: material.color,
    metalness: material.metalness,
    roughness: material.roughness,
    // ... other properties
    mapPath: material.mapPath ? `${dataPath}/${material.mapPath}` : undefined,
    // ... other texture paths
  });

  // 3. Apply to mesh
  const mesh = sceneData?.meshes.get(objectName);
  if (mesh) {
    applyMaterialToMesh(mesh, threeMaterial);
  }

  // 4. Save mapping to database
  await materialService.setMapping(sceneId, objectName, materialId);

  // 5. Update local store
  useSceneStore.getState().setMaterialMapping(objectName, materialId);
};
```

---

## Verification Checklist

After completing Phase 4, verify:

- [ ] Material library loads from SQLite database
- [ ] Search and category filters work
- [ ] Material editor opens for new/edit
- [ ] All material properties can be adjusted
- [ ] Preview updates in real-time
- [ ] Materials save to local database
- [ ] Textures can be imported from local filesystem
- [ ] Textures display correctly via asset:// protocol
- [ ] Materials can be applied to scene objects
- [ ] Material mappings persist after reload

---

## Next Phase

After Phase 4 is complete, proceed to **Phase 5: VR Mode** which covers:
- WebXR session management
- VR locomotion controls
- VR UI panels
- Object selection in VR
