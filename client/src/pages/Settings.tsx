import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Keyboard,
  Download,
  Info,
  RefreshCw,
  ExternalLink,
  Mail,
  Check,
  X,
  FolderOpen,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useLicenseStore } from '@/stores/licenseStore';
import {
  licenseService,
  formatDaysRemaining,
  getTierDisplayName,
} from '@/services/licenseService';

type SettingsPanel = 'general' | 'license' | 'shortcuts' | 'updates' | 'about';

const navItems: { id: SettingsPanel; label: string; icon: typeof SettingsIcon }[] = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'license', label: 'License', icon: ShieldCheck },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'updates', label: 'Updates', icon: Download },
  { id: 'about', label: 'About', icon: Info },
];

export function Settings() {
  const [activePanel, setActivePanel] = useState<SettingsPanel>('general');

  return (
    <div className="h-full flex flex-col overflow-hidden bg-base">
      {/* Page header */}
      <div className="px-6 py-4 flex-shrink-0">
        <h1 className="text-2xl font-semibold text-txt-primary">Settings</h1>
        <p className="text-xs text-txt-tertiary mt-1">Manage your app preferences and license</p>
      </div>

      {/* Settings layout: sub-nav + content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sub-navigation */}
        <nav className="w-[180px] flex-shrink-0 border-r border-border-subtle px-3 pt-1 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActivePanel(id)}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs transition-all ${
                activePanel === id
                  ? 'bg-accent-muted text-accent'
                  : 'text-txt-secondary hover:bg-hovr hover:text-txt-primary'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-7 py-5">
          {activePanel === 'general' && <GeneralPanel />}
          {activePanel === 'license' && <LicensePanel />}
          {activePanel === 'shortcuts' && <ShortcutsPanel />}
          {activePanel === 'updates' && <UpdatesPanel />}
          {activePanel === 'about' && <AboutPanel />}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   GENERAL
   ══════════════════════════════════════════════ */

function GeneralPanel() {
  const [antiAliasing, setAntiAliasing] = useState(true);
  const [showFps, setShowFps] = useState(false);
  const [invertY, setInvertY] = useState(false);

  return (
    <div className="max-w-xl space-y-0">
      {/* Appearance */}
      <SettingsSection title="Appearance" description="Customize how Ozone Studio looks." first>
        <SettingRow label="Theme" description="Choose the visual appearance of the app.">
          <SettingsSelect defaultValue="dark" options={['Dark', 'Light', 'System']} />
        </SettingRow>
        <SettingRow label="Accent color" description="Primary color used for highlights and interactive elements.">
          <SettingsSelect defaultValue="indigo" options={['Indigo', 'Blue', 'Purple', 'Teal', 'Orange']} />
        </SettingRow>
      </SettingsSection>

      {/* Performance */}
      <SettingsSection title="Performance" description="Adjust rendering and performance options.">
        <SettingRow label="Anti-aliasing" description="Smooth jagged edges in the 3D viewport. May impact performance.">
          <SettingsToggle checked={antiAliasing} onChange={setAntiAliasing} />
        </SettingRow>
        <SettingRow label="Shadow quality" description="Resolution of real-time shadows in scene editor.">
          <SettingsSelect defaultValue="medium" options={['Low (1024)', 'Medium (2048)', 'High (4096)']} />
        </SettingRow>
        <SettingRow label="Show FPS counter" description="Display performance stats in the viewport.">
          <SettingsToggle checked={showFps} onChange={setShowFps} />
        </SettingRow>
      </SettingsSection>

      {/* Controls */}
      <SettingsSection title="Controls" description="Adjust navigation and input settings.">
        <SettingRow label="Mouse sensitivity" description="Adjust look-around speed in first-person mode.">
          <SettingsSelect defaultValue="medium" options={['Low', 'Medium', 'High']} />
        </SettingRow>
        <SettingRow label="Invert Y axis" description="Reverse vertical mouse movement in viewport.">
          <SettingsToggle checked={invertY} onChange={setInvertY} />
        </SettingRow>
      </SettingsSection>

      {/* Data */}
      <SettingsSection title="Data" description="Manage your local data and storage.">
        <SettingRow label="Projects folder" description="Where project files are stored on disk.">
          <Button variant="secondary" size="sm">
            <FolderOpen size={13} />
            Choose
          </Button>
        </SettingRow>
        <SettingRow label="Clear material cache" description="Remove cached texture previews. They will regenerate when needed.">
          <button className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-medium bg-error/[0.12] text-error border border-error/20 hover:bg-error/20 transition-all">
            <Trash2 size={13} />
            Clear Cache
          </button>
        </SettingRow>
      </SettingsSection>
    </div>
  );
}

/* ══════════════════════════════════════════════
   LICENSE
   ══════════════════════════════════════════════ */

function LicensePanel() {
  const { license, status, isLoading, error, setLicense, setStatus, setLoading, setError } = useLicenseStore();
  const [licenseKey, setLicenseKey] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    loadLicenseStatus();
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

  const formatKey = (value: string): string => {
    const clean = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const parts = clean.match(/.{1,4}/g) || [];
    return parts.slice(0, 4).join('-');
  };

  const tierName = getTierDisplayName(status?.tier ?? 'trial');

  return (
    <div className="max-w-xl">
      <SettingsSection title="License" description="Manage your Ozone Studio license." first>
        {/* License card */}
        <div className="flex items-center gap-3.5 bg-raised border border-border rounded-lg p-4 mb-3">
          <div className="w-[42px] h-[42px] rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={20} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-txt-primary">{tierName}</p>
            <p className="text-[11px] text-txt-tertiary truncate">
              {license?.email ? `Licensed to ${license.email}` : 'No license activated'}
              {status?.daysRemaining != null && ` · ${formatDaysRemaining(status.daysRemaining)}`}
            </p>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0 ${
            status?.isActive
              ? 'bg-success/[0.12] text-success'
              : 'bg-warning/[0.12] text-warning'
          }`}>
            {status?.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* License key input */}
        <SettingRow label="License key" description="Your activation key for this installation.">
          <input
            type="text"
            value={license?.key || licenseKey}
            onChange={(e) => setLicenseKey(formatKey(e.target.value))}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            maxLength={19}
            readOnly={!!license}
            className="w-[260px] bg-raised text-txt-primary text-[11px] font-mono px-2.5 py-1.5 rounded border border-border-subtle focus:outline-none focus:border-border-focus placeholder:text-txt-tertiary transition-colors"
          />
        </SettingRow>

        {/* Activate / Deactivate */}
        {error && (
          <div className="bg-error/10 border border-error/30 text-error px-3 py-2 rounded text-xs mb-4">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 mt-1 mb-4">
          {license ? (
            <>
              <Button variant="secondary" size="sm" onClick={handleDeactivate} disabled={isLoading}>
                Deactivate
              </Button>
              <Button size="sm" disabled={isLoading}>Update Key</Button>
            </>
          ) : (
            <Button size="sm" onClick={handleActivate} disabled={isLoading || licenseKey.length < 19}>
              {isLoading ? 'Activating...' : 'Activate License'}
            </Button>
          )}
        </div>

        {/* Features list */}
        <div className="flex flex-col gap-px mt-3">
          {[
            { label: 'Unlimited projects', ok: true },
            { label: 'Export to standalone viewer', ok: true },
            { label: 'VR mode', ok: true },
            { label: 'Priority support', ok: true },
            { label: 'Team collaboration (Enterprise)', ok: false },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 py-1.5 text-xs text-txt-secondary">
              {f.ok ? (
                <Check size={14} className="text-success flex-shrink-0" />
              ) : (
                <X size={14} className="text-txt-tertiary opacity-40 flex-shrink-0" />
              )}
              <span className={f.ok ? '' : 'text-txt-tertiary'}>{f.label}</span>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SHORTCUTS
   ══════════════════════════════════════════════ */

const shortcutGroups = [
  {
    title: 'General',
    items: [
      { action: 'New project', keys: ['Ctrl', 'N'] },
      { action: 'Search', keys: ['/'] },
      { action: 'Settings', keys: ['Ctrl', ','] },
      { action: 'Toggle sidebar', keys: ['Ctrl', 'B'] },
    ],
  },
  {
    title: 'Scene Editor',
    items: [
      { action: 'Move tool', keys: ['W'] },
      { action: 'Rotate tool', keys: ['E'] },
      { action: 'Scale tool', keys: ['R'] },
      { action: 'First-person mode', keys: ['F'] },
      { action: 'Focus on selected', keys: ['.'] },
      { action: 'Delete selected', keys: ['Del'] },
      { action: 'Undo', keys: ['Ctrl', 'Z'] },
      { action: 'Redo', keys: ['Ctrl', 'Shift', 'Z'] },
    ],
  },
  {
    title: 'Panorama Viewer',
    items: [
      { action: 'Next panorama', keys: ['Ctrl', '\u2192'] },
      { action: 'Previous panorama', keys: ['Ctrl', '\u2190'] },
      { action: 'Toggle edit mode', keys: ['E'] },
      { action: 'Exit viewer', keys: ['Esc'] },
    ],
  },
];

function ShortcutsPanel() {
  return (
    <div className="max-w-xl">
      <SettingsSection title="Keyboard Shortcuts" description="Quick reference for keyboard controls." first>
        {shortcutGroups.map((group, gi) => (
          <div key={group.title} className={gi > 0 ? 'mt-5' : 'mt-2'}>
            <h4 className="text-[11px] font-semibold text-txt-tertiary uppercase tracking-wide mb-2">{group.title}</h4>
            <div className="space-y-0">
              {group.items.map((item) => (
                <div key={item.action} className="flex items-center justify-between py-1.5">
                  <span className="text-xs text-txt-secondary">{item.action}</span>
                  <div className="flex gap-0.5">
                    {item.keys.map((k, i) => (
                      <kbd
                        key={i}
                        className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-raised border border-border rounded text-[10px] font-mono text-txt-secondary"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </SettingsSection>
    </div>
  );
}

/* ══════════════════════════════════════════════
   UPDATES
   ══════════════════════════════════════════════ */

function UpdatesPanel() {
  const [currentVersion, setCurrentVersion] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    invoke<string>('get_current_version').then(setCurrentVersion);
  }, []);

  const checkForUpdates = async () => {
    setIsChecking(true);
    try {
      await invoke('check_for_updates');
      setLastChecked(new Date());
    } catch {
      // handled elsewhere
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="max-w-xl">
      <SettingsSection title="Updates" description="Keep Ozone Studio up to date." first>
        {/* Update card */}
        <div className="flex items-center justify-between gap-3.5 bg-raised border border-border rounded-lg px-4 py-3.5 mb-4">
          <div>
            <p className="text-xs font-medium text-txt-primary">Ozone Studio v{currentVersion || '...'}</p>
            <p className="text-[11px] text-txt-tertiary">
              <span className="text-success">Up to date</span>
              {lastChecked && ` · Last checked ${lastChecked.toLocaleTimeString()}`}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={checkForUpdates} disabled={isChecking}>
            <RefreshCw size={13} className={isChecking ? 'animate-spin' : ''} />
            Check
          </Button>
        </div>

        <SettingRow label="Auto-update" description="Automatically download and install updates when available.">
          <SettingsToggle checked={autoUpdate} onChange={setAutoUpdate} />
        </SettingRow>
        <SettingRow label="Update channel" description="Choose between stable releases or early access.">
          <SettingsSelect defaultValue="stable" options={['Stable', 'Beta']} />
        </SettingRow>
      </SettingsSection>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ABOUT
   ══════════════════════════════════════════════ */

function AboutPanel() {
  const [version, setVersion] = useState('');

  useEffect(() => {
    invoke<string>('get_current_version').then(setVersion);
  }, []);

  const aboutRows = [
    { label: 'Version', value: version || '...', mono: true },
    { label: 'Platform', value: 'Windows x64' },
    { label: 'Framework', value: 'Tauri 2.x + React 18' },
    { label: 'Renderer', value: 'Three.js r168' },
    { label: 'License', value: 'Professional' },
    { label: 'Data folder', value: '%APPDATA%\\ozone-studio', mono: true },
  ];

  return (
    <div className="max-w-xl">
      <SettingsSection title="About Ozone Studio" description="Virtual tour creation platform for professionals." first>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 mb-5">
          {aboutRows.map((row) => (
            <div key={row.label} className="contents text-xs">
              <span className="text-txt-tertiary py-0.5">{row.label}</span>
              <span className={`text-txt-secondary py-0.5 ${row.mono ? 'font-mono text-[11px]' : ''}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            <ExternalLink size={12} />
            Website
          </Button>
          <Button variant="secondary" size="sm">
            <Info size={12} />
            Documentation
          </Button>
          <Button variant="secondary" size="sm">
            <Mail size={12} />
            Contact Support
          </Button>
        </div>
      </SettingsSection>
    </div>
  );
}

/* ══════════════════════════════════════════════
   SHARED COMPONENTS
   ══════════════════════════════════════════════ */

function SettingsSection({
  title,
  description,
  first,
  children,
}: {
  title: string;
  description: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`py-5 ${first ? '' : 'border-t border-border-subtle'}`}>
      <h3 className="text-sm font-semibold text-txt-primary tracking-tight mb-1">{title}</h3>
      <p className="text-xs text-txt-tertiary mb-4 leading-relaxed">{description}</p>
      {children}
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 mb-4">
      <div className="min-w-0">
        <p className="text-xs font-medium text-txt-primary">{label}</p>
        <p className="text-[11px] text-txt-tertiary mt-0.5 leading-relaxed">{description}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SettingsToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-hovr'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-4' : ''
        }`}
      />
    </button>
  );
}

function SettingsSelect({ defaultValue, options }: { defaultValue: string; options: string[] }) {
  return (
    <select
      defaultValue={defaultValue}
      className="bg-raised text-txt-primary text-xs px-2.5 py-1.5 rounded border border-border-subtle focus:outline-none focus:border-border-focus cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt} value={opt.toLowerCase().split(' ')[0]}>
          {opt}
        </option>
      ))}
    </select>
  );
}
