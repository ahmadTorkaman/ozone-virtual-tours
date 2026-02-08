import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Eye,
  Maximize,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { PanoramaViewer } from '@/features/panorama';
import { usePanoramaStore } from '@/stores/panoramaStore';
import {
  getPanorama,
  getPanoramaFilePath,
  listPanoramas,
  listHotspots,
  parseHotspotContent,
  type Panorama,
  type Hotspot,
  type HotspotContent,
} from '@/services/tauri';
import { getAssetUrl } from '@/lib/tauri-file';

export function PanoramaViewerPage() {
  const { projectId, panoramaId } = useParams<{
    projectId: string;
    panoramaId: string;
  }>();
  const navigate = useNavigate();

  const {
    panoramas,
    hotspots,
    isLoading,
    isEditing,
    setPanoramas,
    setHotspots,
    setCurrentPanorama,
    setLoading,
    setEditing,
    setSelectedHotspot,
    reset,
  } = usePanoramaStore();

  const [panorama, setPanorama] = useState<Panorama | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoPanel, setInfoPanel] = useState<{
    hotspot: Hotspot;
    content: HotspotContent | null;
  } | null>(null);

  // Load panorama data
  useEffect(() => {
    async function loadData() {
      if (!projectId || !panoramaId) return;

      try {
        setLoading(true);
        setError(null);

        const [panoramaData, allPanoramas, hotspotsData, filePath] = await Promise.all([
          getPanorama(panoramaId),
          listPanoramas(projectId),
          listHotspots(panoramaId),
          getPanoramaFilePath(panoramaId),
        ]);

        if (!panoramaData) {
          setError('Panorama not found');
          return;
        }

        setPanorama(panoramaData);
        setPanoramas(allPanoramas);
        setHotspots(hotspotsData);
        setCurrentPanorama(panoramaId);

        const url = getAssetUrl(filePath);
        setImageUrl(url);
      } catch (err) {
        console.error('Failed to load panorama:', err);
        setError(err instanceof Error ? err.message : 'Failed to load panorama');
      } finally {
        setLoading(false);
      }
    }

    loadData();
    return () => { reset(); };
  }, [projectId, panoramaId, setLoading, setPanoramas, setHotspots, setCurrentPanorama, reset]);

  const navigateToPanorama = useCallback(
    (targetPanoramaId: string) => {
      navigate(`/projects/${projectId}/panoramas/${targetPanoramaId}`);
    },
    [navigate, projectId]
  );

  const handleHotspotClick = useCallback(
    (hotspotId: string) => {
      const hotspot = hotspots.find((h) => h.id === hotspotId);
      if (!hotspot) return;

      if (isEditing) {
        setSelectedHotspot(hotspotId);
        return;
      }

      switch (hotspot.hotspot_type) {
        case 'navigation':
          if (hotspot.target_panorama_id) {
            navigateToPanorama(hotspot.target_panorama_id);
          }
          break;
        case 'info':
        case 'media':
          setInfoPanel({ hotspot, content: parseHotspotContent(hotspot) });
          break;
        case 'link': {
          const content = parseHotspotContent(hotspot);
          if (content?.url) window.open(content.url, '_blank');
          break;
        }
      }
    },
    [hotspots, isEditing, navigateToPanorama, setSelectedHotspot]
  );

  // Prev/next navigation
  const currentIndex = panoramas.findIndex((p) => p.id === panoramaId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < panoramas.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev) navigateToPanorama(panoramas[currentIndex - 1].id);
  }, [hasPrev, currentIndex, panoramas, navigateToPanorama]);

  const goToNext = useCallback(() => {
    if (hasNext) navigateToPanorama(panoramas[currentIndex + 1].id);
  }, [hasNext, currentIndex, panoramas, navigateToPanorama]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (infoPanel) {
        if (e.key === 'Escape') setInfoPanel(null);
        return;
      }
      switch (e.key) {
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) goToPrev();
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) goToNext();
          break;
        case 'Escape':
          navigate(`/projects/${projectId}`);
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [infoPanel, goToPrev, goToNext, navigate, projectId]);

  // Error state
  if (error) {
    return (
      <div className="h-screen w-screen bg-base flex items-center justify-center">
        <div className="text-center">
          <p className="text-error text-lg mb-4">Failed to load panorama</p>
          <p className="text-txt-tertiary text-sm mb-4">{error}</p>
          <button
            className="px-4 py-2 bg-accent hover:bg-accent-hover rounded text-white text-sm transition-colors"
            onClick={() => navigate(`/projects/${projectId}`)}
          >
            Back to Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      {/* ── Panorama Canvas ── */}
      <div className="absolute inset-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-base z-20">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-txt-secondary text-sm">Loading panorama...</span>
            </div>
          </div>
        )}

        {imageUrl && panorama && (
          <PanoramaViewer
            imageUrl={imageUrl}
            initialYaw={panorama.initial_yaw}
            initialPitch={panorama.initial_pitch}
            onHotspotClick={handleHotspotClick}
          />
        )}
      </div>

      {/* ── Top Bar (glassmorphic gradient) ── */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Back + Title */}
          <div className="flex items-center gap-3">
            <GlassButton onClick={() => navigate(`/projects/${projectId}`)}>
              <ArrowLeft size={16} />
            </GlassButton>
            {panorama && (
              <div>
                <h1 className="text-sm font-medium text-white/90">{panorama.name}</h1>
                {panoramas.length > 1 && (
                  <p className="text-[11px] text-white/40">
                    {currentIndex + 1} of {panoramas.length}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right: Edit + Fullscreen */}
          <div className="flex items-center gap-1.5">
            <GlassButton
              onClick={() => setEditing(!isEditing)}
              active={isEditing}
              className="gap-1.5"
            >
              {isEditing ? <Eye size={15} /> : <Edit size={15} />}
              <span className="text-xs hidden sm:inline">{isEditing ? 'View' : 'Edit'}</span>
            </GlassButton>
            <GlassButton>
              <Maximize size={15} />
            </GlassButton>
          </div>
        </div>
      </div>

      {/* ── Edit Mode Indicator ── */}
      {isEditing && (
        <div className="absolute top-[60px] left-1/2 -translate-x-1/2 z-[12] flex items-center gap-2 px-3.5 py-1.5 bg-accent/20 backdrop-blur-xl border border-accent/30 rounded-full text-[11px] text-[#a5a7fc] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Editing Hotspots
        </div>
      )}

      {/* ── Navigation Arrows ── */}
      {panoramas.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            disabled={!hasPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-[8] w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-lg border border-white/[0.06] text-white/50 hover:bg-black/50 hover:text-white/90 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goToNext}
            disabled={!hasNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-[8] w-10 h-10 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-lg border border-white/[0.06] text-white/50 hover:bg-black/50 hover:text-white/90 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* ── Compass Widget ── */}
      <div className="absolute top-[60px] right-4 z-[8] w-12 h-12 flex items-center justify-center opacity-40 hover:opacity-70 transition-opacity">
        <div className="w-11 h-11 border border-white/15 rounded-full flex items-center justify-center relative">
          <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-error">N</span>
          <div className="w-0.5 h-[18px] rounded-sm bg-gradient-to-b from-error to-white/30 -rotate-[25deg]" />
        </div>
      </div>

      {/* ── Zoom Controls ── */}
      <div className="absolute bottom-[90px] right-4 z-[8] flex flex-col bg-black/40 backdrop-blur-lg border border-white/[0.06] rounded-lg overflow-hidden">
        <button className="w-8 h-[30px] flex items-center justify-center text-white/50 hover:bg-white/[0.08] hover:text-white/90 transition-all">
          <ZoomIn size={15} />
        </button>
        <div className="h-px bg-white/[0.06] mx-1.5" />
        <button className="w-8 h-[30px] flex items-center justify-center text-white/50 hover:bg-white/[0.08] hover:text-white/90 transition-all">
          <ZoomOut size={15} />
        </button>
      </div>

      {/* ── Bottom Bar (glassmorphic gradient) ── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-center pb-3.5 px-4">
        {/* Viewer hint */}
        <div className="flex items-center gap-3.5 px-3.5 py-1.5 bg-white/[0.06] backdrop-blur-xl border border-white/[0.06] rounded-full text-[10px] text-white/40 mb-2.5">
          <span>Drag to look around</span>
          <span className="w-px h-2.5 bg-white/10" />
          <span>Scroll to zoom</span>
          <span className="w-px h-2.5 bg-white/10" />
          <span>Click hotspot to interact</span>
        </div>

        {/* Thumbnail strip */}
        {panoramas.length > 1 && (
          <div className="flex gap-1.5 p-1.5 bg-black/50 backdrop-blur-xl border border-white/[0.06] rounded-lg max-w-[80vw] overflow-x-auto scrollbar-thin">
            {panoramas.map((p, index) => (
              <button
                key={p.id}
                onClick={() => navigateToPanorama(p.id)}
                className={`relative flex-shrink-0 w-16 h-11 rounded overflow-hidden border-2 transition-all group ${
                  p.id === panoramaId
                    ? 'border-accent shadow-[0_0_0_1px_var(--accent)]'
                    : 'border-transparent hover:border-white/30'
                }`}
              >
                <div className="w-full h-full bg-gradient-to-br from-surface to-raised flex items-center justify-center">
                  <span className="text-[10px] text-white/40 font-medium">{index + 1}</span>
                </div>
                {/* Hover label */}
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] text-white/50 bg-black/70 px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Info Panel (slide-in from right) ── */}
      <div
        className={`absolute inset-y-0 right-0 w-[340px] z-20 bg-base/[0.92] backdrop-blur-[20px] border-l border-white/[0.06] flex flex-col transition-transform duration-[250ms] ease-out ${
          infoPanel ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {infoPanel && (
          <>
            {/* Panel header */}
            <div className="flex items-center justify-between px-[18px] py-4 border-b border-white/[0.06] flex-shrink-0">
              <h3 className="text-sm font-medium text-txt-primary">
                {infoPanel.content?.title || 'Information'}
              </h3>
              <button
                onClick={() => setInfoPanel(null)}
                className="w-7 h-7 flex items-center justify-center rounded text-txt-tertiary hover:bg-hovr hover:text-txt-primary transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Panel body */}
            <div className="flex-1 overflow-y-auto p-[18px]">
              {/* Image */}
              {infoPanel.content?.media_url && infoPanel.content?.media_type === 'image' && (
                <div className="w-full h-40 rounded-lg bg-raised mb-3.5 overflow-hidden">
                  <img
                    src={infoPanel.content.media_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Video */}
              {infoPanel.content?.media_url && infoPanel.content?.media_type === 'video' && (
                <video
                  src={infoPanel.content.media_url}
                  controls
                  className="w-full rounded-lg mb-3.5"
                />
              )}

              {/* Description */}
              {infoPanel.content?.description && (
                <p className="text-xs text-txt-secondary leading-[1.7] mb-3.5">
                  {infoPanel.content.description}
                </p>
              )}

              {/* Link */}
              {infoPanel.content?.url && (
                <a
                  href={infoPanel.content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover transition-colors"
                >
                  <ExternalLink size={13} />
                  Open Link
                </a>
              )}
            </div>
          </>
        )}
      </div>

      {/* Click-away overlay for info panel */}
      {infoPanel && (
        <div
          className="absolute inset-0 z-[19]"
          onClick={() => setInfoPanel(null)}
        />
      )}
    </div>
  );
}

/* ── Glass Button ── */

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

function GlassButton({ children, onClick, active, className = '' }: GlassButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center px-2.5 py-1.5 rounded backdrop-blur-xl border text-xs font-medium transition-all ${
        active
          ? 'bg-accent/25 border-accent/30 text-[#a5a7fc]'
          : 'bg-white/[0.08] border-white/[0.08] text-white/70 hover:bg-white/[0.14] hover:text-white/90'
      } ${className}`}
    >
      {children}
    </button>
  );
}
