import { useState, useCallback } from 'react';
import PanoramaViewer from './components/viewer/PanoramaViewer';
import FloorPlanWidget from './components/viewer/FloorPlanWidget';
import InfoModal from './components/viewer/InfoModal';
import SceneThumbnails from './components/viewer/SceneThumbnails';
import TourHeader from './components/viewer/TourHeader';
import GuidedTourControls from './components/viewer/GuidedTourControls';
import { useTourStore } from './stores/tourStore';
import './App.css';

// Demo data - replace with API calls in production
const DEMO_TOUR = {
  id: 'demo-tour',
  name: 'Modern Kitchen Showcase',
  description: 'Explore this stunning modern kitchen design with premium finishes',
  clientName: 'Demo Client',
  settings: {
    autoRotate: false,
    showFloorPlan: true,
    vrEnabled: true
  },
  scenes: [
    {
      id: 'scene-1',
      name: 'Kitchen Overview',
      panoramaUrl: '/demo/kitchen-overview.jpg',
      stereoUrl: null,
      initialYaw: 0,
      initialPitch: 0,
      floorPlanX: 150,
      floorPlanY: 120,
      order: 0,
      hotspots: [
        {
          id: 'hs-1',
          type: 'NAVIGATION',
          yaw: 45,
          pitch: -5,
          targetSceneId: 'scene-2',
          title: 'Kitchen Island',
          color: '#7c8cfb',
          icon: 'arrow',
          scale: 1
        },
        {
          id: 'hs-2',
          type: 'INFO',
          yaw: -60,
          pitch: 5,
          title: 'Premium Cabinets',
          content: 'Handcrafted walnut cabinets with soft-close hinges and custom brass hardware. Each unit is precision-built to maximize storage while maintaining clean, modern lines.',
          color: '#9b72f2',
          icon: 'info',
          scale: 1
        },
        {
          id: 'hs-3',
          type: 'INFO',
          yaw: 120,
          pitch: 0,
          title: 'Integrated Appliances',
          content: 'Full Miele appliance suite including built-in refrigeration, steam oven, and induction cooktop - all seamlessly integrated into the cabinetry.',
          color: '#9b72f2',
          icon: 'info',
          scale: 1
        }
      ]
    },
    {
      id: 'scene-2',
      name: 'Kitchen Island',
      panoramaUrl: '/demo/kitchen-island.jpg',
      stereoUrl: null,
      initialYaw: 180,
      initialPitch: 0,
      floorPlanX: 250,
      floorPlanY: 120,
      order: 1,
      hotspots: [
        {
          id: 'hs-4',
          type: 'NAVIGATION',
          yaw: 180,
          pitch: -5,
          targetSceneId: 'scene-1',
          title: 'Back to Overview',
          color: '#7c8cfb',
          icon: 'arrow',
          scale: 1
        },
        {
          id: 'hs-5',
          type: 'INFO',
          yaw: 0,
          pitch: -10,
          title: 'Marble Countertop',
          content: 'Calacatta Gold marble with book-matched veining. This statement island features a waterfall edge and integrated breakfast bar.',
          color: '#9b72f2',
          icon: 'info',
          scale: 1
        },
        {
          id: 'hs-6',
          type: 'NAVIGATION',
          yaw: -90,
          pitch: -5,
          targetSceneId: 'scene-3',
          title: 'Dining Area',
          color: '#7c8cfb',
          icon: 'arrow',
          scale: 1
        }
      ]
    },
    {
      id: 'scene-3',
      name: 'Dining Area',
      panoramaUrl: '/demo/dining-area.jpg',
      stereoUrl: null,
      initialYaw: 90,
      initialPitch: 0,
      floorPlanX: 250,
      floorPlanY: 220,
      order: 2,
      hotspots: [
        {
          id: 'hs-7',
          type: 'NAVIGATION',
          yaw: 90,
          pitch: -5,
          targetSceneId: 'scene-2',
          title: 'Back to Island',
          color: '#7c8cfb',
          icon: 'arrow',
          scale: 1
        },
        {
          id: 'hs-8',
          type: 'INFO',
          yaw: -45,
          pitch: 10,
          title: 'Custom Lighting',
          content: 'Bespoke pendant lighting with hand-blown glass shades. Fully dimmable with smart home integration.',
          color: '#9b72f2',
          icon: 'info',
          scale: 1
        }
      ]
    }
  ],
  floorPlan: {
    id: 'fp-1',
    name: 'Ground Floor',
    imageUrl: '/demo/floorplan.png',
    floor: 0,
    width: 400,
    height: 300
  }
};

function App() {
  const [tour] = useState(DEMO_TOUR);
  const [currentSceneId, setCurrentSceneId] = useState(DEMO_TOUR.scenes[0].id);
  const [infoModal, setInfoModal] = useState(null);
  const [showFloorPlan, setShowFloorPlan] = useState(true);
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentScene = tour.scenes.find(s => s.id === currentSceneId);
  const currentSceneIndex = tour.scenes.findIndex(s => s.id === currentSceneId);

  const navigateToScene = useCallback((sceneId) => {
    if (sceneId === currentSceneId || isTransitioning) return;
    
    setIsTransitioning(true);
    
    // Brief fade transition
    setTimeout(() => {
      setCurrentSceneId(sceneId);
      setIsTransitioning(false);
    }, 300);
  }, [currentSceneId, isTransitioning]);

  const handleHotspotClick = useCallback((hotspotId) => {
    const hotspot = currentScene.hotspots.find(h => h.id === hotspotId);
    if (!hotspot) return;

    if (hotspot.type === 'NAVIGATION' && hotspot.targetSceneId) {
      navigateToScene(hotspot.targetSceneId);
    } else if (hotspot.type === 'INFO' || hotspot.type === 'MEDIA') {
      setInfoModal(hotspot);
    } else if (hotspot.type === 'LINK' && hotspot.url) {
      window.open(hotspot.url, '_blank');
    }
  }, [currentScene, navigateToScene]);

  const handleSceneSelect = useCallback((sceneId) => {
    navigateToScene(sceneId);
  }, [navigateToScene]);

  const handleNextScene = useCallback(() => {
    const nextIndex = (currentSceneIndex + 1) % tour.scenes.length;
    navigateToScene(tour.scenes[nextIndex].id);
  }, [currentSceneIndex, tour.scenes, navigateToScene]);

  const handlePrevScene = useCallback(() => {
    const prevIndex = currentSceneIndex === 0 ? tour.scenes.length - 1 : currentSceneIndex - 1;
    navigateToScene(tour.scenes[prevIndex].id);
  }, [currentSceneIndex, tour.scenes, navigateToScene]);

  const toggleGuidedMode = useCallback(() => {
    setIsGuidedMode(prev => !prev);
  }, []);

  return (
    <div className="tour-app">
      {/* Transition Overlay */}
      <div className={`transition-overlay ${isTransitioning ? 'active' : ''}`} />

      {/* Main Viewer */}
      <div className="viewer-container">
        {currentScene && (
          <PanoramaViewer
            key={currentScene.id}
            panoramaUrl={currentScene.panoramaUrl}
            stereoUrl={currentScene.stereoUrl}
            hotspots={currentScene.hotspots}
            initialYaw={currentScene.initialYaw}
            initialPitch={currentScene.initialPitch}
            onHotspotClick={handleHotspotClick}
            vrEnabled={tour.settings?.vrEnabled !== false}
            autoRotate={tour.settings?.autoRotate || false}
          />
        )}
      </div>

      {/* Top Header Bar */}
      <TourHeader
        tourName={tour.name}
        sceneName={currentScene?.name}
        sceneIndex={currentSceneIndex + 1}
        totalScenes={tour.scenes.length}
        showFloorPlan={showFloorPlan}
        onToggleFloorPlan={() => setShowFloorPlan(!showFloorPlan)}
        isGuidedMode={isGuidedMode}
        onToggleGuidedMode={toggleGuidedMode}
      />

      {/* Floor Plan Mini-Map */}
      {showFloorPlan && tour.floorPlan && (
        <FloorPlanWidget
          floorPlan={tour.floorPlan}
          scenes={tour.scenes}
          currentSceneId={currentSceneId}
          onSceneSelect={handleSceneSelect}
        />
      )}

      {/* Scene Navigation */}
      <SceneThumbnails
        scenes={tour.scenes}
        currentSceneId={currentSceneId}
        onSceneSelect={handleSceneSelect}
      />

      {/* Guided Tour Controls */}
      {isGuidedMode && (
        <GuidedTourControls
          currentIndex={currentSceneIndex}
          totalScenes={tour.scenes.length}
          onPrev={handlePrevScene}
          onNext={handleNextScene}
          onExit={() => setIsGuidedMode(false)}
          autoAdvance={true}
          autoAdvanceDelay={8000}
        />
      )}

      {/* Info Modal */}
      {infoModal && (
        <InfoModal
          hotspot={infoModal}
          onClose={() => setInfoModal(null)}
        />
      )}
    </div>
  );
}

export default App;
