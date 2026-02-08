import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Move,
  RotateCw,
  Maximize2,
  User,
  Orbit,
  Play,
  Download,
  Layers,
} from 'lucide-react';
import { SceneViewer, ObjectHierarchy } from '@/features/scene-viewer';
import { MaterialLibrary } from '@/features/materials';
import { useSceneStore } from '@/stores/sceneStore';
import { useMaterialStore } from '@/stores/materialStore';
import { getSceneGlbUrl } from '@/lib/tauri-file';
import { createPhysicalMaterial, applyMaterialToMesh } from '@/engine/MaterialSystem';
import { Button } from '@/components/ui';
import {
  getSettings,
  getProject,
  getScene,
  getSceneMaterialMappings,
  setMaterialMapping,
  getMaterial,
  parseMaterialProperties,
  type Scene,
  type Project,
} from '@/services/tauri';

type InspectorTab = 'properties' | 'material';
type TransformTool = 'move' | 'rotate' | 'scale';
type ViewMode = 'firstperson' | 'orbit';

export function SceneEditor() {
  const { projectId, sceneId } = useParams<{ projectId: string; sceneId: string }>();
  const navigate = useNavigate();

  const [scene, setScene] = useState<Scene | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [dataPath, setDataPath] = useState<string>('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  // UI state
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('material');
  const [activeTool, setActiveTool] = useState<TransformTool>('move');
  const [viewMode, setViewMode] = useState<ViewMode>('orbit');

  const {
    selectedObjectName,
    sceneData,
    setCurrentProject,
    setCurrentScene,
    setMaterialMapping: setMaterialMappingInStore,
    setMaterialMappings,
  } = useSceneStore();

  const { selectedMaterialId, setSelectedMaterial } = useMaterialStore();

  // Object/material counts from scene data
  const objectCount = useMemo(() => {
    if (!sceneData) return 0;
    return sceneData.meshes.size;
  }, [sceneData]);

  const materialMappingCount = useMemo(() => {
    return Object.keys(useSceneStore.getState().materialMappings).length;
  }, [sceneData]);

  // Load scene data
  useEffect(() => {
    async function loadData() {
      if (!projectId || !sceneId) return;

      try {
        const settings = await getSettings();
        setDataPath(settings.data_path);

        const [projectData, sceneData] = await Promise.all([
          getProject(projectId),
          getScene(sceneId),
        ]);

        if (!projectData) throw new Error('Project not found');
        if (!sceneData) throw new Error('Scene not found');

        setProject(projectData);
        setScene(sceneData);
        setCurrentProject(projectId);
        setCurrentScene(sceneId);

        const mappings = await getSceneMaterialMappings(sceneId);
        const mappingsRecord: Record<string, string> = {};
        mappings.forEach((m) => {
          mappingsRecord[m.object_name] = m.material_id;
        });
        setMaterialMappings(mappingsRecord);
      } catch (error) {
        console.error('Failed to load scene:', error);
        setLoadError(error instanceof Error ? error.message : String(error));
      }
    }

    loadData();

    return () => {
      setCurrentProject(null);
      setCurrentScene(null);
      setMaterialMappings({});
    };
  }, [projectId, sceneId, setCurrentProject, setCurrentScene, setMaterialMappings]);

  // Apply saved material mappings to scene once loaded
  useEffect(() => {
    async function applyMappings() {
      const { sceneData, materialMappings } = useSceneStore.getState();
      if (!sceneData || !dataPath) return;

      for (const [objectName, materialId] of Object.entries(materialMappings)) {
        try {
          const mesh = sceneData.meshes.get(objectName);
          if (!mesh) continue;

          const rawMaterial = await getMaterial(materialId);
          if (!rawMaterial) continue;

          const props = parseMaterialProperties(rawMaterial);
          const materialsPath = `${dataPath}/materials/textures`;

          const threeMaterial = await createPhysicalMaterial({
            color: props.color,
            metalness: props.metalness,
            roughness: props.roughness,
            opacity: props.opacity,
            transparent: props.transparent,
            clearcoat: props.clearcoat,
            clearcoatRoughness: props.clearcoat_roughness,
            sheen: props.sheen,
            sheenRoughness: props.sheen_roughness,
            sheenColor: props.sheen_color,
            transmission: props.transmission,
            thickness: props.thickness,
            ior: props.ior,
            iridescence: props.iridescence,
            iridescenceIOR: props.iridescence_ior,
            anisotropy: props.anisotropy,
            anisotropyRotation: props.anisotropy_rotation,
            mapPath: props.map_path ? `${materialsPath}/${props.map_path}` : undefined,
            normalMapPath: props.normal_map_path ? `${materialsPath}/${props.normal_map_path}` : undefined,
            roughnessMapPath: props.roughness_map_path ? `${materialsPath}/${props.roughness_map_path}` : undefined,
            metalnessMapPath: props.metalness_map_path ? `${materialsPath}/${props.metalness_map_path}` : undefined,
            aoMapPath: props.ao_map_path ? `${materialsPath}/${props.ao_map_path}` : undefined,
            emissiveMapPath: props.emissive_map_path ? `${materialsPath}/${props.emissive_map_path}` : undefined,
          });

          applyMaterialToMesh(mesh, threeMaterial);
        } catch (error) {
          console.error(`Failed to apply material to ${objectName}:`, error);
        }
      }
    }

    if (sceneData) {
      applyMappings();
    }
  }, [sceneData, dataPath]);

  // Handle applying material to selected object
  const handleApplyMaterial = async (materialId: string) => {
    if (!selectedObjectName || !sceneId || !dataPath || !sceneData) return;

    setIsApplying(true);
    try {
      const mesh = sceneData.meshes.get(selectedObjectName);
      if (!mesh) throw new Error(`Mesh "${selectedObjectName}" not found`);

      const rawMaterial = await getMaterial(materialId);
      if (!rawMaterial) throw new Error('Material not found');

      const props = parseMaterialProperties(rawMaterial);
      const materialsPath = `${dataPath}/materials/textures`;

      const threeMaterial = await createPhysicalMaterial({
        color: props.color,
        metalness: props.metalness,
        roughness: props.roughness,
        opacity: props.opacity,
        transparent: props.transparent,
        clearcoat: props.clearcoat,
        clearcoatRoughness: props.clearcoat_roughness,
        sheen: props.sheen,
        sheenRoughness: props.sheen_roughness,
        sheenColor: props.sheen_color,
        transmission: props.transmission,
        thickness: props.thickness,
        ior: props.ior,
        iridescence: props.iridescence,
        iridescenceIOR: props.iridescence_ior,
        anisotropy: props.anisotropy,
        anisotropyRotation: props.anisotropy_rotation,
        mapPath: props.map_path ? `${materialsPath}/${props.map_path}` : undefined,
        normalMapPath: props.normal_map_path ? `${materialsPath}/${props.normal_map_path}` : undefined,
        roughnessMapPath: props.roughness_map_path ? `${materialsPath}/${props.roughness_map_path}` : undefined,
        metalnessMapPath: props.metalness_map_path ? `${materialsPath}/${props.metalness_map_path}` : undefined,
        aoMapPath: props.ao_map_path ? `${materialsPath}/${props.ao_map_path}` : undefined,
        emissiveMapPath: props.emissive_map_path ? `${materialsPath}/${props.emissive_map_path}` : undefined,
      });

      applyMaterialToMesh(mesh, threeMaterial);
      await setMaterialMapping(sceneId, materialId, selectedObjectName);
      setMaterialMappingInStore(selectedObjectName, materialId);
      setSelectedMaterial(null);
    } catch (error) {
      console.error('Failed to apply material:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // Error state
  if (loadError) {
    return (
      <div className="h-screen flex items-center justify-center bg-base text-txt-primary">
        <div className="text-center">
          <p className="text-error text-lg mb-4">Failed to load scene data</p>
          <p className="text-txt-tertiary mb-4">{loadError}</p>
          <Button onClick={() => navigate('/')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  // Loading state
  if (!scene || !project || !dataPath) {
    return (
      <div className="h-screen flex items-center justify-center bg-base">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-txt-secondary">Loading scene...</span>
        </div>
      </div>
    );
  }

  const sceneUrl = getSceneGlbUrl(dataPath, projectId!, scene.glb_path);

  const toolButtons: { id: TransformTool; icon: typeof Move; label: string }[] = [
    { id: 'move', icon: Move, label: 'Move' },
    { id: 'rotate', icon: RotateCw, label: 'Rotate' },
    { id: 'scale', icon: Maximize2, label: 'Scale' },
  ];

  const viewButtons: { id: ViewMode; icon: typeof User; label: string }[] = [
    { id: 'firstperson', icon: User, label: 'First Person' },
    { id: 'orbit', icon: Orbit, label: 'Orbit' },
  ];

  const inspectorTabs: { id: InspectorTab; label: string }[] = [
    { id: 'properties', label: 'Properties' },
    { id: 'material', label: 'Material' },
  ];

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-base"
      style={{
        display: 'grid',
        gridTemplateRows: '46px 1fr 24px',
        gridTemplateColumns: '260px 1fr 280px',
      }}
    >
      {/* ── Header ── */}
      <header
        className="flex items-center px-3 bg-surface border-b border-border"
        style={{ gridColumn: '1 / -1' }}
        data-tauri-drag-region
      >
        {/* Left: Back + Breadcrumb */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="w-7 h-7 flex items-center justify-center rounded text-txt-tertiary hover:text-txt-primary hover:bg-hovr transition-colors flex-shrink-0"
          >
            <ArrowLeft size={15} />
          </button>
          <nav className="flex items-center gap-1 text-xs min-w-0">
            <button
              onClick={() => navigate('/')}
              className="text-txt-tertiary hover:text-txt-secondary transition-colors flex-shrink-0"
            >
              Projects
            </button>
            <span className="text-txt-tertiary flex-shrink-0">/</span>
            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className="text-txt-tertiary hover:text-txt-secondary transition-colors truncate max-w-[120px]"
            >
              {project.name}
            </button>
            <span className="text-txt-tertiary flex-shrink-0">/</span>
            <span className="text-txt-primary font-medium truncate max-w-[140px]">{scene.name}</span>
          </nav>
        </div>

        {/* Center: Transform + View tools */}
        <div className="flex-1 flex items-center justify-center gap-1">
          {/* Transform tools */}
          <div className="flex items-center gap-0.5">
            {toolButtons.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                title={label}
                onClick={() => setActiveTool(id)}
                className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                  activeTool === id
                    ? 'bg-accent-muted text-accent'
                    : 'text-txt-tertiary hover:text-txt-primary hover:bg-hovr'
                }`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-[18px] bg-border mx-1" />

          {/* View tools */}
          <div className="flex items-center gap-0.5">
            {viewButtons.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                title={label}
                onClick={() => setViewMode(id)}
                className={`w-8 h-8 flex items-center justify-center rounded transition-colors ${
                  viewMode === id
                    ? 'bg-accent-muted text-accent'
                    : 'text-txt-tertiary hover:text-txt-primary hover:bg-hovr'
                }`}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Download size={14} />
            Export
          </Button>
          <Button size="sm">
            <Play size={14} />
            Preview
          </Button>
        </div>
      </header>

      {/* ── Left Sidebar: Scene Tree ── */}
      <aside className="bg-surface border-r border-border flex flex-col overflow-hidden">
        <ObjectHierarchy />
      </aside>

      {/* ── Viewport ── */}
      <div className="relative overflow-hidden bg-base">
        <SceneViewer
          sceneUrl={sceneUrl}
          spawnPosition={{ x: scene.spawn_x, y: scene.spawn_y, z: scene.spawn_z }}
          spawnRotation={{ x: 0, y: scene.spawn_rot_y, z: 0 }}
        />

        {/* Applying overlay */}
        {isApplying && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-20">
            <div className="bg-overlay border border-border px-4 py-3 rounded-lg flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-txt-primary text-sm">Applying material...</span>
            </div>
          </div>
        )}

        {/* Viewport stats (top-left) */}
        <div className="absolute top-2.5 left-2.5 font-mono text-[11px] text-txt-tertiary leading-relaxed pointer-events-none select-none">
          <div>{objectCount} objects</div>
        </div>
      </div>

      {/* ── Right Panel: Inspector ── */}
      <aside className="bg-surface border-l border-border flex flex-col overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-border-subtle px-2.5 flex-shrink-0">
          {inspectorTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setInspectorTab(tab.id)}
              className={`relative px-3 py-2.5 text-xs font-medium transition-colors ${
                inspectorTab === tab.id
                  ? 'text-txt-primary'
                  : 'text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              {tab.label}
              {inspectorTab === tab.id && (
                <div className="absolute bottom-[-1px] left-3 right-3 h-0.5 bg-accent rounded-sm" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {inspectorTab === 'properties' ? (
            <PropertiesPanel selectedObjectName={selectedObjectName} />
          ) : (
            <MaterialLibrary
              selectedMaterialId={selectedMaterialId}
              onSelect={(id) => setSelectedMaterial(id)}
              showApplyButton={true}
              canApply={!!selectedObjectName}
              onApply={handleApplyMaterial}
            />
          )}
        </div>
      </aside>

      {/* ── Status Bar ── */}
      <footer
        className="flex items-center justify-between px-3 bg-surface border-t border-border text-[11px] text-txt-tertiary"
        style={{ gridColumn: '1 / -1' }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          <span>Ready</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Objects: {objectCount}</span>
          <span className="text-border">|</span>
          <span>Materials: {materialMappingCount}</span>
          <span className="text-border">|</span>
          <span>Scene: {scene.name}</span>
        </div>
      </footer>
    </div>
  );
}

/* ── Properties Panel (right inspector, Properties tab) ── */

interface PropertiesPanelProps {
  selectedObjectName: string | null;
}

function PropertiesPanel({ selectedObjectName }: PropertiesPanelProps) {
  if (!selectedObjectName) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <Layers size={28} className="text-txt-tertiary mb-2" />
        <p className="text-xs text-txt-tertiary">Select an object to view properties</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {/* Object section */}
      <div className="border-b border-border-subtle">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-medium text-txt-tertiary uppercase tracking-wider">Object</span>
        </div>
        <div className="px-3 pb-3 space-y-1.5">
          <PropRow label="Name">
            <input
              type="text"
              readOnly
              value={selectedObjectName}
              className="flex-1 bg-raised text-txt-primary text-[11px] font-mono px-1.5 py-1 rounded border border-border-subtle focus:outline-none focus:border-border-focus min-w-0"
            />
          </PropRow>
          <PropRow label="Type">
            <span className="text-[11px] text-txt-secondary">Mesh</span>
          </PropRow>
        </div>
      </div>

      {/* Transform section */}
      <div className="border-b border-border-subtle">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-medium text-txt-tertiary uppercase tracking-wider">Transform</span>
        </div>
        <div className="px-3 pb-3 space-y-1.5">
          <PropRow label="Position">
            <AxisInputs x="0.00" y="0.00" z="0.00" />
          </PropRow>
          <PropRow label="Rotation">
            <AxisInputs x="0.00" y="0.00" z="0.00" />
          </PropRow>
          <PropRow label="Scale">
            <AxisInputs x="1.00" y="1.00" z="1.00" />
          </PropRow>
        </div>
      </div>
    </div>
  );
}

/* ── Property helpers ── */

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-[58px] flex-shrink-0 text-[11px] text-txt-tertiary whitespace-nowrap">{label}</span>
      <div className="flex-1 flex gap-0.5 min-w-0">{children}</div>
    </div>
  );
}

function AxisInputs({ x, y, z }: { x: string; y: string; z: string }) {
  return (
    <>
      <AxisInput axis="x" value={x} />
      <AxisInput axis="y" value={y} />
      <AxisInput axis="z" value={z} />
    </>
  );
}

const axisColors = { x: 'text-red-400', y: 'text-green-400', z: 'text-blue-400' } as const;

function AxisInput({ axis, value }: { axis: 'x' | 'y' | 'z'; value: string }) {
  return (
    <div className="flex items-center gap-0.5 flex-1 min-w-0">
      <span className={`w-2.5 text-center text-[10px] font-semibold flex-shrink-0 ${axisColors[axis]}`}>
        {axis.toUpperCase()}
      </span>
      <input
        type="text"
        readOnly
        value={value}
        className="w-0 flex-1 bg-raised text-txt-primary text-[11px] font-mono px-1.5 py-1 rounded border border-border-subtle focus:outline-none focus:border-border-focus min-w-0"
      />
    </div>
  );
}
