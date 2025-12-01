// ===========================================
// Tour Viewer Page
// ===========================================
// This is the public-facing tour viewer accessible via /tour/:slug
// TODO: Connect to API to load tours by slug

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PanoramaViewer from '../../components/viewer/PanoramaViewer';
import FloorPlanWidget from '../../components/viewer/FloorPlanWidget';
import InfoModal from '../../components/viewer/InfoModal';
import SceneThumbnails from '../../components/viewer/SceneThumbnails';
import TourHeader from '../../components/viewer/TourHeader';
import GuidedTourControls from '../../components/viewer/GuidedTourControls';
import { useBranding } from '../../contexts/BrandingContext';
import { toursApi } from '../../services/api';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import './TourViewer.css';

export default function TourViewer() {
  const { slug } = useParams();
  const { branding } = useBranding();

  const [tour, setTour] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Password protection state
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Viewer state
  const [currentSceneId, setCurrentSceneId] = useState(null);
  const [infoModal, setInfoModal] = useState(null);
  const [showFloorPlan, setShowFloorPlan] = useState(true);
  const [isGuidedMode, setIsGuidedMode] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    loadTour();
  }, [slug]);

  const loadTour = async () => {
    try {
      setLoading(true);
      setError(null);

      // This will return partial data if password protected
      const response = await toursApi.getBySlug(slug);

      if (response.needsPassword) {
        setNeedsPassword(true);
        setTour(response.tour); // Minimal tour info
      } else {
        setTour(response.tour);
        if (response.tour.scenes?.length > 0) {
          setCurrentSceneId(response.tour.scenes[0].id);
        }
      }
    } catch (err) {
      if (err.status === 404) {
        setError('Tour not found');
      } else {
        setError('Failed to load tour');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setVerifying(true);

    try {
      const response = await toursApi.verifyPassword(tour.id, password);
      setTour(response.tour);
      setNeedsPassword(false);
      if (response.tour.scenes?.length > 0) {
        setCurrentSceneId(response.tour.scenes[0].id);
      }
    } catch (err) {
      setPasswordError('Incorrect password');
    } finally {
      setVerifying(false);
    }
  };

  const currentScene = tour?.scenes?.find(s => s.id === currentSceneId);
  const currentSceneIndex = tour?.scenes?.findIndex(s => s.id === currentSceneId) ?? 0;

  const navigateToScene = useCallback((sceneId) => {
    if (sceneId === currentSceneId || isTransitioning) return;

    setIsTransitioning(true);

    setTimeout(() => {
      setCurrentSceneId(sceneId);
      setIsTransitioning(false);
    }, 300);
  }, [currentSceneId, isTransitioning]);

  const handleHotspotClick = useCallback((hotspotId) => {
    const hotspot = currentScene?.hotspots?.find(h => h.id === hotspotId);
    if (!hotspot) return;

    if (hotspot.type === 'NAVIGATION' && hotspot.targetSceneId) {
      navigateToScene(hotspot.targetSceneId);
    } else if (hotspot.type === 'INFO' || hotspot.type === 'MEDIA') {
      setInfoModal(hotspot);
    } else if (hotspot.type === 'LINK' && hotspot.url) {
      window.open(hotspot.url, '_blank');
    } else if (hotspot.type === 'AUDIO' && hotspot.audioUrl) {
      // TODO: Handle audio playback
    }
  }, [currentScene, navigateToScene]);

  const handleSceneSelect = useCallback((sceneId) => {
    navigateToScene(sceneId);
  }, [navigateToScene]);

  const handleNextScene = useCallback(() => {
    if (!tour?.scenes) return;
    const nextIndex = (currentSceneIndex + 1) % tour.scenes.length;
    navigateToScene(tour.scenes[nextIndex].id);
  }, [currentSceneIndex, tour?.scenes, navigateToScene]);

  const handlePrevScene = useCallback(() => {
    if (!tour?.scenes) return;
    const prevIndex = currentSceneIndex === 0 ? tour.scenes.length - 1 : currentSceneIndex - 1;
    navigateToScene(tour.scenes[prevIndex].id);
  }, [currentSceneIndex, tour?.scenes, navigateToScene]);

  // Loading state
  if (loading) {
    return (
      <div className="viewer-loading">
        <Loader2 size={48} className="spinner-icon" />
        <p>Loading tour...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="viewer-error">
        <AlertCircle size={64} />
        <h1>{error}</h1>
        <p>The tour you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  // Password gate
  if (needsPassword) {
    return (
      <div className="viewer-password">
        <div className="password-card">
          <Lock size={48} className="password-icon" />
          <h1>{tour?.name || 'Protected Tour'}</h1>
          <p>This tour is password protected. Please enter the password to continue.</p>

          <form onSubmit={handlePasswordSubmit}>
            {passwordError && (
              <div className="password-error">{passwordError}</div>
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="password-input"
              autoFocus
            />
            <button type="submit" className="password-submit" disabled={verifying}>
              {verifying ? (
                <Loader2 size={20} className="spinner-icon" />
              ) : (
                'Enter Tour'
              )}
            </button>
          </form>

          <div className="password-branding">
            {branding.companyLogo ? (
              <img src={branding.companyLogo} alt={branding.companyName} />
            ) : (
              <span>{branding.companyName}</span>
            )}
            <span className="powered-by">{branding.poweredByText}</span>
          </div>
        </div>
      </div>
    );
  }

  // No scenes
  if (!currentScene) {
    return (
      <div className="viewer-error">
        <AlertCircle size={64} />
        <h1>No scenes available</h1>
        <p>This tour doesn't have any scenes yet.</p>
      </div>
    );
  }

  // Main viewer
  return (
    <div className="tour-app">
      {/* Transition Overlay */}
      <div className={`transition-overlay ${isTransitioning ? 'active' : ''}`} />

      {/* Main Viewer */}
      <div className="viewer-container">
        <PanoramaViewer
          key={currentScene.id}
          panoramaUrl={currentScene.panoramaUrl}
          stereoUrl={currentScene.stereoUrl}
          hotspots={currentScene.hotspots || []}
          initialYaw={currentScene.initialYaw}
          initialPitch={currentScene.initialPitch}
          onHotspotClick={handleHotspotClick}
          vrEnabled={tour.settings?.vrEnabled !== false}
          autoRotate={tour.settings?.autoRotate || false}
        />
      </div>

      {/* Top Header Bar */}
      <TourHeader
        tourName={tour.name}
        sceneName={currentScene?.name}
        sceneIndex={currentSceneIndex + 1}
        totalScenes={tour.scenes?.length || 0}
        showFloorPlan={showFloorPlan}
        onToggleFloorPlan={() => setShowFloorPlan(!showFloorPlan)}
        isGuidedMode={isGuidedMode}
        onToggleGuidedMode={() => setIsGuidedMode(!isGuidedMode)}
        branding={branding}
      />

      {/* Floor Plan Mini-Map */}
      {showFloorPlan && tour.floorPlans?.[0] && (
        <FloorPlanWidget
          floorPlan={tour.floorPlans[0]}
          scenes={tour.scenes || []}
          currentSceneId={currentSceneId}
          onSceneSelect={handleSceneSelect}
        />
      )}

      {/* Scene Navigation */}
      <SceneThumbnails
        scenes={tour.scenes || []}
        currentSceneId={currentSceneId}
        onSceneSelect={handleSceneSelect}
      />

      {/* Guided Tour Controls */}
      {isGuidedMode && (
        <GuidedTourControls
          currentIndex={currentSceneIndex}
          totalScenes={tour.scenes?.length || 0}
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

      {/* Branding Footer */}
      <div className="viewer-branding">
        {branding.companyLogo ? (
          <img src={branding.companyLogo} alt={branding.companyName} className="branding-logo" />
        ) : (
          <span className="branding-name">{branding.companyName}</span>
        )}
        <span className="branding-powered">{branding.poweredByText}</span>
      </div>
    </div>
  );
}
