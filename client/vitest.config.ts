import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom for DOM testing
    environment: 'jsdom',

    // Global test setup
    globals: true,

    // Setup files run before each test file
    setupFiles: ['./src/test/setup.ts'],

    // Include patterns for test files
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // Exclude patterns
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
      ],
    },

    // Mock Tauri APIs
    deps: {
      inline: ['@tauri-apps/api'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
