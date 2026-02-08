import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { listProjects, createProject, deleteProject, type Project } from '@/services/tauri';
import { Plus, LayoutGrid, List, Search, MoreVertical, Trash2, Pencil, FolderOpen } from 'lucide-react';
import { Button, IconButton, SearchInput } from '@/components/ui';

type ViewMode = 'grid' | 'list';
type SortBy = 'updated' | 'name' | 'created';

export function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [searchQuery, setSearchQuery] = useState('');
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const contextRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (contextRef.current && !contextRef.current.contains(e.target as Node)) {
        setContextMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listProjects();
      setProjects(data);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    try {
      setError(null);
      const project = await createProject({
        name: `New Project ${projects.length + 1}`,
        description: 'Created from Ozone Studio',
      });
      setProjects([project, ...projects]);
    } catch (err) {
      setError(err as string);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setContextMenuId(null);
    try {
      setError(null);
      await deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
    } catch (err) {
      setError(err as string);
    }
  };

  const sortedProjects = [...projects]
    .filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-base">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <h1 className="text-2xl font-semibold text-txt-primary">Projects</h1>
        <Button onClick={handleCreateProject}>
          <Plus size={16} />
          New Project
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-6 pb-4 flex-shrink-0">
        {/* View toggle */}
        <div className="flex bg-raised rounded border border-border">
          <IconButton
            label="Grid view"
            size="sm"
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-hovr' : ''}
          >
            <LayoutGrid size={14} />
          </IconButton>
          <IconButton
            label="List view"
            size="sm"
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-hovr' : ''}
          >
            <List size={14} />
          </IconButton>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="bg-raised text-txt-secondary text-sm px-2.5 py-1 rounded border border-border focus:outline-none focus:ring-2 focus:ring-accent/50 cursor-pointer"
        >
          <option value="updated">Last modified</option>
          <option value="name">Name</option>
          <option value="created">Date created</option>
        </select>

        <div className="flex-1" />

        {/* Search */}
        <div className="w-56">
          <SearchInput
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-6 mb-4 bg-error/10 border border-error/30 text-error px-4 py-2.5 rounded text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : sortedProjects.length === 0 && !searchQuery ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen size={40} className="text-txt-tertiary mb-3" />
            <p className="text-txt-secondary text-lg">No projects yet</p>
            <p className="text-txt-tertiary text-sm mt-1 mb-4">Create your first project to get started</p>
            <Button onClick={handleCreateProject}>
              <Plus size={16} />
              New Project
            </Button>
          </div>
        ) : sortedProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Search size={32} className="text-txt-tertiary mb-3" />
            <p className="text-txt-secondary">No projects match "{searchQuery}"</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {sortedProjects.map((project) => (
              <div
                key={project.id}
                className="group bg-raised border border-border rounded-lg overflow-hidden hover:border-border-focus/40 transition-colors cursor-pointer relative"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                {/* Thumbnail placeholder */}
                <div className="h-36 bg-surface flex items-center justify-center">
                  <FolderOpen size={32} className="text-txt-tertiary" />
                </div>

                {/* Content */}
                <div className="p-3.5">
                  <h3 className="text-sm font-medium text-txt-primary truncate">{project.name}</h3>
                  {project.description && (
                    <p className="text-xs text-txt-tertiary mt-1 line-clamp-2">{project.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-txt-tertiary">{formatDate(project.updated_at)}</span>
                  </div>
                </div>

                {/* Context menu button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" ref={contextMenuId === project.id ? contextRef : undefined}>
                  <IconButton
                    label="More actions"
                    size="sm"
                    variant="secondary"
                    className="bg-overlay/80 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuId(contextMenuId === project.id ? null : project.id);
                    }}
                  >
                    <MoreVertical size={14} />
                  </IconButton>

                  {contextMenuId === project.id && (
                    <div className="absolute right-0 top-8 bg-overlay border border-border rounded-md shadow-lg py-1 w-36 z-10">
                      <button
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-txt-secondary hover:bg-hovr hover:text-txt-primary transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setContextMenuId(null);
                        }}
                      >
                        <Pencil size={13} /> Rename
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Dashed "New Project" card */}
            <button
              onClick={handleCreateProject}
              className="h-full min-h-[220px] border-2 border-dashed border-border hover:border-txt-tertiary rounded-lg flex flex-col items-center justify-center gap-2 text-txt-tertiary hover:text-txt-secondary transition-colors cursor-pointer"
            >
              <Plus size={24} />
              <span className="text-sm">New Project</span>
            </button>
          </div>
        ) : (
          /* List View */
          <div className="flex flex-col gap-1">
            {sortedProjects.map((project) => (
              <div
                key={project.id}
                className="group flex items-center gap-4 px-4 py-3 bg-raised border border-transparent hover:border-border rounded-md transition-colors cursor-pointer"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="w-8 h-8 rounded bg-surface flex items-center justify-center flex-shrink-0">
                  <FolderOpen size={16} className="text-txt-tertiary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-txt-primary truncate">{project.name}</h3>
                  {project.description && (
                    <p className="text-xs text-txt-tertiary truncate">{project.description}</p>
                  )}
                </div>
                <span className="text-xs text-txt-tertiary flex-shrink-0">{formatDate(project.updated_at)}</span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <IconButton
                    label="Delete"
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Keyboard shortcuts bar */}
      <div className="flex items-center justify-center gap-6 px-6 py-2 border-t border-border-subtle flex-shrink-0">
        <span className="text-xs text-txt-tertiary">
          <kbd className="px-1.5 py-0.5 bg-raised border border-border rounded text-[10px] font-mono">↑↓</kbd> Navigate
        </span>
        <span className="text-xs text-txt-tertiary">
          <kbd className="px-1.5 py-0.5 bg-raised border border-border rounded text-[10px] font-mono">Enter</kbd> Open
        </span>
        <span className="text-xs text-txt-tertiary">
          <kbd className="px-1.5 py-0.5 bg-raised border border-border rounded text-[10px] font-mono">N</kbd> New project
        </span>
        <span className="text-xs text-txt-tertiary">
          <kbd className="px-1.5 py-0.5 bg-raised border border-border rounded text-[10px] font-mono">/</kbd> Search
        </span>
      </div>
    </div>
  );
}
