// Ozone Virtual Tours - Shared Types & Constants

// Hotspot types
export const HOTSPOT_TYPES = {
  NAVIGATION: 'NAVIGATION',
  INFO: 'INFO',
  MEDIA: 'MEDIA',
  LINK: 'LINK'
};

// Hotspot icons
export const HOTSPOT_ICONS = {
  ARROW: 'arrow',
  INFO: 'info',
  IMAGE: 'image',
  VIDEO: 'video',
  LINK: 'link',
  CUSTOM: 'custom'
};

// Default colors (Ozone palette)
export const COLORS = {
  PRIMARY: '#7c8cfb',
  ACCENT: '#9b72f2',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  ERROR: '#ef4444'
};

// Default tour settings
export const DEFAULT_TOUR_SETTINGS = {
  autoRotate: false,
  autoRotateSpeed: 0.5,
  defaultFov: 80,
  transitionDuration: 300,
  vrEnabled: true,
  showFloorPlan: true,
  showThumbnails: true,
  guidedTourDelay: 8000
};

// Panorama requirements
export const PANORAMA_REQUIREMENTS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  RECOMMENDED_WIDTH: 4096,
  RECOMMENDED_HEIGHT: 2048,
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ASPECT_RATIO: 2 // Equirectangular = 2:1
};

// Stereo panorama modes
export const STEREO_MODES = {
  SIDE_BY_SIDE: 'sbs',      // Left|Right
  TOP_BOTTOM: 'tb',          // Top/Bottom
  MONO: 'mono'               // Single image (no stereo)
};

// Utility: Convert yaw/pitch to 3D position
export const sphericalToCartesian = (yaw, pitch, radius = 5) => {
  const yawRad = (yaw * Math.PI) / 180;
  const pitchRad = (pitch * Math.PI) / 180;

  const x = radius * Math.cos(pitchRad) * Math.sin(yawRad);
  const y = radius * Math.sin(pitchRad);
  const z = -radius * Math.cos(pitchRad) * Math.cos(yawRad);

  return { x, y, z };
};

// Utility: Convert 3D position to yaw/pitch
export const cartesianToSpherical = (x, y, z) => {
  const radius = Math.sqrt(x * x + y * y + z * z);
  const pitch = Math.asin(y / radius) * (180 / Math.PI);
  const yaw = Math.atan2(x, -z) * (180 / Math.PI);

  return { yaw, pitch, radius };
};

// Utility: Normalize angle to -180 to 180
export const normalizeAngle = (angle) => {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
};
