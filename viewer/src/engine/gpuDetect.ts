import type { GpuTier } from '@/stores/viewerStore';

interface GpuInfo {
  tier: GpuTier;
  renderer: string;
  isMobile: boolean;
  hasWebGPU: boolean;
}

const MOBILE_REGEX = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i;

const HIGH_TIER_KEYWORDS = [
  'NVIDIA', 'GeForce RTX', 'GeForce GTX 10', 'GeForce GTX 16',
  'Radeon RX 5', 'Radeon RX 6', 'Radeon RX 7',
  'Arc A7', 'Arc A5',
  'Apple M1 Pro', 'Apple M1 Max', 'Apple M1 Ultra',
  'Apple M2', 'Apple M3', 'Apple M4',
];

const LOW_TIER_KEYWORDS = [
  'Mali', 'Adreno 5', 'Adreno 6', 'PowerVR',
  'Intel HD', 'Intel UHD 6', 'Intel Iris',
  'SwiftShader', 'llvmpipe',
];

export function detectGpu(): GpuInfo {
  const isMobile = MOBILE_REGEX.test(navigator.userAgent);
  const hasWebGPU = 'gpu' in navigator;
  let renderer = 'Unknown';
  let tier: GpuTier = 'medium';

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'Unknown';
      }
    }
  } catch {
    // WebGL not available
  }

  // Classify
  if (isMobile) {
    tier = 'low';
  } else if (HIGH_TIER_KEYWORDS.some((k) => renderer.includes(k))) {
    tier = 'high';
  } else if (LOW_TIER_KEYWORDS.some((k) => renderer.includes(k))) {
    tier = 'low';
  }

  return { tier, renderer, isMobile, hasWebGPU };
}

export function hasWebGLSupport(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}
