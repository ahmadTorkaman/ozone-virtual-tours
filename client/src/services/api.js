// ===========================================
// API Service - Centralized API calls
// ===========================================

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

/**
 * Make an API request
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Include cookies for session
    ...options,
  };

  // Don't set Content-Type for FormData
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(url, config);

  // Handle no content responses
  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error?.message || 'Request failed');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ===========================================
// Auth API
// ===========================================

export const authApi = {
  // Get current user
  me: () => request('/auth/me'),

  // Login with email
  login: (email) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  // Logout
  logout: () => request('/auth/logout', { method: 'POST' }),

  // Check if bootstrap needed
  bootstrap: () => request('/auth/bootstrap'),

  // Validate invite token
  validateInvite: (token) => request(`/auth/invite/${token}`),

  // Register with invite
  register: (data) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Create invite link
  createInvite: (email) => request('/auth/invite', {
    method: 'POST',
    body: JSON.stringify({ email }),
  }),

  // List invites
  listInvites: () => request('/auth/invites'),

  // Revoke invite
  revokeInvite: (id) => request(`/auth/invite/${id}`, { method: 'DELETE' }),
};

// ===========================================
// Tours API
// ===========================================

export const toursApi = {
  // List all tours
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tours${query ? `?${query}` : ''}`);
  },

  // Get tour by ID
  getById: (id) => request(`/tours/${id}`),

  // Get tour by slug (public)
  getBySlug: (slug) => request(`/tours/slug/${slug}`),

  // Create tour
  create: (data) => request('/tours', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update tour
  update: (id, data) => request(`/tours/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete tour
  delete: (id) => request(`/tours/${id}`, { method: 'DELETE' }),

  // Publish tour
  publish: (id) => request(`/tours/${id}/publish`, { method: 'POST' }),

  // Unpublish tour
  unpublish: (id) => request(`/tours/${id}/unpublish`, { method: 'POST' }),

  // Verify password
  verifyPassword: (id, password) => request(`/tours/${id}/verify-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  }),
};

// ===========================================
// Scenes API
// ===========================================

export const scenesApi = {
  // List scenes for a tour
  list: (tourId) => request(`/tours/${tourId}/scenes`),

  // Get scene by ID
  get: (tourId, sceneId) => request(`/tours/${tourId}/scenes/${sceneId}`),

  // Create scene
  create: (tourId, data) => request(`/tours/${tourId}/scenes`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update scene
  update: (tourId, sceneId, data) => request(`/tours/${tourId}/scenes/${sceneId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete scene
  delete: (tourId, sceneId) => request(`/tours/${tourId}/scenes/${sceneId}`, {
    method: 'DELETE',
  }),

  // Reorder scenes
  reorder: (tourId, sceneIds) => request(`/tours/${tourId}/scenes/reorder`, {
    method: 'POST',
    body: JSON.stringify({ sceneIds }),
  }),
};

// ===========================================
// Floor Plans API
// ===========================================

export const floorPlansApi = {
  // List floor plans for a tour
  list: (tourId) => request(`/tours/${tourId}/floorplans`),

  // Get floor plan by ID
  get: (tourId, floorPlanId) => request(`/tours/${tourId}/floorplans/${floorPlanId}`),

  // Create floor plan
  create: (tourId, data) => request(`/tours/${tourId}/floorplans`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update floor plan
  update: (tourId, floorPlanId, data) => request(`/tours/${tourId}/floorplans/${floorPlanId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete floor plan
  delete: (tourId, floorPlanId) => request(`/tours/${tourId}/floorplans/${floorPlanId}`, {
    method: 'DELETE',
  }),

  // Update scene position on floor plan
  updateScenePosition: (tourId, floorPlanId, sceneId, position) =>
    request(`/tours/${tourId}/floorplans/${floorPlanId}/scenes/${sceneId}`, {
      method: 'PUT',
      body: JSON.stringify(position),
    }),
};

// ===========================================
// Hotspots API
// ===========================================

export const hotspotsApi = {
  // List hotspots for a scene
  list: (tourId, sceneId) => request(`/tours/${tourId}/scenes/${sceneId}/hotspots`),

  // Create hotspot
  create: (tourId, sceneId, data) => request(`/tours/${tourId}/scenes/${sceneId}/hotspots`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update hotspot
  update: (tourId, sceneId, hotspotId, data) =>
    request(`/tours/${tourId}/scenes/${sceneId}/hotspots/${hotspotId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete hotspot
  delete: (tourId, sceneId, hotspotId) =>
    request(`/tours/${tourId}/scenes/${sceneId}/hotspots/${hotspotId}`, {
      method: 'DELETE',
    }),
};

// ===========================================
// Settings API
// ===========================================

export const settingsApi = {
  // Get branding settings (public)
  getBranding: () => request('/settings/branding'),

  // Update branding settings
  updateBranding: (data) => request('/settings/branding', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Get team members
  getTeam: () => request('/settings/team'),

  // Update team member
  updateTeamMember: (id, data) => request(`/settings/team/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Remove team member
  removeTeamMember: (id) => request(`/settings/team/${id}`, { method: 'DELETE' }),

  // Get team stats
  getTeamStats: () => request('/settings/team/stats'),
};

// ===========================================
// Upload API
// ===========================================

export const uploadApi = {
  // Upload panorama
  uploadPanorama: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return request('/upload/panorama', {
      method: 'POST',
      body: formData,
    });
  },

  // Upload stereo panorama
  uploadStereo: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return request('/upload/stereo', {
      method: 'POST',
      body: formData,
    });
  },

  // Upload floor plan
  uploadFloorplan: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return request('/upload/floorplan', {
      method: 'POST',
      body: formData,
    });
  },

  // Upload audio
  uploadAudio: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return request('/upload/audio', {
      method: 'POST',
      body: formData,
    });
  },

  // Upload logo
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return request('/upload/logo', {
      method: 'POST',
      body: formData,
    });
  },

  // Delete file
  delete: (type, filename) => request(`/upload/${type}/${filename}`, {
    method: 'DELETE',
  }),
};

export default {
  auth: authApi,
  tours: toursApi,
  scenes: scenesApi,
  floorPlans: floorPlansApi,
  hotspots: hotspotsApi,
  settings: settingsApi,
  upload: uploadApi,
};
