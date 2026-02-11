import { useState, useEffect, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Pencil, Check, X, Copy, Download, Package } from 'lucide-react';
import { Toggle, Button, IconButton } from '@/components/ui';
import {
  toggleScenePublish,
  togglePanoramaPublish,
  updatePublishSlug,
  getFirmProfile,
  type Project,
  type Scene,
  type Panorama,
  type FirmProfile,
} from '@/services/tauri';
import { PublishModal } from './PublishModal';

interface PublishSectionProps {
  project: Project;
  scenes: Scene[];
  panoramas: Panorama[];
  onProjectUpdate: (p: Project) => void;
}

export function PublishSection({ project, scenes, panoramas, onProjectUpdate }: PublishSectionProps) {
  const [firmProfile, setFirmProfile] = useState<FirmProfile | null>(null);
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugDraft, setSlugDraft] = useState('');
  const [showQr, setShowQr] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getFirmProfile().then(setFirmProfile).catch(() => {});
  }, []);

  const isPublished = project.scene_published || project.panorama_published;
  const subdomain = firmProfile?.subdomain || 'demo';
  const slug = project.publish_slug || project.id;
  const publishUrl = `https://${subdomain}.view.ozonestudio.com/${slug}`;

  const handleSceneToggle = async (checked: boolean) => {
    try {
      const updated = await toggleScenePublish(project.id, checked);
      onProjectUpdate(updated);
    } catch (err) {
      console.error('Failed to toggle scene publish:', err);
    }
  };

  const handlePanoramaToggle = async (checked: boolean) => {
    try {
      const updated = await togglePanoramaPublish(project.id, checked);
      onProjectUpdate(updated);
    } catch (err) {
      console.error('Failed to toggle panorama publish:', err);
    }
  };

  const handleSlugSave = async () => {
    const clean = slugDraft.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!clean) return;
    try {
      await updatePublishSlug(project.id, clean);
      onProjectUpdate({ ...project, publish_slug: clean });
      setEditingSlug(false);
    } catch (err) {
      console.error('Failed to update slug:', err);
    }
  };

  const handleCopyUrl = useCallback(async () => {
    await navigator.clipboard.writeText(publishUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [publishUrl]);

  const handleDownloadQr = useCallback(() => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 512;
    canvas.height = 512;

    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement('a');
      link.download = `${slug}-qr.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(data);
  }, [slug]);

  const relativeTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <>
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {/* Scene toggle */}
        <div className="flex items-center gap-2">
          <Toggle size="sm" checked={project.scene_published} onChange={handleSceneToggle} />
          <span className="text-xs text-txt-secondary">Scene Published</span>
        </div>

        {/* Panorama toggle */}
        <div className="flex items-center gap-2">
          <Toggle size="sm" checked={project.panorama_published} onChange={handlePanoramaToggle} />
          <span className="text-xs text-txt-secondary">Panorama Published</span>
        </div>

        {/* Version + time */}
        {isPublished && (
          <>
            <div className="w-px h-4 bg-border" />
            <span className="text-xs text-txt-tertiary">
              v{project.publish_version}{project.published_at && ` \u00b7 Published ${relativeTime(project.published_at)}`}
            </span>
          </>
        )}

        {/* Slug */}
        {isPublished && (
          <>
            <div className="w-px h-4 bg-border" />
            {editingSlug ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-txt-tertiary">/</span>
                <input
                  autoFocus
                  value={slugDraft}
                  onChange={(e) => setSlugDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSlugSave(); if (e.key === 'Escape') setEditingSlug(false); }}
                  className="w-28 bg-raised text-txt-primary text-xs px-1.5 py-0.5 rounded border border-border-subtle focus:outline-none focus:border-border-focus"
                />
                <IconButton label="Save slug" size="sm" variant="ghost" onClick={handleSlugSave}>
                  <Check size={13} className="text-success" />
                </IconButton>
                <IconButton label="Cancel" size="sm" variant="ghost" onClick={() => setEditingSlug(false)}>
                  <X size={13} className="text-txt-tertiary" />
                </IconButton>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className="text-xs text-txt-tertiary font-mono">/{slug}</span>
                <IconButton label="Edit slug" size="sm" variant="ghost" onClick={() => { setSlugDraft(slug); setEditingSlug(true); }}>
                  <Pencil size={12} className="text-txt-tertiary" />
                </IconButton>
              </div>
            )}

            {/* QR button */}
            <IconButton label="Show QR code" size="sm" variant="ghost" onClick={() => setShowQr(true)}>
              <QrCode size={14} className="text-txt-tertiary" />
            </IconButton>

            {/* Publish button */}
            <Button size="sm" onClick={() => setShowPublishModal(true)}>
              <Package size={14} />
              Publish
            </Button>
          </>
        )}
      </div>

      {/* QR Modal */}
      {showQr && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50" onClick={() => setShowQr(false)}>
          <div className="bg-overlay border border-border rounded-lg p-6 max-w-sm mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-txt-primary">QR Code</h3>
              <IconButton label="Close" size="sm" variant="ghost" onClick={() => setShowQr(false)}>
                <X size={16} />
              </IconButton>
            </div>

            <div ref={qrRef} className="flex items-center justify-center bg-white rounded-lg p-4 mb-4">
              <QRCodeSVG value={publishUrl} size={200} />
            </div>

            <p className="text-xs text-txt-tertiary text-center font-mono mb-4 break-all">{publishUrl}</p>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={handleCopyUrl}>
                <Copy size={13} />
                {copied ? 'Copied!' : 'Copy URL'}
              </Button>
              <Button variant="secondary" className="flex-1" onClick={handleDownloadQr}>
                <Download size={13} />
                Download PNG
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      <PublishModal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        projectId={project.id}
        project={project}
        scenes={scenes}
        panoramas={panoramas}
        onPublishComplete={(updated) => {
          onProjectUpdate(updated);
          setShowPublishModal(false);
        }}
      />
    </>
  );
}
