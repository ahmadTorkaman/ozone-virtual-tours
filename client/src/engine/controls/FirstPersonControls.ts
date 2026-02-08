import * as THREE from 'three';

export interface FirstPersonControlsConfig {
  moveSpeed: number;
  lookSpeed: number;
  eyeHeight: number;
  enableCollision: boolean;
}

const DEFAULT_CONFIG: FirstPersonControlsConfig = {
  moveSpeed: 5,
  lookSpeed: 0.002,
  eyeHeight: 1.6,
  enableCollision: false, // Will be enabled in future phase
};

export class FirstPersonControls {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private config: FirstPersonControlsConfig;

  private euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();

  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private moveUp = false;
  private moveDown = false;

  private isLocked = false;
  private enabled = true;

  constructor(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement,
    config: Partial<FirstPersonControlsConfig> = {}
  ) {
    this.camera = camera;
    this.domElement = domElement;
    this.config = { ...DEFAULT_CONFIG, ...config };

    console.log('[FirstPersonControls] Initialized with domElement:', domElement);
    console.log('[FirstPersonControls] Camera position:', camera.position);

    this.bindEvents();
  }

  private bindEvents(): void {
    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  private onPointerLockChange = (): void => {
    this.isLocked = document.pointerLockElement === this.domElement;
    console.log('[FirstPersonControls] Pointer lock changed:', this.isLocked, 'domElement:', this.domElement, 'pointerLockElement:', document.pointerLockElement);
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    console.log('[FirstPersonControls] Key down:', event.code, 'enabled:', this.enabled, 'isLocked:', this.isLocked);
    if (!this.enabled || !this.isLocked) return;

    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = true;
        break;
      case 'Space':
        this.moveUp = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveDown = true;
        break;
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        this.moveForward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        this.moveBackward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        this.moveLeft = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        this.moveRight = false;
        break;
      case 'Space':
        this.moveUp = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveDown = false;
        break;
    }
  };

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.enabled || !this.isLocked) return;

    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;

    this.euler.setFromQuaternion(this.camera.quaternion);

    this.euler.y -= movementX * this.config.lookSpeed;
    this.euler.x -= movementY * this.config.lookSpeed;

    // Clamp vertical rotation
    this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

    this.camera.quaternion.setFromEuler(this.euler);
  };

  update(delta: number): void {
    if (!this.enabled) return;

    // Log movement state occasionally
    if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
      console.log('[FirstPersonControls] Moving - F:', this.moveForward, 'B:', this.moveBackward, 'L:', this.moveLeft, 'R:', this.moveRight);
    }

    const speed = this.config.moveSpeed * delta;

    this.velocity.x = 0;
    this.velocity.y = 0;
    this.velocity.z = 0;

    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.y = Number(this.moveUp) - Number(this.moveDown);
    this.direction.normalize();

    if (this.moveForward || this.moveBackward) {
      this.velocity.z -= this.direction.z * speed;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x += this.direction.x * speed;
    }
    if (this.moveUp || this.moveDown) {
      this.velocity.y += this.direction.y * speed;
    }

    // Move relative to camera orientation (horizontal plane only for XZ)
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

    this.camera.position.addScaledVector(forward, -this.velocity.z);
    this.camera.position.addScaledVector(right, this.velocity.x);
    this.camera.position.y += this.velocity.y;
  }

  setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y + this.config.eyeHeight, z);
  }

  setRotation(x: number, y: number, z: number): void {
    this.euler.set(x, y, z, 'YXZ');
    this.camera.quaternion.setFromEuler(this.euler);
  }

  lock(): void {
    this.domElement.requestPointerLock();
  }

  unlock(): void {
    document.exitPointerLock();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.moveForward = false;
      this.moveBackward = false;
      this.moveLeft = false;
      this.moveRight = false;
      this.moveUp = false;
      this.moveDown = false;
    }
  }

  getIsLocked(): boolean {
    return this.isLocked;
  }

  dispose(): void {
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
  }
}
