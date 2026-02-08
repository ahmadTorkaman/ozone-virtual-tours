import { useEffect } from 'react';
import { Search, Plus, FolderPlus } from 'lucide-react';
import { useMaterialStore } from '@/stores/materialStore';
import {
  listMaterials,
  listMaterialCategories,
  createMaterialCategory,
  type Material as RawMaterial,
  type MaterialCategory as RawCategory,
} from '@/services/tauri';
import { parseMaterial } from '@/types/material';
import { MaterialCard } from './MaterialCard';
import { MaterialEditor } from './MaterialEditor';

interface MaterialLibraryProps {
  onSelect?: (materialId: string) => void;
  selectedMaterialId?: string | null;
  showApplyButton?: boolean;
  onApply?: (materialId: string) => void;
  canApply?: boolean;
}

export function MaterialLibrary({
  onSelect,
  selectedMaterialId,
  showApplyButton = false,
  onApply,
  canApply = true,
}: MaterialLibraryProps) {
  const {
    categories,
    searchQuery,
    selectedCategoryId,
    isLoading,
    isEditorOpen,
    setMaterials,
    setCategories,
    setSearchQuery,
    setSelectedCategory,
    setLoading,
    setSelectedMaterial,
    openEditor,
    getFilteredMaterials,
  } = useMaterialStore();

  // Load materials and categories on mount
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [rawMaterials, rawCategories] = await Promise.all([
        listMaterials(),
        listMaterialCategories(),
      ]);

      const materials = rawMaterials.map((raw: RawMaterial) => parseMaterial(raw));
      setMaterials(materials);

      const cats = rawCategories.map((raw: RawCategory) => ({
        id: raw.id,
        name: raw.name,
        sortOrder: raw.sort_order,
      }));
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load materials:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSelectMaterial = (materialId: string) => {
    setSelectedMaterial(materialId);
    onSelect?.(materialId);
  };

  const handleApplyMaterial = () => {
    if (selectedMaterialId && onApply) {
      onApply(selectedMaterialId);
    }
  };

  const handleAddCategory = async () => {
    const name = prompt('Enter category name:');
    if (name?.trim()) {
      try {
        const newCategory = await createMaterialCategory(name.trim());
        setCategories([
          ...categories,
          { id: newCategory.id, name: newCategory.name, sortOrder: newCategory.sort_order },
        ]);
      } catch (error) {
        console.error('Failed to create category:', error);
      }
    }
  };

  const filteredMaterials = getFilteredMaterials();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 pt-2.5 pb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[11px] font-medium text-txt-secondary uppercase tracking-wider">
            Materials
          </h2>
          <button
            type="button"
            onClick={() => openEditor()}
            className="flex items-center gap-1 bg-accent hover:bg-accent-hover text-white px-2 py-1 rounded text-[11px] font-medium transition-colors"
          >
            <Plus size={12} />
            New
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-tertiary pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search materials..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-raised text-txt-primary text-xs pl-7 pr-3 py-1.5 rounded border border-border-subtle focus:outline-none focus:border-border-focus placeholder:text-txt-tertiary transition-colors"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="flex gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-2 py-[3px] rounded-full text-[10px] transition-colors ${
              !selectedCategoryId
                ? 'bg-accent-muted text-accent'
                : 'bg-raised text-txt-tertiary hover:text-txt-secondary'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setSelectedCategory(category.id)}
              className={`px-2 py-[3px] rounded-full text-[10px] transition-colors ${
                selectedCategoryId === category.id
                  ? 'bg-accent-muted text-accent'
                  : 'bg-raised text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              {category.name}
            </button>
          ))}
          <button
            type="button"
            onClick={handleAddCategory}
            className="p-0.5 text-txt-tertiary hover:text-txt-secondary transition-colors"
            title="Add category"
          >
            <FolderPlus size={12} />
          </button>
        </div>
      </div>

      {/* Material grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-txt-tertiary">No materials found</p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-accent hover:underline text-[11px] mt-1"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {filteredMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                isSelected={selectedMaterialId === material.id}
                onClick={() => handleSelectMaterial(material.id)}
                onEdit={() => openEditor(material)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Apply button */}
      {showApplyButton && (
        <div className="px-3 py-2.5 border-t border-border flex-shrink-0">
          <button
            type="button"
            onClick={handleApplyMaterial}
            disabled={!selectedMaterialId || !canApply}
            className="w-full bg-accent hover:bg-accent-hover disabled:bg-raised disabled:text-txt-tertiary disabled:cursor-not-allowed text-white py-1.5 rounded text-xs font-medium transition-colors"
          >
            {!canApply
              ? 'Select an object first'
              : !selectedMaterialId
              ? 'Select a material'
              : 'Apply Material'}
          </button>
        </div>
      )}

      {/* Material Editor Modal */}
      {isEditorOpen && <MaterialEditor onSaved={loadData} />}
    </div>
  );
}
