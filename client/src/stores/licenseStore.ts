import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { License, LicenseStatus, LicenseTier } from '@/services/licenseService';

interface LicenseState {
  // License data
  license: License | null;
  status: LicenseStatus | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setLicense: (license: License | null) => void;
  setStatus: (status: LicenseStatus | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Computed helpers
  canUseFeature: (feature: string) => boolean;
  getTier: () => LicenseTier;
  isActive: () => boolean;
}

const initialState = {
  license: null,
  status: null,
  isLoading: false,
  error: null,
};

export const useLicenseStore = create<LicenseState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setLicense: (license) => set({ license }),

      setStatus: (status) => set({ status }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),

      /**
       * Check if a specific feature is available with the current license
       */
      canUseFeature: (feature: string): boolean => {
        const { license, status } = get();

        // If no status loaded yet, assume trial
        if (!status) return false;

        // If license is not active, no features available
        if (!status.isActive) return false;

        // Check specific features
        switch (feature) {
          case 'export':
            return status.canExport;
          case 'vr':
            return status.canUseVr;
          case 'cloud_sync':
            return status.hasCloudSync;
          default:
            // Check if feature is in license features list
            return license?.features.includes(feature) ?? false;
        }
      },

      /**
       * Get the current license tier
       */
      getTier: (): LicenseTier => {
        const { status } = get();
        return status?.tier ?? 'trial';
      },

      /**
       * Check if the license is active
       */
      isActive: (): boolean => {
        const { status } = get();
        return status?.isActive ?? false;
      },
    }),
    { name: 'license-store' }
  )
);

/**
 * Hook to check if a feature is available
 */
export function useCanUseFeature(feature: string): boolean {
  return useLicenseStore((state) => state.canUseFeature(feature));
}

/**
 * Hook to get the current tier
 */
export function useLicenseTier(): LicenseTier {
  return useLicenseStore((state) => state.getTier());
}

/**
 * Hook to get license status
 */
export function useLicenseStatus(): LicenseStatus | null {
  return useLicenseStore((state) => state.status);
}

/**
 * Hook to check if license is active
 */
export function useIsLicenseActive(): boolean {
  return useLicenseStore((state) => state.isActive());
}
