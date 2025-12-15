import { useState, useCallback, useRef } from 'react';
import {
  X,
  Save,
  Trash2,
  Copy,
  RotateCcw,
  Upload,
  Palette,
  Layers,
  Sun,
  Box,
  Circle,
  Square,
  Hexagon,
  Image,
  Sparkles,
} from 'lucide-react';
import { useMaterialStore, MATERIAL_PRESETS } from '../../../stores/materialStore';
import { uploadApi } from '../../../services/api';
import MaterialPreview3D from './MaterialPreview3D';
import './MaterialEditor.css';

// Environment options for preview
const ENVIRONMENTS = [
  { id: 'studio', label: 'Studio', icon: Box },
  { id: 'sunset', label: 'Sunset', icon: Sun },
  { id: 'warehouse', label: 'Warehouse', icon: Square },
  { id: 'forest', label: 'Forest', icon: Layers },
  { id: 'night', label: 'Night', icon: Circle },
  { id: 'city', label: 'City', icon: Hexagon },
];

// Shape options for preview
const SHAPES = [
  { id: 'sphere', label: 'Sphere', icon: Circle },
  { id: 'cube', label: 'Cube', icon: Square },
  { id: 'torus', label: 'Torus', icon: Hexagon },
  { id: 'torusKnot', label: 'Knot', icon: Sparkles },
  { id: 'plane', label: 'Plane', icon: Layers },
];

// Texture types for upload
const TEXTURE_TYPES = [
  { id: 'map', label: 'Albedo/Color', description: 'Base color texture' },
  { id: 'normalMap', label: 'Normal Map', description: 'Surface detail' },
  { id: 'roughnessMap', label: 'Roughness', description: 'Surface roughness' },
  { id: 'metalnessMap', label: 'Metalness', description: 'Metallic areas' },
  { id: 'aoMap', label: 'Ambient Occlusion', description: 'Shadow detail' },
  { id: 'heightMap', label: 'Height/Displacement', description: 'Surface height' },
  { id: 'emissiveMap', label: 'Emissive', description: 'Glowing areas' },
];

export default function MaterialEditor({ onClose }) {
  const {
    editingMaterial,
    updateEditingMaterial,
    saveMaterial,
    deleteMaterial,
    duplicateMaterial,
    categories,
    previewShape,
    setPreviewShape,
    previewEnvironment,
    setPreviewEnvironment,
    previewAutoRotate,
    togglePreviewAutoRotate,
  } = useMaterialStore();

  const [activeTab, setActiveTab] = useState('properties');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingTexture, setUploadingTexture] = useState(null);
  const fileInputRef = useRef(null);

  const material = editingMaterial;

  if (!material) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveMaterial(material);
      onClose();
    } catch (error) {
      console.error('Failed to save material:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await deleteMaterial(material.id);
        onClose();
      } catch (error) {
        console.error('Failed to delete material:', error);
      }
    }
  };

  const handleDuplicate = () => {
    const newMaterial = duplicateMaterial(material.id);
    if (newMaterial) {
      useMaterialStore.getState().openEditor(newMaterial);
    }
  };

  const handleTextureUpload = async (textureType, file) => {
    if (!file) return;

    setUploadingTexture(textureType);
    try {
      const result = await uploadApi.uploadTexture(file, textureType);
      updateEditingMaterial({ [textureType]: result.textureUrl });
    } catch (error) {
      console.error('Failed to upload texture:', error);
    } finally {
      setUploadingTexture(null);
    }
  };

  const handleTextureRemove = (textureType) => {
    updateEditingMaterial({ [textureType]: null });
  };

  const applyPreset = (presetKey) => {
    const preset = MATERIAL_PRESETS[presetKey];
    if (preset) {
      updateEditingMaterial({
        ...preset,
        name: material.name, // Keep current name
      });
    }
  };

  return (
    <div className="material-editor-overlay" onClick={onClose}>
      <div className="material-editor-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="editor-header">
          <div className="editor-title-group">
            <input
              type="text"
              className="editor-title-input"
              value={material.name}
              onChange={(e) => updateEditingMaterial({ name: e.target.value })}
              placeholder="Material Name"
            />
            <span className="editor-category-badge">{material.category}</span>
          </div>
          <div className="editor-actions">
            <button className="editor-action-btn" onClick={handleDuplicate} title="Duplicate">
              <Copy size={18} />
            </button>
            <button className="editor-action-btn danger" onClick={handleDelete} title="Delete">
              <Trash2 size={18} />
            </button>
            <button className="editor-action-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="editor-body">
          {/* Preview Section */}
          <div className="editor-preview-section">
            <div className="preview-container">
              <MaterialPreview3D
                material={material}
                shape={previewShape}
                environment={previewEnvironment}
                autoRotate={previewAutoRotate}
              />
            </div>

            {/* Preview Controls */}
            <div className="preview-controls">
              <div className="control-group">
                <label className="control-label">Shape</label>
                <div className="shape-selector">
                  {SHAPES.map((shape) => (
                    <button
                      key={shape.id}
                      className={`shape-btn ${previewShape === shape.id ? 'active' : ''}`}
                      onClick={() => setPreviewShape(shape.id)}
                      title={shape.label}
                    >
                      <shape.icon size={16} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-group">
                <label className="control-label">Environment</label>
                <select
                  className="control-select"
                  value={previewEnvironment}
                  onChange={(e) => setPreviewEnvironment(e.target.value)}
                >
                  {ENVIRONMENTS.map((env) => (
                    <option key={env.id} value={env.id}>
                      {env.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Properties Section */}
          <div className="editor-properties-section">
            {/* Tabs */}
            <div className="editor-tabs">
              <button
                className={`editor-tab ${activeTab === 'properties' ? 'active' : ''}`}
                onClick={() => setActiveTab('properties')}
              >
                <Palette size={16} />
                Properties
              </button>
              <button
                className={`editor-tab ${activeTab === 'textures' ? 'active' : ''}`}
                onClick={() => setActiveTab('textures')}
              >
                <Image size={16} />
                Textures
              </button>
              <button
                className={`editor-tab ${activeTab === 'presets' ? 'active' : ''}`}
                onClick={() => setActiveTab('presets')}
              >
                <Sparkles size={16} />
                Presets
              </button>
            </div>

            {/* Tab Content */}
            <div className="editor-tab-content">
              {activeTab === 'properties' && (
                <div className="properties-panel">
                  {/* Category */}
                  <div className="property-group">
                    <label className="property-label">Category</label>
                    <select
                      className="property-select"
                      value={material.category}
                      onChange={(e) => updateEditingMaterial({ category: e.target.value })}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Base Color */}
                  <div className="property-group">
                    <label className="property-label">Base Color</label>
                    <div className="color-input-group">
                      <input
                        type="color"
                        className="color-picker"
                        value={material.color}
                        onChange={(e) => updateEditingMaterial({ color: e.target.value })}
                      />
                      <input
                        type="text"
                        className="color-text"
                        value={material.color}
                        onChange={(e) => updateEditingMaterial({ color: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Metalness */}
                  <div className="property-group">
                    <label className="property-label">
                      Metalness
                      <span className="property-value">{material.metalness.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      className="property-slider"
                      min="0"
                      max="1"
                      step="0.01"
                      value={material.metalness}
                      onChange={(e) => updateEditingMaterial({ metalness: parseFloat(e.target.value) })}
                    />
                  </div>

                  {/* Roughness */}
                  <div className="property-group">
                    <label className="property-label">
                      Roughness
                      <span className="property-value">{material.roughness.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      className="property-slider"
                      min="0"
                      max="1"
                      step="0.01"
                      value={material.roughness}
                      onChange={(e) => updateEditingMaterial({ roughness: parseFloat(e.target.value) })}
                    />
                  </div>

                  {/* Opacity */}
                  <div className="property-group">
                    <label className="property-label">
                      <span>
                        Opacity
                        <input
                          type="checkbox"
                          className="property-checkbox"
                          checked={material.transparent}
                          onChange={(e) => updateEditingMaterial({ transparent: e.target.checked })}
                        />
                        <span className="checkbox-label">Transparent</span>
                      </span>
                      <span className="property-value">{material.opacity.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      className="property-slider"
                      min="0"
                      max="1"
                      step="0.01"
                      value={material.opacity}
                      onChange={(e) => updateEditingMaterial({ opacity: parseFloat(e.target.value) })}
                    />
                  </div>

                  {/* Emissive */}
                  <div className="property-group">
                    <label className="property-label">Emissive Color</label>
                    <div className="color-input-group">
                      <input
                        type="color"
                        className="color-picker"
                        value={material.emissive}
                        onChange={(e) => updateEditingMaterial({ emissive: e.target.value })}
                      />
                      <input
                        type="text"
                        className="color-text"
                        value={material.emissive}
                        onChange={(e) => updateEditingMaterial({ emissive: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Emissive Intensity */}
                  <div className="property-group">
                    <label className="property-label">
                      Emissive Intensity
                      <span className="property-value">{material.emissiveIntensity.toFixed(2)}</span>
                    </label>
                    <input
                      type="range"
                      className="property-slider"
                      min="0"
                      max="2"
                      step="0.01"
                      value={material.emissiveIntensity}
                      onChange={(e) => updateEditingMaterial({ emissiveIntensity: parseFloat(e.target.value) })}
                    />
                  </div>

                  {/* Normal Scale (if normal map exists) */}
                  {material.normalMap && (
                    <div className="property-group">
                      <label className="property-label">
                        Normal Scale
                        <span className="property-value">{(material.normalScale || 1).toFixed(2)}</span>
                      </label>
                      <input
                        type="range"
                        className="property-slider"
                        min="0"
                        max="2"
                        step="0.01"
                        value={material.normalScale || 1}
                        onChange={(e) => updateEditingMaterial({ normalScale: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}

                  {/* Displacement Scale (if height map exists) */}
                  {material.heightMap && (
                    <div className="property-group">
                      <label className="property-label">
                        Displacement Scale
                        <span className="property-value">{(material.displacementScale || 0.1).toFixed(2)}</span>
                      </label>
                      <input
                        type="range"
                        className="property-slider"
                        min="0"
                        max="1"
                        step="0.01"
                        value={material.displacementScale || 0.1}
                        onChange={(e) => updateEditingMaterial({ displacementScale: parseFloat(e.target.value) })}
                      />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'textures' && (
                <div className="textures-panel">
                  {TEXTURE_TYPES.map((textureType) => (
                    <TextureUpload
                      key={textureType.id}
                      textureType={textureType}
                      value={material[textureType.id]}
                      isUploading={uploadingTexture === textureType.id}
                      onUpload={(file) => handleTextureUpload(textureType.id, file)}
                      onRemove={() => handleTextureRemove(textureType.id)}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'presets' && (
                <div className="presets-panel">
                  <p className="presets-hint">Click a preset to apply it to your material</p>
                  <div className="presets-grid">
                    {Object.entries(MATERIAL_PRESETS).map(([key, preset]) => (
                      <button
                        key={key}
                        className="preset-btn"
                        onClick={() => applyPreset(key)}
                      >
                        <div
                          className="preset-preview"
                          style={{
                            background: preset.metalness > 0.5
                              ? `linear-gradient(135deg, ${preset.color}, #fff)`
                              : preset.color,
                          }}
                        />
                        <span className="preset-name">{preset.name}</span>
                        <span className="preset-category">{preset.category}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="editor-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <span className="spinner-small" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Material
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Texture Upload Component
function TextureUpload({ textureType, value, isUploading, onUpload, onRemove }) {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    e.target.value = '';
  };

  return (
    <div className="texture-upload">
      <div className="texture-info">
        <span className="texture-label">{textureType.label}</span>
        <span className="texture-description">{textureType.description}</span>
      </div>

      {value ? (
        <div className="texture-preview">
          <img src={value} alt={textureType.label} />
          <div className="texture-actions">
            <button className="texture-action-btn" onClick={() => fileInputRef.current?.click()}>
              <RotateCcw size={14} />
            </button>
            <button className="texture-action-btn danger" onClick={onRemove}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          className="texture-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <span className="spinner-small" />
          ) : (
            <>
              <Upload size={16} />
              Upload
            </>
          )}
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}
