# Ozone Virtual Tours API Reference

Complete API documentation for the Ozone Virtual Tours backend.

## Base URL

- **Development**: `http://localhost:3001/api`
- **Production**: `https://your-domain.com/api`

## Authentication

All authenticated endpoints require a valid session cookie. Sessions are created via the login endpoint.

### Session Cookie
- **Name**: `session`
- **Type**: HTTP-only cookie
- **Duration**: 7 days

---

## Table of Contents

- [Authentication](#authentication-endpoints)
- [Tours](#tours)
- [Scenes](#scenes)
- [Hotspots](#hotspots)
- [Floor Plans](#floor-plans)
- [Material Library](#material-library)
- [Uploads](#uploads)
- [Settings](#settings)
- [Error Handling](#error-handling)

---

## Authentication Endpoints

### Check Bootstrap Status
```http
GET /api/auth/bootstrap
```

Check if the system needs initial setup (no users exist).

**Response (needs setup):**
```json
{
  "needsBootstrap": true
}
```

**Response (already configured):**
```json
{
  "needsBootstrap": false
}
```

---

### Login
```http
POST /api/auth/login
```

Login with email address (passwordless).

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN"
  }
}
```

**Errors:**
- `401`: Invalid email or user not found

---

### Logout
```http
POST /api/auth/logout
```

End the current session.

**Response:**
```json
{
  "success": true
}
```

---

### Get Current User
```http
GET /api/auth/me
```

Get the currently authenticated user.

**Response:**
```json
{
  "user": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN",
    "avatar": null
  }
}
```

**Errors:**
- `401`: Not authenticated

---

### Create Invite Link
```http
POST /api/auth/invite
```

Create an invitation link for a new user. **Requires ADMIN role.**

**Request Body:**
```json
{
  "email": "newuser@example.com"
}
```

**Response:**
```json
{
  "invite": {
    "id": "clx...",
    "token": "abc123...",
    "email": "newuser@example.com",
    "expiresAt": "2024-12-22T00:00:00.000Z"
  },
  "inviteUrl": "https://example.com/register/abc123..."
}
```

---

### Validate Invite Token
```http
GET /api/auth/invite/:token
```

Validate an invitation token before registration.

**Response:**
```json
{
  "valid": true,
  "email": "newuser@example.com"
}
```

**Errors:**
- `400`: Invalid or expired token

---

### Register with Invite
```http
POST /api/auth/register
```

Register a new user with an invite token.

**Request Body:**
```json
{
  "token": "abc123...",
  "name": "New User",
  "email": "newuser@example.com"
}
```

**Response:**
```json
{
  "user": {
    "id": "clx...",
    "email": "newuser@example.com",
    "name": "New User",
    "role": "EDITOR"
  }
}
```

---

### List Invites
```http
GET /api/auth/invites
```

List all pending invitations. **Requires ADMIN role.**

**Response:**
```json
{
  "invites": [
    {
      "id": "clx...",
      "email": "pending@example.com",
      "expiresAt": "2024-12-22T00:00:00.000Z",
      "createdAt": "2024-12-15T00:00:00.000Z"
    }
  ]
}
```

---

### Revoke Invite
```http
DELETE /api/auth/invite/:id
```

Delete a pending invitation. **Requires ADMIN role.**

**Response:**
```json
{
  "success": true
}
```

---

## Tours

### List Tours
```http
GET /api/tours
```

Get all tours for the authenticated user.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Max tours to return |
| `offset` | number | Pagination offset |
| `status` | string | Filter: 'published', 'draft' |

**Response:**
```json
{
  "tours": [
    {
      "id": "clx...",
      "name": "Modern Kitchen Tour",
      "slug": "modern-kitchen",
      "description": "A tour of our modern kitchen design",
      "clientName": "Acme Corp",
      "isPublished": true,
      "scenes": [...]
    }
  ]
}
```

---

### Get Tour by ID
```http
GET /api/tours/:id
```

Get a tour with all related data.

**Response:**
```json
{
  "tour": {
    "id": "clx...",
    "name": "Modern Kitchen Tour",
    "slug": "modern-kitchen",
    "description": "...",
    "clientName": "Acme Corp",
    "projectRef": "PRJ-001",
    "isPublished": true,
    "isPasswordProtected": false,
    "ambientMusicUrl": "/uploads/audio/ambient.mp3",
    "ambientMusicVolume": 0.5,
    "settings": {
      "autoRotate": false,
      "vrEnabled": true,
      "showCompass": true
    },
    "scenes": [...],
    "floorPlans": [...]
  }
}
```

---

### Get Tour by Slug (Public)
```http
GET /api/tours/slug/:slug
```

Get a published tour by its public slug. No authentication required.

**Response:** Same as Get Tour by ID

**Errors:**
- `404`: Tour not found or not published

---

### Create Tour
```http
POST /api/tours
```

Create a new tour.

**Request Body:**
```json
{
  "name": "New Tour",
  "slug": "new-tour",
  "description": "Tour description",
  "clientName": "Client Name"
}
```

**Response:**
```json
{
  "tour": {
    "id": "clx...",
    "name": "New Tour",
    "slug": "new-tour",
    ...
  }
}
```

---

### Update Tour
```http
PUT /api/tours/:id
```

Update tour properties.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "settings": {
    "autoRotate": true
  }
}
```

**Response:**
```json
{
  "tour": { ... }
}
```

---

### Delete Tour
```http
DELETE /api/tours/:id
```

Delete a tour and all related data.

**Response:**
```json
{
  "success": true
}
```

---

### Publish Tour
```http
POST /api/tours/:id/publish
```

Make a tour publicly accessible.

**Response:**
```json
{
  "tour": {
    ...
    "isPublished": true
  }
}
```

---

### Unpublish Tour
```http
POST /api/tours/:id/unpublish
```

Make a tour private.

**Response:**
```json
{
  "tour": {
    ...
    "isPublished": false
  }
}
```

---

### Verify Tour Password
```http
POST /api/tours/:id/verify-password
```

Verify password for a protected tour.

**Request Body:**
```json
{
  "password": "tour-password"
}
```

**Response:**
```json
{
  "valid": true
}
```

---

## Scenes

### List Scenes
```http
GET /api/tours/:tourId/scenes
```

Get all scenes for a tour.

**Response:**
```json
{
  "scenes": [
    {
      "id": "clx...",
      "name": "Living Room",
      "panoramaUrl": "/uploads/panoramas/abc.jpg",
      "thumbnailUrl": "/uploads/thumbnails/abc_thumb.jpg",
      "order": 0,
      "initialYaw": 0,
      "initialPitch": 0,
      "hotspots": [...]
    }
  ]
}
```

---

### Create Scene
```http
POST /api/tours/:tourId/scenes
```

Add a scene to a tour.

**Request Body:**
```json
{
  "name": "New Scene",
  "panoramaUrl": "/uploads/panoramas/abc.jpg",
  "thumbnailUrl": "/uploads/thumbnails/abc_thumb.jpg"
}
```

---

### Update Scene
```http
PUT /api/tours/:tourId/scenes/:sceneId
```

Update scene properties.

**Request Body:**
```json
{
  "name": "Updated Name",
  "initialYaw": 90,
  "initialPitch": 0
}
```

---

### Delete Scene
```http
DELETE /api/tours/:tourId/scenes/:sceneId
```

Remove a scene from a tour.

---

### Reorder Scenes
```http
POST /api/tours/:tourId/scenes/reorder
```

Change scene order.

**Request Body:**
```json
{
  "sceneIds": ["scene1", "scene2", "scene3"]
}
```

---

## Hotspots

### List Hotspots
```http
GET /api/tours/:tourId/scenes/:sceneId/hotspots
```

Get all hotspots for a scene.

**Response:**
```json
{
  "hotspots": [
    {
      "id": "clx...",
      "type": "NAVIGATION",
      "name": "To Kitchen",
      "yaw": 45.5,
      "pitch": -10,
      "targetSceneId": "clx...",
      "content": null,
      "linkUrl": null
    }
  ]
}
```

---

### Create Hotspot
```http
POST /api/tours/:tourId/scenes/:sceneId/hotspots
```

Add a hotspot to a scene.

**Request Body:**
```json
{
  "type": "NAVIGATION",
  "name": "To Kitchen",
  "yaw": 45.5,
  "pitch": -10,
  "targetSceneId": "clx..."
}
```

**Hotspot Types:**
- `NAVIGATION`: Link to another scene
- `INFO`: Display information popup
- `LINK`: External URL link
- `AUDIO`: Play audio file

---

### Update Hotspot
```http
PUT /api/tours/:tourId/scenes/:sceneId/hotspots/:hotspotId
```

Update hotspot properties.

---

### Delete Hotspot
```http
DELETE /api/tours/:tourId/scenes/:sceneId/hotspots/:hotspotId
```

Remove a hotspot.

---

## Floor Plans

### List Floor Plans
```http
GET /api/tours/:tourId/floorplans
```

Get all floor plans for a tour.

**Response:**
```json
{
  "floorPlans": [
    {
      "id": "clx...",
      "name": "Ground Floor",
      "imageUrl": "/uploads/floorplans/floor1.png",
      "width": 800,
      "height": 600,
      "order": 0,
      "scenePositions": [
        {
          "sceneId": "clx...",
          "x": 0.5,
          "y": 0.3
        }
      ]
    }
  ]
}
```

---

### Create Floor Plan
```http
POST /api/tours/:tourId/floorplans
```

Add a floor plan to a tour.

**Request Body:**
```json
{
  "name": "Ground Floor",
  "imageUrl": "/uploads/floorplans/floor1.png",
  "width": 800,
  "height": 600
}
```

---

### Update Floor Plan
```http
PUT /api/tours/:tourId/floorplans/:floorPlanId
```

Update floor plan properties.

---

### Delete Floor Plan
```http
DELETE /api/tours/:tourId/floorplans/:floorPlanId
```

Remove a floor plan.

---

### Update Scene Position
```http
PUT /api/tours/:tourId/floorplans/:floorPlanId/scenes/:sceneId
```

Set scene position on a floor plan.

**Request Body:**
```json
{
  "x": 0.5,
  "y": 0.3
}
```

---

## Material Library

### Fetch Library
```http
GET /api/library
```

Get the user's complete material library.

**Response:**
```json
{
  "materials": {
    "mat_123": {
      "id": "mat_123",
      "name": "Chrome",
      "category": "Metals",
      "color": "#ffffff",
      "metalness": 1,
      "roughness": 0.1,
      ...
    }
  },
  "categories": ["Metals", "Plastics", "Glass", "Wood", "Fabric", "Stone", "Custom"],
  "lastSyncedAt": "2024-12-15T10:00:00.000Z"
}
```

---

### Sync Library
```http
POST /api/library/sync
```

Sync entire material library to the cloud.

**Request Body:**
```json
{
  "materials": { ... },
  "categories": ["Metals", "Custom", ...]
}
```

**Response:**
```json
{
  "success": true,
  "lastSyncedAt": "2024-12-15T10:00:00.000Z",
  "materialCount": 15
}
```

---

### Get Material
```http
GET /api/library/material/:id
```

Get a single material by ID.

**Response:**
```json
{
  "material": {
    "id": "mat_123",
    "name": "Chrome",
    ...
  }
}
```

---

### Save Material
```http
PUT /api/library/material/:id
```

Create or update a material.

**Request Body:**
```json
{
  "name": "My Material",
  "category": "Custom",
  "color": "#ff0000",
  "metalness": 0.5,
  "roughness": 0.3,
  "opacity": 1,
  "transparent": false,
  "emissive": "#000000",
  "emissiveIntensity": 0,
  "normalMap": "/uploads/textures/normal_abc.png"
}
```

**Response:**
```json
{
  "success": true,
  "material": { ... }
}
```

---

### Delete Material
```http
DELETE /api/library/material/:id
```

Remove a material from the library.

**Response:**
```json
{
  "success": true
}
```

---

### Update Categories
```http
POST /api/library/categories
```

Update the category list.

**Request Body:**
```json
{
  "categories": ["Metals", "Plastics", "My Category"]
}
```

**Response:**
```json
{
  "success": true,
  "categories": ["Metals", "Plastics", "My Category"]
}
```

---

## Uploads

### Upload Panorama
```http
POST /api/upload/panorama
```

Upload a 360° panorama image.

**Request:** `multipart/form-data`
- `file`: Image file (JPEG, PNG, WebP)

**Response:**
```json
{
  "success": true,
  "panoramaUrl": "/uploads/panoramas/abc123.jpg",
  "thumbnailUrl": "/uploads/thumbnails/abc123_thumb.jpg",
  "metadata": {
    "width": 4096,
    "height": 2048,
    "format": "jpeg",
    "size": 2500000
  }
}
```

---

### Upload Stereo Panorama
```http
POST /api/upload/stereo
```

Upload a stereo (side-by-side) panorama for VR.

**Response:** Same as panorama upload

---

### Upload Floor Plan
```http
POST /api/upload/floorplan
```

Upload a floor plan image.

**Response:**
```json
{
  "success": true,
  "imageUrl": "/uploads/floorplans/floor_abc.png",
  "width": 800,
  "height": 600
}
```

---

### Upload Audio
```http
POST /api/upload/audio
```

Upload an audio file for ambient music or hotspots.

**Accepted formats:** MP3, WAV, OGG, WebM

**Response:**
```json
{
  "success": true,
  "audioUrl": "/uploads/audio/music_abc.mp3",
  "metadata": {
    "mimetype": "audio/mpeg",
    "size": 5000000
  }
}
```

---

### Upload Logo
```http
POST /api/upload/logo
```

Upload a company logo.

**Response:**
```json
{
  "success": true,
  "logoUrl": "/uploads/logos/logo_abc.png"
}
```

---

### Upload Texture
```http
POST /api/upload/texture
```

Upload a material texture image.

**Request:** `multipart/form-data`
- `file`: Image file (JPEG, PNG, WebP)
- `textureType`: Type of texture (normal, roughness, ao, height, emissive, albedo, metalness, opacity)

**Response:**
```json
{
  "success": true,
  "textureUrl": "/uploads/textures/normal_abc123.png",
  "textureType": "normal",
  "metadata": {
    "width": 2048,
    "height": 2048,
    "originalWidth": 4096,
    "originalHeight": 4096,
    "size": 1500000
  }
}
```

---

### Delete Upload
```http
DELETE /api/upload/:type/:filename
```

Delete an uploaded file.

**Valid types:** `panoramas`, `thumbnails`, `floorplans`, `audio`, `logos`, `textures`

**Response:** `204 No Content`

---

## Settings

### Get Branding
```http
GET /api/settings/branding
```

Get company branding settings. **Public endpoint.**

**Response:**
```json
{
  "branding": {
    "companyName": "Ozone Design",
    "companyLogo": "/uploads/logos/logo.png",
    "primaryColor": "#7c8cfb",
    "secondaryColor": "#9b72f2"
  }
}
```

---

### Update Branding
```http
PUT /api/settings/branding
```

Update branding settings. **Requires ADMIN role.**

**Request Body:**
```json
{
  "companyName": "My Company",
  "companyLogo": "/uploads/logos/mylogo.png",
  "primaryColor": "#ff0000",
  "secondaryColor": "#00ff00"
}
```

---

### Get Team Members
```http
GET /api/settings/team
```

List all team members. **Requires ADMIN role.**

**Response:**
```json
{
  "members": [
    {
      "id": "clx...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "ADMIN",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Team Stats
```http
GET /api/settings/team/stats
```

Get team and tour statistics.

**Response:**
```json
{
  "stats": {
    "totalTours": 25,
    "publishedTours": 18,
    "teamMembers": 5
  }
}
```

---

### Update Team Member
```http
PUT /api/settings/team/:id
```

Update a team member. **Requires ADMIN role.**

**Request Body:**
```json
{
  "name": "Updated Name",
  "role": "EDITOR"
}
```

---

### Remove Team Member
```http
DELETE /api/settings/team/:id
```

Remove a team member. **Requires ADMIN role.**

---

## Error Handling

### Error Response Format

All errors follow this structure:

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE"
  }
}
```

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content (successful delete) |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate slug, etc.) |
| 413 | Payload Too Large (file size) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

### Rate Limiting

Endpoints are rate-limited to prevent abuse:

| Endpoint Type | Limit |
|---------------|-------|
| Auth endpoints | 5 requests/minute |
| Upload endpoints | 10 requests/minute |
| General API | 100 requests/minute |
| Public endpoints | 200 requests/minute |

When rate limited, the response includes:

```json
{
  "error": {
    "message": "Too many requests, please try again later"
  }
}
```

---

## WebSocket Events (Future)

*Reserved for real-time collaboration features*

---

## Changelog

| Version | Changes |
|---------|---------|
| 0.7.0 | Added Material Library endpoints |
| 0.6.0 | Added rate limiting, file validation |
| 0.5.0 | Added audio upload endpoint |
| 0.4.0 | Added floor plans, hotspots endpoints |
| 0.3.0 | Added authentication, settings |
| 0.2.0 | Added upload endpoints |
| 0.1.0 | Initial tours/scenes API |
