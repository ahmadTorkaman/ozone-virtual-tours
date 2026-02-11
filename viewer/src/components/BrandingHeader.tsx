import { resolveAssetUrl } from '@/services/assetLoader';
import type { Manifest } from '@/types/manifest';

interface BrandingHeaderProps {
  branding: Manifest['branding'];
}

export function BrandingHeader({ branding }: BrandingHeaderProps) {
  return (
    <header className="glass border-b border-border/50 px-4 py-2.5 flex items-center gap-3">
      {branding.firm_logo && (
        <img
          src={resolveAssetUrl(branding.firm_logo)}
          alt={branding.firm_name}
          className="w-7 h-7 object-contain rounded"
        />
      )}
      <span className="text-sm font-medium text-txt-primary">
        {branding.firm_name}
      </span>
    </header>
  );
}
