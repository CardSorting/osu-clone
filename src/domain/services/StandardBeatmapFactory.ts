import { BaseBeatmapFactory } from './BeatmapFactory';
import { BeatmapDifficulty } from '../entities/Beatmap';
import { BeatmapTimingPoint } from '../value-objects/BeatmapTimingPoint';
import { HitObject } from '../entities/HitObject';
import { HitCircle } from '../entities/HitCircle';
import { BeatmapCreationParams } from './BeatmapFactory';
import { Vector2 } from '../../shared/types/game';

/**
 * Standard beatmap factory that generates a balanced distribution of hit objects
 * following a musical structure with basic rhythmic patterns
 */
export class StandardBeatmapFactory extends BaseBeatmapFactory {
  /**
   * Generate hit objects for a standard beatmap
   * @param params Creation parameters
   * @param difficulty Difficulty settings
   * @param timingPoints Timing points
   * @returns Array of hit objects
   */
  protected generateHitObjects(
    params: BeatmapCreationParams,
    difficulty: BeatmapDifficulty,
    timingPoints: BeatmapTimingPoint[]
  ): HitObject[] {
    const hitObjects: HitObject[] = [];
    const bpm = difficulty.bpm;
    const approachRate = difficulty.approachRate;
    const beatDuration = 60000 / bpm; // Duration of one beat in ms
    
    // Get total duration from params
    const totalDuration = params.duration;
    
    // Amount of spacing between objects
    // Higher difficulties have shorter spacing (more notes)
    const difficultyFactor = params.difficulty ? params.difficulty / 5 : 1; // Normalized to 1 at difficulty 5
    const baseSpacing = beatDuration;  // One note per beat by default
    let spacing = baseSpacing / difficultyFactor;
    
    // Ensure we don't go below a reasonable minimum spacing
    const minSpacing = 150; // 150ms minimum between notes
    spacing = Math.max(minSpacing, spacing);
    
    // Generate objects
    let currentTime = 1000; // Start 1 second into the song
    let lastPosition = this.generateRandomPosition();

    while (currentTime < totalDuration - 1000) { // End 1 second before the song ends
      // Generate a position that's not too close to the last one
      const minDistance = 50 + (difficultyFactor * 30); // Higher difficulty = larger jumps
      const maxDistance = 150 + (difficultyFactor * 50);
      let position = this.generateNextPosition(lastPosition, minDistance, maxDistance);
      
      // Create hit circle
      const hitCircle = new HitCircle(
        `circle_${currentTime}`,
        position,
        currentTime,
        approachRate
      );
      
      hitObjects.push(hitCircle);
      lastPosition = position;
      
      // Add some rhythmic variation occasionally
      if (Math.random() < 0.2) {
        // Sometimes add a half-beat note
        currentTime += spacing / 2;
        position = this.generateNextPosition(lastPosition, minDistance, maxDistance);
        
        const halfBeatCircle = new HitCircle(
          `circle_${currentTime}`,
          position,
          currentTime,
          approachRate
        );
        
        hitObjects.push(halfBeatCircle);
        lastPosition = position;
        
        // Then continue with normal rhythm
        currentTime += spacing / 2;
      } else {
        // Normal beat spacing
        currentTime += spacing;
      }
      
      // Occasionally add rhythmic breaks
      if (Math.random() < 0.1) {
        // Add an extra beat of rest
        currentTime += spacing;
      }
    }
    
    return hitObjects;
  }

  /**
   * Generate a new position that's within a certain distance range from the last position
   * @param lastPosition The last object's position
   * @param minDistance Minimum distance from last position
   * @param maxDistance Maximum distance from last position
   * @returns A new position
   */
  private generateNextPosition(
    lastPosition: Vector2,
    minDistance: number,
    maxDistance: number
  ): Vector2 {
    // Try up to 10 times to find a suitable position
    for (let i = 0; i < 10; i++) {
      const newPosition = this.generateRandomPosition();
      
      // Calculate distance from last position
      const dx = newPosition.x - lastPosition.x;
      const dy = newPosition.y - lastPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if it's within our desired range
      if (distance >= minDistance && distance <= maxDistance) {
        return newPosition;
      }
    }
    
    // If we couldn't find a good position, just return any random position
    return this.generateRandomPosition();
  }
}
