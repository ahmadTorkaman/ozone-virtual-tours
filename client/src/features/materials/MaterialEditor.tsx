import { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { useMaterialStore } from '@/stores/materialStore';
import {
  createMaterial,
  updateMaterial,
  deleteMaterial,
  uploadMaterialTexture,
} from '@/services/tauri';
import { materialToProperties, type Material } from '@/types/material';
import { MaterialPreview } from './MaterialPreview';
import { PropertySlider } from './PropertySlider';
import { ColorPicker } from './ColorPicker';
import { TextureUpload } from './TextureUpload';

interface MaterialEditorProps {
  onSaved?: () => void;
}

export function MaterialEditor({ onSaved }: MaterialEditorProps) {
  const {
    editingMaterial,
    isSaving,
    closeEditor,
    updateEditingMaterial,
    setSaving,
    addMaterial,
    updateMaterial: updateMaterialInStore,
    removeMaterial,
  } = useMaterialStore();

  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'textures'>('basic');
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editingMaterial || !editingMaterial.name?.trim()) {
      setError('Material name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const properties = materialToProperties(editingMaterial);

      if (editingMaterial.id) {
        await updateMaterial(editingMaterial.id, {
          name: editingMaterial.name,
          description: editingMaterial.description || undefined,
          category_id: editingMaterial.categoryId || undefined,
          properties,
        });
        updateMaterialInStore(editingMaterial.id, editingMaterial as Material);
      } else {
        const created = await createMaterial({
          name: editingMaterial.name,
          description: editingMaterial.description || undefined,
          category_id: editingMaterial.categoryId || undefined,
          properties,
        });

        const newMaterial: Material = {
          id: created.id,
          name: created.name,
          description: created.description,
          categoryId: created.category_id,
          thumbnailPath: created.thumbnail_path,
          ...editingMaterial,
          createdAt: created.created_at,
          updatedAt: created.updated_at,
          cloudId: created.cloud_id,
          isSynced: created.is_synced,
        } as Material;

        addMaterial(newMaterial);
      }

      closeEditor();
      onSaved?.();
    } catch (err) {
      console.error('Failed to save material:', err);
      setError(err instanceof Error ? err.message : 'Failed to save material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingMaterial?.id) return;

    if (!confirm('Are you sure you want to delete this material? This cannot be undone.')) {
      return;
    }

    try {
      await deleteMaterial(editingMaterial.id);
      removeMaterial(editingMaterial.id);
      closeEditor();
      onSaved?.();
    } catch (err) {
      console.error('Failed to delete material:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete material');
    }
  };

  const handleImportTexture = async (
    textureType: 'map' | 'normal' | 'roughness' | 'metalness' | 'ao' | 'emissive'
  ) => {
    if (!editingMaterial?.id) {
      setError('Please save the material first before adding textures.');
      return;
    }

    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: 'Images',
            extensions: ['png', 'jpg', 'jpeg', 'webp', 'tga'],
          },
        ],
      });

      if (!selected) return;

      const relativePath = await uploadMaterialTexture(
        editingMaterial.id,
        textureType,
        selected as string
      );

      const pathKey = `${textureType}Path` as keyof Material;
      updateEditingMaterial({ [pathKey]: relativePath } as Partial<Material>);
    } catch (err) {
      console.error('Failed to import texture:', err);
      setError(err instanceof Error ? err.message : 'Failed to import texture');
    }
  };

  if (!editingMaterial) return null;

  const isNew = !editingMaterial.id;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg w-[850px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-txt-primary">
            {isNew ? 'New Material' : 'Edit Material'}
          </h2>
          <button
            type="button"
            onClick={closeEditor}
            className="w-7 h-7 flex items-center justify-center rounded text-txt-tertiary hover:text-txt-primary hover:bg-hovr transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 mt-3 px-3 py-2 bg-red-500/15 border border-red-500/30 rounded text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left panel - Preview and name */}
          <div className="w-56 bg-base p-4 flex flex-col items-center border-r border-border">
            <MaterialPreview material={editingMaterial} size={180} />

            <input
              type="text"
              value={editingMaterial.name || ''}
              onChange={(e) => updateEditingMaterial({ name: e.target.value })}
              className="w-full mt-4 bg-raised text-txt-primary px-3 py-2 rounded text-xs text-center border border-border-subtle focus:outline-none focus:border-border-focus transition-colors"
              placeholder="Material name"
            />

            <textarea
              value={editingMaterial.description || ''}
              onChange={(e) => updateEditingMaterial({ description: e.target.value || null })}
              className="w-full mt-2 bg-raised text-txt-primary px-3 py-2 rounded text-[11px] resize-none border border-border-subtle focus:outline-none focus:border-border-focus transition-colors"
              placeholder="Description (optional)"
              rows={3}
            />
          </div>

          {/* Right panel - Properties */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-border px-2.5">
              {(['basic', 'advanced', 'textures'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-3 py-2.5 text-xs font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? 'text-txt-primary'
                      : 'text-txt-tertiary hover:text-txt-secondary'
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-[-1px] left-3 right-3 h-0.5 bg-accent rounded-sm" />
                  )}
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
                  onImport={handleImportTexture}
                  onClear={(key) => updateEditingMaterial({ [key]: null } as Partial<Material>)}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <div>
            {!isNew && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-red-400 hover:text-red-300 text-xs transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeEditor}
              className="px-3 py-1.5 text-txt-secondary hover:text-txt-primary text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !editingMaterial.name?.trim()}
              className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover disabled:bg-raised disabled:text-txt-tertiary disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs font-medium transition-colors"
            >
              <Save size={14} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Basic Properties Tab
function BasicProperties({
  material,
  onChange,
}: {
  material: Partial<Material>;
  onChange: (updates: Partial<Material>) => void;
}) {
  return (
    <div className="space-y-4">
      <ColorPicker
        label="Color"
        value={material.color || '#ffffff'}
        onChange={(color) => onChange({ color })}
      />

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

// Advanced Properties Tab
function AdvancedProperties({
  material,
  onChange,
}: {
  material: Partial<Material>;
  onChange: (updates: Partial<Material>) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Clearcoat */}
      <div className="bg-raised rounded-lg p-3.5">
        <h3 className="text-txt-primary font-medium text-xs mb-3">Clearcoat (Car Paint, Lacquer)</h3>
        <div className="space-y-3">
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
      <div className="bg-raised rounded-lg p-3.5">
        <h3 className="text-txt-primary font-medium text-xs mb-3">Sheen (Fabric, Velvet)</h3>
        <div className="space-y-3">
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
          <ColorPicker
            label="Sheen Color"
            value={material.sheenColor || '#ffffff'}
            onChange={(sheenColor) => onChange({ sheenColor })}
          />
        </div>
      </div>

      {/* Transmission */}
      <div className="bg-raised rounded-lg p-3.5">
        <h3 className="text-txt-primary font-medium text-xs mb-3">Transmission (Glass, Water)</h3>
        <div className="space-y-3">
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
      <div className="bg-raised rounded-lg p-3.5">
        <h3 className="text-txt-primary font-medium text-xs mb-3">Iridescence (Soap Bubbles, Oil)</h3>
        <div className="space-y-3">
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
      <div className="bg-raised rounded-lg p-3.5">
        <h3 className="text-txt-primary font-medium text-xs mb-3">Anisotropy (Brushed Metal, Hair)</h3>
        <div className="space-y-3">
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
            unit="rad"
          />
        </div>
      </div>
    </div>
  );
}

// Texture Properties Tab
function TextureProperties({
  material,
  onImport,
  onClear,
}: {
  material: Partial<Material>;
  onImport: (type: 'map' | 'normal' | 'roughness' | 'metalness' | 'ao' | 'emissive') => void;
  onClear: (key: string) => void;
}) {
  const isNew = !material.id;

  return (
    <div>
      {isNew && (
        <div className="mb-4 px-3 py-2 bg-yellow-500/15 border border-yellow-500/30 rounded text-yellow-400 text-xs">
          Save the material first to enable texture uploads.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <TextureUpload
          label="Albedo Map"
          value={material.mapPath}
          onImport={() => onImport('map')}
          onClear={() => onClear('mapPath')}
          disabled={isNew}
        />
        <TextureUpload
          label="Normal Map"
          value={material.normalMapPath}
          onImport={() => onImport('normal')}
          onClear={() => onClear('normalMapPath')}
          disabled={isNew}
        />
        <TextureUpload
          label="Roughness Map"
          value={material.roughnessMapPath}
          onImport={() => onImport('roughness')}
          onClear={() => onClear('roughnessMapPath')}
          disabled={isNew}
        />
        <TextureUpload
          label="Metalness Map"
          value={material.metalnessMapPath}
          onImport={() => onImport('metalness')}
          onClear={() => onClear('metalnessMapPath')}
          disabled={isNew}
        />
        <TextureUpload
          label="Ambient Occlusion"
          value={material.aoMapPath}
          onImport={() => onImport('ao')}
          onClear={() => onClear('aoMapPath')}
          disabled={isNew}
        />
        <TextureUpload
          label="Emissive Map"
          value={material.emissiveMapPath}
          onImport={() => onImport('emissive')}
          onClear={() => onClear('emissiveMapPath')}
          disabled={isNew}
        />
      </div>
    </div>
  );
}
