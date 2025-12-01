// ===========================================
// Floor Plan Editor Component
// ===========================================

import { useState, useRef, useCallback } from 'react';
import {
  Map, Upload, Trash2, Plus, GripVertical,
  Loader2, MapPin, ChevronUp, ChevronDown
} from 'lucide-react';
import { uploadApi, floorPlansApi } from '../../../services/api';
import './FloorPlanEditor.css';

export default function FloorPlanEditor({
  tourId,
  floorPlans,
  scenes,
  onChange,
  onRefresh
}) {
  const [uploading, setUploading] = useState(false);
  const [selectedFloor, setSelectedFloor] = useState(floorPlans[0]?.id || null);
  const [editingName, setEditingName] = useState(null);
  const [placingScene, setPlacingScene] = useState(null);
  const fileInputRef = useRef(null);

  const currentFloorPlan = floorPlans.find(fp => fp.id === selectedFloor);

  // Upload new floor plan
  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Upload the image
      const uploadResponse = await uploadApi.uploadFloorplan(file);

      // Create floor plan record
      const floorPlanData = {
        name: `Floor ${floorPlans.length + 1}`,
        imageUrl: uploadResponse.imageUrl,
        floor: floorPlans.length,
        width: uploadResponse.width,
        height: uploadResponse.height
      };

      await floorPlansApi.create(tourId, floorPlanData);
      await onRefresh();
    } catch (err) {
      console.error('Failed to upload floor plan:', err);
      alert('Failed to upload floor plan');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete floor plan
  const handleDelete = async (floorPlanId) => {
    if (!confirm('Are you sure you want to delete this floor plan?')) return;

    try {
      await floorPlansApi.delete(tourId, floorPlanId);
      if (selectedFloor === floorPlanId) {
        setSelectedFloor(floorPlans[0]?.id || null);
      }
      await onRefresh();
    } catch (err) {
      console.error('Failed to delete floor plan:', err);
      alert('Failed to delete floor plan');
    }
  };

  // Update floor plan name
  const handleNameSave = async (floorPlanId, newName) => {
    try {
      await floorPlansApi.update(tourId, floorPlanId, { name: newName });
      setEditingName(null);
      await onRefresh();
    } catch (err) {
      console.error('Failed to update floor plan:', err);
    }
  };

  // Handle click on floor plan to place scene
  const handleFloorPlanClick = async (e) => {
    if (!placingScene || !currentFloorPlan) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    try {
      // Update scene with floor plan position
      const scene = scenes.find(s => s.id === placingScene);
      if (scene) {
        // This would need to update the scene's floorPlanX and floorPlanY
        await floorPlansApi.updateScenePosition(tourId, currentFloorPlan.id, placingScene, {
          x: Math.round(x * 10) / 10,
          y: Math.round(y * 10) / 10
        });
        await onRefresh();
      }
    } catch (err) {
      console.error('Failed to position scene:', err);
    } finally {
      setPlacingScene(null);
    }
  };

  // Get scenes positioned on current floor plan
  const positionedScenes = scenes.filter(
    s => s.floorPlanId === currentFloorPlan?.id && s.floorPlanX != null && s.floorPlanY != null
  );

  return (
    <div className="floor-plan-editor">
      {/* Floor Plan List */}
      <div className="floor-plan-sidebar">
        <div className="sidebar-header">
          <h3>
            <Map size={18} />
            Floor Plans
          </h3>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 size={16} className="spinner" /> : <Plus size={16} />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
        </div>

        {floorPlans.length === 0 ? (
          <div className="empty-state">
            <Map size={32} />
            <p>No floor plans yet</p>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Floor Plan
            </button>
          </div>
        ) : (
          <div className="floor-plan-list">
            {floorPlans.map((fp, index) => (
              <div
                key={fp.id}
                className={`floor-plan-item ${selectedFloor === fp.id ? 'active' : ''}`}
                onClick={() => setSelectedFloor(fp.id)}
              >
                <div className="floor-plan-thumb">
                  <img src={fp.imageUrl} alt={fp.name} />
                </div>
                <div className="floor-plan-info">
                  {editingName === fp.id ? (
                    <input
                      type="text"
                      defaultValue={fp.name}
                      autoFocus
                      onBlur={(e) => handleNameSave(fp.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNameSave(fp.id, e.target.value);
                        if (e.key === 'Escape') setEditingName(null);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="floor-name"
                      onDoubleClick={() => setEditingName(fp.id)}
                    >
                      {fp.name}
                    </span>
                  )}
                  <span className="scene-count">
                    {positionedScenes.filter(s => s.floorPlanId === fp.id).length} scenes
                  </span>
                </div>
                <button
                  className="btn btn-ghost btn-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(fp.id);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floor Plan Canvas */}
      <div className="floor-plan-canvas">
        {currentFloorPlan ? (
          <>
            <div className="canvas-toolbar">
              <span>{currentFloorPlan.name}</span>
              {placingScene && (
                <div className="placing-indicator">
                  <MapPin size={16} />
                  Click on the floor plan to position the scene
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => setPlacingScene(null)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div
              className={`canvas-area ${placingScene ? 'placing' : ''}`}
              onClick={handleFloorPlanClick}
            >
              <img
                src={currentFloorPlan.imageUrl}
                alt={currentFloorPlan.name}
                draggable={false}
              />

              {/* Scene Markers */}
              {positionedScenes.map(scene => (
                <div
                  key={scene.id}
                  className="scene-marker"
                  style={{
                    left: `${scene.floorPlanX}%`,
                    top: `${scene.floorPlanY}%`
                  }}
                  title={scene.name}
                >
                  <MapPin size={24} />
                  <span className="marker-label">{scene.name}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="canvas-empty">
            <Map size={48} />
            <p>Select or upload a floor plan</p>
          </div>
        )}
      </div>

      {/* Scene Positioning Panel */}
      {currentFloorPlan && scenes.length > 0 && (
        <div className="scene-position-panel">
          <h4>Position Scenes</h4>
          <p className="hint">Click a scene, then click on the floor plan to position it</p>

          <div className="scene-position-list">
            {scenes.map(scene => {
              const isPositioned = scene.floorPlanId === currentFloorPlan.id &&
                scene.floorPlanX != null && scene.floorPlanY != null;

              return (
                <div
                  key={scene.id}
                  className={`scene-position-item ${placingScene === scene.id ? 'active' : ''} ${isPositioned ? 'positioned' : ''}`}
                  onClick={() => setPlacingScene(scene.id)}
                >
                  <div className="scene-thumb">
                    {scene.thumbnailUrl ? (
                      <img src={scene.thumbnailUrl} alt={scene.name} />
                    ) : (
                      <MapPin size={16} />
                    )}
                  </div>
                  <span className="scene-name">{scene.name}</span>
                  {isPositioned && (
                    <span className="position-badge">
                      <MapPin size={12} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
