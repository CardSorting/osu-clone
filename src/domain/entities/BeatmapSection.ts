import { HitObject } from './HitObject';
import { BeatmapTimingPoint } from '../value-objects/BeatmapTimingPoint';

/**
 * Represents a logical section of a beatmap
 * This is an aggregate root that contains hit objects and timing points for a specific section
 */
export class BeatmapSection {
  constructor(
    private readonly _id: string,
    private readonly _name: string,
    private readonly _startTime: number,
    private readonly _endTime: number,
    private readonly _hitObjects: HitObject[],
    private readonly _timingPoints: BeatmapTimingPoint[] = [],
    private readonly _difficulty: number = 0, // Section-specific difficulty rating
    private readonly _tags: string[] = []
  ) {}

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get startTime(): number {
    return this._startTime;
  }

  get endTime(): number {
    return this._endTime;
  }

  get duration(): number {
    return this._endTime - this._startTime;
  }

  get hitObjects(): HitObject[] {
    return [...this._hitObjects];
  }

  get timingPoints(): BeatmapTimingPoint[] {
    return [...this._timingPoints];
  }

  get difficulty(): number {
    return this._difficulty;
  }

  get tags(): string[] {
    return [...this._tags];
  }

  get objectDensity(): number {
    // Calculate objects per second
    const durationInSeconds = this.duration / 1000;
    return durationInSeconds > 0 ? this._hitObjects.length / durationInSeconds : 0;
  }

  /**
   * Get hit objects within a specified time range
   * @param startTime Start time in milliseconds (relative to section start)
   * @param endTime End time in milliseconds (relative to section start)
   * @returns Hit objects within the time range
   */
  getHitObjectsInTimeRange(startTime: number, endTime: number): HitObject[] {
    const absoluteStartTime = this._startTime + startTime;
    const absoluteEndTime = this._startTime + endTime;
    
    return this._hitObjects.filter(
      obj => obj.time >= absoluteStartTime && obj.time <= absoluteEndTime
    );
  }

  /**
   * Get timing point active at a specific time
   * @param time Time position in milliseconds
   * @returns The active timing point at this time, or undefined if none
   */
  getTimingPointAt(time: number): BeatmapTimingPoint | undefined {
    // Look for the most recent timing point before or at the specified time
    const absoluteTime = this._startTime + time;
    
    // Sort timing points in reverse chronological order
    const sortedTimingPoints = [...this._timingPoints].sort((a, b) => b.time - a.time);
    
    // Find the first timing point that is before or at the specified time
    return sortedTimingPoints.find(tp => tp.time <= absoluteTime);
  }

  /**
   * Create a new section with adjusted timing
   * @param newStartTime New start time for the section
   * @param speedMultiplier Factor to adjust timing (e.g., 0.5 = half speed, 2.0 = double speed)
   * @returns A new BeatmapSection with adjusted timing
   */
  withAdjustedTiming(newStartTime: number, speedMultiplier: number = 1.0): BeatmapSection {
    // Adjust object times
    const adjustedHitObjects = this._hitObjects.map(obj => {
      const relativeTime = obj.time - this._startTime;
      const newTime = newStartTime + (relativeTime / speedMultiplier);
      return obj.clone(obj.position, newTime);
    });
    
    // Adjust timing points
    const adjustedTimingPoints = this._timingPoints.map(tp => {
      const relativeTime = tp.time - this._startTime;
      const newTime = newStartTime + (relativeTime / speedMultiplier);
      
      // For timing points, we also need to adjust the BPM if speed is changed
      const adjustedBpm = tp.bpm * speedMultiplier;
      
      return tp.withChanges({
        time: newTime,
        bpm: adjustedBpm
      });
    });
    
    // Calculate new end time
    const newDuration = this.duration / speedMultiplier;
    const newEndTime = newStartTime + newDuration;
    
    return new BeatmapSection(
      `${this._id}_adjusted`,
      this._name,
      newStartTime,
      newEndTime,
      adjustedHitObjects,
      adjustedTimingPoints,
      this._difficulty,
      [...this._tags, `speed_${speedMultiplier}`]
    );
  }
}
