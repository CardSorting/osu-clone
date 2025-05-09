import { BeatmapPattern } from '../../domain/value-objects/BeatmapPattern';
import { HitCircle } from '../../domain/entities/HitCircle';
import { Vector2 } from '../../shared/types/game';

/**
 * Repository for storing and retrieving beatmap patterns
 * This follows the Repository pattern from DDD
 */
export class BeatmapPatternRepository {
  private patterns: Map<string, BeatmapPattern> = new Map();

  constructor() {
    // Initialize with some sample patterns
    this.initializeSamplePatterns();
  }

  /**
   * Get a pattern by ID
   * @param id Pattern ID
   * @returns The pattern or undefined if not found
   */
  async getById(id: string): Promise<BeatmapPattern | undefined> {
    return this.patterns.get(id);
  }

  /**
   * Get all patterns
   * @returns All patterns
   */
  async getAll(): Promise<BeatmapPattern[]> {
    return Array.from(this.patterns.values());
  }

  /**
   * Get patterns matching a set of tags
   * @param tags Tags to match
   * @param matchAll If true, all tags must match; if false, any tag can match
   * @returns Matching patterns
   */
  async getByTags(tags: string[], matchAll: boolean = false): Promise<BeatmapPattern[]> {
    if (tags.length === 0) {
      return this.getAll();
    }
    
    return Array.from(this.patterns.values()).filter(pattern => {
      if (matchAll) {
        // All tags must be present in the pattern
        return tags.every(tag => pattern.tags.includes(tag));
      } else {
        // Any tag can match
        return tags.some(tag => pattern.tags.includes(tag));
      }
    });
  }

  /**
   * Save a pattern
   * @param pattern Pattern to save
   */
  async save(pattern: BeatmapPattern): Promise<void> {
    this.patterns.set(pattern.id, pattern);
  }

  /**
   * Initialize with sample patterns
   * These serve as building blocks for beatmap generation
   */
  private initializeSamplePatterns(): void {
    // Create a simple stream pattern
    this.createStreamPattern();
    
    // Create a jump pattern
    this.createJumpPattern();
    
    // Create a zig-zag pattern
    this.createZigzagPattern();
    
    // Create a circular pattern
    this.createCircularPattern();
  }

  /**
   * Create a simple stream pattern
   * Stream patterns are sequences of closely spaced objects in a line
   */
  private createStreamPattern(): void {
    const id = 'pattern_stream';
    const hitObjects = [];
    const startPosition: Vector2 = { x: 100, y: 100 };
    const spacing = 30; // Spacing between objects
    const timeSpacing = 150; // Time between objects (ms)
    
    // Create 8 hit circles in a horizontal line
    for (let i = 0; i < 8; i++) {
      const position: Vector2 = {
        x: startPosition.x + (i * spacing),
        y: startPosition.y
      };
      
      const hitCircle = new HitCircle(
        `stream_circle_${i}`,
        position,
        i * timeSpacing,
        5 // Default approach rate
      );
      
      hitObjects.push(hitCircle);
    }
    
    const pattern = new BeatmapPattern(
      id,
      'Basic Stream',
      hitObjects,
      true, // Relative positions
      (8 - 1) * timeSpacing, // Pattern duration (objects - 1) * spacing
      ['stream', 'basic']
    );
    
    this.patterns.set(id, pattern);
  }

  /**
   * Create a jump pattern
   * Jump patterns involve large distances between consecutive objects
   */
  private createJumpPattern(): void {
    const id = 'pattern_jump';
    const hitObjects = [];
    const startPosition: Vector2 = { x: 100, y: 100 };
    const jumpDistance = 200; // Large distance between objects
    const timeSpacing = 350; // More time between objects for jumps
    
    // Create alternating jumps
    const positions = [
      { x: startPosition.x, y: startPosition.y },
      { x: startPosition.x + jumpDistance, y: startPosition.y },
      { x: startPosition.x, y: startPosition.y + jumpDistance },
      { x: startPosition.x + jumpDistance, y: startPosition.y + jumpDistance }
    ];
    
    for (let i = 0; i < positions.length; i++) {
      const hitCircle = new HitCircle(
        `jump_circle_${i}`,
        positions[i],
        i * timeSpacing,
        7 // Higher approach rate for jumps
      );
      
      hitObjects.push(hitCircle);
    }
    
    const pattern = new BeatmapPattern(
      id,
      'Square Jump Pattern',
      hitObjects,
      true, // Relative positions
      (positions.length - 1) * timeSpacing, // Pattern duration
      ['jump', 'square']
    );
    
    this.patterns.set(id, pattern);
  }

  /**
   * Create a zig-zag pattern
   * Zig-zag patterns involve consistent back-and-forth movements
   */
  private createZigzagPattern(): void {
    const id = 'pattern_zigzag';
    const hitObjects = [];
    const startPosition: Vector2 = { x: 100, y: 100 };
    const xSpacing = 50;
    const ySpacing = 30;
    const timeSpacing = 200;
    
    // Create zig-zag pattern
    for (let i = 0; i < 8; i++) {
      const position: Vector2 = {
        x: startPosition.x + (i * xSpacing),
        y: startPosition.y + (i % 2 === 0 ? 0 : ySpacing)
      };
      
      const hitCircle = new HitCircle(
        `zigzag_circle_${i}`,
        position,
        i * timeSpacing,
        6 // Medium approach rate
      );
      
      hitObjects.push(hitCircle);
    }
    
    const pattern = new BeatmapPattern(
      id,
      'Zig-Zag Pattern',
      hitObjects,
      true, // Relative positions
      (8 - 1) * timeSpacing, // Pattern duration
      ['zigzag', 'medium']
    );
    
    this.patterns.set(id, pattern);
  }

  /**
   * Create a circular pattern
   * Circular patterns arrange objects in a circle
   */
  private createCircularPattern(): void {
    const id = 'pattern_circular';
    const hitObjects = [];
    const centerPosition: Vector2 = { x: 150, y: 150 };
    const radius = 100;
    const objectCount = 8;
    const timeSpacing = 200;
    
    // Create objects in a circle
    for (let i = 0; i < objectCount; i++) {
      const angle = (i / objectCount) * Math.PI * 2;
      const position: Vector2 = {
        x: centerPosition.x + Math.cos(angle) * radius,
        y: centerPosition.y + Math.sin(angle) * radius
      };
      
      const hitCircle = new HitCircle(
        `circle_obj_${i}`,
        position,
        i * timeSpacing,
        5 // Default approach rate
      );
      
      hitObjects.push(hitCircle);
    }
    
    const pattern = new BeatmapPattern(
      id,
      'Circular Pattern',
      hitObjects,
      true, // Relative positions
      (objectCount - 1) * timeSpacing, // Pattern duration
      ['circular', 'advanced']
    );
    
    this.patterns.set(id, pattern);
  }
}
