import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Tauri APIs
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(() => Promise.resolve(() => {})),
  emit: vi.fn(),
}));

// Mock window.__TAURI__ for Tauri detection
Object.defineProperty(window, '__TAURI__', {
  value: {
    invoke: vi.fn(),
  },
  writable: true,
});

// Suppress console errors during tests (optional)
// vi.spyOn(console, 'error').mockImplementation(() => {});
