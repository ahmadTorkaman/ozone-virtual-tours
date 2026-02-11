import { useCallback } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { resolveAssetUrl } from '@/services/assetLoader';
import type { ConfigurableComponent } from '@/types/manifest';

interface MaterialPickerProps {
  open: boolean;
  component: ConfigurableComponent | null;
  activeMaterialId: string | null;
  onSelect: (materialId: string) => void;
  onClose: () => void;
}

export function MaterialPicker({
  open,
  component,
  activeMaterialId,
  onSelect,
  onClose,
}: MaterialPickerProps) {
  const handleDragDown = useCallback(
    (e: React.TouchEvent) => {
      const startY = e.touches[0].clientY;
      const handleMove = (ev: TouchEvent) => {
        if (ev.touches[0].clientY - startY > 60) {
          onClose();
          cleanup();
        }
      };
      const cleanup = () => {
        document.removeEventListener('touchmove', handleMove);
        document.removeEventListener('touchend', cleanup);
      };
      document.addEventListener('touchmove', handleMove, { passive: true });
      document.addEventListener('touchend', cleanup);
    },
    [onClose]
  );

  return (
    <div
      className={clsx(
        'absolute bottom-0 left-0 right-0 z-40',
        'glass border-t border-border/50 rounded-t-xl',
        'transition-transform duration-300 ease-out safe-bottom',
        open && component ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      {/* Handle bar */}
      <div
        className="flex justify-center pt-2 pb-1 cursor-grab"
        onTouchStart={handleDragDown}
      >
        <div className="w-10 h-1 rounded-full bg-txt-tertiary/40" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-sm font-medium text-txt-primary">
          {component?.name || 'Materials'}
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-hovr transition-colors"
        >
          <X size={14} className="text-txt-secondary" />
        </button>
      </div>

      {/* Material thumbnails */}
      <div className="px-4 pb-4 overflow-x-auto">
        <div className="flex gap-2 sm:grid sm:grid-cols-4 md:grid-cols-6">
          {component?.materials.map((mat) => {
            const isActive = activeMaterialId === mat.id;
            return (
              <button
                key={mat.id}
                onClick={() => onSelect(mat.id)}
                className={clsx(
                  'flex-shrink-0 flex flex-col items-center gap-1.5 p-1.5 rounded-md transition-all',
                  'hover:bg-hovr min-w-[72px]',
                  isActive && 'ring-2 ring-accent bg-accent-muted'
                )}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded bg-overlay overflow-hidden">
                  <img
                    src={resolveAssetUrl(mat.thumbnail)}
                    alt={mat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] text-txt-secondary text-center leading-tight line-clamp-2 max-w-[72px]">
                  {mat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
