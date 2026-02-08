interface LoadingOverlayProps {
  progress: number;
}

export function LoadingOverlay({ progress }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-base flex flex-col items-center justify-center z-50">
      <div className="text-center">
        <h2 className="text-lg text-txt-primary mb-4">Loading Scene</h2>

        <div className="w-64 h-1.5 bg-raised rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-txt-tertiary text-xs mt-2">{progress}%</p>
      </div>
    </div>
  );
}
