// ===========================================
// Tour Editor Page
// ===========================================
// Full-featured tour editor with tabs for Details, Floor Plans, Scenes, and Preview

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Save, ArrowLeft, Eye, Settings, Map, Image,
  Loader2, AlertCircle, CheckCircle, Trash2
} from 'lucide-react';
import TourDetailsForm from '../../components/admin/tour-editor/TourDetailsForm';
import FloorPlanEditor from '../../components/admin/tour-editor/FloorPlanEditor';
import SceneManager from '../../components/admin/tour-editor/SceneManager';
import TourPreview from '../../components/admin/tour-editor/TourPreview';
import { toursApi, scenesApi, floorPlansApi } from '../../services/api';
import './TourEditor.css';

const TABS = [
  { id: 'details', label: 'Details', icon: Settings },
  { id: 'floorplans', label: 'Floor Plans', icon: Map },
  { id: 'scenes', label: 'Scenes', icon: Image },
  { id: 'preview', label: 'Preview', icon: Eye }
];

export default function TourEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id; // No id means new tour (from /admin/tours/new route)

  // Tour state
  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null); // 'saved', 'error'

  // Active tab
  const [activeTab, setActiveTab] = useState('details');

  // Unsaved changes tracking
  const [hasChanges, setHasChanges] = useState(false);

  // Load tour data
  useEffect(() => {
    if (!isNew) {
      loadTour();
    } else {
      // Initialize empty tour for new creation
      setTour({
        name: '',
        slug: '',
        description: '',
        clientName: '',
        projectRef: '',
        isPasswordProtected: false,
        password: '',
        ambientMusicUrl: '',
        ambientMusicVolume: 0.5,
        settings: {
          autoRotate: false,
          vrEnabled: true,
          compassEnabled: true
        },
        scenes: [],
        floorPlans: []
      });
    }
  }, [id, isNew]);

  const loadTour = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await toursApi.getById(id);
      setTour(response.tour);
    } catch (err) {
      setError('Failed to load tour');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Save tour
  const handleSave = async () => {
    if (!tour.name) {
      setError('Tour name is required');
      setActiveTab('details');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSaveStatus(null);

      let savedTour;
      if (isNew) {
        const response = await toursApi.create(tour);
        savedTour = response.tour;
        // Navigate to edit mode with the new ID
        navigate(`/admin/tours/${savedTour.id}`, { replace: true });
      } else {
        const response = await toursApi.update(id, tour);
        savedTour = response.tour;
      }

      setTour(savedTour);
      setHasChanges(false);
      setSaveStatus('saved');

      // Clear save status after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save tour');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  // Update tour data
  const updateTour = useCallback((updates) => {
    setTour(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }, []);

  // Update scenes
  const updateScenes = useCallback((scenes) => {
    setTour(prev => ({ ...prev, scenes }));
    setHasChanges(true);
  }, []);

  // Update floor plans
  const updateFloorPlans = useCallback((floorPlans) => {
    setTour(prev => ({ ...prev, floorPlans }));
    setHasChanges(true);
  }, []);

  // Delete tour
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tour? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      await toursApi.delete(id);
      navigate('/admin/tours');
    } catch (err) {
      setError('Failed to delete tour');
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="tour-editor-loading">
        <Loader2 size={48} className="spinner" />
        <p>Loading tour...</p>
      </div>
    );
  }

  // Error state (couldn't load)
  if (!tour && error) {
    return (
      <div className="tour-editor-error">
        <AlertCircle size={48} />
        <h2>Failed to Load Tour</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/admin/tours')} className="btn btn-secondary">
          <ArrowLeft size={18} />
          Back to Tours
        </button>
      </div>
    );
  }

  return (
    <div className="tour-editor">
      {/* Header */}
      <div className="tour-editor-header">
        <div className="header-left">
          <button
            onClick={() => navigate('/admin/tours')}
            className="btn btn-ghost btn-back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="header-title">
            <h1>{isNew ? 'Create New Tour' : tour.name || 'Untitled Tour'}</h1>
            {tour.slug && !isNew && (
              <span className="tour-slug">/tour/{tour.slug}</span>
            )}
          </div>
        </div>

        <div className="header-actions">
          {saveStatus === 'saved' && (
            <span className="save-status saved">
              <CheckCircle size={16} />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="save-status error">
              <AlertCircle size={16} />
              Error saving
            </span>
          )}

          {!isNew && (
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              disabled={saving}
            >
              <Trash2 size={18} />
              Delete
            </button>
          )}

          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={saving || (!hasChanges && !isNew)}
          >
            {saving ? (
              <Loader2 size={18} className="spinner" />
            ) : (
              <Save size={18} />
            )}
            {isNew ? 'Create Tour' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="tour-editor-error-banner">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tour-editor-tabs">
        {TABS.map(tab => {
          const Icon = tab.icon;
          // Disable certain tabs for new tours
          const disabled = isNew && (tab.id === 'floorplans' || tab.id === 'scenes' || tab.id === 'preview');

          return (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => !disabled && setActiveTab(tab.id)}
              disabled={disabled}
              title={disabled ? 'Save tour first to access this section' : ''}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="tour-editor-content">
        {activeTab === 'details' && (
          <TourDetailsForm
            tour={tour}
            onChange={updateTour}
            isNew={isNew}
          />
        )}

        {activeTab === 'floorplans' && !isNew && (
          <FloorPlanEditor
            tourId={id}
            floorPlans={tour.floorPlans || []}
            scenes={tour.scenes || []}
            onChange={updateFloorPlans}
            onRefresh={loadTour}
          />
        )}

        {activeTab === 'scenes' && !isNew && (
          <SceneManager
            tourId={id}
            scenes={tour.scenes || []}
            onChange={updateScenes}
            onRefresh={loadTour}
          />
        )}

        {activeTab === 'preview' && !isNew && (
          <TourPreview
            tour={tour}
            slug={tour.slug}
          />
        )}
      </div>
    </div>
  );
}
