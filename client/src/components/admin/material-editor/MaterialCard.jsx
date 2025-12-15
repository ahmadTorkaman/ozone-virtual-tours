import { useState } from 'react';
import { Edit3, Copy, Trash2, MoreVertical } from 'lucide-react';
import { MaterialPreviewMini } from './MaterialPreview3D';
import { useMaterialStore } from '../../../stores/materialStore';
import './MaterialCard.css';

export default function MaterialCard({ material, onEdit }) {
  const [showMenu, setShowMenu] = useState(false);
  const { duplicateMaterial, deleteMaterial, openEditor } = useMaterialStore();

  const handleEdit = () => {
    openEditor(material);
    if (onEdit) onEdit(material);
  };

  const handleDuplicate = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    duplicateMaterial(material.id);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    setShowMenu(false);
    if (window.confirm(`Delete "${material.name}"?`)) {
      try {
        await deleteMaterial(material.id);
      } catch (error) {
        console.error('Failed to delete material:', error);
      }
    }
  };

  const toggleMenu = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  // Close menu when clicking outside
  const closeMenu = () => setShowMenu(false);

  return (
    <div className="material-card" onClick={handleEdit}>
      {/* 3D Preview */}
      <div className="material-card-preview">
        <MaterialPreviewMini material={material} />

        {/* Overlay on hover */}
        <div className="material-card-overlay">
          <button className="material-card-edit-btn">
            <Edit3 size={20} />
            Edit
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="material-card-info">
        <div className="material-card-header">
          <h3 className="material-card-name">{material.name}</h3>
          <div className="material-card-menu-wrapper">
            <button
              className="material-card-menu-btn"
              onClick={toggleMenu}
              aria-label="More options"
            >
              <MoreVertical size={16} />
            </button>

            {showMenu && (
              <>
                <div className="material-card-menu-backdrop" onClick={closeMenu} />
                <div className="material-card-menu">
                  <button className="menu-item" onClick={handleDuplicate}>
                    <Copy size={14} />
                    Duplicate
                  </button>
                  <button className="menu-item danger" onClick={handleDelete}>
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <span className="material-card-category">{material.category}</span>

        {/* Properties preview */}
        <div className="material-card-props">
          <div className="prop-item">
            <span
              className="prop-color"
              style={{ backgroundColor: material.color }}
            />
          </div>
          <div className="prop-item">
            <span className="prop-label">M</span>
            <span className="prop-value">{(material.metalness * 100).toFixed(0)}%</span>
          </div>
          <div className="prop-item">
            <span className="prop-label">R</span>
            <span className="prop-value">{(material.roughness * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact card for smaller views
export function MaterialCardCompact({ material, onSelect, isSelected }) {
  return (
    <div
      className={`material-card-compact ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect?.(material)}
    >
      <div className="compact-preview">
        <MaterialPreviewMini material={material} />
      </div>
      <div className="compact-info">
        <span className="compact-name">{material.name}</span>
        <span className="compact-category">{material.category}</span>
      </div>
    </div>
  );
}
