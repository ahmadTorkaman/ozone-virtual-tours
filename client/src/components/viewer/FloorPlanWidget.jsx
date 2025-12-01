import { X } from 'lucide-react';

const FloorPlanWidget = ({
  floorPlan,
  scenes,
  currentSceneId,
  onSceneSelect,
  onClose
}) => {
  if (!floorPlan) return null;

  return (
    <div className="floor-plan-widget">
      <div className="floor-plan-header">
        <h3>{floorPlan.name || 'Floor Plan'}</h3>
        {onClose && (
          <button className="floor-plan-close" onClick={onClose}>
            <X size={16} />
          </button>
        )}
      </div>
      
      <div className="floor-plan-content">
        <div
          className="floor-plan-image"
          style={{
            backgroundImage: `url(${floorPlan.imageUrl})`,
            width: '100%',
            aspectRatio: `${floorPlan.width} / ${floorPlan.height}`
          }}
        >
          {scenes.map((scene) => {
            if (scene.floorPlanX == null || scene.floorPlanY == null) return null;
            
            // Calculate position as percentage
            const leftPercent = (scene.floorPlanX / floorPlan.width) * 100;
            const topPercent = (scene.floorPlanY / floorPlan.height) * 100;
            
            return (
              <button
                key={scene.id}
                className={`scene-marker ${scene.id === currentSceneId ? 'active' : ''}`}
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`
                }}
                onClick={() => onSceneSelect(scene.id)}
                title={scene.name}
              >
                <span className="scene-marker-label">{scene.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FloorPlanWidget;
