// ===========================================
// Tour Details Form Component
// ===========================================

import { useState, useRef } from 'react';
import { Settings, Lock, Music, Upload, X, Loader2 } from 'lucide-react';
import { uploadApi } from '../../../services/api';

export default function TourDetailsForm({ tour, onChange, isNew }) {
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const audioInputRef = useRef(null);

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    onChange({ name });

    // Auto-generate slug for new tours
    if (isNew && !tour.slug) {
      onChange({ name, slug: generateSlug(name) });
    }
  };

  const handleSlugChange = (e) => {
    const slug = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 50);
    onChange({ slug });
  };

  const handleToggle = (field) => {
    onChange({ [field]: !tour[field] });
  };

  const handleSettingToggle = (setting) => {
    onChange({
      settings: {
        ...tour.settings,
        [setting]: !tour.settings?.[setting]
      }
    });
  };

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingAudio(true);
      const response = await uploadApi.uploadAudio(file);
      onChange({ ambientMusicUrl: response.audioUrl });
    } catch (err) {
      console.error('Failed to upload audio:', err);
      alert('Failed to upload audio file');
    } finally {
      setUploadingAudio(false);
      if (audioInputRef.current) {
        audioInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAudio = () => {
    onChange({ ambientMusicUrl: '' });
  };

  return (
    <div className="tour-details-form">
      {/* Basic Information */}
      <section className="editor-section">
        <div className="editor-section-header">
          <h3>
            <Settings size={18} />
            Basic Information
          </h3>
        </div>
        <div className="editor-section-content">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">Tour Name *</label>
              <input
                id="name"
                type="text"
                value={tour.name || ''}
                onChange={handleNameChange}
                placeholder="e.g., Modern Apartment Tour"
              />
            </div>

            <div className="form-group">
              <label htmlFor="slug">URL Slug</label>
              <div className="input-with-addon">
                <span className="input-addon">/tour/</span>
                <input
                  id="slug"
                  type="text"
                  value={tour.slug || ''}
                  onChange={handleSlugChange}
                  placeholder="modern-apartment"
                />
              </div>
              <span className="hint">The URL path for this tour</span>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={tour.description || ''}
                onChange={(e) => onChange({ description: e.target.value })}
                placeholder="A brief description of this virtual tour..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="clientName">Client Name</label>
              <input
                id="clientName"
                type="text"
                value={tour.clientName || ''}
                onChange={(e) => onChange({ clientName: e.target.value })}
                placeholder="e.g., ABC Properties"
              />
            </div>

            <div className="form-group">
              <label htmlFor="projectRef">Project Reference</label>
              <input
                id="projectRef"
                type="text"
                value={tour.projectRef || ''}
                onChange={(e) => onChange({ projectRef: e.target.value })}
                placeholder="e.g., PRJ-2024-001"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Password Protection */}
      <section className="editor-section">
        <div className="editor-section-header">
          <h3>
            <Lock size={18} />
            Access Control
          </h3>
        </div>
        <div className="editor-section-content">
          <div className="toggle-row">
            <div className="toggle-label">
              <span>Password Protection</span>
              <span>Require a password to view this tour</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={tour.isPasswordProtected || false}
                onChange={() => handleToggle('isPasswordProtected')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          {tour.isPasswordProtected && (
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label htmlFor="password">Tour Password</label>
              <input
                id="password"
                type="password"
                value={tour.password || ''}
                onChange={(e) => onChange({ password: e.target.value })}
                placeholder="Enter password for this tour"
              />
              <span className="hint">Viewers will need this password to access the tour</span>
            </div>
          )}
        </div>
      </section>

      {/* Ambient Music */}
      <section className="editor-section">
        <div className="editor-section-header">
          <h3>
            <Music size={18} />
            Ambient Music
          </h3>
        </div>
        <div className="editor-section-content">
          {!tour.ambientMusicUrl ? (
            <div
              className="file-upload-zone"
              onClick={() => audioInputRef.current?.click()}
            >
              {uploadingAudio ? (
                <>
                  <Loader2 size={32} className="spinner" />
                  <p>Uploading audio...</p>
                </>
              ) : (
                <>
                  <Upload size={32} />
                  <p>Click to upload ambient music</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    MP3, WAV, OGG or WebM • Max 20MB
                  </p>
                </>
              )}
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm"
                onChange={handleAudioUpload}
              />
            </div>
          ) : (
            <div className="audio-preview">
              <audio controls src={tour.ambientMusicUrl} />
              <button
                type="button"
                className="btn btn-ghost btn-remove"
                onClick={handleRemoveAudio}
                title="Remove audio"
              >
                <X size={18} />
              </button>
            </div>
          )}

          {tour.ambientMusicUrl && (
            <div className="range-group" style={{ marginTop: '1rem' }}>
              <div className="range-header">
                <label>Default Volume</label>
                <span className="range-value">{Math.round((tour.ambientMusicVolume || 0.5) * 100)}%</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min="0"
                max="1"
                step="0.05"
                value={tour.ambientMusicVolume || 0.5}
                onChange={(e) => onChange({ ambientMusicVolume: parseFloat(e.target.value) })}
              />
            </div>
          )}
        </div>
      </section>

      {/* Viewer Settings */}
      <section className="editor-section">
        <div className="editor-section-header">
          <h3>
            <Settings size={18} />
            Viewer Settings
          </h3>
        </div>
        <div className="editor-section-content">
          <div className="toggle-row">
            <div className="toggle-label">
              <span>Auto-Rotate</span>
              <span>Slowly rotate the view when idle</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={tour.settings?.autoRotate || false}
                onChange={() => handleSettingToggle('autoRotate')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-row">
            <div className="toggle-label">
              <span>VR Mode</span>
              <span>Allow viewing in VR headsets</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={tour.settings?.vrEnabled !== false}
                onChange={() => handleSettingToggle('vrEnabled')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>

          <div className="toggle-row">
            <div className="toggle-label">
              <span>Compass</span>
              <span>Show directional compass in viewer</span>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={tour.settings?.compassEnabled !== false}
                onChange={() => handleSettingToggle('compassEnabled')}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
