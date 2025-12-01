// ===========================================
// API Service - Centralized API calls
// ===========================================

const API_BASE = '/api';

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
  get: (id) => request(`/tours/${id}`),

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
  // Get scene by ID
  get: (id) => request(`/scenes/${id}`),

  // Create scene
  create: (data) => request('/scenes', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update scene
  update: (id, data) => request(`/scenes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete scene
  delete: (id) => request(`/scenes/${id}`, { method: 'DELETE' }),

  // Reorder scenes
  reorder: (tourId, sceneIds) => request(`/scenes/${tourId}/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ sceneIds }),
  }),
};

// ===========================================
// Hotspots API
// ===========================================

export const hotspotsApi = {
  // Get hotspot by ID
  get: (id) => request(`/hotspots/${id}`),

  // Create hotspot
  create: (data) => request('/hotspots', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update hotspot
  update: (id, data) => request(`/hotspots/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete hotspot
  delete: (id) => request(`/hotspots/${id}`, { method: 'DELETE' }),

  // Batch create
  batchCreate: (hotspots) => request('/hotspots/batch', {
    method: 'POST',
    body: JSON.stringify({ hotspots }),
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
  uploadPanorama: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('panorama', file);

    return request('/upload/panorama', {
      method: 'POST',
      body: formData,
    });
  },

  // Upload floor plan
  uploadFloorplan: async (file) => {
    const formData = new FormData();
    formData.append('floorplan', file);

    return request('/upload/floorplan', {
      method: 'POST',
      body: formData,
    });
  },

  // Upload audio
  uploadAudio: async (file) => {
    const formData = new FormData();
    formData.append('audio', file);

    return request('/upload/audio', {
      method: 'POST',
      body: formData,
    });
  },

  // Upload logo
  uploadLogo: async (file) => {
    const formData = new FormData();
    formData.append('logo', file);

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
  hotspots: hotspotsApi,
  settings: settingsApi,
  upload: uploadApi,
};
