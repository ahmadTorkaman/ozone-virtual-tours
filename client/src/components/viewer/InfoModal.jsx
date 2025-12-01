import { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

const InfoModal = ({ hotspot, onClose }) => {
  // Close on escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!hotspot) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{hotspot.title}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body">
          {hotspot.content && (
            <div className="modal-content">
              {hotspot.content}
            </div>
          )}
          
          {hotspot.mediaUrl && (
            <img
              className="modal-media"
              src={hotspot.mediaUrl}
              alt={hotspot.title}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
