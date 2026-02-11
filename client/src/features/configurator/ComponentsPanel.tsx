import { useState, useEffect } from 'react';
import { Plus, Layers, X, Check } from 'lucide-react';
import { IconButton } from '@/components/ui';
import {
  listComponentGroups,
  createComponentGroup,
  reorderComponentGroups,
  type ComponentGroup,
} from '@/services/tauri';
import { useSceneStore } from '@/stores/sceneStore';
import { ComponentGroupItem } from './ComponentGroupItem';

interface ComponentsPanelProps {
  projectId: string;
  sceneId: string;
}

export function ComponentsPanel({ projectId, sceneId }: ComponentsPanelProps) {
  const [groups, setGroups] = useState<ComponentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const selectedObjectName = useSceneStore((s) => s.selectedObjectName);

  const loadGroups = async () => {
    try {
      const data = await listComponentGroups(sceneId);
      setGroups(data);
    } catch (err) {
      console.error('Failed to load component groups:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadGroups();
  }, [sceneId]);

  const handleCreate = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    try {
      await createComponentGroup({
        project_id: projectId,
        scene_id: sceneId,
        group_name: name,
        mesh_names: selectedObjectName ? [selectedObjectName] : [],
      });
      setNewGroupName('');
      setIsCreating(false);
      await loadGroups();
    } catch (err) {
      console.error('Failed to create group:', err);
    }
  };

  const handleReorder = async (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= groups.length) return;
    const reordered = [...groups];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];
    setGroups(reordered);
    try {
      await reorderComponentGroups(reordered.map((g) => g.id));
    } catch (err) {
      console.error('Failed to reorder groups:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border-subtle flex-shrink-0">
        <span className="text-xs font-medium text-txt-tertiary uppercase tracking-wider">Component Groups</span>
        <IconButton
          label="New group"
          size="sm"
          variant="ghost"
          onClick={() => { setIsCreating(true); setNewGroupName(''); }}
        >
          <Plus size={14} className="text-accent" />
        </IconButton>
      </div>

      {/* Create form */}
      {isCreating && (
        <div className="px-3 py-2 border-b border-border-subtle bg-surface flex items-center gap-1.5">
          <input
            autoFocus
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setIsCreating(false); }}
            placeholder="Group name..."
            className="flex-1 bg-raised text-txt-primary text-[11px] px-2 py-1 rounded border border-border-subtle focus:outline-none focus:border-border-focus min-w-0"
          />
          <IconButton label="Create" size="sm" variant="ghost" onClick={handleCreate}>
            <Check size={13} className="text-success" />
          </IconButton>
          <IconButton label="Cancel" size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
            <X size={13} className="text-txt-tertiary" />
          </IconButton>
        </div>
      )}

      {/* Groups list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {groups.length === 0 && !isCreating && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Layers size={28} className="text-txt-tertiary mb-2" />
            <p className="text-xs text-txt-tertiary">No component groups yet</p>
            <p className="text-[10px] text-txt-tertiary mt-1">Create a group to define configurable parts of your scene</p>
          </div>
        )}
        {groups.map((group, i) => (
          <ComponentGroupItem
            key={group.id}
            group={group}
            isExpanded={expandedGroupId === group.id}
            onToggleExpand={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
            onUpdate={loadGroups}
            onDelete={loadGroups}
            onMoveUp={i > 0 ? () => handleReorder(i, -1) : undefined}
            onMoveDown={i < groups.length - 1 ? () => handleReorder(i, 1) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
