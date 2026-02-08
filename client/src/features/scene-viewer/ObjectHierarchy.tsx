import { useMemo, useState } from 'react';
import { Search, Plus, ChevronRight, Eye, EyeOff, Box, Sun, Sofa, Package } from 'lucide-react';
import { useSceneStore } from '@/stores/sceneStore';

interface TreeGroup {
  name: string;
  items: string[];
  icon: typeof Box;
}

export function ObjectHierarchy() {
  const { sceneData, selectedObjectName, setSelectedObject } = useSceneStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Scene Root']));
  const [hiddenObjects, setHiddenObjects] = useState<Set<string>>(new Set());

  // Group objects by name prefix heuristic
  const groups = useMemo((): TreeGroup[] => {
    if (!sceneData) return [];
    const names = Array.from(sceneData.meshes.keys()).sort();

    // Group by common prefix patterns
    const groupMap = new Map<string, string[]>();

    for (const name of names) {
      // Try to find a group prefix (e.g., "Walls_Exterior" -> "Walls", "Light_Sun" -> "Lights")
      const lowerName = name.toLowerCase();
      let group = 'Objects';

      if (lowerName.includes('light') || lowerName.includes('lamp') || lowerName.includes('sun') || lowerName.includes('ambient')) {
        group = 'Lights';
      } else if (lowerName.includes('wall') || lowerName.includes('floor') || lowerName.includes('ceiling') || lowerName.includes('roof') || lowerName.includes('door') || lowerName.includes('window') || lowerName.includes('stair')) {
        group = 'Architecture';
      } else if (lowerName.includes('chair') || lowerName.includes('table') || lowerName.includes('sofa') || lowerName.includes('bed') || lowerName.includes('desk') || lowerName.includes('cabinet') || lowerName.includes('shelf')) {
        group = 'Furniture';
      } else if (lowerName.includes('plant') || lowerName.includes('vase') || lowerName.includes('rug') || lowerName.includes('curtain') || lowerName.includes('decor') || lowerName.includes('picture') || lowerName.includes('frame')) {
        group = 'Props';
      }

      if (!groupMap.has(group)) groupMap.set(group, []);
      groupMap.get(group)!.push(name);
    }

    const iconMap: Record<string, typeof Box> = {
      Lights: Sun,
      Architecture: Box,
      Furniture: Sofa,
      Props: Package,
      Objects: Box,
    };

    // Ordered priority
    const order = ['Lights', 'Architecture', 'Furniture', 'Props', 'Objects'];
    return order
      .filter((g) => groupMap.has(g))
      .map((g) => ({ name: g, items: groupMap.get(g)!, icon: iconMap[g] ?? Box }));
  }, [sceneData]);

  // Filter by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groups;
    const q = searchQuery.toLowerCase();
    return groups
      .map((g) => ({ ...g, items: g.items.filter((name) => name.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, searchQuery]);

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleVisibility = (name: string) => {
    setHiddenObjects((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (!sceneData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <Box size={24} className="text-txt-tertiary mb-2" />
        <p className="text-xs text-txt-tertiary">No scene loaded</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 flex-shrink-0">
        <h2 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider">Scene</h2>
        <button className="w-6 h-6 flex items-center justify-center rounded text-txt-tertiary hover:text-txt-primary hover:bg-hovr transition-colors">
          <Plus size={14} />
        </button>
      </div>

      {/* Search */}
      <div className="px-2.5 pb-2 flex-shrink-0">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder="Search objects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-raised text-txt-primary text-xs pl-7 pr-3 py-1.5 rounded border border-border-subtle focus:outline-none focus:border-border-focus placeholder:text-txt-tertiary transition-colors"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1">
        {/* Scene Root */}
        <div className="space-y-0.5">
          {filteredGroups.map((group) => {
            const isExpanded = expandedGroups.has(group.name) || !!searchQuery;
            const GroupIcon = group.icon;

            return (
              <div key={group.name}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.name)}
                  className="w-full flex items-center gap-1.5 px-2 py-[5px] rounded text-xs text-txt-secondary hover:bg-hovr hover:text-txt-primary transition-colors"
                >
                  <ChevronRight
                    size={14}
                    className={`text-txt-tertiary transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                  />
                  <GroupIcon size={14} className="text-txt-tertiary opacity-60 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">{group.name}</span>
                  <span className="text-[10px] text-txt-tertiary flex-shrink-0">{group.items.length}</span>
                </button>

                {/* Group items */}
                {isExpanded && (
                  <div className="ml-4 space-y-0.5">
                    {group.items.map((name) => {
                      const isSelected = selectedObjectName === name;
                      const isHidden = hiddenObjects.has(name);

                      return (
                        <div
                          key={name}
                          className={`group flex items-center gap-1.5 pl-5 pr-2 py-[5px] rounded text-xs cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-accent-muted text-accent'
                              : 'text-txt-secondary hover:bg-hovr hover:text-txt-primary'
                          }`}
                          onClick={() => setSelectedObject(name)}
                          title={name}
                        >
                          <Box size={14} className={`flex-shrink-0 ${isSelected ? 'opacity-100' : 'opacity-60'}`} />
                          <span className="flex-1 truncate">{name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVisibility(name);
                            }}
                            className={`flex-shrink-0 transition-opacity ${
                              isHidden ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            {isHidden ? (
                              <EyeOff size={13} className="text-txt-tertiary" />
                            ) : (
                              <Eye size={13} className="text-txt-tertiary hover:text-txt-secondary" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
