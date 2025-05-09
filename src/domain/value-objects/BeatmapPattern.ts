import { Vector2 } from '../../shared/types/game';
import { HitObject } from '../entities/HitObject';

/**
 * Represents a pattern of hit objects that can be reused in different parts of a beatmap
 * This is a Value Object as defined in DDD - immutable and identified by its attributes
 */
export class BeatmapPattern {
  constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _hitObjects: HitObject[],
    private readonly _relativePositions: boolean = true, // If true, positions are relative to pattern start
    private readonly _patternDuration: number, // Pattern duration in milliseconds
    private readonly _tags: string[] = [] // Descriptive tags for the pattern (e.g., "stream", "jump")
  ) {}

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get hitObjects(): HitObject[] {
    return [...this._hitObjects]; // Return a copy to prevent modification
  }

  get relativePositions(): boolean {
    return this._relativePositions;
  }

  get patternDuration(): number {
    return this._patternDuration;
  }

  get tags(): string[] {
    return [...this._tags];
  }

  /**
   * Apply this pattern at a specific point in time and position in a beatmap
   * @param startTime The starting time position (ms) to place this pattern
   * @param basePosition The base position to offset relative positions from
   * @param speedMultiplier Speed multiplier (affects timing between objects)
   * @param scaleMultiplier Scale multiplier (affects size and distances)
   * @returns New hit objects for the pattern instance
   */
  applyPattern(
    startTime: number,
    basePosition: Vector2,
    speedMultiplier: number = 1.0,
    scaleMultiplier: number = 1.0
  ): HitObject[] {
    // Create new hit objects based on the pattern, but at the new position and time
    return this._hitObjects.map(originalObj => {
      // Calculate the new time based on the relative time within the pattern
      const relativeTime = originalObj.time - this._hitObjects[0].time;
      const newTime = startTime + (relativeTime * (1 / speedMultiplier));
      
      // Calculate the new position
      let newPosition: Vector2;
      if (this._relativePositions) {
        // Apply position relative to base position
        newPosition = {
          x: basePosition.x + (originalObj.position.x * scaleMultiplier),
          y: basePosition.y + (originalObj.position.y * scaleMultiplier)
        };
      } else {
        // Use absolute positions but apply scaling
        newPosition = {
          x: originalObj.position.x * scaleMultiplier,
          y: originalObj.position.y * scaleMultiplier
        };
      }
      
      // Clone the hit object with the new position and time
      // We're using a simplified approach here as the actual implementation
      // would depend on how HitObject subclasses handle cloning
      return originalObj.clone(newPosition, newTime);
    });
  }

  /**
   * Create a mirror of this pattern along the X or Y axis
   * @param axis The axis to mirror on ('x' or 'y')
   * @param playfieldWidth The width of the playfield
   * @param playfieldHeight The height of the playfield
   * @returns A new BeatmapPattern that is mirrored
   */
  createMirrored(
    axis: 'x' | 'y',
    playfieldWidth: number = 512,
    playfieldHeight: number = 384
  ): BeatmapPattern {
    const mirroredObjects = this._hitObjects.map(obj => {
      let newPosition: Vector2;
      
      if (axis === 'x') {
        // Mirror horizontally
        newPosition = {
          x: playfieldWidth - obj.position.x,
          y: obj.position.y
        };
      } else {
        // Mirror vertically
        newPosition = {
          x: obj.position.x,
          y: playfieldHeight - obj.position.y
        };
      }
      
      return obj.clone(newPosition, obj.time);
    });
    
    return new BeatmapPattern(
      `${this._id}_mirrored_${axis}`,
      `${this._name} (Mirrored ${axis.toUpperCase()})`,
      mirroredObjects,
      this._relativePositions,
      this._patternDuration,
      [...this._tags, `mirrored_${axis}`]
    );
  }
}
