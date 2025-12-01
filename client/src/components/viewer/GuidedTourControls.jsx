import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const GuidedTourControls = ({
  currentIndex,
  totalScenes,
  onPrev,
  onNext,
  onExit,
  autoAdvance = true,
  autoAdvanceDelay = 8000
}) => {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);
  const progressRef = useRef(null);

  // Auto-advance with progress bar
  useEffect(() => {
    if (!autoAdvance) {
      setProgress(0);
      return;
    }

    const startTime = Date.now();
    
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percent = Math.min((elapsed / autoAdvanceDelay) * 100, 100);
      setProgress(percent);
    }, 50);

    intervalRef.current = setTimeout(() => {
      onNext();
    }, autoAdvanceDelay);

    return () => {
      clearTimeout(intervalRef.current);
      clearInterval(progressRef.current);
      setProgress(0);
    };
  }, [currentIndex, autoAdvance, autoAdvanceDelay, onNext]);

  return (
    <div className="guided-tour-controls">
      {/* Previous Button */}
      <button
        className="guided-nav-btn"
        onClick={onPrev}
        disabled={currentIndex === 0}
        title="Previous scene"
      >
        <ChevronLeft size={24} />
      </button>

      {/* Progress Dots */}
      <div className="guided-progress">
        {Array.from({ length: totalScenes }).map((_, index) => (
          <div
            key={index}
            className={`guided-dot ${
              index === currentIndex ? 'active' : ''
            } ${index < currentIndex ? 'completed' : ''}`}
            style={
              index === currentIndex && autoAdvance
                ? {
                    background: `conic-gradient(
                      var(--primary) ${progress}%, 
                      var(--border) ${progress}%
                    )`
                  }
                : {}
            }
          />
        ))}
      </div>

      {/* Next Button */}
      <button
        className="guided-nav-btn"
        onClick={onNext}
        title="Next scene"
      >
        <ChevronRight size={24} />
      </button>

      {/* Exit Button */}
      <button
        className="guided-exit-btn"
        onClick={onExit}
        title="Exit guided tour"
      >
        <X size={14} />
        Exit
      </button>
    </div>
  );
};

export default GuidedTourControls;
