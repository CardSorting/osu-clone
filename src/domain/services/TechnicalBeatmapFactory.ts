import { BaseBeatmapFactory } from './BeatmapFactory';
import { BeatmapDifficulty } from '../entities/Beatmap';
import { BeatmapTimingPoint } from '../value-objects/BeatmapTimingPoint';
import { HitObject } from '../entities/HitObject';
import { HitCircle } from '../entities/HitCircle';
import { BeatmapCreationParams } from './BeatmapFactory';
import { Vector2 } from '../../shared/types/game';

/**
 * Technical beatmap factory that generates complex rhythmic patterns and precise 
 * object placements with challenging patterns suitable for advanced players
 */
export class TechnicalBeatmapFactory extends BaseBeatmapFactory {
  /**
   * Generate hit objects for a technical beatmap
   * Technical beatmaps feature precise timing, complex rhythm patterns,
   * and emphasize reading and finger control skills
   * 
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
    
    // For technical maps, we want precise rhythmic patterns
    // with more complex timing and positioning
    
    // Generate objects
    let currentTime = 1000; // Start 1 second into the song
    
    // Generate several patterns across the map
    while (currentTime < totalDuration - 1000) {
      // Choose a pattern type for this section
      const patternType = this.choosePatternType();
      const patternDuration = 5000; // Each pattern lasts about 5 seconds
      
      // Generate hit objects for this pattern
      const patternObjects = this.generatePattern(
        patternType,
        currentTime,
        patternDuration,
        approachRate,
        difficulty
      );
      
      // Add objects to the full list
      hitObjects.push(...patternObjects);
      
      // Move to the next pattern
      currentTime += patternDuration;
      
      // Sometimes add a short break
      if (Math.random() < 0.3) {
        currentTime += beatDuration * 2; // 2-beat break
      }
    }
    
    return hitObjects;
  }

  /**
   * Choose a pattern type for variety
   * @returns A string identifying the pattern type
   */
  private choosePatternType(): string {
    const patternTypes = [
      'triplets',   // 1/3 rhythm
      'streams',    // Fast consecutive notes
      'stacks',     // Objects on the same spot with tight timing
      'polyrhythm', // Mixed rhythms
      'tech'        // Technical patterns with precise jumps
    ];
    
    // Select a random pattern type
    return patternTypes[Math.floor(Math.random() * patternTypes.length)];
  }

  /**
   * Generate a specific pattern type
   * @param patternType The type of pattern to generate
   * @param startTime Starting time for the pattern
   * @param duration Duration of the pattern
   * @param approachRate Approach rate for the objects
   * @param difficulty Difficulty settings
   * @returns An array of hit objects for the pattern
   */
  private generatePattern(
    patternType: string,
    startTime: number,
    duration: number,
    approachRate: number,
    difficulty: BeatmapDifficulty
  ): HitObject[] {
    switch (patternType) {
      case 'triplets':
        return this.generateTripletPattern(startTime, duration, approachRate, difficulty);
      case 'streams':
        return this.generateStreamPattern(startTime, duration, approachRate, difficulty);
      case 'stacks':
        return this.generateStackPattern(startTime, duration, approachRate, difficulty);
      case 'polyrhythm':
        return this.generatePolyrhythmPattern(startTime, duration, approachRate, difficulty);
      case 'tech':
        return this.generateTechPattern(startTime, duration, approachRate, difficulty);
      default:
        return this.generateTechPattern(startTime, duration, approachRate, difficulty);
    }
  }

  /**
   * Generate a triplet rhythm pattern (1/3 divisions of beats)
   * @param startTime Starting time for the pattern
   * @param duration Duration of the pattern
   * @param approachRate Approach rate for the objects
   * @param difficulty Difficulty settings
   * @returns Array of hit objects in a triplet pattern
   */
  private generateTripletPattern(
    startTime: number,
    duration: number,
    approachRate: number,
    difficulty: BeatmapDifficulty
  ): HitObject[] {
    const hitObjects: HitObject[] = [];
    const bpm = difficulty.bpm;
    const beatDuration = 60000 / bpm;
    const tripletSpacing = beatDuration / 3; // Three notes per beat
    
    let currentTime = startTime;
    let lastPosition = this.generateRandomPosition();
    
    while (currentTime < startTime + duration) {
      // Three notes in a triplet
      for (let i = 0; i < 3; i++) {
        // Generate position with moderate jumps
        const position = this.generateNextPosition(lastPosition, 40, 80);
        
        const hitCircle = new HitCircle(
          `triplet_${currentTime}_${i}`,
          position,
          currentTime,
          approachRate
        );
        
        hitObjects.push(hitCircle);
        lastPosition = position;
        currentTime += tripletSpacing;
      }
      
      // Sometimes skip a beat for rhythmic interest
      if (Math.random() < 0.2) {
        currentTime += beatDuration;
      }
    }
    
    return hitObjects;
  }

  /**
   * Generate a stream pattern (fast consecutive notes)
   * @param startTime Starting time for the pattern
   * @param duration Duration of the pattern
   * @param approachRate Approach rate for the objects
   * @param difficulty Difficulty settings
   * @returns Array of hit objects in a stream pattern
   */
  private generateStreamPattern(
    startTime: number,
    duration: number,
    approachRate: number,
    difficulty: BeatmapDifficulty
  ): HitObject[] {
    const hitObjects: HitObject[] = [];
    const bpm = difficulty.bpm;
    
    // For technical difficulty, use 1/4 or 1/6 note spacing (depending on difficulty)
    const divisor = difficulty.overallDifficulty > 7 ? 6 : 4;
    const spacing = (60000 / bpm) / divisor;
    
    let currentTime = startTime;
    let lastPosition = this.generateRandomPosition();
    
    // Generate a curved path for the stream
    const centerX = this.playfieldWidth / 2;
    const centerY = this.playfieldHeight / 2;
    const radius = 150;
    
    let angle = Math.random() * Math.PI * 2; // Random starting angle
    const angleIncrement = (Math.PI * 2) / (duration / spacing * 0.7); // Complete about 0.7 circles
    
    while (currentTime < startTime + duration) {
      // Generate position along an arc
      const position: Vector2 = {
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      };
      
      // Clamp to the playfield
      position.x = Math.max(50, Math.min(this.playfieldWidth - 50, position.x));
      position.y = Math.max(50, Math.min(this.playfieldHeight - 50, position.y));
      
      const hitCircle = new HitCircle(
        `stream_${currentTime}`,
        position,
        currentTime,
        approachRate
      );
      
      hitObjects.push(hitCircle);
      
      // Update angle and time
      angle += angleIncrement;
      currentTime += spacing;
      
      // Occasional variation in timing for technical challenge
      if (Math.random() < 0.15) {
        currentTime += spacing / 2; // Add a small delay
      }
    }
    
    return hitObjects;
  }

  /**
   * Generate a stack pattern (objects on same position with different timing)
   * @param startTime Starting time for the pattern
   * @param duration Duration of the pattern
   * @param approachRate Approach rate for the objects
   * @param difficulty Difficulty settings
   * @returns Array of hit objects in a stack pattern
   */
  private generateStackPattern(
    startTime: number,
    duration: number,
    approachRate: number,
    difficulty: BeatmapDifficulty
  ): HitObject[] {
    const hitObjects: HitObject[] = [];
    const bpm = difficulty.bpm;
    const beatDuration = 60000 / bpm;
    
    // For stacks, we want fast consecutive objects at the same position
    const stackSpacing = beatDuration / 4; // 1/4 notes
    
    let currentTime = startTime;
    
    // Create several stacks throughout the pattern duration
    while (currentTime < startTime + duration) {
      // Generate a random position for this stack
      const stackPosition = this.generateRandomPosition();
      
      // Number of objects in this stack (2-5)
      const stackSize = 2 + Math.floor(Math.random() * 4);
      
      // Create the stack
      for (let i = 0; i < stackSize; i++) {
        const hitCircle = new HitCircle(
          `stack_${currentTime}_${i}`,
          stackPosition,
          currentTime,
          approachRate
        );
        
        hitObjects.push(hitCircle);
        currentTime += stackSpacing;
      }
      
      // Add a bigger gap between stacks
      currentTime += beatDuration * (1 + Math.random());
    }
    
    return hitObjects;
  }

  /**
   * Generate a polyrhythm pattern (mixed rhythms)
   * @param startTime Starting time for the pattern
   * @param duration Duration of the pattern
   * @param approachRate Approach rate for the objects
   * @param difficulty Difficulty settings
   * @returns Array of hit objects in a polyrhythm pattern
   */
  private generatePolyrhythmPattern(
    startTime: number,
    duration: number,
    approachRate: number,
    difficulty: BeatmapDifficulty
  ): HitObject[] {
    const hitObjects: HitObject[] = [];
    const bpm = difficulty.bpm;
    const beatDuration = 60000 / bpm;
    
    let currentTime = startTime;
    
    // Create a polyrhythm mixing different timing divisions
    while (currentTime < startTime + duration) {
      // Choose either duplets, triplets, or quadruplets
      const rhythmType = Math.floor(Math.random() * 3);
      let division: number;
      
      switch (rhythmType) {
        case 0: division = 2; break; // 1/2 notes
        case 1: division = 3; break; // 1/3 notes (triplets)
        case 2: division = 4; break; // 1/4 notes
        default: division = 2;
      }
      
      const rhythmSpacing = beatDuration / division;
      
      // Random position for the first note in the rhythm group
      let position = this.generateRandomPosition();
      
      // Create the rhythm group
      for (let i = 0; i < division; i++) {
        // Vary position slightly for each note in the group
        const newPosition: Vector2 = {
          x: position.x + (Math.random() * 40 - 20),
          y: position.y + (Math.random() * 40 - 20)
        };
        
        const hitCircle = new HitCircle(
          `poly_${currentTime}_${i}`,
          newPosition,
          currentTime,
          approachRate
        );
        
        hitObjects.push(hitCircle);
        currentTime += rhythmSpacing;
      }
      
      // Sometimes add a rest
      if (Math.random() < 0.3) {
        currentTime += beatDuration / 2;
      }
    }
    
    return hitObjects;
  }

  /**
   * Generate a technical pattern with precise jumps and timing
   * @param startTime Starting time for the pattern
   * @param duration Duration of the pattern
   * @param approachRate Approach rate for the objects
   * @param difficulty Difficulty settings
   * @returns Array of hit objects in a technical pattern
   */
  private generateTechPattern(
    startTime: number,
    duration: number,
    approachRate: number,
    difficulty: BeatmapDifficulty
  ): HitObject[] {
    const hitObjects: HitObject[] = [];
    const bpm = difficulty.bpm;
    const beatDuration = 60000 / bpm;
    
    let currentTime = startTime;
    let lastPosition = this.generateRandomPosition();
    
    // Create geometric patterns with varying rhythms
    while (currentTime < startTime + duration) {
      // Choose a basic shape (line, triangle, rectangle)
      const shapeType = Math.floor(Math.random() * 3);
      
      let shape: Vector2[] = [];
      
      switch (shapeType) {
        case 0: // Line
          shape = this.generateLinePoints(4, lastPosition);
          break;
        case 1: // Triangle
          shape = this.generateTrianglePoints(lastPosition);
          break;
        case 2: // Rectangle
          shape = this.generateRectanglePoints(lastPosition);
          break;
      }
      
      // Varying time spacing for technical challenge
      const divisors = [1, 1.5, 2, 3, 4];
      
      // Add objects for this shape
      for (let i = 0; i < shape.length; i++) {
        // Vary the rhythm
        const divisor = divisors[Math.floor(Math.random() * divisors.length)];
        const spacing = beatDuration / divisor;
        
        const hitCircle = new HitCircle(
          `tech_${currentTime}_${i}`,
          shape[i],
          currentTime,
          approachRate
        );
        
        hitObjects.push(hitCircle);
        currentTime += spacing;
        lastPosition = shape[i];
      }
      
      // Add a small break between shapes
      currentTime += beatDuration / 2;
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

  /**
   * Generate points in a straight line
   * @param pointCount Number of points to generate
   * @param startPosition Starting position
   * @returns Array of positions in a line
   */
  private generateLinePoints(pointCount: number, startPosition: Vector2): Vector2[] {
    const points: Vector2[] = [];
    
    // Random angle for the line
    const angle = Math.random() * Math.PI * 2;
    const distance = 70; // Distance between points
    
    for (let i = 0; i < pointCount; i++) {
      const position: Vector2 = {
        x: startPosition.x + Math.cos(angle) * distance * i,
        y: startPosition.y + Math.sin(angle) * distance * i
      };
      
      // Ensure we stay within the playfield
      position.x = Math.max(50, Math.min(this.playfieldWidth - 50, position.x));
      position.y = Math.max(50, Math.min(this.playfieldHeight - 50, position.y));
      
      points.push(position);
    }
    
    return points;
  }

  /**
   * Generate points in a triangle
   * @param startPosition Position near the triangle
   * @returns Array of positions in a triangle
   */
  private generateTrianglePoints(startPosition: Vector2): Vector2[] {
    const sideLength = 100 + Math.random() * 50;
    const centerX = startPosition.x;
    const centerY = startPosition.y;
    
    // Equilateral triangle points
    return [
      { x: centerX, y: centerY - sideLength * 0.866 }, // Top
      { x: centerX - sideLength / 2, y: centerY + sideLength * 0.433 }, // Bottom left
      { x: centerX + sideLength / 2, y: centerY + sideLength * 0.433 } // Bottom right
    ];
  }

  /**
   * Generate points in a rectangle
   * @param startPosition Position near the rectangle
   * @returns Array of positions in a rectangle
   */
  private generateRectanglePoints(startPosition: Vector2): Vector2[] {
    const width = 80 + Math.random() * 40;
    const height = 80 + Math.random() * 40;
    const centerX = startPosition.x;
    const centerY = startPosition.y;
    
    return [
      { x: centerX - width/2, y: centerY - height/2 }, // Top left
      { x: centerX + width/2, y: centerY - height/2 }, // Top right
      { x: centerX + width/2, y: centerY + height/2 }, // Bottom right
      { x: centerX - width/2, y: centerY + height/2 }  // Bottom left
    ];
  }
}
