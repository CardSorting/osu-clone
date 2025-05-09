import * as THREE from 'three';
import { HitObject } from '../../domain/entities/HitObject';
import { HitObjectType, HitResultType, Vector2 } from '../../shared/types/game';

/**
 * ThreeJsRenderer handles the rendering of game objects using Three.js
 * It sets up the scene, camera, renderer and manages the animation loop
 */
export class ThreeJsRenderer {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private hitObjectMeshes: Map<string, THREE.Object3D> = new Map();
  private effectMeshes: Map<string, THREE.Object3D> = new Map();
  private animationFrameId: number | null = null;
  
  // Game area dimensions
  private readonly gameWidth = 512; // osu! standard playfield width
  private readonly gameHeight = 384; // osu! standard playfield height
  
  // Visual constants
  private readonly HIT_CIRCLE_COLOR = 0xff66ab;
  private readonly APPROACH_CIRCLE_COLOR = 0xffffff;
  private readonly BACKGROUND_COLOR = 0x111111;

  // Layer depths
  private readonly LAYER_BACKGROUND = 0;
  private readonly LAYER_HIT_OBJECTS = 5;
  private readonly LAYER_APPROACH_CIRCLES = 10;
  private readonly LAYER_EFFECTS = 15;
  private readonly LAYER_UI = 20;

  constructor(container: HTMLElement) {
    try {
      // Initialize clock for timing animations
      this.clock = new THREE.Clock();
      
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(this.BACKGROUND_COLOR);
      
      // Calculate aspect ratio and camera frustum
      const aspect = container.clientWidth / container.clientHeight;
      const frustumSize = this.gameHeight;
      
      // Create orthographic camera (2D view)
      this.camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        1,
        1000
      );
      this.camera.position.z = 100;
      
      // Initialize renderer with WebGL error handling
      try {
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(this.renderer.domElement);
      } catch (webglError) {
        console.error("WebGL renderer initialization failed:", webglError);
        // Create a fallback renderer (simple 2D canvas)
        const canvas = document.createElement('canvas');
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.backgroundColor = '#111111';
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillText('WebGL not available - Fallback mode', 10, 20);
        }
        
        // Use a dummy renderer
        this.renderer = {
          render: () => {},
          setSize: () => {},
          dispose: () => {},
          domElement: canvas
        } as unknown as THREE.WebGLRenderer;
      }
      
      // Setup initial scene
      this.setupScene();
      
      // Handle window resize
      window.addEventListener('resize', () => this.onWindowResize(container));
    } catch (error) {
      console.error("Error initializing Three.js renderer:", error);
      // Create a minimal renderer to prevent further errors
      this.scene = new THREE.Scene();
      this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 1000);
      this.clock = new THREE.Clock();
      
      // Create a dummy renderer to prevent errors
      const canvas = document.createElement('canvas');
      container.appendChild(canvas);
      this.renderer = {
        render: () => {},
        setSize: () => {},
        dispose: () => {},
        domElement: canvas
      } as unknown as THREE.WebGLRenderer;
    }
  }

  /**
   * Set up the initial scene with any static elements
   */
  private setupScene(): void {
    // Add ambient light for basic illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Add directional light for some shadows/highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 0, 50);
    this.scene.add(directionalLight);
    
    // Add a subtle background grid (optional)
    this.addBackgroundGrid();
  }

  /**
   * Add a subtle grid to the background
   */
  private addBackgroundGrid(): void {
    const gridSize = Math.max(this.gameWidth, this.gameHeight) * 1.5;
    const gridDivisions = 20;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0x444444, 0x222222);
    gridHelper.rotation.x = Math.PI / 2; // Rotate to be flat (x-y plane)
    gridHelper.position.z = this.LAYER_BACKGROUND;
    this.scene.add(gridHelper);
  }

  /**
   * Handle window resize events
   */
  private onWindowResize(container: HTMLElement): void {
    const aspect = container.clientWidth / container.clientHeight;
    const frustumSize = this.gameHeight;
    
    this.camera.left = frustumSize * aspect / -2;
    this.camera.right = frustumSize * aspect / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
  }

  /**
   * Convert osu! coordinates to Three.js scene coordinates
   */
  private convertToSceneCoordinates(position: Vector2): THREE.Vector3 {
    // osu! has (0,0) at top-left, Three.js has (0,0) at center
    const x = position.x - this.gameWidth / 2;
    const y = this.gameHeight / 2 - position.y; // Invert Y
    
    return new THREE.Vector3(x, y, this.LAYER_HIT_OBJECTS);
  }

  /**
   * Start the animation loop
   */
  start(): void {
    if (this.animationFrameId !== null) return;
    
    this.clock.start();
    this.animate();
  }

  /**
   * Stop the animation loop
   */
  stop(): void {
    if (this.animationFrameId === null) return;
    
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = null;
    this.clock.stop();
  }

  /**
   * Animation loop
   */
  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate());
    
    // Update effects and animations
    this.updateEffects();
    
    // Render the scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Update animations for effects
   */
  private updateEffects(): void {
    const delta = this.clock.getDelta();
    
    // Update any effect objects that need animation
    this.effectMeshes.forEach((effect) => {
      if ('update' in effect && typeof effect.update === 'function') {
        effect.update(delta);
      }
    });
  }

  /**
   * Add hit objects to the scene
   */
  addHitObjects(hitObjects: HitObject[]): void {
    hitObjects.forEach(hitObject => this.addHitObject(hitObject));
  }

  /**
   * Add a single hit object to the scene
   */
  addHitObject(hitObject: HitObject): void {
    // If we already have this object, remove it first
    if (this.hitObjectMeshes.has(hitObject.id)) {
      this.removeHitObject(hitObject.id);
    }
    
    let mesh: THREE.Object3D;
    
    // Create appropriate mesh based on hit object type
    switch (hitObject.type) {
      case HitObjectType.CIRCLE:
        mesh = this.createCircleMesh(hitObject);
        break;
      case HitObjectType.SLIDER:
        // TODO: Implement slider visualization
        mesh = this.createPlaceholderMesh(hitObject);
        break;
      case HitObjectType.SPINNER:
        // TODO: Implement spinner visualization
        mesh = this.createPlaceholderMesh(hitObject);
        break;
      default:
        mesh = this.createPlaceholderMesh(hitObject);
    }
    
    // Add the mesh to the scene and store it
    this.scene.add(mesh);
    this.hitObjectMeshes.set(hitObject.id, mesh);
  }

  /**
   * Create a circle mesh for a hit circle
   */
  private createCircleMesh(hitObject: HitObject): THREE.Object3D {
    const group = new THREE.Group();
    const position = this.convertToSceneCoordinates(hitObject.position);
    group.position.copy(position);
    
    // Main hit circle
    const circleGeometry = new THREE.CircleGeometry(hitObject.radius, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({
      color: this.HIT_CIRCLE_COLOR,
      transparent: true,
      opacity: 0.9
    });
    const circle = new THREE.Mesh(circleGeometry, circleMaterial);
    circle.position.z = this.LAYER_HIT_OBJECTS;
    group.add(circle);
    
    // Circle border
    const ringGeometry = new THREE.RingGeometry(
      hitObject.radius - 2,
      hitObject.radius + 2,
      32
    );
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.z = this.LAYER_HIT_OBJECTS + 0.1;
    group.add(ring);
    
    // Approach circle
    const approachGeometry = new THREE.RingGeometry(
      hitObject.radius * 2.5,
      hitObject.radius * 2.5 + 2,
      32
    );
    const approachMaterial = new THREE.MeshBasicMaterial({
      color: this.APPROACH_CIRCLE_COLOR,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const approachCircle = new THREE.Mesh(approachGeometry, approachMaterial);
    approachCircle.position.z = this.LAYER_APPROACH_CIRCLES;
    
    // Custom update function for approach circle animation
    const approachTime = hitObject.getApproachTime();
    const startScale = 3.0;
    
    approachCircle.userData = {
      initialScale: startScale,
      approachTime,
      elapsedTime: 0,
      update: function(delta: number) {
        this.elapsedTime += delta * 1000;
        const progress = Math.min(this.elapsedTime / approachTime, 1);
        const scale = startScale - (startScale - 1) * progress;
        approachCircle.scale.set(scale, scale, 1);
        
        // When approach animation is complete, remove approach circle
        if (progress >= 1) {
          group.remove(approachCircle);
        }
      }
    };
    
    // Add the update function to the group for animation
    group.userData.update = function(delta: number) {
      if (approachCircle.parent) {
        approachCircle.userData.update(delta);
      }
    };
    
    group.add(approachCircle);
    
    return group;
  }

  /**
   * Create a placeholder mesh for unimplemented hit object types
   */
  private createPlaceholderMesh(hitObject: HitObject): THREE.Object3D {
    const position = this.convertToSceneCoordinates(hitObject.position);
    const geometry = new THREE.BoxGeometry(hitObject.radius * 2, hitObject.radius * 2, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.position.z = this.LAYER_HIT_OBJECTS;
    return mesh;
  }

  /**
   * Remove a hit object from the scene
   */
  removeHitObject(id: string): void {
    const mesh = this.hitObjectMeshes.get(id);
    if (mesh) {
      this.scene.remove(mesh);
      this.hitObjectMeshes.delete(id);
      this.disposeObject(mesh);
    }
  }

  /**
   * Show a hit result effect at the specified position
   */
  showHitResult(position: Vector2, resultType: HitResultType): void {
    const scenePosition = this.convertToSceneCoordinates(position);
    const effectId = `effect_${Date.now()}_${Math.random()}`;
    
    let effect: THREE.Object3D;
    
    switch (resultType) {
      case HitResultType.PERFECT:
        effect = this.createHitEffect(scenePosition, 0x66ffcc, 1.5);
        break;
      case HitResultType.GREAT:
        effect = this.createHitEffect(scenePosition, 0x66ccff, 1.3);
        break;
      case HitResultType.GOOD:
        effect = this.createHitEffect(scenePosition, 0xffcc66, 1.1);
        break;
      case HitResultType.BAD:
        effect = this.createHitEffect(scenePosition, 0xff6666, 0.9);
        break;
      case HitResultType.MISS:
        effect = this.createMissEffect(scenePosition);
        break;
      default:
        return;
    }
    
    // Add to scene and store
    this.scene.add(effect);
    this.effectMeshes.set(effectId, effect);
    
    // Set up removal of the effect after animation completes
    setTimeout(() => {
      if (this.effectMeshes.has(effectId)) {
        this.scene.remove(effect);
        this.effectMeshes.delete(effectId);
        this.disposeObject(effect);
      }
    }, 2000);
  }

  /**
   * Create a hit effect
   */
  private createHitEffect(position: THREE.Vector3, color: number, size: number): THREE.Object3D {
    const group = new THREE.Group();
    group.position.copy(position);
    group.position.z = this.LAYER_EFFECTS;
    
    // Inner burst
    const burstGeometry = new THREE.CircleGeometry(30 * size, 32);
    const burstMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.7
    });
    const burst = new THREE.Mesh(burstGeometry, burstMaterial);
    group.add(burst);
    
    // Ring effect
    const ringGeometry = new THREE.RingGeometry(40 * size, 42 * size, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    group.add(ring);
    
    // Animation
    const lifetime = 1.0;
    group.userData = {
      lifetime,
      elapsed: 0,
      update: function(delta: number) {
        this.elapsed += delta;
        const progress = this.elapsed / lifetime;
        
        // Scale up and fade out
        const scale = 1 + progress;
        group.scale.set(scale, scale, 1);
        
        // Adjust opacity
        burstMaterial.opacity = 0.7 * (1 - progress);
        ringMaterial.opacity = 0.5 * (1 - progress);
        
        // When animation is complete
        if (progress >= 1) {
          burstMaterial.opacity = 0;
          ringMaterial.opacity = 0;
        }
      }
    };
    
    return group;
  }

  /**
   * Create a miss effect
   */
  private createMissEffect(position: THREE.Vector3): THREE.Object3D {
    const group = new THREE.Group();
    group.position.copy(position);
    group.position.z = this.LAYER_EFFECTS;
    
    // X mark
    const material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8,
      linewidth: 3
    });
    
    const size = 30;
    
    // First line of X
    const line1Geometry = new THREE.BufferGeometry();
    line1Geometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([
        -size, -size, 0,
        size, size, 0
      ]), 3
    ));
    const line1 = new THREE.Line(line1Geometry, material);
    group.add(line1);
    
    // Second line of X
    const line2Geometry = new THREE.BufferGeometry();
    line2Geometry.setAttribute('position', new THREE.BufferAttribute(
      new Float32Array([
        -size, size, 0,
        size, -size, 0
      ]), 3
    ));
    const line2 = new THREE.Line(line2Geometry, material);
    group.add(line2);
    
    // Animation
    const lifetime = 1.0;
    group.userData = {
      lifetime,
      elapsed: 0,
      update: function(delta: number) {
        this.elapsed += delta;
        const progress = this.elapsed / lifetime;
        
        // Fade out
        material.opacity = 0.8 * (1 - progress);
        
        // When animation is complete
        if (progress >= 1) {
          material.opacity = 0;
        }
      }
    };
    
    return group;
  }

  /**
   * Clear the scene of all hit objects and effects
   */
  clear(): void {
    // Remove all hit objects
    this.hitObjectMeshes.forEach((mesh, id) => {
      this.scene.remove(mesh);
      this.disposeObject(mesh);
    });
    this.hitObjectMeshes.clear();
    
    // Remove all effects
    this.effectMeshes.forEach((mesh, id) => {
      this.scene.remove(mesh);
      this.disposeObject(mesh);
    });
    this.effectMeshes.clear();
  }

  /**
   * Dispose of a Three.js object to free memory
   */
  private disposeObject(object: THREE.Object3D): void {
    if (object instanceof THREE.Mesh) {
      if (object.geometry) {
        object.geometry.dispose();
      }
      
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    }
    
    // Recursively dispose of children
    while (object.children.length > 0) {
      this.disposeObject(object.children[0]);
      object.remove(object.children[0]);
    }
  }
}
