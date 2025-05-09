import { HitObject } from './HitObject';

export interface BeatmapMetadata {
  id: string;
  title: string;
  artist: string;
  creator: string;
  version: string;
  audioFile: string;
  backgroundImage?: string;
  previewTime: number; // Time in ms where the song preview starts
}

export interface BeatmapDifficulty {
  approachRate: number; // How fast circles approach (1-10)
  circleSize: number; // Size of circles (1-10, inversely related to radius)
  overallDifficulty: number; // Timing window difficulty (1-10)
  healthDrain: number; // Health drain rate (1-10)
  sliderMultiplier: number; // Base slider velocity
  bpm: number; // Beats per minute
}

export class Beatmap {
  private _id: string;
  private _metadata: BeatmapMetadata;
  private _difficulty: BeatmapDifficulty;
  private _hitObjects: HitObject[];
  private _totalNotes: number;
  private _maxScore: number;
  private _totalLength: number; // Length of the map in milliseconds

  constructor(
    id: string,
    metadata: BeatmapMetadata,
    difficulty: BeatmapDifficulty,
    hitObjects: HitObject[]
  ) {
    this._id = id;
    this._metadata = metadata;
    this._difficulty = difficulty;
    this._hitObjects = [...hitObjects].sort((a, b) => a.time - b.time); // Sort by time
    this._totalNotes = hitObjects.length;
    this._maxScore = this.calculateMaxScore();
    this._totalLength = this.calculateTotalLength();
  }

  get id(): string {
    return this._id;
  }

  get metadata(): BeatmapMetadata {
    return this._metadata;
  }

  get difficulty(): BeatmapDifficulty {
    return this._difficulty;
  }

  get hitObjects(): HitObject[] {
    return [...this._hitObjects]; // Return a copy to prevent direct modification
  }

  get totalNotes(): number {
    return this._totalNotes;
  }

  get maxScore(): number {
    return this._maxScore;
  }

  get totalLength(): number {
    return this._totalLength;
  }

  // Get hit objects occurring between startTime and endTime (inclusive)
  getHitObjectsInTimeRange(startTime: number, endTime: number): HitObject[] {
    return this._hitObjects.filter(
      obj => obj.time >= startTime && obj.time <= endTime
    );
  }

  // Get the next hit object after a given time
  getNextHitObjectAfterTime(time: number): HitObject | null {
    for (const hitObject of this._hitObjects) {
      if (hitObject.time > time) {
        return hitObject;
      }
    }
    return null; // No more hit objects
  }

  // Calculate the maximum possible score for this beatmap
  private calculateMaxScore(): number {
    // In osu!, max score calculation is complex, but this is a simplified version:
    // Each note is worth 300 points (perfect hit)
    return this._totalNotes * 300;
  }

  // Calculate the total length of the beatmap in milliseconds
  private calculateTotalLength(): number {
    if (this._hitObjects.length === 0) return 0;
    
    // Find the time of the last hit object
    const lastHitObjectTime = Math.max(
      ...this._hitObjects.map(obj => obj.time)
    );
    
    // Add some buffer time after the last hit object
    const bufferTime = 3000; // 3 seconds
    return lastHitObjectTime + bufferTime;
  }
}
