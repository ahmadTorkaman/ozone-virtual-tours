import { Map, Play, Pause } from 'lucide-react';

const TourHeader = ({
  tourName,
  sceneName,
  sceneIndex,
  totalScenes,
  showFloorPlan,
  onToggleFloorPlan,
  isGuidedMode,
  onToggleGuidedMode
}) => {
  return (
    <header className="tour-header">
      <div className="tour-info">
        <h1>{tourName}</h1>
        <div className="scene-indicator">
          <span className="scene-name">{sceneName}</span>
          <span className="scene-count">{sceneIndex} / {totalScenes}</span>
        </div>
      </div>
      
      <div className="tour-controls">
        <button
          className={`btn ${showFloorPlan ? 'active' : ''}`}
          onClick={onToggleFloorPlan}
          title="Toggle floor plan"
        >
          <Map size={18} />
          <span className="btn-label">Floor Plan</span>
        </button>
        
        <button
          className={`btn ${isGuidedMode ? 'active' : ''}`}
          onClick={onToggleGuidedMode}
          title={isGuidedMode ? 'Exit guided tour' : 'Start guided tour'}
        >
          {isGuidedMode ? <Pause size={18} /> : <Play size={18} />}
          <span className="btn-label">Guided Tour</span>
        </button>
      </div>
    </header>
  );
};

export default TourHeader;
