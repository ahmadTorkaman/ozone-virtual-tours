import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useViewerStore } from '@/stores/viewerStore';
import { fetchManifest, resolveAssetUrl } from '@/services/assetLoader';
import { detectGpu, hasWebGLSupport } from '@/engine/gpuDetect';
import { Layout } from '@/components/Layout';
import { BrandingHeader } from '@/components/BrandingHeader';
import { LoadingScreen } from '@/components/LoadingScreen';

export function Lobby() {
  const manifest = useViewerStore((s) => s.manifest);
  const loading = useViewerStore((s) => s.manifestLoading);
  const error = useViewerStore((s) => s.manifestError);
  const setManifest = useViewerStore((s) => s.setManifest);
  const setManifestLoading = useViewerStore((s) => s.setManifestLoading);
  const setManifestError = useViewerStore((s) => s.setManifestError);
  const setGpuTier = useViewerStore((s) => s.setGpuTier);
  const setRendererMode = useViewerStore((s) => s.setRendererMode);

  useEffect(() => {
    // Check WebGL support
    if (!hasWebGLSupport()) {
      setManifestError('NO_WEBGL');
      return;
    }

    // Detect GPU and set default renderer
    const gpu = detectGpu();
    setGpuTier(gpu.tier);
    setRendererMode(gpu.tier === 'high' ? 'pathtracer' : 'pbr');

    // Fetch manifest
    setManifestLoading(true);
    fetchManifest()
      .then((m) => {
        if (m.scenes.length === 0 && m.panoramas.length === 0) {
          setManifestError('EMPTY_MANIFEST');
        } else {
          setManifest(m);
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'NETWORK_ERROR';
        setManifestError(msg);
      });
  }, []);

  if (loading) {
    return <LoadingScreen progress={30} message="Loading project..." />;
  }

  if (error) {
    return <ErrorScreen error={error} />;
  }

  if (!manifest) return null;

  const hasScenes = manifest.scenes.length > 0;
  const hasPanoramas = manifest.panoramas.length > 0;

  return (
    <Layout>
      <BrandingHeader branding={manifest.branding} />

      <div className="px-4 py-6 max-w-2xl mx-auto">
        {/* Project hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-txt-primary">
            {manifest.project.name}
          </h1>
          <p className="mt-1 text-sm text-txt-secondary">
            by {manifest.branding.firm_name}
          </p>
        </div>

        {/* Scene cards */}
        {hasScenes && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
              3D Scenes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {manifest.scenes.map((scene) => (
                <Link
                  key={scene.id}
                  to={`/scene/${scene.id}`}
                  className="group bg-raised rounded-lg border border-border overflow-hidden hover:border-accent/50 transition-colors"
                >
                  <div className="aspect-video bg-overlay relative overflow-hidden">
                    <img
                      src={resolveAssetUrl(scene.thumbnail)}
                      alt={scene.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="px-3 py-2.5">
                    <span className="text-sm font-medium text-txt-primary">
                      {scene.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Panorama cards */}
        {hasPanoramas && (
          <section>
            <h2 className="text-xs font-semibold text-txt-secondary uppercase tracking-wider mb-3">
              360 Panoramas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {manifest.panoramas.map((pano) => (
                <Link
                  key={pano.id}
                  to={`/panorama/${pano.id}`}
                  className="group bg-raised rounded-lg border border-border overflow-hidden hover:border-accent/50 transition-colors"
                >
                  <div className="aspect-video bg-overlay relative overflow-hidden">
                    <img
                      src={resolveAssetUrl(pano.thumbnail)}
                      alt={pano.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-[10px] font-semibold text-white">
                      360
                    </div>
                  </div>
                  <div className="px-3 py-2.5">
                    <span className="text-sm font-medium text-txt-primary">
                      {pano.name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}

function ErrorScreen({ error }: { error: string }) {
  const retry = () => window.location.reload();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred.';

  if (error === 'Missing ?base= parameter in URL') {
    title = 'Incomplete Link';
    message = 'This link appears to be incomplete. Please scan the QR code again or check the URL.';
  } else if (error === 'MANIFEST_NOT_FOUND') {
    title = 'Project Not Available';
    message = 'This project is no longer available or has been unpublished.';
  } else if (error === 'EMPTY_MANIFEST') {
    title = 'No Content';
    message = 'No published content yet. The designer has not added any scenes or panoramas.';
  } else if (error === 'NO_WEBGL') {
    title = 'Unsupported Browser';
    message = 'Your browser does not support 3D graphics. Please try Chrome, Firefox, or Safari.';
  } else if (error.startsWith('NETWORK_ERROR')) {
    title = 'Connection Error';
    message = 'Could not connect to the server. Please check your internet connection.';
  }

  return (
    <div className="min-h-[100dvh] bg-base flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-raised flex items-center justify-center mb-4">
        <span className="text-2xl">!</span>
      </div>
      <h1 className="text-xl font-semibold text-txt-primary mb-2">{title}</h1>
      <p className="text-sm text-txt-secondary max-w-xs mb-6">{message}</p>
      {error.startsWith('NETWORK_ERROR') && (
        <button
          onClick={retry}
          className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-md hover:bg-accent-hover transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
