import { useState, useEffect, useCallback, useRef } from 'react';
import { open as dialogOpen } from '@tauri-apps/plugin-dialog';
import { open as shellOpen } from '@tauri-apps/plugin-shell';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { X, FolderOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, IconButton } from '@/components/ui';
import {
  saveThumbnail,
  publishProject,
  getSceneFilePath,
  getPanoramaFilePath,
  getAppDataPath,
  type Project,
  type Scene,
  type Panorama,
  type PublishProgress,
} from '@/services/tauri';
import { captureSceneThumbnail, capturePanoramaThumbnail, disposeCaptureRenderer } from './captureThumbnails';

type PublishState = 'idle' | 'thumbnails' | 'packaging' | 'complete' | 'error';

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  project: Project;
  scenes: Scene[];
  panoramas: Panorama[];
  onPublishComplete: (updatedProject: Project) => void;
}

export function PublishModal({
  open: isOpen,
  onClose,
  projectId,
  project,
  scenes,
  panoramas,
  onPublishComplete,
}: PublishModalProps) {
  const [state, setState] = useState<PublishState>('idle');
  const [progress, setProgress] = useState<PublishProgress | null>(null);
  const [thumbnailProgress, setThumbnailProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');
  const [destinationFolder, setDestinationFolder] = useState('');
  const [publishedVersion, setPublishedVersion] = useState(0);
  const unlistenRef = useRef<UnlistenFn | null>(null);

  // Determine what will be published
  const publishedScenes = project.scene_published ? scenes : [];
  const publishedPanoramas = project.panorama_published ? panoramas : [];
  const totalItems = publishedScenes.length + publishedPanoramas.length;

  // Cleanup event listener on unmount
  useEffect(() => {
    return () => {
      unlistenRef.current?.();
      disposeCaptureRenderer();
    };
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setState('idle');
      setProgress(null);
      setThumbnailProgress({ current: 0, total: 0 });
      setError('');
      setDestinationFolder('');
    }
  }, [isOpen]);

  const handlePublish = useCallback(async () => {
    try {
      // Pick destination folder
      const folder = await dialogOpen({
        directory: true,
        title: 'Choose publish destination folder',
      });
      if (!folder) return;

      const dest = typeof folder === 'string' ? folder : (folder as string);
      setDestinationFolder(dest);

      // Phase 1: Capture thumbnails
      setState('thumbnails');
      const appDataPath = await getAppDataPath();
      const sceneThumbnails: Record<string, string> = {};
      const panoramaThumbnails: Record<string, string> = {};
      const total = publishedScenes.length + publishedPanoramas.length;
      let current = 0;

      setThumbnailProgress({ current: 0, total });

      for (const scene of publishedScenes) {
        current++;
        setThumbnailProgress({ current, total });

        try {
          const glbPath = await getSceneFilePath(scene.id);
          const base64 = await captureSceneThumbnail(glbPath);
          const thumbPath = `${appDataPath}/projects/${projectId}/scenes/${scene.id}-thumb.webp`;
          await saveThumbnail(base64, thumbPath);
          sceneThumbnails[scene.id] = thumbPath;
        } catch (err) {
          console.warn(`Failed to capture thumbnail for scene ${scene.name}:`, err);
        }
      }

      for (const panorama of publishedPanoramas) {
        current++;
        setThumbnailProgress({ current, total });

        try {
          const imgPath = await getPanoramaFilePath(panorama.id);
          const base64 = await capturePanoramaThumbnail(imgPath);
          const thumbPath = `${appDataPath}/projects/${projectId}/panoramas/${panorama.id}-thumb.webp`;
          await saveThumbnail(base64, thumbPath);
          panoramaThumbnails[panorama.id] = thumbPath;
        } catch (err) {
          console.warn(`Failed to capture thumbnail for panorama ${panorama.name}:`, err);
        }
      }

      disposeCaptureRenderer();

      // Phase 2: Package and publish
      setState('packaging');

      // Listen for progress events
      unlistenRef.current = await listen<PublishProgress>('publish-progress', (event) => {
        setProgress(event.payload);
      });

      await publishProject({
        project_id: projectId,
        destination_folder: dest,
        scene_thumbnails: sceneThumbnails,
        panorama_thumbnails: panoramaThumbnails,
      });

      unlistenRef.current?.();
      unlistenRef.current = null;

      const newVersion = project.publish_version + 1;
      setPublishedVersion(newVersion);
      setState('complete');

      onPublishComplete({
        ...project,
        publish_version: newVersion,
        published_at: new Date().toISOString(),
      });
    } catch (err) {
      unlistenRef.current?.();
      unlistenRef.current = null;
      disposeCaptureRenderer();
      setError(err instanceof Error ? err.message : String(err));
      setState('error');
    }
  }, [projectId, project, publishedScenes, publishedPanoramas, onPublishComplete]);

  const handleOpenFolder = useCallback(async () => {
    if (destinationFolder) {
      await shellOpen(destinationFolder);
    }
  }, [destinationFolder]);

  if (!isOpen) return null;

  const progressPercent = (() => {
    if (state === 'thumbnails' && thumbnailProgress.total > 0) {
      return Math.round((thumbnailProgress.current / thumbnailProgress.total) * 100);
    }
    if (state === 'packaging' && progress) {
      if (progress.step === 'done') return 100;
      // Estimate progress across steps
      const stepWeights: Record<string, number> = {
        copying_scenes: 30,
        copying_panoramas: 50,
        copying_materials: 70,
        copying_branding: 85,
        writing_manifest: 95,
      };
      return stepWeights[progress.step] ?? 50;
    }
    return 0;
  })();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50" onClick={onClose}>
      <div
        className="bg-overlay border border-border rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-txt-primary">Publish Project</h3>
          <IconButton label="Close" size="sm" variant="ghost" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>

        {/* Idle state — summary */}
        {state === 'idle' && (
          <>
            <div className="bg-surface rounded-lg p-4 mb-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-txt-secondary">Scenes</span>
                <span className="text-txt-primary font-medium">{publishedScenes.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-txt-secondary">Panoramas</span>
                <span className="text-txt-primary font-medium">{publishedPanoramas.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-txt-secondary">Current version</span>
                <span className="text-txt-primary font-medium">v{project.publish_version}</span>
              </div>
            </div>

            {totalItems === 0 ? (
              <p className="text-xs text-txt-tertiary text-center mb-4">
                No content is marked for publishing. Enable Scene or Panorama publishing first.
              </p>
            ) : (
              <Button className="w-full" onClick={handlePublish}>
                <FolderOpen size={14} />
                Choose Folder & Publish
              </Button>
            )}
          </>
        )}

        {/* Thumbnails state */}
        {state === 'thumbnails' && (
          <div className="space-y-3">
            <p className="text-sm text-txt-secondary">
              Capturing thumbnails ({thumbnailProgress.current}/{thumbnailProgress.total})...
            </p>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Packaging state */}
        {state === 'packaging' && (
          <div className="space-y-3">
            <p className="text-sm text-txt-secondary">
              {progress?.message || 'Packaging...'}
            </p>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Complete state */}
        {state === 'complete' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle size={24} className="text-success flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-txt-primary">
                  Published v{publishedVersion}
                </p>
                <p className="text-xs text-txt-tertiary mt-0.5 break-all">
                  {destinationFolder}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={handleOpenFolder}>
                <FolderOpen size={14} />
                Open Folder
              </Button>
              <Button className="flex-1" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        )}

        {/* Error state */}
        {state === 'error' && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={24} className="text-error flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-txt-primary">Publish failed</p>
                <p className="text-xs text-txt-tertiary mt-1 break-all">{error}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={onClose}>
                Close
              </Button>
              <Button className="flex-1" onClick={() => { setState('idle'); setError(''); }}>
                Retry
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
