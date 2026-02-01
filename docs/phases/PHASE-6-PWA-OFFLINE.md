# Phase 6: PWA & Offline

> **Estimated Scope**: Service worker, IndexedDB, offline capability
> **Prerequisites**: Phase 5 complete (VR mode working)
> **Outputs**: Installable PWA with selective offline support

---

## Overview

This phase adds Progressive Web App capabilities:

1. Service worker for caching and offline
2. IndexedDB for local data storage
3. Selective scene caching (user-initiated)
4. Background sync for pending changes
5. Install prompt and app manifest
6. Storage management and cleanup

---

## Context for New Sessions

If you're starting a new Claude session to work on this phase:

- **Project**: Ozone Studio - 3D scene viewer for interior designers
- **Current State**: Phase 5 complete (full 3D viewer with VR)
- **Working Directory**: `C:/Users/Lion/ozone-virtual-tours`
- **Focus**: Making the app work offline

**Important constraint**: GLB files can be up to 1GB. We cannot cache everything. Strategy is:
- Always cache: App shell, static assets, API responses
- User-initiated: Scene GLB files (with storage warnings)
- Never cache: Very large files without explicit user consent

Read `/docs/ARCHITECTURE.md` for full context.

---

## Dependencies

```bash
cd client
pnpm add workbox-window idb
pnpm add -D vite-plugin-pwa workbox-precaching workbox-routing workbox-strategies
```

---

## Task Checklist

### 6.1 Configure Vite PWA Plugin

Update `client/vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Show update prompt
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Ozone Studio',
        short_name: 'Ozone Studio',
        description: '3D Scene Viewer for Interior Designers',
        theme_color: '#6366f1',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // API responses (cache first, then network)
            urlPattern: /^\/api\/(?!upload).*/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            // Small images (thumbnails, textures < 5MB)
            urlPattern: /\/uploads\/(?!glb).*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              matchOptions: {
                ignoreVary: true,
              },
            },
          },
          // GLB files are NOT cached automatically - handled by IndexedDB
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

### 6.2 Create IndexedDB Storage Layer

Create `client/src/services/storage/db.ts`:

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OzoneDB extends DBSchema {
  scenes: {
    key: string; // scene ID
    value: {
      id: string;
      projectId: string;
      name: string;
      glbBlob: Blob;
      glbSize: number;
      thumbnail?: string;
      cachedAt: number;
      lastAccessed: number;
    };
    indexes: {
      'by-project': string;
      'by-cached-at': number;
    };
  };
  materials: {
    key: string; // material ID
    value: {
      id: string;
      data: any; // Material properties
      textures: Record<string, Blob>; // Texture blobs by type
      cachedAt: number;
    };
  };
  pendingSync: {
    key: number; // auto-increment
    value: {
      id?: number;
      type: 'material-mapping' | 'material-update' | 'scene-update';
      payload: any;
      createdAt: number;
      retries: number;
    };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
}

let dbInstance: IDBPDatabase<OzoneDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<OzoneDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OzoneDB>('ozone-studio', 1, {
    upgrade(db) {
      // Scenes store
      const scenesStore = db.createObjectStore('scenes', { keyPath: 'id' });
      scenesStore.createIndex('by-project', 'projectId');
      scenesStore.createIndex('by-cached-at', 'cachedAt');

      // Materials store
      db.createObjectStore('materials', { keyPath: 'id' });

      // Pending sync queue
      db.createObjectStore('pendingSync', {
        keyPath: 'id',
        autoIncrement: true,
      });

      // Metadata store
      db.createObjectStore('metadata', { keyPath: 'key' });
    },
  });

  return dbInstance;
}

export async function closeDB(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
```

Create `client/src/services/storage/sceneCache.ts`:

```typescript
import { getDB } from './db';

export interface CachedScene {
  id: string;
  projectId: string;
  name: string;
  glbBlob: Blob;
  glbSize: number;
  thumbnail?: string;
  cachedAt: number;
  lastAccessed: number;
}

export async function cacheScene(
  sceneId: string,
  projectId: string,
  name: string,
  glbBlob: Blob,
  thumbnail?: string
): Promise<void> {
  const db = await getDB();

  await db.put('scenes', {
    id: sceneId,
    projectId,
    name,
    glbBlob,
    glbSize: glbBlob.size,
    thumbnail,
    cachedAt: Date.now(),
    lastAccessed: Date.now(),
  });
}

export async function getCachedScene(sceneId: string): Promise<CachedScene | undefined> {
  const db = await getDB();
  const scene = await db.get('scenes', sceneId);

  if (scene) {
    // Update last accessed time
    await db.put('scenes', {
      ...scene,
      lastAccessed: Date.now(),
    });
  }

  return scene;
}

export async function isSceneCached(sceneId: string): Promise<boolean> {
  const db = await getDB();
  const scene = await db.get('scenes', sceneId);
  return !!scene;
}

export async function removeCachedScene(sceneId: string): Promise<void> {
  const db = await getDB();
  await db.delete('scenes', sceneId);
}

export async function getCachedScenesByProject(projectId: string): Promise<CachedScene[]> {
  const db = await getDB();
  return db.getAllFromIndex('scenes', 'by-project', projectId);
}

export async function getAllCachedScenes(): Promise<CachedScene[]> {
  const db = await getDB();
  return db.getAll('scenes');
}

export async function getCacheStats(): Promise<{
  sceneCount: number;
  totalSize: number;
  scenes: { id: string; name: string; size: number; cachedAt: number }[];
}> {
  const scenes = await getAllCachedScenes();

  return {
    sceneCount: scenes.length,
    totalSize: scenes.reduce((sum, s) => sum + s.glbSize, 0),
    scenes: scenes.map((s) => ({
      id: s.id,
      name: s.name,
      size: s.glbSize,
      cachedAt: s.cachedAt,
    })),
  };
}

export async function clearOldCache(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
  const db = await getDB();
  const cutoff = Date.now() - maxAgeMs;

  const tx = db.transaction('scenes', 'readwrite');
  const index = tx.store.index('by-cached-at');

  let deleted = 0;
  let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoff));

  while (cursor) {
    await cursor.delete();
    deleted++;
    cursor = await cursor.continue();
  }

  await tx.done;
  return deleted;
}

export async function clearAllCache(): Promise<void> {
  const db = await getDB();
  await db.clear('scenes');
}
```

### 6.3 Create Sync Manager

Create `client/src/services/storage/syncManager.ts`:

```typescript
import { getDB } from './db';

interface PendingSync {
  id?: number;
  type: 'material-mapping' | 'material-update' | 'scene-update';
  payload: any;
  createdAt: number;
  retries: number;
}

export async function addPendingSync(
  type: PendingSync['type'],
  payload: any
): Promise<number> {
  const db = await getDB();

  const id = await db.add('pendingSync', {
    type,
    payload,
    createdAt: Date.now(),
    retries: 0,
  });

  // Trigger sync if online
  if (navigator.onLine) {
    processPendingSync();
  }

  return id as number;
}

export async function getPendingSync(): Promise<PendingSync[]> {
  const db = await getDB();
  return db.getAll('pendingSync');
}

export async function removePendingSync(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('pendingSync', id);
}

export async function incrementRetry(id: number): Promise<void> {
  const db = await getDB();
  const item = await db.get('pendingSync', id);

  if (item) {
    await db.put('pendingSync', {
      ...item,
      retries: item.retries + 1,
    });
  }
}

let isSyncing = false;

export async function processPendingSync(): Promise<void> {
  if (isSyncing || !navigator.onLine) return;

  isSyncing = true;

  try {
    const db = await getDB();
    const pending = await db.getAll('pendingSync');

    for (const item of pending) {
      if (item.retries >= 3) {
        // Give up after 3 retries
        await db.delete('pendingSync', item.id!);
        continue;
      }

      try {
        await syncItem(item);
        await db.delete('pendingSync', item.id!);
      } catch (error) {
        console.error('Sync failed for item:', item, error);
        await incrementRetry(item.id!);
      }
    }
  } finally {
    isSyncing = false;
  }
}

async function syncItem(item: PendingSync): Promise<void> {
  const { type, payload } = item;

  switch (type) {
    case 'material-mapping':
      await fetch(`/api/scenes/${payload.sceneId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      break;

    case 'material-update':
      await fetch(`/api/materials/${payload.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      break;

    case 'scene-update':
      await fetch(`/api/scenes/${payload.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      break;
  }
}

// Listen for online event
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processPendingSync();
  });
}
```

### 6.4 Create Offline Store

Create `client/src/stores/offlineStore.ts`:

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface OfflineState {
  isOnline: boolean;
  pendingSyncCount: number;
  cacheStats: {
    sceneCount: number;
    totalSize: number;
  } | null;

  // Download progress
  downloadingSceneId: string | null;
  downloadProgress: number;

  // Actions
  setOnline: (online: boolean) => void;
  setPendingSyncCount: (count: number) => void;
  setCacheStats: (stats: { sceneCount: number; totalSize: number } | null) => void;
  setDownloading: (sceneId: string | null, progress?: number) => void;
}

export const useOfflineStore = create<OfflineState>()(
  devtools(
    (set) => ({
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      pendingSyncCount: 0,
      cacheStats: null,
      downloadingSceneId: null,
      downloadProgress: 0,

      setOnline: (online) => set({ isOnline: online }),
      setPendingSyncCount: (count) => set({ pendingSyncCount: count }),
      setCacheStats: (stats) => set({ cacheStats: stats }),
      setDownloading: (sceneId, progress = 0) =>
        set({ downloadingSceneId: sceneId, downloadProgress: progress }),
    }),
    { name: 'offline-store' }
  )
);

// Initialize online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnline(true);
  });

  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnline(false);
  });
}
```

### 6.5 Create Scene Download Hook

Create `client/src/hooks/useSceneCache.ts`:

```typescript
import { useState, useCallback } from 'react';
import {
  cacheScene,
  getCachedScene,
  isSceneCached,
  removeCachedScene,
  getCacheStats,
} from '@/services/storage/sceneCache';
import { useOfflineStore } from '@/stores/offlineStore';

export function useSceneCache() {
  const [error, setError] = useState<string | null>(null);
  const { setDownloading, setCacheStats } = useOfflineStore();

  const downloadScene = useCallback(
    async (scene: {
      id: string;
      projectId: string;
      name: string;
      glbUrl: string;
      thumbnail?: string;
    }) => {
      setError(null);
      setDownloading(scene.id, 0);

      try {
        // Fetch GLB with progress
        const response = await fetch(scene.glbUrl);

        if (!response.ok) {
          throw new Error('Failed to download scene');
        }

        const contentLength = response.headers.get('Content-Length');
        const total = contentLength ? parseInt(contentLength) : 0;

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const chunks: Uint8Array[] = [];
        let loaded = 0;

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          chunks.push(value);
          loaded += value.length;

          if (total > 0) {
            setDownloading(scene.id, Math.round((loaded / total) * 100));
          }
        }

        // Create blob from chunks
        const blob = new Blob(chunks);

        // Save to IndexedDB
        await cacheScene(
          scene.id,
          scene.projectId,
          scene.name,
          blob,
          scene.thumbnail
        );

        // Update cache stats
        const stats = await getCacheStats();
        setCacheStats({ sceneCount: stats.sceneCount, totalSize: stats.totalSize });

        setDownloading(null);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Download failed');
        setDownloading(null);
        return false;
      }
    },
    [setDownloading, setCacheStats]
  );

  const getScene = useCallback(async (sceneId: string) => {
    const cached = await getCachedScene(sceneId);
    if (cached) {
      return URL.createObjectURL(cached.glbBlob);
    }
    return null;
  }, []);

  const checkCached = useCallback(async (sceneId: string) => {
    return isSceneCached(sceneId);
  }, []);

  const removeScene = useCallback(
    async (sceneId: string) => {
      await removeCachedScene(sceneId);
      const stats = await getCacheStats();
      setCacheStats({ sceneCount: stats.sceneCount, totalSize: stats.totalSize });
    },
    [setCacheStats]
  );

  const refreshStats = useCallback(async () => {
    const stats = await getCacheStats();
    setCacheStats({ sceneCount: stats.sceneCount, totalSize: stats.totalSize });
  }, [setCacheStats]);

  return {
    downloadScene,
    getScene,
    checkCached,
    removeScene,
    refreshStats,
    error,
  };
}
```

### 6.6 Create Offline Status UI

Create `client/src/components/feedback/OfflineIndicator.tsx`:

```tsx
import { WifiOff, Cloud, CloudOff, Download } from 'lucide-react';
import { useOfflineStore } from '@/stores/offlineStore';

export function OfflineIndicator() {
  const { isOnline, pendingSyncCount, downloadingSceneId, downloadProgress } = useOfflineStore();

  if (isOnline && pendingSyncCount === 0 && !downloadingSceneId) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 flex flex-col gap-2">
      {/* Offline indicator */}
      {!isOnline && (
        <div className="flex items-center gap-2 bg-yellow-600 text-white px-3 py-2 rounded-lg">
          <WifiOff size={18} />
          <span className="text-sm">Offline</span>
        </div>
      )}

      {/* Pending sync indicator */}
      {pendingSyncCount > 0 && (
        <div className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg">
          {isOnline ? <Cloud size={18} /> : <CloudOff size={18} />}
          <span className="text-sm">
            {pendingSyncCount} pending {pendingSyncCount === 1 ? 'change' : 'changes'}
          </span>
        </div>
      )}

      {/* Download progress */}
      {downloadingSceneId && (
        <div className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded-lg">
          <Download size={18} className="animate-bounce" />
          <div className="flex-1">
            <div className="text-sm">Downloading...</div>
            <div className="w-32 h-1.5 bg-gray-700 rounded-full mt-1">
              <div
                className="h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
          <span className="text-sm">{downloadProgress}%</span>
        </div>
      )}
    </div>
  );
}
```

### 6.7 Create Cache Manager UI

Create `client/src/features/settings/CacheManager.tsx`:

```tsx
import { useEffect } from 'react';
import { HardDrive, Trash2, Download } from 'lucide-react';
import { useOfflineStore } from '@/stores/offlineStore';
import { getCacheStats, clearAllCache, clearOldCache } from '@/services/storage/sceneCache';

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function CacheManager() {
  const { cacheStats, setCacheStats } = useOfflineStore();

  // Load stats on mount
  useEffect(() => {
    getCacheStats().then((stats) => {
      setCacheStats({ sceneCount: stats.sceneCount, totalSize: stats.totalSize });
    });
  }, [setCacheStats]);

  const handleClearOld = async () => {
    const deleted = await clearOldCache();
    const stats = await getCacheStats();
    setCacheStats({ sceneCount: stats.sceneCount, totalSize: stats.totalSize });
    alert(`Removed ${deleted} old cached scene(s)`);
  };

  const handleClearAll = async () => {
    if (confirm('Clear all cached scenes? This cannot be undone.')) {
      await clearAllCache();
      setCacheStats({ sceneCount: 0, totalSize: 0 });
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <HardDrive size={20} className="text-gray-400" />
        <h3 className="text-white font-medium">Offline Cache</h3>
      </div>

      {cacheStats && (
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Cached Scenes</span>
            <span className="text-white">{cacheStats.sceneCount}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Storage Used</span>
            <span className="text-white">{formatSize(cacheStats.totalSize)}</span>
          </div>

          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500"
              style={{
                width: `${Math.min((cacheStats.totalSize / (1024 * 1024 * 1024)) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {formatSize(cacheStats.totalSize)} of ~1 GB used
          </p>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleClearOld}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm"
            >
              <Trash2 size={16} />
              Clear Old
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
            >
              <Trash2 size={16} />
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### 6.8 Update Service Worker Registration

Create `client/src/services/pwa.ts`:

```typescript
import { registerSW } from 'virtual:pwa-register';

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined;

export function initializePWA() {
  updateSW = registerSW({
    onNeedRefresh() {
      // Show update prompt to user
      if (confirm('New version available. Reload to update?')) {
        updateSW?.(true);
      }
    },
    onOfflineReady() {
      console.log('App ready for offline use');
    },
    onRegistered(registration) {
      console.log('Service worker registered:', registration);
    },
    onRegisterError(error) {
      console.error('Service worker registration failed:', error);
    },
  });
}

export function updatePWA() {
  updateSW?.(true);
}
```

Update `client/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { initializePWA } from './services/pwa';
import './styles/globals.css';

// Initialize PWA
initializePWA();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      // Use cached data when offline
      networkMode: 'offlineFirst',
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

## Verification Checklist

After completing Phase 6, verify:

- [ ] App can be installed as PWA
- [ ] App shell works offline
- [ ] API responses are cached
- [ ] Scenes can be downloaded for offline
- [ ] Downloaded scenes load when offline
- [ ] Pending changes are queued when offline
- [ ] Changes sync when back online
- [ ] Cache manager shows storage usage
- [ ] Old cache can be cleared
- [ ] Offline indicator appears when disconnected

---

## Testing Offline Mode

1. Open Chrome DevTools → Application → Service Workers
2. Check "Offline" checkbox
3. Verify app still loads
4. Download a scene while online
5. Go offline and load the cached scene
6. Make a change (material mapping) while offline
7. Go back online and verify sync

---

## Next Phase

After Phase 6 is complete, proceed to **Phase 7: Panorama Viewer** which covers:
- Fixing/rewriting the panorama viewer
- Hotspot system
- Integration with project system
