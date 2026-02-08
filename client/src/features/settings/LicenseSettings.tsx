import { useState, useEffect } from 'react';
import { useLicenseStore } from '@/stores/licenseStore';
import {
  licenseService,
  formatDaysRemaining,
  getTierDisplayName,
  getTierColor,
} from '@/services/licenseService';

export function LicenseSettings() {
  const {
    license,
    status,
    isLoading,
    error,
    setLicense,
    setStatus,
    setLoading,
    setError,
  } = useLicenseStore();

  const [licenseKey, setLicenseKey] = useState('');
  const [email, setEmail] = useState('');
  const [machineId, setMachineId] = useState<string | null>(null);

  useEffect(() => {
    loadLicenseStatus();
    loadMachineId();
  }, []);

  const loadLicenseStatus = async () => {
    setLoading(true);
    try {
      const [lic, stat] = await Promise.all([
        licenseService.getLicense(),
        licenseService.getStatus(),
      ]);
      setLicense(lic);
      setStatus(stat);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load license');
    } finally {
      setLoading(false);
    }
  };

  const loadMachineId = async () => {
    try {
      const id = await licenseService.getMachineId();
      setMachineId(id);
    } catch {
      // Non-critical, ignore
    }
  };

  const handleActivate = async () => {
    if (!licenseKey) return;

    setLoading(true);
    setError(null);

    try {
      const newLicense = await licenseService.activate(licenseKey, email || undefined);
      setLicense(newLicense);
      const stat = await licenseService.getStatus();
      setStatus(stat);
      setLicenseKey('');
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Deactivate your license? You can reactivate it later.')) return;

    setLoading(true);
    try {
      await licenseService.deactivate();
      setLicense(null);
      const stat = await licenseService.getStatus();
      setStatus(stat);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deactivation failed');
    } finally {
      setLoading(false);
    }
  };

  const formatLicenseKey = (value: string): string => {
    // Remove non-alphanumeric characters and convert to uppercase
    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    // Split into groups of 4 and join with dashes
    const parts = clean.match(/.{1,4}/g) || [];
    return parts.slice(0, 4).join('-');
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLicenseKey(formatLicenseKey(e.target.value));
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <svg
          className="w-6 h-6 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-white">License</h2>
      </div>

      {/* Current Status */}
      <div className="mb-6 p-4 bg-gray-900 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400">Status</span>
          <div className="flex items-center gap-2">
            {status?.isActive ? (
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <span className={status?.isActive ? 'text-green-400' : 'text-yellow-400'}>
              {status?.message || 'Loading...'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400">Tier</span>
          <span className={`font-medium ${getTierColor(status?.tier ?? 'trial')}`}>
            {getTierDisplayName(status?.tier ?? 'trial')}
          </span>
        </div>

        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400">Days Remaining</span>
          <span className="text-white">
            {status ? formatDaysRemaining(status.daysRemaining) : '-'}
          </span>
        </div>

        {license && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs text-gray-500 font-mono mb-1">{license.key}</p>
            {license.email && (
              <p className="text-xs text-gray-500">{license.email}</p>
            )}
          </div>
        )}
      </div>

      {/* Activate License */}
      {!license && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">License Key</label>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
              <input
                type="text"
                value={licenseKey}
                onChange={handleKeyChange}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                maxLength={19}
                className="w-full bg-gray-700 text-white pl-11 pr-4 py-2.5 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-gray-700 text-white px-4 py-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleActivate}
            disabled={isLoading || !licenseKey || licenseKey.length < 19}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Activating...' : 'Activate License'}
          </button>
        </div>
      )}

      {/* Deactivate */}
      {license && (
        <button
          onClick={handleDeactivate}
          disabled={isLoading}
          className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white py-2.5 rounded-lg font-medium transition-colors mb-6"
        >
          {isLoading ? 'Deactivating...' : 'Deactivate License'}
        </button>
      )}

      {/* Feature Comparison */}
      <div className="pt-6 border-t border-gray-700">
        <h3 className="text-white font-medium mb-4">License Tiers</h3>

        <div className="space-y-4">
          {/* Trial */}
          <div className="p-3 bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 font-medium">Trial</span>
              <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">Free</span>
            </div>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>3 projects</li>
              <li>5 scenes per project</li>
              <li>14-day trial</li>
            </ul>
          </div>

          {/* Professional */}
          <div className="p-3 bg-gray-900 rounded-lg border border-blue-800/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-400 font-medium">Professional</span>
              <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">
                Recommended
              </span>
            </div>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>50 projects</li>
              <li>100 scenes per project</li>
              <li>Export feature</li>
              <li>VR mode</li>
            </ul>
          </div>

          {/* Enterprise */}
          <div className="p-3 bg-gray-900 rounded-lg border border-purple-800/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-400 font-medium">Enterprise</span>
              <span className="text-xs text-purple-400 bg-purple-900/30 px-2 py-1 rounded">
                Full Features
              </span>
            </div>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>Unlimited projects</li>
              <li>Unlimited scenes</li>
              <li>Cloud sync</li>
              <li>Priority support</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Machine ID (for support) */}
      {machineId && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Machine ID: <span className="font-mono">{machineId.substring(0, 16)}...</span>
          </p>
        </div>
      )}
    </div>
  );
}
