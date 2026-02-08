import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { LocomotionMode } from '@/engine/vr/VRControls';

interface VRState {
  // Session state
  isSupported: boolean;
  isInVR: boolean;
  isEntering: boolean;

  // Settings (persisted)
  locomotionMode: LocomotionMode;
  smoothSpeed: number;
  snapTurnAngle: number;
  vignetteEnabled: boolean;

  // Actions
  setSupported: (supported: boolean) => void;
  setInVR: (inVR: boolean) => void;
  setEntering: (entering: boolean) => void;
  setLocomotionMode: (mode: LocomotionMode) => void;
  setSmoothSpeed: (speed: number) => void;
  setSnapTurnAngle: (angle: number) => void;
  setVignetteEnabled: (enabled: boolean) => void;
}

export const useVRStore = create<VRState>()(
  devtools(
    persist(
      (set) => ({
        // Initial state
        isSupported: false,
        isInVR: false,
        isEntering: false,
        locomotionMode: 'teleport',
        smoothSpeed: 3,
        snapTurnAngle: 45,
        vignetteEnabled: true,

        // Actions
        setSupported: (supported) => set({ isSupported: supported }),
        setInVR: (inVR) => set({ isInVR: inVR }),
        setEntering: (entering) => set({ isEntering: entering }),
        setLocomotionMode: (mode) => set({ locomotionMode: mode }),
        setSmoothSpeed: (speed) => set({ smoothSpeed: speed }),
        setSnapTurnAngle: (angle) => set({ snapTurnAngle: angle }),
        setVignetteEnabled: (enabled) => set({ vignetteEnabled: enabled }),
      }),
      {
        name: 'vr-settings',
        partialize: (state) => ({
          locomotionMode: state.locomotionMode,
          smoothSpeed: state.smoothSpeed,
          snapTurnAngle: state.snapTurnAngle,
          vignetteEnabled: state.vignetteEnabled,
        }),
      }
    ),
    { name: 'vr-store' }
  )
);
