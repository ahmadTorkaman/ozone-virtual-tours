import { useState } from 'react';
import { Settings } from 'lucide-react';
import { useVRStore } from '@/stores/vrStore';
import type { LocomotionMode } from '@/engine/vr/VRControls';

interface VRSettingsProps {
  className?: string;
}

export function VRSettings({ className = '' }: VRSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isSupported,
    locomotionMode,
    smoothSpeed,
    snapTurnAngle,
    vignetteEnabled,
    setLocomotionMode,
    setSmoothSpeed,
    setSnapTurnAngle,
    setVignetteEnabled,
  } = useVRStore();

  if (!isSupported) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 bg-gray-800/80 rounded-lg hover:bg-gray-700/80 transition-colors"
        title="VR Settings"
      >
        <Settings size={20} className="text-white" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Settings Panel */}
          <div className="absolute top-12 right-0 w-72 bg-gray-800 rounded-lg shadow-xl p-4 z-50">
            <h3 className="text-white font-semibold mb-4 text-lg">VR Settings</h3>

            {/* Locomotion Mode */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Movement Mode</label>
              <select
                value={locomotionMode}
                onChange={(e) => setLocomotionMode(e.target.value as LocomotionMode)}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              >
                <option value="teleport">Teleport</option>
                <option value="smooth">Smooth Locomotion</option>
                <option value="none">None (Stationary)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {locomotionMode === 'teleport' && 'Point and click to teleport'}
                {locomotionMode === 'smooth' && 'Use left thumbstick to move'}
                {locomotionMode === 'none' && 'Stay in one place'}
              </p>
            </div>

            {/* Smooth Speed (only show when smooth locomotion) */}
            {locomotionMode === 'smooth' && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">
                  Movement Speed: {smoothSpeed.toFixed(1)} m/s
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={smoothSpeed}
                  onChange={(e) => setSmoothSpeed(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>
            )}

            {/* Snap Turn Angle */}
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Snap Turn Angle: {snapTurnAngle}°
              </label>
              <input
                type="range"
                min={15}
                max={90}
                step={15}
                value={snapTurnAngle}
                onChange={(e) => setSnapTurnAngle(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>15°</span>
                <span>45°</span>
                <span>90°</span>
              </div>
            </div>

            {/* Comfort Vignette Toggle */}
            <div className="flex items-center justify-between py-2">
              <div>
                <label className="text-sm text-gray-300">Comfort Vignette</label>
                <p className="text-xs text-gray-500">Reduces motion sickness</p>
              </div>
              <button
                onClick={() => setVignetteEnabled(!vignetteEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  vignetteEnabled ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    vignetteEnabled ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            {/* Info footer */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                Use right thumbstick to snap turn. Settings are saved automatically.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
