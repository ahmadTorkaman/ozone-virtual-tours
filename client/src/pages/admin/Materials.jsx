// ===========================================
// Materials Page - Ozone Material Editor
// ===========================================

import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Download,
  Upload,
  RefreshCw,
  Palette,
  Grid,
  List,
  Sparkles,
  Cloud,
  CloudOff,
} from 'lucide-react';
import { useMaterialStore, MATERIAL_PRESETS } from '../../stores/materialStore';
import MaterialCard from '../../components/admin/material-editor/MaterialCard';
import CategoryManager from '../../components/admin/material-editor/CategoryManager';
import MaterialEditor from '../../components/admin/material-editor/MaterialEditor';
import './Materials.css';

export default function Materials() {
  const {
    materials,
    categories,
    isLoading,
    isSyncing,
    error,
    lastSyncedAt,
    searchQuery,
    setSearchQuery,
    isEditorOpen,
    closeEditor,
    fetchLibrary,
    syncLibrary,
    createMaterial,
    getFilteredMaterials,
    getMaterialCount,
    exportLibrary,
    importLibrary,
  } = useMaterialStore();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [showPresetMenu, setShowPresetMenu] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch library on mount
  useEffect(() => {
    fetchLibrary().catch(console.error);
  }, [fetchLibrary]);

  // Handle create new material
  const handleCreateMaterial = (presetKey = null) => {
    createMaterial(presetKey);
    setShowPresetMenu(false);
  };

  // Handle sync
  const handleSync = async () => {
    try {
      await syncLibrary();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  // Handle export
  const handleExport = () => {
    const data = exportLibrary();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `material-library-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle import
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const mode = window.confirm(
          'Do you want to merge with existing materials?\n\nOK = Merge (keep existing)\nCancel = Replace all'
        )
          ? 'merge'
          : 'replace';
        importLibrary(data, mode);
        handleSync(); // Sync after import
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import: Invalid file format');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredMaterials = getFilteredMaterials();
  const totalCount = getMaterialCount();

  // Format last synced time
  const formatSyncTime = (date) => {
    if (!date) return 'Never synced';
    const d = new Date(date);
    return `Synced ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="materials-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div>
            <h1 className="page-title">
              <Palette size={28} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Material Library
            </h1>
            <p className="page-subtitle">
              Create and manage PBR materials for your 3D scenes
            </p>
          </div>

          <div className="page-header-actions">
            {/* Sync Status */}
            <div className="sync-status">
              {isSyncing ? (
                <RefreshCw size={16} className="sync-icon spinning" />
              ) : lastSyncedAt ? (
                <Cloud size={16} className="sync-icon synced" />
              ) : (
                <CloudOff size={16} className="sync-icon" />
              )}
              <span className="sync-text">{isSyncing ? 'Syncing...' : formatSyncTime(lastSyncedAt)}</span>
            </div>

            {/* Sync Button */}
            <button className="btn btn-secondary" onClick={handleSync} disabled={isSyncing}>
              <RefreshCw size={16} className={isSyncing ? 'spinning' : ''} />
              Sync
            </button>

            {/* Import */}
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
              <Upload size={16} />
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />

            {/* Export */}
            <button className="btn btn-secondary" onClick={handleExport} disabled={totalCount === 0}>
              <Download size={16} />
              Export
            </button>

            {/* Create New */}
            <div className="create-btn-wrapper">
              <button className="btn btn-primary" onClick={() => handleCreateMaterial()}>
                <Plus size={18} />
                New Material
              </button>
              <button
                className="btn btn-primary preset-trigger"
                onClick={() => setShowPresetMenu(!showPresetMenu)}
                title="Create from preset"
              >
                <Sparkles size={16} />
              </button>

              {showPresetMenu && (
                <>
                  <div className="preset-menu-backdrop" onClick={() => setShowPresetMenu(false)} />
                  <div className="preset-menu">
                    <div className="preset-menu-header">Start from preset</div>
                    {Object.entries(MATERIAL_PRESETS).map(([key, preset]) => (
                      <button
                        key={key}
                        className="preset-menu-item"
                        onClick={() => handleCreateMaterial(key)}
                      >
                        <span
                          className="preset-menu-color"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span className="preset-menu-name">{preset.name}</span>
                        <span className="preset-menu-category">{preset.category}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={() => useMaterialStore.getState().clearError()}>Dismiss</button>
        </div>
      )}

      {/* Main Content */}
      <div className="materials-content">
        {/* Sidebar - Categories */}
        <aside className="materials-sidebar">
          <CategoryManager />

          {/* Stats */}
          <div className="materials-stats">
            <div className="stat-item">
              <span className="stat-number">{totalCount}</span>
              <span className="stat-label">Materials</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{categories.length}</span>
              <span className="stat-label">Categories</span>
            </div>
          </div>
        </aside>

        {/* Main Grid */}
        <main className="materials-main">
          {/* Toolbar */}
          <div className="materials-toolbar">
            {/* Search */}
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Search materials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* View Toggle */}
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <Grid size={18} />
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <List size={18} />
              </button>
            </div>

            {/* Results Count */}
            <span className="results-count">
              {filteredMaterials.length} {filteredMaterials.length === 1 ? 'material' : 'materials'}
            </span>
          </div>

          {/* Materials Grid/List */}
          {filteredMaterials.length === 0 ? (
            <div className="empty-state">
              <Palette size={64} className="empty-state-icon" />
              <h3 className="empty-state-title">
                {searchQuery ? 'No materials found' : 'No materials yet'}
              </h3>
              <p className="empty-state-text">
                {searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'Create your first material to get started with the library.'}
              </p>
              {!searchQuery && (
                <button className="btn btn-primary" onClick={() => handleCreateMaterial()}>
                  <Plus size={18} />
                  Create Material
                </button>
              )}
            </div>
          ) : (
            <div className={`materials-grid ${viewMode}`}>
              {filteredMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Material Editor Modal */}
      {isEditorOpen && <MaterialEditor onClose={closeEditor} />}
    </div>
  );
}
