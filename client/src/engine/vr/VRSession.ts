import * as THREE from 'three';

export interface VRSessionConfig {
  referenceSpaceType: XRReferenceSpaceType;
  optionalFeatures?: string[];
  requiredFeatures?: string[];
}

const DEFAULT_CONFIG: VRSessionConfig = {
  referenceSpaceType: 'local-floor',
  optionalFeatures: ['hand-tracking', 'layers'],
  requiredFeatures: ['local-floor'],
};

export class VRSessionManager {
  private renderer: THREE.WebGLRenderer;
  private session: XRSession | null = null;
  private config: VRSessionConfig;

  private onSessionStart?: () => void;
  private onSessionEnd?: () => void;

  constructor(
    renderer: THREE.WebGLRenderer,
    config: Partial<VRSessionConfig> = {}
  ) {
    this.renderer = renderer;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async isSupported(): Promise<boolean> {
    if (!navigator.xr) return false;
    try {
      return await navigator.xr.isSessionSupported('immersive-vr');
    } catch {
      return false;
    }
  }

  async enterVR(): Promise<void> {
    if (!navigator.xr) {
      throw new Error('WebXR not supported');
    }

    if (this.session) {
      console.warn('VR session already active');
      return;
    }

    try {
      this.session = await navigator.xr.requestSession('immersive-vr', {
        optionalFeatures: this.config.optionalFeatures,
        requiredFeatures: this.config.requiredFeatures,
      });

      this.session.addEventListener('end', this.handleSessionEnd);

      await this.renderer.xr.setSession(this.session);
      this.renderer.xr.enabled = true;

      this.onSessionStart?.();
    } catch (error) {
      console.error('Failed to enter VR:', error);
      throw error;
    }
  }

  exitVR(): void {
    if (this.session) {
      this.session.end();
    }
  }

  private handleSessionEnd = (): void => {
    this.session = null;
    this.renderer.xr.enabled = false;
    this.onSessionEnd?.();
  };

  isInVR(): boolean {
    return this.session !== null;
  }

  setCallbacks(onStart?: () => void, onEnd?: () => void): void {
    this.onSessionStart = onStart;
    this.onSessionEnd = onEnd;
  }

  getSession(): XRSession | null {
    return this.session;
  }

  dispose(): void {
    this.exitVR();
  }
}
