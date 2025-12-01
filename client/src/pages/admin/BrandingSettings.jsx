// ===========================================
// Branding Settings Page
// ===========================================

import { useState, useEffect } from 'react';
import { useBranding } from '../../contexts/BrandingContext';
import { uploadApi } from '../../services/api';
import { Upload, Check, Loader2, Palette } from 'lucide-react';

export default function BrandingSettings() {
  const { branding, updateBranding } = useBranding();
  const [formData, setFormData] = useState({
    companyName: '',
    companyLogo: '',
    primaryColor: '#7c8cfb',
    secondaryColor: '#9b72f2',
    poweredByText: 'powered by Ozone',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (branding) {
      setFormData({
        companyName: branding.companyName || '',
        companyLogo: branding.companyLogo || '',
        primaryColor: branding.primaryColor || '#7c8cfb',
        secondaryColor: branding.secondaryColor || '#9b72f2',
        poweredByText: branding.poweredByText || 'powered by Ozone',
      });
    }
  }, [branding]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const { url } = await uploadApi.uploadLogo(file);
      setFormData(prev => ({ ...prev, companyLogo: url }));
      setSaved(false);
    } catch (err) {
      console.error('Logo upload failed:', err);
      alert('Failed to upload logo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData(prev => ({ ...prev, companyLogo: '' }));
    setSaved(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      await updateBranding(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Failed to save branding:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="branding-settings">
      <div className="page-header">
        <h1 className="page-title">Branding Settings</h1>
        <p className="page-subtitle">Customize the look and feel of your virtual tours</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-2">
          {/* Left Column - Form */}
          <div className="card">
            <h2 className="card-title">Company Details</h2>

            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="form-input"
                placeholder="Your Company Name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company Logo</label>
              <div className="logo-upload">
                {formData.companyLogo ? (
                  <div className="logo-preview">
                    <img src={formData.companyLogo} alt="Company logo" />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleRemoveLogo}
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="logo-dropzone">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      hidden
                    />
                    {uploading ? (
                      <Loader2 size={24} className="spinner-icon" />
                    ) : (
                      <>
                        <Upload size={24} />
                        <span>Upload logo</span>
                      </>
                    )}
                  </label>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">"Powered by" Text</label>
              <input
                type="text"
                name="poweredByText"
                value={formData.poweredByText}
                onChange={handleChange}
                className="form-input"
                placeholder="powered by Ozone"
              />
            </div>
          </div>

          {/* Right Column - Colors */}
          <div className="card">
            <h2 className="card-title">
              <Palette size={20} style={{ marginRight: '0.5rem' }} />
              Brand Colors
            </h2>

            <div className="form-group">
              <label className="form-label">Primary Color</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleChange}
                  className="color-input"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => handleChange({ target: { name: 'primaryColor', value: e.target.value } })}
                  className="form-input"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Secondary Color</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleChange}
                  className="color-input"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => handleChange({ target: { name: 'secondaryColor', value: e.target.value } })}
                  className="form-input"
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Color Preview */}
            <div className="color-preview">
              <div
                className="preview-swatch primary"
                style={{ background: formData.primaryColor }}
              >
                Primary
              </div>
              <div
                className="preview-swatch secondary"
                style={{ background: formData.secondaryColor }}
              >
                Secondary
              </div>
              <div
                className="preview-gradient"
                style={{ background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})` }}
              >
                Gradient
              </div>
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <h2 className="card-title">Preview</h2>
          <div className="branding-preview">
            <div className="preview-header" style={{ borderColor: formData.primaryColor }}>
              {formData.companyLogo ? (
                <img src={formData.companyLogo} alt="Logo" className="preview-logo" />
              ) : (
                <span
                  className="preview-brand-name"
                  style={{ background: `linear-gradient(135deg, ${formData.primaryColor}, ${formData.secondaryColor})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                >
                  {formData.companyName || 'Company Name'}
                </span>
              )}
            </div>
            <div className="preview-footer">
              <span style={{ color: 'var(--color-text-muted)' }}>{formData.poweredByText}</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? (
              <>
                <Loader2 size={18} className="spinner-icon" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check size={18} />
                Saved!
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>

      <style>{`
        .logo-upload {
          margin-top: 0.5rem;
        }

        .logo-preview {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .logo-preview img {
          height: 60px;
          width: auto;
          max-width: 200px;
          object-fit: contain;
          background: var(--color-bg);
          padding: 0.5rem;
          border-radius: 8px;
        }

        .logo-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 2rem;
          border: 2px dashed var(--color-border);
          border-radius: 8px;
          color: var(--color-text-muted);
          cursor: pointer;
          transition: var(--transition);
        }

        .logo-dropzone:hover {
          border-color: var(--color-primary);
          color: var(--color-primary);
        }

        .color-input-wrapper {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .color-input {
          width: 48px;
          height: 48px;
          padding: 0;
          border: 2px solid var(--color-border);
          border-radius: 8px;
          cursor: pointer;
        }

        .color-input::-webkit-color-swatch-wrapper {
          padding: 4px;
        }

        .color-input::-webkit-color-swatch {
          border: none;
          border-radius: 4px;
        }

        .color-preview {
          display: flex;
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .preview-swatch {
          flex: 1;
          padding: 1rem;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          text-align: center;
        }

        .preview-gradient {
          flex: 1;
          padding: 1rem;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          text-align: center;
        }

        .branding-preview {
          background: var(--color-bg);
          border-radius: 12px;
          overflow: hidden;
          max-width: 400px;
        }

        .preview-header {
          padding: 1.5rem;
          border-bottom: 2px solid;
          text-align: center;
        }

        .preview-logo {
          height: 40px;
          width: auto;
        }

        .preview-brand-name {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .preview-footer {
          padding: 1rem;
          text-align: center;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}
