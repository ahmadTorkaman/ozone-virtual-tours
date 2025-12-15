import { useState } from 'react';
import { Plus, X, Edit2, Check, Folder, FolderOpen } from 'lucide-react';
import { useMaterialStore } from '../../../stores/materialStore';
import './CategoryManager.css';

export default function CategoryManager({ onCategorySelect }) {
  const {
    categories,
    activeCategory,
    setActiveCategory,
    addCategory,
    removeCategory,
    renameCategory,
    getCategoryCount,
    getMaterialCount,
  } = useMaterialStore();

  const [isAdding, setIsAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      const success = addCategory(newCategoryName.trim());
      if (success) {
        setNewCategoryName('');
        setIsAdding(false);
      }
    }
  };

  const handleStartRename = (category) => {
    setEditingCategory(category);
    setEditName(category);
  };

  const handleRename = () => {
    if (editName.trim() && editName !== editingCategory) {
      renameCategory(editingCategory, editName.trim());
    }
    setEditingCategory(null);
    setEditName('');
  };

  const handleRemove = (category) => {
    const count = getCategoryCount(category);
    if (count > 0) {
      if (!window.confirm(`"${category}" contains ${count} material(s). Materials will become uncategorized. Continue?`)) {
        return;
      }
    }
    removeCategory(category);
    if (activeCategory === category) {
      setActiveCategory(null);
    }
  };

  const handleSelect = (category) => {
    const newCategory = activeCategory === category ? null : category;
    setActiveCategory(newCategory);
    onCategorySelect?.(newCategory);
  };

  const totalCount = getMaterialCount();

  return (
    <div className="category-manager">
      <div className="category-header">
        <h3 className="category-title">Categories</h3>
        <button
          className="category-add-btn"
          onClick={() => setIsAdding(true)}
          title="Add category"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="category-list">
        {/* All Materials */}
        <button
          className={`category-item ${activeCategory === null ? 'active' : ''}`}
          onClick={() => handleSelect(null)}
        >
          <FolderOpen size={16} className="category-icon" />
          <span className="category-name">All Materials</span>
          <span className="category-count">{totalCount}</span>
        </button>

        {/* Category Items */}
        {categories.map((category) => {
          const count = getCategoryCount(category);
          const isEditing = editingCategory === category;

          return (
            <div key={category} className="category-item-wrapper">
              {isEditing ? (
                <div className="category-edit-form">
                  <input
                    type="text"
                    className="category-edit-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename();
                      if (e.key === 'Escape') setEditingCategory(null);
                    }}
                    autoFocus
                  />
                  <button className="category-edit-save" onClick={handleRename}>
                    <Check size={14} />
                  </button>
                  <button className="category-edit-cancel" onClick={() => setEditingCategory(null)}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  className={`category-item ${activeCategory === category ? 'active' : ''}`}
                  onClick={() => handleSelect(category)}
                >
                  <Folder size={16} className="category-icon" />
                  <span className="category-name">{category}</span>
                  <span className="category-count">{count}</span>
                </button>
              )}

              {!isEditing && (
                <div className="category-actions">
                  <button
                    className="category-action"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartRename(category);
                    }}
                    title="Rename"
                  >
                    <Edit2 size={12} />
                  </button>
                  <button
                    className="category-action danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(category);
                    }}
                    title="Delete"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Add New Category Form */}
        {isAdding && (
          <div className="category-add-form">
            <input
              type="text"
              className="category-add-input"
              placeholder="Category name..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCategory();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewCategoryName('');
                }
              }}
              autoFocus
            />
            <button className="category-add-save" onClick={handleAddCategory}>
              <Check size={14} />
            </button>
            <button
              className="category-add-cancel"
              onClick={() => {
                setIsAdding(false);
                setNewCategoryName('');
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
