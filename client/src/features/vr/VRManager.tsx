import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVRStore } from '@/stores/vrStore';
import { VRControls } from '@/engine/vr/VRControls';

interface VRManagerProps {
  cameraGroup: THREE.Group;
  onObjectSelect?: (objectName: string) => void;
}

/**
 * VR Manager component that handles VR controls and interactions
 * Must be placed inside the Canvas and XR context
 */
export function VRManager({ cameraGroup, onObjectSelect }: VRManagerProps) {
  const { gl, scene, camera } = useThree();
  const controlsRef = useRef<VRControls | null>(null);

  const {
    locomotionMode,
    smoothSpeed,
    snapTurnAngle,
    setSupported
  } = useVRStore();

  // Check VR support on mount
  useEffect(() => {
    async function checkSupport() {
      if (navigator.xr) {
        try {
          const supported = await navigator.xr.isSessionSupported('immersive-vr');
          setSupported(supported);
        } catch {
          setSupported(false);
        }
      } else {
        setSupported(false);
      }
    }
    checkSupport();
  }, [setSupported]);

  // Watch XR session state via renderer
  useEffect(() => {
    const xr = gl.xr;

    // Check if we're in VR by looking at the session
    const checkSession = () => {
      const session = xr.getSession();
      const inVR = session !== null;

      if (inVR && !controlsRef.current) {
        // Initialize VR controls when entering VR
        controlsRef.current = new VRControls(gl, scene, camera, cameraGroup, {
          locomotionMode,
          smoothSpeed,
          snapTurnAngle,
        });

        // Set up object selection callback
        controlsRef.current.setCallbacks(
          (_controller, intersection) => {
            if (intersection?.object instanceof THREE.Mesh) {
              onObjectSelect?.(intersection.object.name);
            }
          },
          undefined
        );
      } else if (!inVR && controlsRef.current) {
        // Clean up VR controls when exiting VR
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
    };

    // Check on mount and add session event listeners
    checkSession();

    // Poll for session changes (since XR events aren't always reliable)
    const interval = setInterval(checkSession, 500);

    return () => {
      clearInterval(interval);
      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }
    };
  }, [gl, scene, camera, cameraGroup, locomotionMode, smoothSpeed, snapTurnAngle, onObjectSelect]);

  // Update settings when they change
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.setLocomotionMode(locomotionMode);
      controlsRef.current.setSmoothSpeed(smoothSpeed);
      controlsRef.current.setSnapTurnAngle(snapTurnAngle);
    }
  }, [locomotionMode, smoothSpeed, snapTurnAngle]);

  // Update controls each frame
  useFrame(() => {
    const session = gl.xr.getSession();
    if (session && controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return null;
}
