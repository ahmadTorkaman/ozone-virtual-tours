import { resolveAssetUrl } from '@/services/assetLoader';
import { useViewerStore } from '@/stores/viewerStore';

interface LoadingScreenProps {
  progress?: number;
  message?: string;
}

export function LoadingScreen({ progress = 0, message }: LoadingScreenProps) {
  const manifest = useViewerStore((s) => s.manifest);
  const firmLogo = manifest?.branding?.firm_logo;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-base">
      {firmLogo && (
        <img
          src={resolveAssetUrl(firmLogo)}
          alt="Firm logo"
          className="w-16 h-16 object-contain mb-6 opacity-60"
        />
      )}

      <div className="w-48 h-1 bg-raised rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      <p className="mt-3 text-sm text-txt-secondary">
        {message || `${Math.round(progress)}%`}
      </p>
    </div>
  );
}
