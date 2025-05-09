import { Vector2, HitResult, HitResultType } from '../../shared/types/game';
import { Beatmap } from './Beatmap';
import { HitObject } from './HitObject';
import { Score } from '../value-objects/Score';

export enum GameState {
  READY = 'READY',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED'
}

export class GameSession {
  private _id: string;
  private _beatmap: Beatmap;
  private _score: Score;
  private _state: GameState;
  private _startTime: number | null = null;
  private _pausedAt: number | null = null;
  private _totalPausedTime: number = 0;
  private _processedHitObjects: Set<string> = new Set();
  private _missedHitObjects: Set<string> = new Set();

  constructor(id: string, beatmap: Beatmap) {
    this._id = id;
    this._beatmap = beatmap;
    this._score = new Score(beatmap.totalNotes);
    this._state = GameState.READY;
  }

  get id(): string {
    return this._id;
  }

  get beatmap(): Beatmap {
    return this._beatmap;
  }

  get score(): Score {
    return this._score;
  }

  get state(): GameState {
    return this._state;
  }

  // Start the game session
  start(timestamp: number): void {
    if (this._state !== GameState.READY && this._state !== GameState.PAUSED) {
      throw new Error(`Cannot start game from ${this._state} state`);
    }

    if (this._state === GameState.PAUSED) {
      // Resuming from pause
      if (this._pausedAt) {
        this._totalPausedTime += timestamp - this._pausedAt;
        this._pausedAt = null;
      }
    } else {
      // Starting new game
      this._startTime = timestamp;
    }

    this._state = GameState.PLAYING;
  }

  // Pause the game session
  pause(timestamp: number): void {
    if (this._state !== GameState.PLAYING) {
      throw new Error(`Cannot pause game from ${this._state} state`);
    }

    this._pausedAt = timestamp;
    this._state = GameState.PAUSED;
  }

  // End the game session
  end(): void {
    if (this._state === GameState.COMPLETED) {
      return; // Already completed
    }

    this._state = GameState.COMPLETED;
  }

  // Get the current game time in milliseconds
  getCurrentTime(timestamp: number): number {
    if (this._startTime === null) {
      return 0;
    }

    if (this._state === GameState.PAUSED && this._pausedAt) {
      return this._pausedAt - this._startTime - this._totalPausedTime;
    }

    return timestamp - this._startTime - this._totalPausedTime;
  }

  // Process a hit attempt by the player
  processHit(position: Vector2, timestamp: number): HitResult | null {
    if (this._state !== GameState.PLAYING) {
      return null;
    }

    const currentTime = this.getCurrentTime(timestamp);
    
    // Evaluation window for hit objects (ms)
    const hitWindow = 200;
    
    // Get hit objects within the evaluation window
    const relevantHitObjects = this._beatmap
      .getHitObjectsInTimeRange(currentTime - hitWindow, currentTime + hitWindow)
      .filter(obj => !this._processedHitObjects.has(obj.id));
    
    if (relevantHitObjects.length === 0) {
      return null;
    }
    
    // Find the closest hit object in time
    const closestHitObject = relevantHitObjects.reduce((closest, current) => {
      return Math.abs(current.time - currentTime) < Math.abs(closest.time - currentTime)
        ? current
        : closest;
    });
    
    // Evaluate the hit
    const result = closestHitObject.evaluate(currentTime, position);
    
    // Mark this hit object as processed
    this._processedHitObjects.add(closestHitObject.id);
    
    // Update score
    this._score.addResult(result.type, result.points);
    
    return result;
  }

  // Check for missed hit objects up to the current time
  checkForMissedObjects(timestamp: number): void {
    if (this._state !== GameState.PLAYING) {
      return;
    }

    const currentTime = this.getCurrentTime(timestamp);
    const missWindow = 200; // Window after which a note is considered missed
    
    const missedObjects = this._beatmap
      .getHitObjectsInTimeRange(0, currentTime - missWindow)
      .filter(obj => !this._processedHitObjects.has(obj.id) && 
                     !this._missedHitObjects.has(obj.id));
    
    for (const missedObj of missedObjects) {
      this._score.addResult(HitResultType.MISS, 0);
      this._missedHitObjects.add(missedObj.id);
    }
    
    // Check if all hit objects have been processed or missed
    if (this._processedHitObjects.size + this._missedHitObjects.size >= this._beatmap.totalNotes) {
      // Add a small delay before ending to allow for final animations
      setTimeout(() => {
        this.end();
      }, 1000);
    }
  }

  // Get active hit objects that should be visible at the current time
  getVisibleHitObjects(timestamp: number): HitObject[] {
    if (this._state !== GameState.PLAYING && this._state !== GameState.PAUSED) {
      return [];
    }

    const currentTime = this.getCurrentTime(timestamp);
    
    // Get the approach time of the first hit object to determine visibility window
    const approachTime = this._beatmap.hitObjects[0]?.getApproachTime() || 1200;
    
    // Get hit objects within the visibility window
    return this._beatmap
      .getHitObjectsInTimeRange(currentTime, currentTime + approachTime)
      .filter(obj => !this._processedHitObjects.has(obj.id) && 
                     !this._missedHitObjects.has(obj.id));
  }
}
