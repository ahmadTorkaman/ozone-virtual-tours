import { useEffect, useState } from 'react';
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface UpdateInfo {
  version: string;
  body?: string;
  date?: string;
}

interface DownloadProgress {
  downloaded: number;
  total: number | null;
}

export function UpdateChecker() {
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get current version
    invoke<string>('get_current_version').then(setCurrentVersion);

    // Listen for update events from backend (on startup check)
    const unlistenUpdate = listen<UpdateInfo>('update-available', (event) => {
      setUpdateAvailable(event.payload);
    });

    // Listen for download progress
    const unlistenProgress = listen<DownloadProgress>('update-download-progress', (event) => {
      setDownloadProgress(event.payload);
    });

    return () => {
      unlistenUpdate.then((fn) => fn());
      unlistenProgress.then((fn) => fn());
    };
  }, []);

  const checkForUpdates = async () => {
    setIsChecking(true);
    setError(null);

    try {
      const update = await invoke<UpdateInfo | null>('check_for_updates');
      setUpdateAvailable(update);
      if (!update) {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsChecking(false);
    }
  };

  const installUpdate = async () => {
    if (!updateAvailable) return;

    setIsInstalling(true);
    setDownloadProgress(null);
    setError(null);

    try {
      await invoke('install_update');
      // App will restart, so this code won't continue
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setIsInstalling(false);
      setDownloadProgress(null);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getProgressPercent = (): number => {
    if (!downloadProgress || !downloadProgress.total) return 0;
    return Math.round((downloadProgress.downloaded / downloadProgress.total) * 100);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-medium text-lg">Software Updates</h3>
          <p className="text-gray-400 text-sm mt-1">
            Current version: <span className="text-white font-mono">v{currentVersion}</span>
          </p>
        </div>
        <button
          onClick={checkForUpdates}
          disabled={isChecking || isInstalling}
          className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Check for updates"
        >
          <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
          <span className="text-sm">Check</span>
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm mb-4 p-3 bg-red-900/20 rounded-lg">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {updateAvailable ? (
        <div className="space-y-4">
          <div className="bg-primary-900/30 border border-primary-500/50 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary-500/20 p-2 rounded-full">
                <Download size={20} className="text-primary-400" />
              </div>
              <div className="flex-1">
                <p className="text-primary-300 font-medium">
                  Version {updateAvailable.version} available
                </p>
                {updateAvailable.body && (
                  <p className="text-gray-400 text-sm mt-2 whitespace-pre-wrap">
                    {updateAvailable.body}
                  </p>
                )}
                {updateAvailable.date && (
                  <p className="text-gray-500 text-xs mt-2">
                    Released: {new Date(updateAvailable.date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {isInstalling && downloadProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Downloading...</span>
                <span>
                  {formatBytes(downloadProgress.downloaded)}
                  {downloadProgress.total && ` / ${formatBytes(downloadProgress.total)}`}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary-500 h-full transition-all duration-300"
                  style={{ width: `${getProgressPercent()}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs text-center">
                {getProgressPercent()}% complete
              </p>
            </div>
          )}

          <button
            onClick={installUpdate}
            disabled={isInstalling}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {isInstalling ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                {downloadProgress ? 'Downloading...' : 'Installing...'}
              </>
            ) : (
              <>
                <Download size={18} />
                Download & Install Update
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-gray-400 p-4 bg-gray-700/50 rounded-lg">
          <CheckCircle size={20} className="text-green-400" />
          <span>You're running the latest version</span>
        </div>
      )}
    </div>
  );
}
