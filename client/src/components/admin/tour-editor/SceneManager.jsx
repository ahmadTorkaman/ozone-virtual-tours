// ===========================================
// Scene Manager Component
// ===========================================

import { useState, useRef, useCallback } from 'react';
import {
  Image, Upload, Trash2, Plus, GripVertical, Edit2,
  Loader2, Eye, ChevronUp, ChevronDown, Compass, MapPin
} from 'lucide-react';
import { uploadApi, scenesApi } from '../../../services/api';
import HotspotEditor from './HotspotEditor';
import './SceneManager.css';

export default function SceneManager({
  tourId,
  scenes,
  onChange,
  onRefresh
}) {
  const [uploading, setUploading] = useState(false);
  const [selectedScene, setSelectedScene] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [showHotspotEditor, setShowHotspotEditor] = useState(false);
  const fileInputRef = useRef(null);

  // Handle panorama upload
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setUploading(true);

      for (const file of files) {
        // Upload panorama image
        const uploadResponse = await uploadApi.uploadPanorama(file);

        // Create scene
        const sceneData = {
          name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
          panoramaUrl: uploadResponse.panoramaUrl,
          thumbnailUrl: uploadResponse.thumbnailUrl,
          order: scenes.length
        };

        await scenesApi.create(tourId, sceneData);
      }

      await onRefresh();
    } catch (err) {
      console.error('Failed to upload scene:', err);
      alert('Failed to upload panorama');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete scene
  const handleDelete = async (sceneId) => {
    if (!confirm('Are you sure you want to delete this scene? All hotspots will also be deleted.')) return;

    try {
      await scenesApi.delete(tourId, sceneId);
      if (selectedScene === sceneId) {
        setSelectedScene(null);
      }
      await onRefresh();
    } catch (err) {
      console.error('Failed to delete scene:', err);
      alert('Failed to delete scene');
    }
  };

  // Update scene name
  const handleNameSave = async (sceneId, newName) => {
    try {
      await scenesApi.update(tourId, sceneId, { name: newName });
      setEditingName(null);
      await onRefresh();
    } catch (err) {
      console.error('Failed to update scene:', err);
    }
  };

  // Reorder scenes
  const handleReorder = async (sceneId, direction) => {
    const currentIndex = scenes.findIndex(s => s.id === sceneId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= scenes.length) return;

    const reorderedScenes = [...scenes];
    const [moved] = reorderedScenes.splice(currentIndex, 1);
    reorderedScenes.splice(newIndex, 0, moved);

    // Update order values
    try {
      for (let i = 0; i < reorderedScenes.length; i++) {
        if (reorderedScenes[i].order !== i) {
          await scenesApi.update(tourId, reorderedScenes[i].id, { order: i });
        }
      }
      await onRefresh();
    } catch (err) {
      console.error('Failed to reorder scenes:', err);
    }
  };

  // Update scene initial view
  const handleInitialViewUpdate = async (sceneId, yaw, pitch) => {
    try {
      await scenesApi.update(tourId, sceneId, {
        initialYaw: yaw,
        initialPitch: pitch
      });
      await onRefresh();
    } catch (err) {
      console.error('Failed to update initial view:', err);
    }
  };

  const currentScene = scenes.find(s => s.id === selectedScene);

  return (
    <div className="scene-manager">
      {/* Scene List */}
      <div className="scene-list-panel">
        <div className="panel-header">
          <h3>
            <Image size={18} />
            Scenes ({scenes.length})
          </h3>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
            Add Scene
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </div>

        {scenes.length === 0 ? (
          <div className="empty-state">
            <Image size={48} />
            <p>No scenes yet</p>
            <span>Upload 360° panorama images to get started</span>
            <button
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} />
              Upload Panoramas
            </button>
          </div>
        ) : (
          <div className="scene-list">
            {scenes.map((scene, index) => (
              <div
                key={scene.id}
                className={`scene-item ${selectedScene === scene.id ? 'active' : ''}`}
                onClick={() => setSelectedScene(scene.id)}
              >
                <div className="scene-order">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReorder(scene.id, 'up');
                    }}
                    disabled={index === 0}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <span>{index + 1}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReorder(scene.id, 'down');
                    }}
                    disabled={index === scenes.length - 1}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                <div className="scene-thumbnail">
                  {scene.thumbnailUrl ? (
                    <img src={scene.thumbnailUrl} alt={scene.name} />
                  ) : (
                    <Image size={24} />
                  )}
                </div>

                <div className="scene-info">
                  {editingName === scene.id ? (
                    <input
                      type="text"
                      defaultValue={scene.name}
                      autoFocus
                      onBlur={(e) => handleNameSave(scene.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNameSave(scene.id, e.target.value);
                        if (e.key === 'Escape') setEditingName(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="scene-name">{scene.name}</span>
                  )}
                  <span className="hotspot-count">
                    <MapPin size={12} />
                    {scene.hotspots?.length || 0} hotspots
                  </span>
                </div>

                <div className="scene-actions">
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingName(scene.id);
                    }}
                    title="Rename"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(scene.id);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload drop zone hint */}
        {scenes.length > 0 && (
          <div className="upload-hint">
            <span>Drag & drop panoramas to add more scenes</span>
          </div>
        )}
      </div>

      {/* Scene Editor Panel */}
      <div className="scene-editor-panel">
        {currentScene ? (
          <>
            <div className="panel-header">
              <h3>{currentScene.name}</h3>
              <button
                className="btn btn-primary"
                onClick={() => setShowHotspotEditor(true)}
              >
                <MapPin size={18} />
                Edit Hotspots
              </button>
            </div>

            <div className="scene-preview">
              <img src={currentScene.panoramaUrl} alt={currentScene.name} />
              <div className="preview-overlay">
                <Eye size={32} />
                <span>Click "Edit Hotspots" to add navigation and info points</span>
              </div>
            </div>

            <div className="scene-settings">
              <h4>Scene Settings</h4>

              <div className="setting-group">
                <label>
                  <Compass size={16} />
                  Initial View Direction
                </label>
                <div className="view-controls">
                  <div className="control-group">
                    <span>Yaw (Horizontal)</span>
                    <input
                      type="number"
                      value={currentScene.initialYaw || 0}
                      onChange={(e) => handleInitialViewUpdate(
                        currentScene.id,
                        parseFloat(e.target.value),
                        currentScene.initialPitch || 0
                      )}
                      min="-180"
                      max="180"
                      step="5"
                    />
                    <span>°</span>
                  </div>
                  <div className="control-group">
                    <span>Pitch (Vertical)</span>
                    <input
                      type="number"
                      value={currentScene.initialPitch || 0}
                      onChange={(e) => handleInitialViewUpdate(
                        currentScene.id,
                        currentScene.initialYaw || 0,
                        parseFloat(e.target.value)
                      )}
                      min="-90"
                      max="90"
                      step="5"
                    />
                    <span>°</span>
                  </div>
                </div>
                <p className="hint">Set where the viewer looks when entering this scene</p>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-panel">
            <Image size={48} />
            <p>Select a scene to edit</p>
          </div>
        )}
      </div>

      {/* Hotspot Editor Modal */}
      {showHotspotEditor && currentScene && (
        <HotspotEditor
          tourId={tourId}
          scene={currentScene}
          allScenes={scenes}
          onClose={() => setShowHotspotEditor(false)}
          onRefresh={onRefresh}
        />
      )}
    </div>
  );
}
