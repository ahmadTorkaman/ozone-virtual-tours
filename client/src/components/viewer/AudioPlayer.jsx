// ===========================================
// AudioPlayer Component
// ===========================================
// Handles ambient music and hotspot audio playback

import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, X } from 'lucide-react';
import { useTourStore } from '../../stores/tourStore';
import './AudioPlayer.css';

export default function AudioPlayer({ ambientMusicUrl }) {
  const ambientRef = useRef(null);
  const hotspotRef = useRef(null);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const {
    audioEnabled,
    ambientPlaying,
    ambientVolume,
    ambientMuted,
    hotspotAudio,
    hotspotPlaying,
    enableAudio,
    toggleAmbientMusic,
    setAmbientPlaying,
    setAmbientVolume,
    toggleAmbientMute,
    stopHotspotAudio
  } = useTourStore();

  // Handle ambient music playback
  useEffect(() => {
    const audio = ambientRef.current;
    if (!audio || !ambientMusicUrl) return;

    audio.volume = ambientMuted ? 0 : ambientVolume;
    audio.loop = true;

    if (audioEnabled && ambientPlaying) {
      audio.play().catch(() => {
        // Autoplay blocked, user needs to interact
        setAmbientPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [audioEnabled, ambientPlaying, ambientMuted, ambientVolume, ambientMusicUrl, setAmbientPlaying]);

  // Handle volume changes
  useEffect(() => {
    const audio = ambientRef.current;
    if (audio) {
      audio.volume = ambientMuted ? 0 : ambientVolume;
    }
  }, [ambientVolume, ambientMuted]);

  // Handle hotspot audio
  useEffect(() => {
    const audio = hotspotRef.current;
    if (!audio) return;

    if (hotspotAudio && hotspotPlaying) {
      audio.src = hotspotAudio.url;
      audio.loop = hotspotAudio.loop;
      audio.volume = ambientMuted ? 0 : ambientVolume;
      audio.play().catch(console.error);
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [hotspotAudio, hotspotPlaying, ambientMuted, ambientVolume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ambientRef.current) {
        ambientRef.current.pause();
      }
      if (hotspotRef.current) {
        hotspotRef.current.pause();
      }
    };
  }, []);

  const handleVolumeChange = (e) => {
    setAmbientVolume(parseFloat(e.target.value));
  };

  // Don't render if no ambient music
  if (!ambientMusicUrl) return null;

  return (
    <div className="audio-player">
      {/* Hidden audio elements */}
      <audio ref={ambientRef} src={ambientMusicUrl} preload="auto" />
      <audio ref={hotspotRef} preload="auto" onEnded={stopHotspotAudio} />

      {/* Audio enable prompt */}
      {!audioEnabled && (
        <button
          className="audio-enable-btn"
          onClick={() => {
            enableAudio();
            toggleAmbientMusic();
          }}
          title="Click to enable audio"
        >
          <Music size={20} />
          <span>Enable Audio</span>
        </button>
      )}

      {/* Audio controls */}
      {audioEnabled && (
        <div
          className="audio-controls"
          onMouseEnter={() => setShowVolumeSlider(true)}
          onMouseLeave={() => setShowVolumeSlider(false)}
        >
          {/* Play/Pause button */}
          <button
            className={`audio-btn ${ambientPlaying ? 'playing' : ''}`}
            onClick={toggleAmbientMusic}
            title={ambientPlaying ? 'Pause music' : 'Play music'}
          >
            {ambientPlaying ? (
              <Music size={20} className="music-playing" />
            ) : (
              <Music size={20} />
            )}
          </button>

          {/* Volume slider */}
          {showVolumeSlider && (
            <div className="volume-slider-container">
              <button
                className="audio-btn mute-btn"
                onClick={toggleAmbientMute}
                title={ambientMuted ? 'Unmute' : 'Mute'}
              >
                {ambientMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                className="volume-slider"
                min="0"
                max="1"
                step="0.05"
                value={ambientVolume}
                onChange={handleVolumeChange}
              />
            </div>
          )}
        </div>
      )}

      {/* Hotspot audio indicator */}
      {hotspotPlaying && (
        <div className="hotspot-audio-indicator">
          <span>Playing audio...</span>
          <button
            className="stop-hotspot-btn"
            onClick={stopHotspotAudio}
            title="Stop audio"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
