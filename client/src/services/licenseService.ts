import { invoke } from '@tauri-apps/api/core';

/**
 * License tier levels
 */
export type LicenseTier = 'trial' | 'professional' | 'enterprise';

/**
 * Full license information
 */
export interface License {
  key: string;
  email: string | null;
  tier: LicenseTier;
  seats: number;
  validUntil: number | null;
  features: string[];
  activatedAt: number;
  machineId: string;
}

/**
 * License status with tier information
 */
export interface LicenseStatus {
  isActive: boolean;
  tier: LicenseTier;
  message: string;
  daysRemaining: number | null;
  maxProjects: number;
  maxScenesPerProject: number;
  canExport: boolean;
  canUseVr: boolean;
  hasCloudSync: boolean;
}

/**
 * Raw license from Rust backend (snake_case)
 */
interface RawLicense {
  key: string;
  email: string | null;
  tier: LicenseTier;
  seats: number;
  valid_until: number | null;
  features: string[];
  activated_at: number;
  machine_id: string;
}

/**
 * Transform raw license to camelCase
 */
function transformLicense(raw: RawLicense): License {
  return {
    key: raw.key,
    email: raw.email,
    tier: raw.tier,
    seats: raw.seats,
    validUntil: raw.valid_until,
    features: raw.features,
    activatedAt: raw.activated_at,
    machineId: raw.machine_id,
  };
}

/**
 * License service for managing app licensing
 */
export const licenseService = {
  /**
   * Get the currently stored license
   */
  async getLicense(): Promise<License | null> {
    const raw = await invoke<RawLicense | null>('get_license');
    return raw ? transformLicense(raw) : null;
  },

  /**
   * Get the current license status with all tier information
   */
  async getStatus(): Promise<LicenseStatus> {
    return invoke<LicenseStatus>('get_license_status');
  },

  /**
   * Activate a license key
   */
  async activate(key: string, email?: string): Promise<License> {
    const raw = await invoke<RawLicense>('activate_license', { key, email });
    return transformLicense(raw);
  },

  /**
   * Deactivate the current license
   */
  async deactivate(): Promise<void> {
    return invoke('deactivate_license');
  },

  /**
   * Check if a specific feature is available
   */
  async checkFeature(feature: string): Promise<boolean> {
    return invoke<boolean>('check_feature', { feature });
  },

  /**
   * Get the machine ID for this computer
   */
  async getMachineId(): Promise<string> {
    return invoke<string>('get_machine_id_cmd');
  },
};

/**
 * Format days remaining for display
 */
export function formatDaysRemaining(days: number | null): string {
  if (days === null) {
    return 'Perpetual';
  }
  if (days === 0) {
    return 'Expired';
  }
  if (days === 1) {
    return '1 day';
  }
  return `${days} days`;
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: LicenseTier): string {
  switch (tier) {
    case 'enterprise':
      return 'Enterprise';
    case 'professional':
      return 'Professional';
    case 'trial':
    default:
      return 'Trial';
  }
}

/**
 * Get tier color for UI
 */
export function getTierColor(tier: LicenseTier): string {
  switch (tier) {
    case 'enterprise':
      return 'text-purple-400';
    case 'professional':
      return 'text-blue-400';
    case 'trial':
    default:
      return 'text-gray-400';
  }
}
