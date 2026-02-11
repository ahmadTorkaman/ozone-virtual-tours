import type { Manifest } from '@/types/manifest';

let cachedBaseUrl: string | null = null;

export function getBaseUrl(): string {
  if (cachedBaseUrl) return cachedBaseUrl;

  const params = new URLSearchParams(window.location.search);
  const base = params.get('base');

  if (!base) {
    throw new Error('Missing ?base= parameter in URL');
  }

  // Remove trailing slash
  cachedBaseUrl = base.replace(/\/+$/, '');
  return cachedBaseUrl;
}

export function resolveAssetUrl(relativePath: string): string {
  const base = getBaseUrl();
  return `${base}/${relativePath}`;
}

export async function fetchManifest(): Promise<Manifest> {
  const url = resolveAssetUrl('manifest.json');
  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('MANIFEST_NOT_FOUND');
    }
    throw new Error(`NETWORK_ERROR: ${response.status}`);
  }

  const data = await response.json();
  return data as Manifest;
}
