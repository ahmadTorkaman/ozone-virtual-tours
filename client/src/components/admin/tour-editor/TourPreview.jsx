// ===========================================
// Tour Preview Component
// ===========================================

import { ExternalLink, Eye, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import './TourPreview.css';

export default function TourPreview({ tour, slug }) {
  const [copied, setCopied] = useState(false);

  const previewUrl = `/tour/${slug}`;
  const fullUrl = `${window.location.origin}${previewUrl}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenPreview = () => {
    window.open(previewUrl, '_blank');
  };

  return (
    <div className="tour-preview">
      <div className="preview-header">
        <div className="preview-info">
          <h3>Tour Preview</h3>
          <p>Preview your tour as visitors will see it</p>
        </div>

        <div className="preview-actions">
          <div className="preview-url">
            <code>{fullUrl}</code>
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleCopyLink}
              title="Copy link"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleOpenPreview}
          >
            <ExternalLink size={18} />
            Open in New Tab
          </button>
        </div>
      </div>

      <div className="preview-frame-container">
        {tour.isPublished ? (
          <iframe
            src={previewUrl}
            className="preview-frame"
            title="Tour Preview"
          />
        ) : (
          <div className="preview-unpublished">
            <Eye size={48} />
            <h4>Tour Not Published</h4>
            <p>Publish this tour to preview it here, or open in a new tab to preview as an admin.</p>
            <button className="btn btn-primary" onClick={handleOpenPreview}>
              <ExternalLink size={18} />
              Preview Anyway
            </button>
          </div>
        )}
      </div>

      <div className="preview-stats">
        <div className="stat-item">
          <span className="stat-value">{tour.scenes?.length || 0}</span>
          <span className="stat-label">Scenes</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">
            {tour.scenes?.reduce((acc, s) => acc + (s.hotspots?.length || 0), 0) || 0}
          </span>
          <span className="stat-label">Hotspots</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{tour.floorPlans?.length || 0}</span>
          <span className="stat-label">Floor Plans</span>
        </div>
        <div className="stat-item">
          <span className={`stat-value ${tour.isPublished ? 'published' : 'draft'}`}>
            {tour.isPublished ? 'Published' : 'Draft'}
          </span>
          <span className="stat-label">Status</span>
        </div>
      </div>
    </div>
  );
}
