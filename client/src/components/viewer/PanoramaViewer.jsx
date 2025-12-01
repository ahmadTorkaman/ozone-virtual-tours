import { useEffect, useRef, useState, useCallback } from 'react';
import 'aframe';

const PanoramaViewer = ({
  panoramaUrl,
  stereoUrl = null,
  hotspots = [],
  initialYaw = 0,
  initialPitch = 0,
  onHotspotClick,
  vrEnabled = true,
  autoRotate = false
}) => {
  const sceneRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Register custom A-Frame components once
  useEffect(() => {
    if (!AFRAME.components['hotspot-listener']) {
      AFRAME.registerComponent('hotspot-listener', {
        schema: {
          hotspotId: { type: 'string' }
        },
        init: function () {
          this.el.addEventListener('click', () => {
            const id = this.data.hotspotId;
            if (id) {
              const event = new CustomEvent('hotspot-clicked', { detail: { id } });
              window.dispatchEvent(event);
            }
          });
          
          // Hover effects
          this.el.addEventListener('mouseenter', () => {
            this.el.setAttribute('scale', '1.2 1.2 1.2');
          });
          
          this.el.addEventListener('mouseleave', () => {
            this.el.setAttribute('scale', '1 1 1');
          });
        }
      });
    }

    if (!AFRAME.components['look-at-camera']) {
      AFRAME.registerComponent('look-at-camera', {
        tick: function () {
          const camera = document.querySelector('[camera]');
          if (camera) {
            const cameraPos = camera.object3D.position;
            this.el.object3D.lookAt(cameraPos);
          }
        }
      });
    }
  }, []);

  // Listen for hotspot clicks
  useEffect(() => {
    const handleHotspotClick = (e) => {
      if (onHotspotClick) {
        onHotspotClick(e.detail.id);
      }
    };

    window.addEventListener('hotspot-clicked', handleHotspotClick);
    return () => window.removeEventListener('hotspot-clicked', handleHotspotClick);
  }, [onHotspotClick]);

  // Convert yaw/pitch to 3D position on sphere
  const sphericalToCartesian = useCallback((yaw, pitch, radius = 5) => {
    const yawRad = (yaw * Math.PI) / 180;
    const pitchRad = (pitch * Math.PI) / 180;

    const x = radius * Math.cos(pitchRad) * Math.sin(yawRad);
    const y = radius * Math.sin(pitchRad);
    const z = -radius * Math.cos(pitchRad) * Math.cos(yawRad);

    return { x, y, z };
  }, []);

  const handleImageLoaded = () => {
    setIsLoading(false);
    setLoadError(null);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setLoadError('Failed to load panorama image');
  };

  const enterVR = () => {
    if (sceneRef.current) {
      sceneRef.current.enterVR();
    }
  };

  // Hotspot icon based on type
  const getHotspotGeometry = (type) => {
    switch (type) {
      case 'NAVIGATION':
        return (
          <a-circle
            radius="0.25"
            material="shader: flat; side: double; transparent: true; opacity: 0.9"
            color="#7c8cfb"
          >
            <a-triangle
              vertex-a="0 0.12 0.01"
              vertex-b="-0.08 -0.06 0.01"
              vertex-c="0.08 -0.06 0.01"
              material="shader: flat; side: double"
              color="white"
            />
          </a-circle>
        );
      case 'INFO':
      case 'MEDIA':
        return (
          <a-ring
            radius-inner="0.15"
            radius-outer="0.25"
            material="shader: flat; side: double; transparent: true; opacity: 0.9"
            color="#9b72f2"
          />
        );
      default:
        return (
          <a-circle
            radius="0.2"
            material="shader: flat; side: double; transparent: true; opacity: 0.9"
            color="#7c8cfb"
          />
        );
    }
  };

  return (
    <div className="panorama-viewer">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <span className="loading-text">Loading panorama...</span>
        </div>
      )}

      {/* Error State */}
      {loadError && (
        <div className="loading-overlay">
          <span className="loading-text" style={{ color: '#ef4444' }}>
            {loadError}
          </span>
        </div>
      )}

      {/* A-Frame Scene */}
      <a-scene
        ref={sceneRef}
        embedded
        vr-mode-ui={vrEnabled ? 'enabled: true' : 'enabled: false'}
        loading-screen="enabled: false"
        renderer="antialias: true; colorManagement: true"
      >
        {/* Assets */}
        <a-assets timeout="30000">
          <img
            id="panorama"
            src={panoramaUrl}
            crossOrigin="anonymous"
            onLoad={handleImageLoaded}
            onError={handleImageError}
          />
          {stereoUrl && (
            <img
              id="panorama-stereo"
              src={stereoUrl}
              crossOrigin="anonymous"
            />
          )}
        </a-assets>

        {/* Sky / Panorama */}
        <a-sky
          src="#panorama"
          rotation={`0 ${-initialYaw} 0`}
        />

        {/* Camera Rig */}
        <a-entity id="rig" position="0 1.6 0">
          <a-camera
            look-controls="reverseMouseDrag: true; touchEnabled: true"
            wasd-controls="enabled: false"
          >
            {/* Cursor for interaction (VR and desktop) */}
            <a-cursor
              fuse="true"
              fuse-timeout="1500"
              color="#7c8cfb"
              raycaster="objects: .hotspot"
              animation__click="property: scale; startEvents: click; from: 0.1 0.1 0.1; to: 1 1 1; dur: 150"
              animation__fusing="property: scale; startEvents: fusing; from: 1 1 1; to: 0.5 0.5 0.5; dur: 1500"
              animation__mouseleave="property: scale; startEvents: mouseleave; to: 1 1 1; dur: 150"
            />
          </a-camera>
        </a-entity>

        {/* Hotspots */}
        {hotspots.map((hotspot) => {
          const pos = sphericalToCartesian(hotspot.yaw, hotspot.pitch);
          const scale = hotspot.scale || 1;

          return (
            <a-entity
              key={hotspot.id}
              class="hotspot"
              position={`${pos.x} ${pos.y + 1.6} ${pos.z}`}
              look-at-camera
              hotspot-listener={`hotspotId: ${hotspot.id}`}
              scale={`${scale} ${scale} ${scale}`}
              animation="property: position; dir: alternate; dur: 2000; easing: easeInOutSine; loop: true; to: ${pos.x} ${pos.y + 1.7} ${pos.z}"
            >
              {/* Hotspot visual based on type */}
              {hotspot.type === 'NAVIGATION' ? (
                <a-circle
                  radius="0.25"
                  material="shader: flat; side: double; transparent: true; opacity: 0.9"
                  color={hotspot.color || '#7c8cfb'}
                />
              ) : (
                <a-ring
                  radius-inner="0.15"
                  radius-outer="0.25"
                  material="shader: flat; side: double; transparent: true; opacity: 0.9"
                  color={hotspot.color || '#9b72f2'}
                />
              )}

              {/* Inner icon for navigation */}
              {hotspot.type === 'NAVIGATION' && (
                <a-entity position="0 0 0.01">
                  <a-triangle
                    vertex-a="0 0.1 0"
                    vertex-b="-0.07 -0.05 0"
                    vertex-c="0.07 -0.05 0"
                    material="shader: flat; side: double"
                    color="white"
                  />
                </a-entity>
              )}

              {/* Inner icon for info */}
              {(hotspot.type === 'INFO' || hotspot.type === 'MEDIA') && (
                <a-text
                  value="i"
                  align="center"
                  position="0 0 0.01"
                  scale="0.5 0.5 0.5"
                  color="white"
                  font="monoid"
                />
              )}

              {/* Label */}
              {hotspot.title && (
                <a-text
                  value={hotspot.title}
                  align="center"
                  position="0 0.45 0"
                  scale="0.6 0.6 0.6"
                  color="#ffffff"
                  font="roboto"
                />
              )}

              {/* Pulse ring animation */}
              <a-ring
                radius-inner="0.26"
                radius-outer="0.3"
                material="shader: flat; side: double; transparent: true; opacity: 0.5"
                color={hotspot.color || '#7c8cfb'}
                animation="property: scale; from: 1 1 1; to: 1.5 1.5 1.5; dur: 1500; loop: true"
                animation__opacity="property: material.opacity; from: 0.5; to: 0; dur: 1500; loop: true"
              />
            </a-entity>
          );
        })}

        {/* Ambient lighting */}
        <a-light type="ambient" intensity="1" />
      </a-scene>

      {/* VR Enter Button */}
      {vrEnabled && (
        <button className="vr-button" onClick={enterVR}>
          🥽 Enter VR
        </button>
      )}
    </div>
  );
};

export default PanoramaViewer;
