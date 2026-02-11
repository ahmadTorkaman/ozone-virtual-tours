declare module 'three-gpu-pathtracer' {
  import { WebGLRenderer, Scene, Camera } from 'three';

  export class WebGLPathTracer {
    constructor(renderer: WebGLRenderer);
    bounces: number;
    renderScale: number;
    setScene(scene: Scene, camera: Camera): void;
    renderSample(): void;
    dispose(): void;
  }
}
