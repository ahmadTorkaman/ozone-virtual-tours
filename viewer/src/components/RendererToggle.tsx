import { clsx } from 'clsx';
import { useViewerStore } from '@/stores/viewerStore';

export function RendererToggle() {
  const mode = useViewerStore((s) => s.rendererMode);
  const gpuTier = useViewerStore((s) => s.gpuTier);
  const samples = useViewerStore((s) => s.pathTracerSamples);
  const converged = useViewerStore((s) => s.pathTracerConverged);
  const setRendererMode = useViewerStore((s) => s.setRendererMode);

  const hdDisabled = gpuTier === 'low';

  return (
    <div className="glass border border-border/50 rounded-full flex items-center p-0.5 gap-0.5">
      <button
        onClick={() => setRendererMode('pbr')}
        className={clsx(
          'px-3 py-1 text-xs font-medium rounded-full transition-colors',
          mode === 'pbr'
            ? 'bg-accent text-white'
            : 'text-txt-secondary hover:text-txt-primary'
        )}
      >
        PBR
      </button>
      <button
        onClick={() => !hdDisabled && setRendererMode('pathtracer')}
        disabled={hdDisabled}
        className={clsx(
          'px-3 py-1 text-xs font-medium rounded-full transition-colors relative',
          hdDisabled && 'opacity-40 cursor-not-allowed',
          mode === 'pathtracer'
            ? 'bg-accent text-white'
            : 'text-txt-secondary hover:text-txt-primary'
        )}
      >
        HD
        {mode === 'pathtracer' && !converged && (
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-warning animate-pulse" />
        )}
      </button>
    </div>
  );
}
