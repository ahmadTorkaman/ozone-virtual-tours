const SceneThumbnails = ({
  scenes,
  currentSceneId,
  onSceneSelect
}) => {
  if (!scenes || scenes.length === 0) return null;

  return (
    <div className="scene-thumbnails">
      {scenes.map((scene) => (
        <button
          key={scene.id}
          className={`thumbnail ${scene.id === currentSceneId ? 'active' : ''}`}
          onClick={() => onSceneSelect(scene.id)}
        >
          <img
            className="thumbnail-image"
            src={scene.panoramaUrl}
            alt={scene.name}
            loading="lazy"
          />
          <span className="thumbnail-name">{scene.name}</span>
        </button>
      ))}
    </div>
  );
};

export default SceneThumbnails;
