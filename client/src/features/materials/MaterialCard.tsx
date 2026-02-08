import { Pencil, Check } from 'lucide-react';
import type { Material } from '@/types/material';
import { MaterialPreviewSmall } from './MaterialPreview';

interface MaterialCardProps {
  material: Material;
  isSelected?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
}

export function MaterialCard({
  material,
  isSelected = false,
  onClick,
  onEdit,
}: MaterialCardProps) {
  const typeLabel = getMaterialTypeLabel(material);

  return (
    <div
      className={`relative group rounded-lg overflow-hidden cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-accent bg-accent-muted'
          : 'bg-raised hover:bg-hovr hover:ring-1 hover:ring-border'
      }`}
      onClick={onClick}
    >
      {/* Preview */}
      <div className="aspect-square bg-base flex items-center justify-center">
        <MaterialPreviewSmall material={material} size={100} />
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="text-txt-primary text-[11px] font-medium truncate" title={material.name}>
          {material.name}
        </p>
        <p className="text-txt-tertiary text-[10px] truncate">{typeLabel}</p>
      </div>

      {/* Edit button - appears on hover */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onEdit?.();
        }}
        className="absolute top-1.5 right-1.5 p-1 bg-overlay/80 hover:bg-hovr rounded opacity-0 group-hover:opacity-100 transition-opacity"
        title="Edit material"
      >
        <Pencil size={12} className="text-txt-secondary" />
      </button>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
          <Check size={10} className="text-white" />
        </div>
      )}
    </div>
  );
}

function getMaterialTypeLabel(material: Material): string {
  const labels: string[] = [];

  if (material.metalness > 0.5) labels.push('Metallic');
  if (material.transmission > 0) labels.push('Glass');
  if (material.clearcoat > 0) labels.push('Clearcoat');
  if (material.sheen > 0) labels.push('Fabric');
  if (material.iridescence > 0) labels.push('Iridescent');

  return labels.length === 0 ? 'Standard' : labels.join(' / ');
}
