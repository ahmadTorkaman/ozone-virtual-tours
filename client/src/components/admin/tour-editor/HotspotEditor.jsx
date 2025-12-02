// ===========================================
// Hotspot Editor Component
// ===========================================
// Modal for visually placing and editing hotspots on panoramas

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Plus, Trash2, Navigation, Info, Link, Music, Save,
  Loader2, Eye, ChevronDown, MapPin
} from 'lucide-react';
import { hotspotsApi } from '../../../services/api';
import './HotspotEditor.css';

const HOTSPOT_TYPES = [
  { value: 'NAVIGATION', label: 'Navigation', icon: Navigation, description: 'Link to another scene' },
  { value: 'INFO', label: 'Info', icon: Info, description: 'Display text or media' },
  { value: 'LINK', label: 'External Link', icon: Link, description: 'Open a URL' },
  { value: 'AUDIO', label: 'Audio', icon: Music, description: 'Play audio clip' }
];

export default function HotspotEditor({
  tourId,
  scene,
  allScenes,
  onClose,
  onRefresh
}) {
  const [hotspots, setHotspots] = useState(scene.hotspots || []);
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [placingType, setPlacingType] = useState('NAVIGATION');
  const [saving, setSaving] = useState(false);
  const [viewPosition, setViewPosition] = useState({ yaw: 0, pitch: 0 });

  const canvasRef = useRef(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Load current view position
  useEffect(() => {
    setViewPosition({
      yaw: scene.initialYaw || 0,
      pitch: scene.initialPitch || 0
    });
  }, [scene]);

  // Handle panorama drag to change view
  const handleMouseDown = (e) => {
    if (isPlacing) return;
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || isPlacing) return;

    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;

    setViewPosition(prev => ({
      yaw: (prev.yaw - deltaX * 0.2) % 360,
      pitch: Math.max(-90, Math.min(90, prev.pitch + deltaY * 0.2))
    }));

    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Handle click to place hotspot
  const handleCanvasClick = async (e) => {
    if (!isPlacing) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Convert to spherical coordinates (simplified equirectangular mapping)
    const yaw = viewPosition.yaw + (x - 0.5) * 120; // 120° FOV
    const pitch = viewPosition.pitch - (y - 0.5) * 90; // 90° vertical FOV

    // Create new hotspot
    const newHotspot = {
      type: placingType,
      name: `${placingType === 'NAVIGATION' ? 'Go to' : 'Info'} ${hotspots.length + 1}`,
      yaw: yaw,
      pitch: pitch,
      targetSceneId: placingType === 'NAVIGATION' ? allScenes[0]?.id : null,
      content: '',
      url: '',
      audioUrl: ''
    };

    try {
      setSaving(true);
      const response = await hotspotsApi.create(tourId, scene.id, newHotspot);
      setHotspots([...hotspots, response.hotspot]);
      setSelectedHotspot(response.hotspot.id);
      setIsPlacing(false);
    } catch (err) {
      console.error('Failed to create hotspot:', err);
      alert('Failed to create hotspot');
    } finally {
      setSaving(false);
    }
  };

  // Update hotspot
  const updateHotspot = async (hotspotId, updates) => {
    try {
      await hotspotsApi.update(tourId, scene.id, hotspotId, updates);
      setHotspots(hotspots.map(h => h.id === hotspotId ? { ...h, ...updates } : h));
    } catch (err) {
      console.error('Failed to update hotspot:', err);
    }
  };

  // Delete hotspot
  const deleteHotspot = async (hotspotId) => {
    if (!confirm('Delete this hotspot?')) return;

    try {
      await hotspotsApi.delete(tourId, scene.id, hotspotId);
      setHotspots(hotspots.filter(h => h.id !== hotspotId));
      if (selectedHotspot === hotspotId) {
        setSelectedHotspot(null);
      }
    } catch (err) {
      console.error('Failed to delete hotspot:', err);
    }
  };

  // Close and refresh
  const handleClose = () => {
    onRefresh();
    onClose();
  };

  // Get hotspot position on canvas
  const getHotspotPosition = (hotspot) => {
    // Convert spherical to canvas position (simplified)
    const yawDiff = hotspot.yaw - viewPosition.yaw;
    const x = 0.5 + (yawDiff / 120);
    const pitchDiff = viewPosition.pitch - hotspot.pitch;
    const y = 0.5 + (pitchDiff / 90);

    // Check if visible in current view
    if (x < -0.2 || x > 1.2 || y < -0.2 || y > 1.2) {
      return null;
    }

    return { x: x * 100, y: y * 100 };
  };

  const selectedHotspotData = hotspots.find(h => h.id === selectedHotspot);

  return (
    <div className="hotspot-editor-modal">
      <div className="hotspot-editor">
        {/* Header */}
        <div className="editor-header">
          <h2>Edit Hotspots - {scene.name}</h2>
          <button className="btn btn-ghost" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="editor-body">
          {/* Canvas */}
          <div className="editor-canvas">
            <div className="canvas-toolbar">
              <div className="toolbar-left">
                <span>View: {Math.round(viewPosition.yaw)}° / {Math.round(viewPosition.pitch)}°</span>
              </div>
              <div className="toolbar-right">
                {isPlacing ? (
                  <>
                    <span className="placing-hint">Click to place {placingType.toLowerCase()} hotspot</span>
                    <button className="btn btn-sm btn-secondary" onClick={() => setIsPlacing(false)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <div className="add-hotspot-dropdown">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => setIsPlacing(true)}
                    >
                      <Plus size={16} />
                      Add Hotspot
                    </button>
                    <select
                      value={placingType}
                      onChange={(e) => setPlacingType(e.target.value)}
                      className="type-select"
                    >
                      {HOTSPOT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div
              ref={canvasRef}
              className={`panorama-canvas ${isPlacing ? 'placing' : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={handleCanvasClick}
              style={{
                backgroundImage: `url(${scene.panoramaUrl})`,
                backgroundPosition: `${50 - viewPosition.yaw / 3.6}% ${50 + viewPosition.pitch}%`
              }}
            >
              {/* Hotspot Markers */}
              {hotspots.map(hotspot => {
                const pos = getHotspotPosition(hotspot);
                if (!pos) return null;

                const TypeIcon = HOTSPOT_TYPES.find(t => t.value === hotspot.type)?.icon || Info;

                return (
                  <div
                    key={hotspot.id}
                    className={`hotspot-marker ${hotspot.type.toLowerCase()} ${selectedHotspot === hotspot.id ? 'selected' : ''}`}
                    style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isPlacing) setSelectedHotspot(hotspot.id);
                    }}
                  >
                    <TypeIcon size={20} />
                    <span className="marker-label">{hotspot.name}</span>
                  </div>
                );
              })}

              {/* Crosshair when placing */}
              {isPlacing && (
                <div className="placement-crosshair">
                  <Plus size={32} />
                </div>
              )}
            </div>

            <div className="canvas-hint">
              {isPlacing
                ? 'Click on the panorama to place the hotspot'
                : 'Drag to look around • Click hotspots to edit'
              }
            </div>
          </div>

          {/* Sidebar */}
          <div className="editor-sidebar">
            <div className="sidebar-header">
              <h3>Hotspots ({hotspots.length})</h3>
            </div>

            {/* Hotspot List */}
            <div className="hotspot-list">
              {hotspots.length === 0 ? (
                <div className="empty-list">
                  <MapPin size={32} />
                  <p>No hotspots yet</p>
                  <span>Click "Add Hotspot" to create one</span>
                </div>
              ) : (
                hotspots.map(hotspot => {
                  const TypeIcon = HOTSPOT_TYPES.find(t => t.value === hotspot.type)?.icon || Info;
                  return (
                    <div
                      key={hotspot.id}
                      className={`hotspot-item ${selectedHotspot === hotspot.id ? 'active' : ''}`}
                      onClick={() => setSelectedHotspot(hotspot.id)}
                    >
                      <div className={`hotspot-icon ${hotspot.type.toLowerCase()}`}>
                        <TypeIcon size={16} />
                      </div>
                      <div className="hotspot-info">
                        <span className="hotspot-name">{hotspot.name}</span>
                        <span className="hotspot-type">{hotspot.type}</span>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHotspot(hotspot.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Hotspot Editor Form */}
            {selectedHotspotData && (
              <div className="hotspot-form">
                <h4>Edit Hotspot</h4>

                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={selectedHotspotData.name || ''}
                    onChange={(e) => updateHotspot(selectedHotspotData.id, { name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select
                    value={selectedHotspotData.type}
                    onChange={(e) => updateHotspot(selectedHotspotData.id, { type: e.target.value })}
                  >
                    {HOTSPOT_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Navigation-specific */}
                {selectedHotspotData.type === 'NAVIGATION' && (
                  <div className="form-group">
                    <label>Target Scene</label>
                    <select
                      value={selectedHotspotData.targetSceneId || ''}
                      onChange={(e) => updateHotspot(selectedHotspotData.id, { targetSceneId: e.target.value })}
                    >
                      <option value="">Select a scene...</option>
                      {allScenes
                        .filter(s => s.id !== scene.id)
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))
                      }
                    </select>
                  </div>
                )}

                {/* Info-specific */}
                {selectedHotspotData.type === 'INFO' && (
                  <div className="form-group">
                    <label>Content</label>
                    <textarea
                      value={selectedHotspotData.content || ''}
                      onChange={(e) => updateHotspot(selectedHotspotData.id, { content: e.target.value })}
                      rows={4}
                      placeholder="Information to display..."
                    />
                  </div>
                )}

                {/* Link-specific */}
                {selectedHotspotData.type === 'LINK' && (
                  <div className="form-group">
                    <label>URL</label>
                    <input
                      type="url"
                      value={selectedHotspotData.url || ''}
                      onChange={(e) => updateHotspot(selectedHotspotData.id, { url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                )}

                {/* Audio-specific */}
                {selectedHotspotData.type === 'AUDIO' && (
                  <div className="form-group">
                    <label>Audio URL</label>
                    <input
                      type="url"
                      value={selectedHotspotData.audioUrl || ''}
                      onChange={(e) => updateHotspot(selectedHotspotData.id, { audioUrl: e.target.value })}
                      placeholder="Audio file URL..."
                    />
                  </div>
                )}

                <div className="form-group position-info">
                  <label>Position</label>
                  <div className="position-values">
                    <span>Yaw: {Math.round(selectedHotspotData.yaw)}°</span>
                    <span>Pitch: {Math.round(selectedHotspotData.pitch)}°</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
