import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Glasses } from 'lucide-react';
import { useVRStore } from '@/stores/vrStore';
import { VRSessionManager } from '@/engine/vr/VRSession';

interface VRButtonProps {
  className?: string;
}

/**
 * VR Button component that must be used inside a Canvas context
 */
export function VRButton({ className = '' }: VRButtonProps) {
  const { gl } = useThree();
  const vrManagerRef = useRef<VRSessionManager | null>(null);
  const { isSupported, isInVR, isEntering, setSupported, setInVR, setEntering } = useVRStore();

  useEffect(() => {
    vrManagerRef.current = new VRSessionManager(gl);
    vrManagerRef.current.setCallbacks(
      () => setInVR(true),
      () => setInVR(false)
    );

    vrManagerRef.current.isSupported().then(setSupported);

    return () => {
      vrManagerRef.current?.dispose();
    };
  }, [gl, setSupported, setInVR]);

  const handleClick = async () => {
    if (!vrManagerRef.current || !isSupported) return;

    if (isInVR) {
      vrManagerRef.current.exitVR();
    } else {
      setEntering(true);
      try {
        await vrManagerRef.current.enterVR();
      } catch (error) {
        console.error('Failed to enter VR:', error);
      } finally {
        setEntering(false);
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      disabled={isEntering}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isInVR
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      } disabled:opacity-50 ${className}`}
    >
      <Glasses size={20} />
      {isEntering ? 'Entering VR...' : isInVR ? 'Exit VR' : 'Enter VR'}
    </button>
  );
}
