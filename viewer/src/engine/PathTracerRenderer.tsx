import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useViewerStore } from '@/stores/viewerStore';

export function PathTracerRenderer() {
  const { gl, scene, camera } = useThree();
  const ptRef = useRef<any>(null);
  const setPathTracerSamples = useViewerStore((s) => s.setPathTracerSamples);
  const setPathTracerConverged = useViewerStore((s) => s.setPathTracerConverged);
  const gpuTier = useViewerStore((s) => s.gpuTier);
  const samplesRef = useRef(0);

  useEffect(() => {
    let pt: any = null;

    async function init() {
      try {
        const { WebGLPathTracer } = await import('three-gpu-pathtracer');
        pt = new WebGLPathTracer(gl);
        pt.bounces = 5;
        pt.renderScale = gpuTier === 'low' ? 0.5 : 1;
        pt.setScene(scene, camera);
        ptRef.current = pt;
        samplesRef.current = 0;
        setPathTracerSamples(0);
        setPathTracerConverged(false);
      } catch (err) {
        console.warn('Path tracer init failed:', err);
      }
    }

    init();

    // Reset on camera change
    const handleChange = () => {
      if (ptRef.current) {
        samplesRef.current = 0;
        setPathTracerSamples(0);
        setPathTracerConverged(false);
      }
    };

    // Listen for orbit control changes via the canvas
    gl.domElement.addEventListener('pointerup', handleChange);
    gl.domElement.addEventListener('wheel', handleChange);

    return () => {
      gl.domElement.removeEventListener('pointerup', handleChange);
      gl.domElement.removeEventListener('wheel', handleChange);
      if (pt) {
        pt.dispose?.();
      }
      ptRef.current = null;
    };
  }, [gl, scene, camera, gpuTier]);

  useFrame(() => {
    if (!ptRef.current) return;

    try {
      ptRef.current.renderSample();
      samplesRef.current += 1;

      // Update store every 10 samples to avoid excess re-renders
      if (samplesRef.current % 10 === 0) {
        setPathTracerSamples(samplesRef.current);
      }

      if (samplesRef.current >= 500 && !useViewerStore.getState().pathTracerConverged) {
        setPathTracerConverged(true);
      }
    } catch {
      // Silently handle render errors
    }
  });

  return null;
}

// Call this to reset BVH when materials change
export function resetPathTracer() {
  // The path tracer will be reset via the pointerup/wheel event handlers
  // For material changes, we dispatch a custom event
  window.dispatchEvent(new CustomEvent('pathtracer-reset'));
}
