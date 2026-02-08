import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/examples/jsm/webxr/XRControllerModelFactory.js';

export type LocomotionMode = 'teleport' | 'smooth' | 'none';

export interface VRControlsConfig {
  locomotionMode: LocomotionMode;
  smoothSpeed: number;
  snapTurnAngle: number;
  teleportDistance: number;
}

const DEFAULT_CONFIG: VRControlsConfig = {
  locomotionMode: 'teleport',
  smoothSpeed: 3,
  snapTurnAngle: 45,
  teleportDistance: 10,
};

export class VRControls {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private cameraGroup: THREE.Group;
  private config: VRControlsConfig;

  private controllers: THREE.XRTargetRaySpace[] = [];
  private controllerGrips: THREE.XRGripSpace[] = [];
  private raycaster = new THREE.Raycaster();

  private teleportMarker: THREE.Mesh | null = null;
  private teleportLine: THREE.Line | null = null;
  private teleportTarget: THREE.Vector3 | null = null;
  private isTeleportAiming = false;

  private lastSnapTurnTime = 0;
  private snapTurnCooldown = 300; // ms between snap turns

  private onSelectStart?: (controller: THREE.XRTargetRaySpace, intersection?: THREE.Intersection) => void;
  private onSelectEnd?: (controller: THREE.XRTargetRaySpace) => void;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    cameraGroup: THREE.Group,
    config: Partial<VRControlsConfig> = {}
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.cameraGroup = cameraGroup;
    this.config = { ...DEFAULT_CONFIG, ...config };

    this.setupControllers();
    this.setupTeleportVisuals();
  }

  private setupControllers(): void {
    const controllerModelFactory = new XRControllerModelFactory();

    for (let i = 0; i < 2; i++) {
      // Controller ray
      const controller = this.renderer.xr.getController(i);
      controller.addEventListener('selectstart', this.onControllerSelectStart);
      controller.addEventListener('selectend', this.onControllerSelectEnd);
      this.cameraGroup.add(controller);
      this.controllers.push(controller);

      // Controller model
      const grip = this.renderer.xr.getControllerGrip(i);
      grip.add(controllerModelFactory.createControllerModel(grip));
      this.cameraGroup.add(grip);
      this.controllerGrips.push(grip);

      // Ray visual
      const rayGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1),
      ]);
      const rayMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
      const ray = new THREE.Line(rayGeometry, rayMaterial);
      ray.scale.z = 5;
      controller.add(ray);
    }
  }

  private setupTeleportVisuals(): void {
    // Teleport marker (ring on floor)
    const markerGeometry = new THREE.RingGeometry(0.15, 0.2, 32);
    markerGeometry.rotateX(-Math.PI / 2);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.8,
    });
    this.teleportMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    this.teleportMarker.visible = false;
    this.scene.add(this.teleportMarker);

    // Teleport arc line
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5,
    });
    this.teleportLine = new THREE.Line(lineGeometry, lineMaterial);
    this.teleportLine.visible = false;
    this.scene.add(this.teleportLine);
  }

  private onControllerSelectStart = (event: { target: THREE.XRTargetRaySpace }): void => {
    const controller = event.target;

    if (this.config.locomotionMode === 'teleport') {
      this.startTeleportAim();
    }

    const intersection = this.getControllerIntersection(controller);
    this.onSelectStart?.(controller, intersection);
  };

  private onControllerSelectEnd = (event: { target: THREE.XRTargetRaySpace }): void => {
    const controller = event.target;

    if (this.config.locomotionMode === 'teleport' && this.teleportTarget) {
      this.executeTeleport();
    }

    this.stopTeleportAim();
    this.onSelectEnd?.(controller);
  };

  private startTeleportAim(): void {
    this.isTeleportAiming = true;
    this.teleportMarker!.visible = true;
    this.teleportLine!.visible = true;
  }

  private stopTeleportAim(): void {
    this.isTeleportAiming = false;
    this.teleportMarker!.visible = false;
    this.teleportLine!.visible = false;
    this.teleportTarget = null;
  }

  private updateTeleportAim(controller: THREE.XRTargetRaySpace): void {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);

    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    // Find floor intersection (Y=0 is floor)
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();

    if (this.raycaster.ray.intersectPlane(floorPlane, intersection)) {
      const distance = intersection.distanceTo(this.raycaster.ray.origin);

      if (distance <= this.config.teleportDistance) {
        this.teleportTarget = intersection;
        this.teleportMarker!.position.copy(intersection);
        this.teleportMarker!.position.y = 0.01;

        const points = [
          this.raycaster.ray.origin.clone(),
          intersection.clone(),
        ];
        this.teleportLine!.geometry.setFromPoints(points);

        (this.teleportMarker!.material as THREE.MeshBasicMaterial).color.setHex(0x00ff00);
      } else {
        (this.teleportMarker!.material as THREE.MeshBasicMaterial).color.setHex(0xff0000);
        this.teleportTarget = null;
      }
    }
  }

  private executeTeleport(): void {
    if (this.teleportTarget) {
      const offset = new THREE.Vector3();
      offset.copy(this.camera.position);
      offset.y = 0;

      this.cameraGroup.position.copy(this.teleportTarget).sub(offset);
    }

    this.stopTeleportAim();
  }

  private getControllerIntersection(controller: THREE.XRTargetRaySpace): THREE.Intersection | undefined {
    const tempMatrix = new THREE.Matrix4();
    tempMatrix.identity().extractRotation(controller.matrixWorld);

    this.raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    this.raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    const intersects = this.raycaster.intersectObjects(this.scene.children, true);
    return intersects.find(i => i.object instanceof THREE.Mesh);
  }

  update(): void {
    // Update teleport aim
    if (this.isTeleportAiming) {
      // Use right controller for teleport by default
      const controller = this.controllers[1] || this.controllers[0];
      if (controller) {
        this.updateTeleportAim(controller);
      }
    }

    // Handle thumbstick input for smooth locomotion and snap turning
    const session = this.renderer.xr.getSession();
    if (session) {
      for (const source of session.inputSources) {
        if (source.gamepad) {
          const axes = source.gamepad.axes;

          // Left controller: smooth movement
          if (source.handedness === 'left' && axes.length >= 4 && this.config.locomotionMode === 'smooth') {
            const moveX = axes[2];
            const moveZ = axes[3];

            if (Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1) {
              const speed = this.config.smoothSpeed * 0.016; // Approximate 60fps delta
              const direction = new THREE.Vector3(moveX, 0, moveZ);
              direction.applyQuaternion(this.camera.quaternion);
              direction.y = 0;
              direction.normalize();

              this.cameraGroup.position.addScaledVector(direction, speed);
            }
          }

          // Right controller: snap turning
          if (source.handedness === 'right' && axes.length >= 4) {
            const turnX = axes[2];
            const now = performance.now();

            if (Math.abs(turnX) > 0.5 && now - this.lastSnapTurnTime > this.snapTurnCooldown) {
              const turnAngle = Math.sign(turnX) * THREE.MathUtils.degToRad(this.config.snapTurnAngle);
              this.cameraGroup.rotateY(-turnAngle);
              this.lastSnapTurnTime = now;
            }
          }
        }
      }
    }
  }

  setCallbacks(
    onSelectStart?: (controller: THREE.XRTargetRaySpace, intersection?: THREE.Intersection) => void,
    onSelectEnd?: (controller: THREE.XRTargetRaySpace) => void
  ): void {
    this.onSelectStart = onSelectStart;
    this.onSelectEnd = onSelectEnd;
  }

  setLocomotionMode(mode: LocomotionMode): void {
    this.config.locomotionMode = mode;
  }

  setSmoothSpeed(speed: number): void {
    this.config.smoothSpeed = speed;
  }

  setSnapTurnAngle(angle: number): void {
    this.config.snapTurnAngle = angle;
  }

  dispose(): void {
    for (const controller of this.controllers) {
      controller.removeEventListener('selectstart', this.onControllerSelectStart);
      controller.removeEventListener('selectend', this.onControllerSelectEnd);
      this.cameraGroup.remove(controller);
    }

    for (const grip of this.controllerGrips) {
      this.cameraGroup.remove(grip);
    }

    if (this.teleportMarker) {
      this.scene.remove(this.teleportMarker);
      this.teleportMarker.geometry.dispose();
      (this.teleportMarker.material as THREE.Material).dispose();
    }

    if (this.teleportLine) {
      this.scene.remove(this.teleportLine);
      this.teleportLine.geometry.dispose();
      (this.teleportLine.material as THREE.Material).dispose();
    }
  }
}
