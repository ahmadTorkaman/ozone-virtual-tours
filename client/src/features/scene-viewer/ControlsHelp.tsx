import { useSceneStore } from '@/stores/sceneStore';

export function ControlsHelp() {
  const { isPointerLocked } = useSceneStore();

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-overlay border border-border rounded-full px-3.5 py-1.5 flex items-center gap-2 text-[11px] text-txt-tertiary z-10">
      {!isPointerLocked ? (
        <span>
          <HintKey>Click</HintKey> to start exploring
        </span>
      ) : (
        <>
          <span><HintKey>W</HintKey><HintKey>A</HintKey><HintKey>S</HintKey><HintKey>D</HintKey> Move</span>
          <HintSep />
          <span><HintKey>Mouse</HintKey> Look</span>
          <HintSep />
          <span><HintKey>Click</HintKey> Select</span>
          <HintSep />
          <span><HintKey>Esc</HintKey> Exit</span>
        </>
      )}
    </div>
  );
}

function HintKey({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center h-[18px] px-1 bg-raised border border-border rounded-[3px] font-mono text-[10px] text-txt-secondary mx-0.5">
      {children}
    </kbd>
  );
}

function HintSep() {
  return <span className="w-px h-3 bg-border" />;
}
