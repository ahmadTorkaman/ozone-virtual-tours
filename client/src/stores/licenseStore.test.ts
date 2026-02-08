import { describe, it, expect, beforeEach } from 'vitest';
import { useLicenseStore } from './licenseStore';
import type { License, LicenseStatus } from '@/services/licenseService';

describe('licenseStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useLicenseStore.getState().reset();
  });

  describe('initial state', () => {
    it('should have null license and status', () => {
      const state = useLicenseStore.getState();
      expect(state.license).toBeNull();
      expect(state.status).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setLicense', () => {
    it('should update license', () => {
      const license: License = {
        key: 'TEST-1234-5678-ABCD',
        email: 'test@example.com',
        tier: 'professional',
        seats: 1,
        validUntil: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
        features: ['export', 'vr'],
        activatedAt: Date.now(),
        machineId: 'test-machine',
      };

      useLicenseStore.getState().setLicense(license);

      expect(useLicenseStore.getState().license).toEqual(license);
    });
  });

  describe('setStatus', () => {
    it('should update status', () => {
      const status: LicenseStatus = {
        tier: 'professional',
        isActive: true,
        message: 'License active',
        daysRemaining: 365,
        maxProjects: 50,
        maxScenesPerProject: 100,
        canExport: true,
        canUseVr: true,
        hasCloudSync: false,
      };

      useLicenseStore.getState().setStatus(status);

      expect(useLicenseStore.getState().status).toEqual(status);
    });
  });

  describe('setLoading', () => {
    it('should update loading state', () => {
      useLicenseStore.getState().setLoading(true);
      expect(useLicenseStore.getState().isLoading).toBe(true);

      useLicenseStore.getState().setLoading(false);
      expect(useLicenseStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should update error state', () => {
      useLicenseStore.getState().setError('Something went wrong');
      expect(useLicenseStore.getState().error).toBe('Something went wrong');

      useLicenseStore.getState().setError(null);
      expect(useLicenseStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      // Set some state
      useLicenseStore.getState().setLoading(true);
      useLicenseStore.getState().setError('Error');

      // Reset
      useLicenseStore.getState().reset();

      const state = useLicenseStore.getState();
      expect(state.license).toBeNull();
      expect(state.status).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('canUseFeature', () => {
    it('should return false when no status', () => {
      expect(useLicenseStore.getState().canUseFeature('export')).toBe(false);
    });

    it('should return false when license is not active', () => {
      useLicenseStore.getState().setStatus({
        tier: 'trial',
        isActive: false,
        message: 'Trial expired',
        daysRemaining: 0,
        maxProjects: 3,
        maxScenesPerProject: 5,
        canExport: false,
        canUseVr: false,
        hasCloudSync: false,
      });

      expect(useLicenseStore.getState().canUseFeature('export')).toBe(false);
    });

    it('should check specific features correctly', () => {
      useLicenseStore.getState().setStatus({
        tier: 'professional',
        isActive: true,
        message: 'License active',
        daysRemaining: 365,
        maxProjects: 50,
        maxScenesPerProject: 100,
        canExport: true,
        canUseVr: true,
        hasCloudSync: false,
      });

      expect(useLicenseStore.getState().canUseFeature('export')).toBe(true);
      expect(useLicenseStore.getState().canUseFeature('vr')).toBe(true);
      expect(useLicenseStore.getState().canUseFeature('cloud_sync')).toBe(false);
    });

    it('should check custom features in license', () => {
      useLicenseStore.getState().setLicense({
        key: 'TEST',
        email: 'test@example.com',
        tier: 'enterprise',
        seats: 10,
        validUntil: Date.now() + 365 * 24 * 60 * 60 * 1000,
        features: ['custom_feature'],
        activatedAt: Date.now(),
        machineId: 'test-machine',
      });

      useLicenseStore.getState().setStatus({
        tier: 'enterprise',
        isActive: true,
        message: 'Enterprise license active',
        daysRemaining: 365,
        maxProjects: -1,
        maxScenesPerProject: -1,
        canExport: true,
        canUseVr: true,
        hasCloudSync: true,
      });

      expect(useLicenseStore.getState().canUseFeature('custom_feature')).toBe(true);
      expect(useLicenseStore.getState().canUseFeature('unknown_feature')).toBe(false);
    });
  });

  describe('getTier', () => {
    it('should return trial when no status', () => {
      expect(useLicenseStore.getState().getTier()).toBe('trial');
    });

    it('should return correct tier from status', () => {
      useLicenseStore.getState().setStatus({
        tier: 'enterprise',
        isActive: true,
        message: 'Enterprise license active',
        daysRemaining: 365,
        maxProjects: -1,
        maxScenesPerProject: -1,
        canExport: true,
        canUseVr: true,
        hasCloudSync: true,
      });

      expect(useLicenseStore.getState().getTier()).toBe('enterprise');
    });
  });

  describe('isActive', () => {
    it('should return false when no status', () => {
      expect(useLicenseStore.getState().isActive()).toBe(false);
    });

    it('should return status.isActive', () => {
      useLicenseStore.getState().setStatus({
        tier: 'professional',
        isActive: true,
        message: 'License active',
        daysRemaining: 365,
        maxProjects: 50,
        maxScenesPerProject: 100,
        canExport: true,
        canUseVr: true,
        hasCloudSync: false,
      });

      expect(useLicenseStore.getState().isActive()).toBe(true);
    });
  });
});
