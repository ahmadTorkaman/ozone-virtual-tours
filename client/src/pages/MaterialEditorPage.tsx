import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  ArrowLeft,
  ChevronRight,
  Copy,
  Save,
  Search,
  Plus,
  Trash2,
  Circle,
  Box,
  Square,
  Cylinder,
  X,
  Upload,
} from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { useMaterialStore } from '@/stores/materialStore';
import {
  listMaterials,
  listMaterialCategories,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  uploadMaterialTexture,
  type Material as RawMaterial,
  type MaterialCategory as RawCategory,
} from '@/services/tauri';
import { parseMaterial, materialToProperties, getDefaultMaterial } from '@/types/material';
import type { Material, MaterialCategory } from '@/types/material';

type PreviewShape = 'sphere' | 'cube' | 'plane' | 'cylinder' | 'torus';

// ─── Main Page ──────────────────────────────────────────────────────
export function MaterialEditorPage() {
  const navigate = useNavigate();
  const { materialId } = useParams<{ materialId?: string }>();

  const {
    materials,
    categories,
    searchQuery,
    selectedCategoryId,
    isLoading,
    setMaterials,
    setCategories,
    setSearchQuery,
    setSelectedCategory,
    setLoading,
    getFilteredMaterials,
  } = useMaterialStore();

  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Material> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewShape, setPreviewShape] = useState<PreviewShape>('sphere');

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Select material from URL param once loaded
  useEffect(() => {
    if (materialId && materials.length > 0) {
      const mat = materials.find((m) => m.id === materialId);
      if (mat) selectMaterial(mat);
    }
  }, [materialId, materials]);

  async function loadData() {
    setLoading(true);
    try {
      const [rawMaterials, rawCategories] = await Promise.all([
        listMaterials(),
        listMaterialCategories(),
      ]);
      const parsed = rawMaterials.map((raw: RawMaterial) => parseMaterial(raw));
      setMaterials(parsed);
      setCategories(
        rawCategories.map((raw: RawCategory) => ({
          id: raw.id,
          name: raw.name,
          sortOrder: raw.sort_order,
        }))
      );
    } catch (err) {
      console.error('Failed to load materials:', err);
    } finally {
      setLoading(false);
    }
  }

  function selectMaterial(mat: Material) {
    setSelectedMaterial(mat);
    setEditDraft({ ...mat });
    setError(null);
  }

  function handleNew() {
    const defaults = getDefaultMaterial();
    setSelectedMaterial(null);
    setEditDraft(defaults);
    setError(null);
  }

  function updateDraft(updates: Partial<Material>) {
    setEditDraft((prev) => (prev ? { ...prev, ...updates } : null));
  }

  async function handleSave() {
    if (!editDraft || !editDraft.name?.trim()) {
      setError('Material name is required');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const properties = materialToProperties(editDraft);
      if (editDraft.id) {
        await updateMaterial(editDraft.id, {
          name: editDraft.name,
          description: editDraft.description || undefined,
          category_id: editDraft.categoryId || undefined,
          properties,
        });
      } else {
        const created = await createMaterial({
          name: editDraft.name,
          description: editDraft.description || undefined,
          category_id: editDraft.categoryId || undefined,
          properties,
        });
        setEditDraft((prev) => (prev ? { ...prev, id: created.id } : null));
      }
      await loadData();
      // Re-select the material after reload
      if (editDraft.id) {
        const updated = useMaterialStore.getState().materials.find((m) => m.id === editDraft.id);
        if (updated) {
          setSelectedMaterial(updated);
          setEditDraft({ ...updated });
        }
      }
    } catch (err) {
      console.error('Failed to save material:', err);
      setError(err instanceof Error ? err.message : 'Failed to save material');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDuplicate() {
    if (!editDraft?.name) return;
    setIsSaving(true);
    try {
      const properties = materialToProperties(editDraft);
      const created = await createMaterial({
        name: `${editDraft.name} (Copy)`,
        description: editDraft.description || undefined,
        category_id: editDraft.categoryId || undefined,
        properties,
      });
      await loadData();
      const newMat = useMaterialStore.getState().materials.find((m) => m.id === created.id);
      if (newMat) selectMaterial(newMat);
    } catch (err) {
      console.error('Failed to duplicate:', err);
      setError(err instanceof Error ? err.message : 'Failed to duplicate');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMaterial(id);
      await loadData();
      if (selectedMaterial?.id === id) {
        setSelectedMaterial(null);
        setEditDraft(null);
      }
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  }

  async function handleImportTexture(
    textureType: 'map' | 'normal' | 'roughness' | 'metalness' | 'ao' | 'emissive'
  ) {
    if (!editDraft?.id) {
      setError('Save the material first before adding textures.');
      return;
    }
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'tga'] }],
      });
      if (!selected) return;
      const relativePath = await uploadMaterialTexture(editDraft.id, textureType, selected as string);
      const pathKey = `${textureType}Path` as keyof Material;
      updateDraft({ [pathKey]: relativePath } as Partial<Material>);
    } catch (err) {
      console.error('Failed to import texture:', err);
      setError(err instanceof Error ? err.message : 'Failed to import texture');
    }
  }

  const filteredMaterials = getFilteredMaterials();
  const breadcrumbName = editDraft?.name || 'Select a Material';
  const isNew = editDraft && !editDraft.id;

  return (
    <div className="h-screen w-screen bg-base text-txt-primary grid grid-rows-[46px_1fr] grid-cols-[300px_1fr_320px] overflow-hidden">
      {/* ═══ Header ═══ */}
      <header className="col-span-3 flex items-center justify-between px-3 bg-surface border-b border-border select-none app-drag-region">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="w-7 h-7 flex items-center justify-center rounded text-txt-secondary hover:text-txt-primary hover:bg-hovr transition-colors flex-shrink-0 app-no-drag"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-1 text-xs min-w-0">
            <span className="text-txt-tertiary whitespace-nowrap">Ozone Studio</span>
            <ChevronRight size={12} className="text-txt-tertiary flex-shrink-0" />
            <span className="text-txt-tertiary whitespace-nowrap">Materials</span>
            <ChevronRight size={12} className="text-txt-tertiary flex-shrink-0" />
            <span className="text-txt-primary font-medium truncate">{breadcrumbName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 app-no-drag">
          {editDraft && (
            <>
              <button
                onClick={handleDuplicate}
                disabled={isSaving || !!isNew}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border border-border text-txt-secondary hover:text-txt-primary hover:bg-hovr disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <Copy size={13} />
                Duplicate
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !editDraft.name?.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-accent hover:bg-accent-hover text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <Save size={13} />
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </>
          )}
        </div>
      </header>

      {/* ═══ Left Panel – Material List ═══ */}
      <aside className="bg-surface border-r border-border flex flex-col overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 flex-shrink-0">
          <h2 className="text-[11px] font-medium text-txt-secondary uppercase tracking-wider">
            Materials
          </h2>
          <button
            onClick={handleNew}
            className="w-6 h-6 flex items-center justify-center rounded text-txt-tertiary hover:text-txt-primary hover:bg-hovr transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Search */}
        <div className="px-2.5 pb-2 flex-shrink-0">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-tertiary pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search materials..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-raised text-txt-primary text-xs pl-7 pr-3 py-1.5 rounded border border-border-subtle focus:outline-none focus:border-border-focus placeholder:text-txt-tertiary transition-colors"
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="px-2.5 pb-2 flex flex-wrap gap-1 flex-shrink-0">
          <CategoryChip
            label="All"
            active={!selectedCategoryId}
            onClick={() => setSelectedCategory(null)}
          />
          {categories.map((cat) => (
            <CategoryChip
              key={cat.id}
              label={cat.name}
              active={selectedCategoryId === cat.id}
              onClick={() => setSelectedCategory(cat.id)}
            />
          ))}
        </div>

        {/* Material list */}
        <div className="flex-1 overflow-y-auto px-1.5 py-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-xs text-txt-tertiary">No materials found</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredMaterials.map((mat) => (
                <MaterialListItem
                  key={mat.id}
                  material={mat}
                  isSelected={selectedMaterial?.id === mat.id}
                  onClick={() => selectMaterial(mat)}
                  onDuplicate={() => {
                    selectMaterial(mat);
                    handleDuplicate();
                  }}
                  onDelete={() => handleDelete(mat.id)}
                />
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ═══ Center – 3D Preview ═══ */}
      <main className="relative overflow-hidden bg-base">
        {/* Grid overlay (aesthetic) */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 70%)',
          }}
        />

        {editDraft ? (
          <Canvas
            camera={{ position: [0, 0, 3], fov: 45 }}
            gl={{ preserveDrawingBuffer: true, antialias: true }}
          >
            <PreviewScene material={editDraft} shape={previewShape} />
          </Canvas>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <Box size={32} className="text-txt-tertiary mb-3" />
            <p className="text-sm text-txt-secondary mb-1">No material selected</p>
            <p className="text-xs text-txt-tertiary">
              Select a material from the list or create a new one
            </p>
          </div>
        )}

        {/* Shape selector bar */}
        {editDraft && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-overlay border border-border rounded-lg p-1">
            {SHAPES.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setPreviewShape(id)}
                className={`w-8 h-7 flex items-center justify-center rounded text-xs transition-colors ${
                  previewShape === id
                    ? 'bg-accent-muted text-accent'
                    : 'text-txt-tertiary hover:text-txt-primary hover:bg-hovr'
                }`}
                title={label}
              >
                <Icon size={14} />
              </button>
            ))}
          </div>
        )}

        {/* Error toast */}
        {error && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500/15 border border-red-500/30 text-red-400 text-xs px-3 py-2 rounded-lg">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="hover:text-red-300">
              <X size={12} />
            </button>
          </div>
        )}
      </main>

      {/* ═══ Right Panel – Properties ═══ */}
      <aside className="bg-surface border-l border-border flex flex-col overflow-hidden">
        <div className="flex items-center px-3.5 py-2.5 flex-shrink-0">
          <h2 className="text-[11px] font-medium text-txt-secondary uppercase tracking-wider">
            Properties
          </h2>
        </div>

        {editDraft ? (
          <div className="flex-1 overflow-y-auto">
            <PropertiesPanel
              draft={editDraft}
              categories={categories}
              onChange={updateDraft}
              onImportTexture={handleImportTexture}
              onClearTexture={(key) => updateDraft({ [key]: null } as Partial<Material>)}
            />

            {/* Delete action */}
            {editDraft.id && (
              <div className="px-3.5 py-3 border-t border-border">
                <button
                  onClick={() => editDraft.id && handleDelete(editDraft.id)}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 size={13} />
                  Delete Material
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <p className="text-xs text-txt-tertiary">
              Select a material to view and edit its properties
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

// ─── Shape Selector Config ──────────────────────────────────────────
const SHAPES: { id: PreviewShape; icon: typeof Circle; label: string }[] = [
  { id: 'sphere', icon: Circle, label: 'Sphere' },
  { id: 'cube', icon: Box, label: 'Cube' },
  { id: 'plane', icon: Square, label: 'Plane' },
  { id: 'cylinder', icon: Cylinder, label: 'Cylinder' },
  { id: 'torus', icon: Circle, label: 'Torus' }, // reuse Circle for torus
];

// ─── Category Chip ──────────────────────────────────────────────────
function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-[3px] rounded-full text-[11px] transition-colors ${
        active
          ? 'bg-accent-muted text-accent'
          : 'bg-raised text-txt-tertiary hover:text-txt-secondary'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Material List Item ─────────────────────────────────────────────
function MaterialListItem({
  material,
  isSelected,
  onClick,
  onDuplicate,
  onDelete,
}: {
  material: Material;
  isSelected: boolean;
  onClick: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-2.5 px-2.5 py-[7px] rounded cursor-pointer transition-colors ${
        isSelected
          ? 'bg-accent-muted text-accent'
          : 'text-txt-secondary hover:bg-hovr hover:text-txt-primary'
      }`}
    >
      {/* Color swatch */}
      <div
        className="w-8 h-8 rounded flex-shrink-0 border border-border"
        style={{ backgroundColor: material.color || '#ffffff' }}
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{material.name}</p>
        <p className={`text-[10px] truncate ${isSelected ? 'text-accent/60' : 'text-txt-tertiary'}`}>
          {getMaterialTypeLabel(material)}
        </p>
      </div>

      {/* Hover actions */}
      <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="w-5 h-5 flex items-center justify-center rounded text-txt-tertiary hover:text-txt-primary hover:bg-hovr transition-colors"
          title="Duplicate"
        >
          <Copy size={11} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="w-5 h-5 flex items-center justify-center rounded text-txt-tertiary hover:text-red-400 hover:bg-hovr transition-colors"
          title="Delete"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

// ─── 3D Preview Scene ───────────────────────────────────────────────
function PreviewScene({
  material,
  shape,
}: {
  material: Partial<Material>;
  shape: PreviewShape;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  const threeMaterial = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: material.color ? new THREE.Color(material.color) : new THREE.Color('#ffffff'),
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
  }, [
    material.color,
    material.metalness,
    material.roughness,
    material.opacity,
    material.transparent,
    material.clearcoat,
    material.clearcoatRoughness,
    material.sheen,
    material.sheenRoughness,
    material.sheenColor,
    material.transmission,
    material.thickness,
    material.ior,
    material.iridescence,
    material.iridescenceIor,
    material.anisotropy,
    material.anisotropyRotation,
  ]);

  const geometry = useMemo(() => {
    switch (shape) {
      case 'cube':
        return new THREE.BoxGeometry(1.2, 1.2, 1.2);
      case 'plane':
        return new THREE.PlaneGeometry(2, 2);
      case 'cylinder':
        return new THREE.CylinderGeometry(0.7, 0.7, 1.4, 64);
      case 'torus':
        return new THREE.TorusGeometry(0.7, 0.28, 32, 100);
      case 'sphere':
      default:
        return new THREE.SphereGeometry(0.9, 64, 64);
    }
  }, [shape]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-5, -5, -5]} intensity={0.3} />
      <hemisphereLight args={['#ffffff', '#444444', 0.5]} />
      <OrbitControls enablePan={false} enableZoom={true} minDistance={1.5} maxDistance={6} />
      <mesh ref={meshRef} geometry={geometry} material={threeMaterial} />
    </>
  );
}

// ─── Properties Panel ───────────────────────────────────────────────
function PropertiesPanel({
  draft,
  categories,
  onChange,
  onImportTexture,
  onClearTexture,
}: {
  draft: Partial<Material>;
  categories: MaterialCategory[];
  onChange: (updates: Partial<Material>) => void;
  onImportTexture: (type: 'map' | 'normal' | 'roughness' | 'metalness' | 'ao' | 'emissive') => void;
  onClearTexture: (key: string) => void;
}) {
  return (
    <div>
      {/* General */}
      <PropSection title="General">
        <PropRow label="Name">
          <input
            type="text"
            value={draft.name || ''}
            onChange={(e) => onChange({ name: e.target.value })}
            className="prop-input-text"
            placeholder="Material name"
          />
        </PropRow>
        <PropRow label="Category">
          <select
            value={draft.categoryId || ''}
            onChange={(e) => onChange({ categoryId: e.target.value || null })}
            className="prop-input-text"
          >
            <option value="">None</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </PropRow>
        <PropRow label="Description">
          <input
            type="text"
            value={draft.description || ''}
            onChange={(e) => onChange({ description: e.target.value || null })}
            className="prop-input-text"
            placeholder="Optional description"
          />
        </PropRow>
      </PropSection>

      {/* Base */}
      <PropSection title="Base">
        <PropColorRow
          label="Color"
          value={draft.color || '#ffffff'}
          onChange={(color) => onChange({ color })}
        />
        <PropSlider
          label="Opacity"
          value={draft.opacity ?? 1}
          min={0}
          max={1}
          step={0.01}
          onChange={(opacity) => onChange({ opacity, transparent: opacity < 1 })}
        />
      </PropSection>

      {/* PBR */}
      <PropSection title="PBR">
        <PropSlider
          label="Roughness"
          value={draft.roughness ?? 1}
          min={0}
          max={1}
          step={0.01}
          onChange={(roughness) => onChange({ roughness })}
        />
        <PropSlider
          label="Metalness"
          value={draft.metalness ?? 0}
          min={0}
          max={1}
          step={0.01}
          onChange={(metalness) => onChange({ metalness })}
        />
      </PropSection>

      {/* Clearcoat */}
      <PropSection title="Clearcoat">
        <PropSlider
          label="Clearcoat"
          value={draft.clearcoat ?? 0}
          min={0}
          max={1}
          step={0.01}
          onChange={(clearcoat) => onChange({ clearcoat })}
        />
        <PropSlider
          label="Roughness"
          value={draft.clearcoatRoughness ?? 0}
          min={0}
          max={1}
          step={0.01}
          onChange={(clearcoatRoughness) => onChange({ clearcoatRoughness })}
        />
      </PropSection>

      {/* Sheen */}
      <PropSection title="Sheen">
        <PropSlider
          label="Sheen"
          value={draft.sheen ?? 0}
          min={0}
          max={1}
          step={0.01}
          onChange={(sheen) => onChange({ sheen })}
        />
        <PropSlider
          label="Roughness"
          value={draft.sheenRoughness ?? 1}
          min={0}
          max={1}
          step={0.01}
          onChange={(sheenRoughness) => onChange({ sheenRoughness })}
        />
        <PropColorRow
          label="Color"
          value={draft.sheenColor || '#ffffff'}
          onChange={(sheenColor) => onChange({ sheenColor })}
        />
      </PropSection>

      {/* Transmission */}
      <PropSection title="Transmission">
        <PropSlider
          label="Transmission"
          value={draft.transmission ?? 0}
          min={0}
          max={1}
          step={0.01}
          onChange={(transmission) => onChange({ transmission })}
        />
        <PropSlider
          label="Thickness"
          value={draft.thickness ?? 0}
          min={0}
          max={5}
          step={0.1}
          onChange={(thickness) => onChange({ thickness })}
        />
        <PropSlider
          label="IOR"
          value={draft.ior ?? 1.5}
          min={1}
          max={2.5}
          step={0.01}
          onChange={(ior) => onChange({ ior })}
        />
      </PropSection>

      {/* Iridescence */}
      <PropSection title="Iridescence">
        <PropSlider
          label="Iridescence"
          value={draft.iridescence ?? 0}
          min={0}
          max={1}
          step={0.01}
          onChange={(iridescence) => onChange({ iridescence })}
        />
        <PropSlider
          label="IOR"
          value={draft.iridescenceIor ?? 1.3}
          min={1}
          max={2.5}
          step={0.01}
          onChange={(iridescenceIor) => onChange({ iridescenceIor })}
        />
      </PropSection>

      {/* Anisotropy */}
      <PropSection title="Anisotropy">
        <PropSlider
          label="Anisotropy"
          value={draft.anisotropy ?? 0}
          min={-1}
          max={1}
          step={0.01}
          onChange={(anisotropy) => onChange({ anisotropy })}
        />
        <PropSlider
          label="Rotation"
          value={draft.anisotropyRotation ?? 0}
          min={0}
          max={Math.PI}
          step={0.01}
          onChange={(anisotropyRotation) => onChange({ anisotropyRotation })}
        />
      </PropSection>

      {/* Texture Maps */}
      <PropSection title="Texture Maps" noBorder>
        <div className="space-y-2">
          <TextureSlot
            label="Albedo / Diffuse"
            value={draft.mapPath}
            onImport={() => onImportTexture('map')}
            onClear={() => onClearTexture('mapPath')}
            disabled={!draft.id}
          />
          <TextureSlot
            label="Normal"
            value={draft.normalMapPath}
            onImport={() => onImportTexture('normal')}
            onClear={() => onClearTexture('normalMapPath')}
            disabled={!draft.id}
          />
          <TextureSlot
            label="Roughness"
            value={draft.roughnessMapPath}
            onImport={() => onImportTexture('roughness')}
            onClear={() => onClearTexture('roughnessMapPath')}
            disabled={!draft.id}
          />
          <TextureSlot
            label="Metalness"
            value={draft.metalnessMapPath}
            onImport={() => onImportTexture('metalness')}
            onClear={() => onClearTexture('metalnessMapPath')}
            disabled={!draft.id}
          />
          <TextureSlot
            label="Ambient Occlusion"
            value={draft.aoMapPath}
            onImport={() => onImportTexture('ao')}
            onClear={() => onClearTexture('aoMapPath')}
            disabled={!draft.id}
          />
          <TextureSlot
            label="Emissive"
            value={draft.emissiveMapPath}
            onImport={() => onImportTexture('emissive')}
            onClear={() => onClearTexture('emissiveMapPath')}
            disabled={!draft.id}
          />
        </div>
        {!draft.id && (
          <p className="text-[10px] text-txt-tertiary mt-2">
            Save the material first to enable texture uploads.
          </p>
        )}
      </PropSection>
    </div>
  );
}

// ─── Property Section ───────────────────────────────────────────────
function PropSection({
  title,
  children,
  noBorder = false,
}: {
  title: string;
  children: React.ReactNode;
  noBorder?: boolean;
}) {
  return (
    <div className={`px-3.5 py-2.5 ${noBorder ? '' : 'border-b border-border-subtle'}`}>
      <h3 className="text-[11px] font-medium text-txt-secondary uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

// ─── Property Row ───────────────────────────────────────────────────
function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-txt-tertiary w-20 flex-shrink-0">{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// ─── Property Slider ────────────────────────────────────────────────
function PropSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const precision = step < 0.1 ? 2 : step < 1 ? 1 : 0;

  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-txt-tertiary w-20 flex-shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 h-[3px] bg-hovr rounded-full appearance-none cursor-pointer accent-accent"
      />
      <span className="text-[11px] text-txt-tertiary font-mono w-8 text-right flex-shrink-0">
        {value.toFixed(precision)}
      </span>
    </div>
  );
}

// ─── Color Row ──────────────────────────────────────────────────────
function PropColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-txt-tertiary w-20 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 flex-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded border border-border cursor-pointer bg-transparent p-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) onChange(e.target.value);
          }}
          className="flex-1 bg-raised text-txt-primary text-[11px] font-mono px-1.5 py-1 rounded border border-border-subtle focus:outline-none focus:border-border-focus transition-colors"
        />
      </div>
    </div>
  );
}

// ─── Texture Slot ───────────────────────────────────────────────────
function TextureSlot({
  label,
  value,
  onImport,
  onClear,
  disabled = false,
}: {
  label: string;
  value?: string | null;
  onImport: () => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const hasTexture = !!value;

  return (
    <div className="flex items-center gap-2.5 group">
      {/* Thumbnail */}
      {hasTexture ? (
        <div className="w-9 h-9 rounded border border-border bg-raised overflow-hidden flex-shrink-0 relative">
          <div className="w-full h-full bg-gradient-to-br from-txt-tertiary/20 to-txt-tertiary/5" />
          <button
            onClick={onClear}
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={12} className="text-red-400" />
          </button>
        </div>
      ) : (
        <button
          onClick={disabled ? undefined : onImport}
          disabled={disabled}
          className="w-9 h-9 rounded border border-dashed border-border-subtle bg-raised flex items-center justify-center flex-shrink-0 text-txt-tertiary hover:border-border hover:text-txt-secondary disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <Upload size={12} />
        </button>
      )}

      {/* Label + file name */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-txt-secondary">{label}</p>
        <p className="text-[10px] text-txt-tertiary truncate">
          {hasTexture ? value?.split('/').pop() : 'Drop image or click'}
        </p>
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────
function getMaterialTypeLabel(material: Material): string {
  const labels: string[] = [];
  if (material.metalness > 0.5) labels.push('Metallic');
  if (material.transmission > 0) labels.push('Glass');
  if (material.clearcoat > 0) labels.push('Clearcoat');
  if (material.sheen > 0) labels.push('Fabric');
  if (material.iridescence > 0) labels.push('Iridescent');
  return labels.length === 0 ? 'Standard' : labels.join(' / ');
}
