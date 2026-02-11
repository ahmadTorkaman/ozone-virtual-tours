import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { open, save } from '@tauri-apps/plugin-dialog';
import {
  getProject,
  listScenes,
  listPanoramas,
  exportProject,
  importScene,
  importPanorama,
  type Project,
  type Scene,
  type Panorama
} from '@/services/tauri';
import { useLicenseStore } from '@/stores/licenseStore';
import { parseTauriError } from '@/types/errors';
import { PublishSection } from '@/features/publish';
import { ArrowLeft, Upload, Box, Globe, Plus, MoreVertical, Lock } from 'lucide-react';
import { Button, IconButton } from '@/components/ui';

type TabFilter = 'all' | 'scenes' | 'panoramas';

export function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [panoramas, setPanoramas] = useState<Panorama[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [importingScene, setImportingScene] = useState(false);
  const [importingPanorama, setImportingPanorama] = useState(false);
  const [showExportUpgradePrompt, setShowExportUpgradePrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  const { status: licenseStatus } = useLicenseStore();
  const canExport = licenseStatus?.canExport ?? false;

  useEffect(() => {
    async function loadData() {
      if (!projectId) return;
      try {
        setLoading(true);
        const [projectData, scenesData, panoramasData] = await Promise.all([
          getProject(projectId),
          listScenes(projectId),
          listPanoramas(projectId),
        ]);
        setProject(projectData);
        setScenes(scenesData);
        setPanoramas(panoramasData);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  const handleExport = async () => {
    if (!canExport) { setShowExportUpgradePrompt(true); return; }
    if (!projectId || !project) return;
    try {
      const destination = await save({
        defaultPath: `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.ozone`,
        filters: [{ name: 'Ozone Project', extensions: ['ozone'] }],
      });
      if (!destination) return;
      setExporting(true);
      setError(null);
      await exportProject(projectId, destination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleImportScene = async () => {
    if (!projectId) return;
    try {
      const filePath = await open({
        multiple: false,
        filters: [{ name: 'GLB Models', extensions: ['glb', 'gltf'] }],
        title: 'Select a GLB/glTF file',
      });
      if (!filePath || Array.isArray(filePath)) return;
      setImportingScene(true);
      setError(null);
      const fileName = filePath.split(/[/\\]/).pop() || 'New Scene';
      const sceneName = fileName.replace(/\.(glb|gltf)$/i, '');
      const newScene = await importScene({ project_id: projectId, name: sceneName, source_path: filePath });
      setScenes((prev) => [...prev, newScene]);
    } catch (err) {
      const error = parseTauriError(err);
      setError(error.message);
    } finally {
      setImportingScene(false);
    }
  };

  const handleImportPanorama = async () => {
    if (!projectId) return;
    try {
      const filePath = await open({
        multiple: false,
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }],
        title: 'Select a 360° panorama image',
      });
      if (!filePath || Array.isArray(filePath)) return;
      setImportingPanorama(true);
      setError(null);
      const fileName = filePath.split(/[/\\]/).pop() || 'New Panorama';
      const panoramaName = fileName.replace(/\.(jpg|jpeg|png|webp)$/i, '');
      const newPanorama = await importPanorama({ project_id: projectId, name: panoramaName, source_path: filePath });
      setPanoramas((prev) => [...prev, newPanorama]);
    } catch (err) {
      const error = parseTauriError(err);
      setError(error.message);
    } finally {
      setImportingPanorama(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-base">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-base">
        <p className="text-error text-lg mb-2">Project not found</p>
        <p className="text-txt-tertiary text-sm mb-4">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/')}>Back to Projects</Button>
      </div>
    );
  }

  const showScenes = activeTab === 'all' || activeTab === 'scenes';
  const showPanoramas = activeTab === 'all' || activeTab === 'panoramas';

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'scenes', label: `Scenes (${scenes.length})` },
    { key: 'panoramas', label: `Panoramas (${panoramas.length})` },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-base">
      {/* Header */}
      <div className="px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => navigate('/')} className="text-txt-tertiary hover:text-txt-primary transition-colors">
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs text-txt-tertiary">Projects</span>
          <span className="text-xs text-txt-tertiary">/</span>
          <span className="text-xs text-txt-secondary">{project.name}</span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-semibold text-txt-primary">{project.name}</h1>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="flex items-center gap-1.5 text-xs text-txt-tertiary">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-txt-tertiary">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                {panoramas.length} panorama{panoramas.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs text-txt-tertiary">
                Modified {new Date(project.updated_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleExport} disabled={exporting}>
              {!canExport && <Lock size={13} />}
              <Upload size={14} />
              {exporting ? 'Exporting...' : canExport ? 'Export' : 'Export (Pro)'}
            </Button>
            <IconButton label="More actions" variant="secondary">
              <MoreVertical size={16} />
            </IconButton>
          </div>
        </div>

        {/* Publish controls */}
        <PublishSection project={project} scenes={scenes} panoramas={panoramas} onProjectUpdate={setProject} />
      </div>

      {/* Tab bar */}
      <div className="px-6 flex gap-1 border-b border-border-subtle flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-2 text-sm transition-colors relative ${
              activeTab === tab.key
                ? 'text-txt-primary'
                : 'text-txt-tertiary hover:text-txt-secondary'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mt-4 bg-error/10 border border-error/30 text-error px-4 py-2.5 rounded text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* Scenes Section */}
        {showScenes && (
          <div className="mb-8">
            {activeTab === 'all' && (
              <h2 className="text-xs font-semibold text-txt-tertiary uppercase tracking-wider mb-3">Scenes</h2>
            )}
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {scenes.map((scene) => (
                <div
                  key={scene.id}
                  className="group bg-raised border border-border rounded-lg overflow-hidden hover:border-border-focus/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${projectId}/scenes/${scene.id}`)}
                >
                  <div className="h-32 bg-surface flex items-center justify-center relative">
                    <Box size={28} className="text-txt-tertiary" />
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-medium rounded">
                      3D Scene
                    </span>
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-txt-primary truncate">{scene.name}</h3>
                    <div className="flex items-center gap-3 mt-2 text-xs text-txt-tertiary">
                      <span>{formatSize(scene.glb_size)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Import scene card */}
              <button
                onClick={handleImportScene}
                disabled={importingScene}
                className="min-h-[180px] border-2 border-dashed border-border hover:border-txt-tertiary rounded-lg flex flex-col items-center justify-center gap-2 text-txt-tertiary hover:text-txt-secondary transition-colors disabled:opacity-50"
              >
                {importingScene ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus size={20} />
                )}
                <span className="text-xs">Import .glb / .gltf</span>
              </button>
            </div>
          </div>
        )}

        {/* Panoramas Section */}
        {showPanoramas && (
          <div className="mb-8">
            {activeTab === 'all' && (
              <h2 className="text-xs font-semibold text-txt-tertiary uppercase tracking-wider mb-3">Panoramas</h2>
            )}
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
              {panoramas.map((panorama) => (
                <div
                  key={panorama.id}
                  className="group bg-raised border border-border rounded-lg overflow-hidden hover:border-border-focus/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`/projects/${projectId}/panoramas/${panorama.id}`)}
                >
                  <div className="h-24 bg-gradient-to-br from-teal-900/30 to-surface flex items-center justify-center">
                    <Globe size={22} className="text-txt-tertiary" />
                  </div>
                  <div className="p-2.5">
                    <h3 className="text-xs font-medium text-txt-primary truncate">{panorama.name}</h3>
                  </div>
                </div>
              ))}

              {/* Import panorama card */}
              <button
                onClick={handleImportPanorama}
                disabled={importingPanorama}
                className="min-h-[120px] border-2 border-dashed border-border hover:border-txt-tertiary rounded-lg flex flex-col items-center justify-center gap-1.5 text-txt-tertiary hover:text-txt-secondary transition-colors disabled:opacity-50"
              >
                {importingPanorama ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus size={18} />
                )}
                <span className="text-[11px]">Import 360° image</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Export Upgrade Prompt Modal */}
      {showExportUpgradePrompt && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-overlay border border-border rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-accent rounded-md">
                <Upload size={18} className="text-white" />
              </div>
              <h3 className="text-lg font-semibold text-txt-primary">Export Project</h3>
            </div>
            <p className="text-txt-secondary text-sm mb-5">
              Project export is available with a Professional or Enterprise license.
            </p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setShowExportUpgradePrompt(false)}>
                Close
              </Button>
              <Button className="flex-1" onClick={() => { setShowExportUpgradePrompt(false); navigate('/settings'); }}>
                View Plans
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
