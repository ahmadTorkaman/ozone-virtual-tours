import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Trash2, ChevronUp, ChevronDown, X, Plus, Search } from 'lucide-react';
import { IconButton } from '@/components/ui';
import {
  updateComponentGroup,
  deleteComponentGroup,
  addMaterialOption,
  removeMaterialOption,
  reorderMaterialOptions,
  listMaterialOptions,
  listMaterials,
  type ComponentGroup,
  type ComponentMaterialOption,
  type Material,
} from '@/services/tauri';
import { useSceneStore } from '@/stores/sceneStore';

interface ComponentGroupItemProps {
  group: ComponentGroup;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function ComponentGroupItem({
  group,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ComponentGroupItemProps) {
  const [materialOptions, setMaterialOptions] = useState<ComponentMaterialOption[]>([]);
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);
  const [showMeshPicker, setShowMeshPicker] = useState(false);
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);
  const [meshSearch, setMeshSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const meshPickerRef = useRef<HTMLDivElement>(null);
  const materialPickerRef = useRef<HTMLDivElement>(null);

  const sceneData = useSceneStore((s) => s.sceneData);
  const meshNames: string[] = JSON.parse(group.mesh_names || '[]');

  useEffect(() => {
    if (isExpanded) {
      listMaterialOptions(group.id).then(setMaterialOptions).catch(() => {});
      listMaterials().then(setAllMaterials).catch(() => {});
    }
  }, [isExpanded, group.id]);

  // Close pickers on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (meshPickerRef.current && !meshPickerRef.current.contains(e.target as Node)) setShowMeshPicker(false);
      if (materialPickerRef.current && !materialPickerRef.current.contains(e.target as Node)) setShowMaterialPicker(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const allMeshNames = sceneData ? Array.from(sceneData.meshes.keys()) : [];
  const availableMeshes = allMeshNames.filter(
    (m) => !meshNames.includes(m) && m.toLowerCase().includes(meshSearch.toLowerCase())
  );
  const assignedMaterialIds = new Set(materialOptions.map((o) => o.material_id));
  const availableMaterials = allMaterials.filter(
    (m) => !assignedMaterialIds.has(m.id) && m.name.toLowerCase().includes(materialSearch.toLowerCase())
  );

  const handleRemoveMesh = async (meshName: string) => {
    const updated = meshNames.filter((n) => n !== meshName);
    try {
      await updateComponentGroup(group.id, { mesh_names: updated });
      onUpdate();
    } catch (err) {
      console.error('Failed to remove mesh:', err);
    }
  };

  const handleAddMesh = async (meshName: string) => {
    const updated = [...meshNames, meshName];
    try {
      await updateComponentGroup(group.id, { mesh_names: updated });
      setShowMeshPicker(false);
      setMeshSearch('');
      onUpdate();
    } catch (err) {
      console.error('Failed to add mesh:', err);
    }
  };

  const handleAddMaterial = async (materialId: string) => {
    try {
      const opt = await addMaterialOption(group.id, materialId);
      setMaterialOptions((prev) => [...prev, opt]);
      setShowMaterialPicker(false);
      setMaterialSearch('');
    } catch (err) {
      console.error('Failed to add material option:', err);
    }
  };

  const handleRemoveMaterial = async (optionId: string) => {
    try {
      await removeMaterialOption(optionId);
      setMaterialOptions((prev) => prev.filter((o) => o.id !== optionId));
    } catch (err) {
      console.error('Failed to remove material option:', err);
    }
  };

  const handleMoveMaterial = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= materialOptions.length) return;
    const reordered = [...materialOptions];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setMaterialOptions(reordered);
    try {
      await reorderMaterialOptions(reordered.map((o) => o.id));
    } catch (err) {
      console.error('Failed to reorder materials:', err);
    }
  };

  const handleDefaultMaterialChange = async (materialId: string) => {
    try {
      await updateComponentGroup(group.id, { default_material_id: materialId || undefined });
      onUpdate();
    } catch (err) {
      console.error('Failed to set default material:', err);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteComponentGroup(group.id);
      onDelete();
    } catch (err) {
      console.error('Failed to delete group:', err);
    }
  };

  const getMaterialName = (materialId: string) => {
    return allMaterials.find((m) => m.id === materialId)?.name || materialId.slice(0, 8);
  };

  return (
    <div className="border border-border rounded-md bg-raised mb-1.5">
      {/* Collapsed row */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left hover:bg-hovr transition-colors rounded-md"
      >
        <ChevronRight
          size={14}
          className={`text-txt-tertiary transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
        />
        <span className="text-xs font-medium text-txt-primary truncate flex-1">{group.group_name}</span>
        <span className="text-[10px] text-txt-tertiary bg-surface px-1.5 py-0.5 rounded-full flex-shrink-0">
          {meshNames.length} mesh{meshNames.length !== 1 ? 'es' : ''}
        </span>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-2.5 pb-2.5 border-t border-border-subtle">
          {/* Actions row */}
          <div className="flex items-center gap-1 py-1.5 mb-1">
            {onMoveUp && (
              <IconButton label="Move up" size="sm" variant="ghost" onClick={onMoveUp}>
                <ChevronUp size={13} />
              </IconButton>
            )}
            {onMoveDown && (
              <IconButton label="Move down" size="sm" variant="ghost" onClick={onMoveDown}>
                <ChevronDown size={13} />
              </IconButton>
            )}
            <div className="flex-1" />
            <IconButton label="Delete group" size="sm" variant="ghost" onClick={handleDelete}>
              <Trash2 size={13} className="text-error" />
            </IconButton>
          </div>

          {/* Meshes */}
          <div className="mb-3">
            <div className="text-[10px] font-semibold text-txt-tertiary uppercase tracking-wider mb-1">Meshes</div>
            {meshNames.length === 0 && (
              <p className="text-[11px] text-txt-tertiary italic">No meshes assigned</p>
            )}
            {meshNames.map((name) => (
              <div key={name} className="flex items-center justify-between py-0.5 group">
                <span className="text-[11px] text-txt-secondary font-mono truncate">{name}</span>
                <button
                  onClick={() => handleRemoveMesh(name)}
                  className="opacity-0 group-hover:opacity-100 text-txt-tertiary hover:text-error transition-opacity p-0.5"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
            <div className="relative mt-1" ref={meshPickerRef}>
              <button
                onClick={() => { setShowMeshPicker(!showMeshPicker); setMeshSearch(''); }}
                className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-hover transition-colors"
              >
                <Plus size={11} /> Add Mesh
              </button>
              {showMeshPicker && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-overlay border border-border rounded-md shadow-lg z-20 max-h-48 flex flex-col">
                  <div className="p-1.5 border-b border-border-subtle">
                    <div className="flex items-center gap-1.5 bg-raised rounded px-2 py-1 border border-border-subtle">
                      <Search size={11} className="text-txt-tertiary flex-shrink-0" />
                      <input
                        autoFocus
                        value={meshSearch}
                        onChange={(e) => setMeshSearch(e.target.value)}
                        placeholder="Search meshes..."
                        className="bg-transparent text-[11px] text-txt-primary placeholder:text-txt-tertiary outline-none w-full"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {availableMeshes.length === 0 && (
                      <p className="text-[11px] text-txt-tertiary p-2 text-center">No meshes available</p>
                    )}
                    {availableMeshes.map((name) => (
                      <button
                        key={name}
                        onClick={() => handleAddMesh(name)}
                        className="w-full text-left px-2.5 py-1 text-[11px] text-txt-secondary hover:bg-hovr transition-colors font-mono truncate"
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Materials */}
          <div className="mb-3">
            <div className="text-[10px] font-semibold text-txt-tertiary uppercase tracking-wider mb-1">Material Options</div>
            {materialOptions.length === 0 && (
              <p className="text-[11px] text-txt-tertiary italic">No material options</p>
            )}
            {materialOptions.map((opt, i) => (
              <div key={opt.id} className="flex items-center gap-1 py-0.5 group">
                <span className="text-[11px] text-txt-secondary truncate flex-1">{getMaterialName(opt.material_id)}</span>
                <button
                  onClick={() => handleRemoveMaterial(opt.id)}
                  className="opacity-0 group-hover:opacity-100 text-txt-tertiary hover:text-error transition-opacity p-0.5"
                >
                  <X size={11} />
                </button>
                <button
                  onClick={() => handleMoveMaterial(i, -1)}
                  disabled={i === 0}
                  className="opacity-0 group-hover:opacity-100 text-txt-tertiary hover:text-txt-primary disabled:opacity-30 transition-opacity p-0.5"
                >
                  <ChevronUp size={11} />
                </button>
                <button
                  onClick={() => handleMoveMaterial(i, 1)}
                  disabled={i === materialOptions.length - 1}
                  className="opacity-0 group-hover:opacity-100 text-txt-tertiary hover:text-txt-primary disabled:opacity-30 transition-opacity p-0.5"
                >
                  <ChevronDown size={11} />
                </button>
              </div>
            ))}
            <div className="relative mt-1" ref={materialPickerRef}>
              <button
                onClick={() => { setShowMaterialPicker(!showMaterialPicker); setMaterialSearch(''); }}
                className="flex items-center gap-1 text-[11px] text-accent hover:text-accent-hover transition-colors"
              >
                <Plus size={11} /> Add Material
              </button>
              {showMaterialPicker && (
                <div className="absolute left-0 top-full mt-1 w-52 bg-overlay border border-border rounded-md shadow-lg z-20 max-h-48 flex flex-col">
                  <div className="p-1.5 border-b border-border-subtle">
                    <div className="flex items-center gap-1.5 bg-raised rounded px-2 py-1 border border-border-subtle">
                      <Search size={11} className="text-txt-tertiary flex-shrink-0" />
                      <input
                        autoFocus
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        placeholder="Search materials..."
                        className="bg-transparent text-[11px] text-txt-primary placeholder:text-txt-tertiary outline-none w-full"
                      />
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {availableMaterials.length === 0 && (
                      <p className="text-[11px] text-txt-tertiary p-2 text-center">No materials available</p>
                    )}
                    {availableMaterials.map((mat) => (
                      <button
                        key={mat.id}
                        onClick={() => handleAddMaterial(mat.id)}
                        className="w-full text-left px-2.5 py-1 text-[11px] text-txt-secondary hover:bg-hovr transition-colors truncate"
                      >
                        {mat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Default Material */}
          {materialOptions.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-txt-tertiary uppercase tracking-wider mb-1">Default Material</div>
              <select
                value={group.default_material_id || ''}
                onChange={(e) => handleDefaultMaterialChange(e.target.value)}
                className="w-full bg-raised text-txt-primary text-[11px] px-2 py-1 rounded border border-border-subtle focus:outline-none focus:border-border-focus"
              >
                <option value="">None</option>
                {materialOptions.map((opt) => (
                  <option key={opt.id} value={opt.material_id}>
                    {getMaterialName(opt.material_id)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
