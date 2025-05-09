import { Vector2, HitObjectType, HitResult, HitResultType } from '../../shared/types/game';

export abstract class HitObject {
  id: string;
  position: Vector2;
  time: number;
  type!: HitObjectType; // Will be set by subclasses, using ! to tell TypeScript this
  radius: number;
  defaultRadius = 54; // Default circle radius in osu!
  approachRate: number; // Determines how quickly the approach circle closes in
  isHit: boolean = false;
  hitTime: number | null = null;

  constructor(id: string, position: Vector2, time: number, approachRate: number) {
    this.id = id;
    this.position = position;
    this.time = time;
    this.approachRate = approachRate;
    this.radius = this.defaultRadius;
    // Type will be set by subclasses
  }

  /**
   * Create a clone of this hit object with a new position and/or time
   * @param newPosition New position for the cloned object
   * @param newTime New timestamp for the cloned object
   * @returns A new instance of the hit object
   */
  abstract clone(newPosition: Vector2, newTime: number): HitObject;

  // Calculate when the object should start appearing on screen
  getApproachTime(): number {
    // Convert AR to milliseconds (AR 5 is 1200ms, AR 10 is 450ms)
    const minTime = 450;
    const maxTime = 1800;
    const arRange = 10;
    return maxTime - ((this.approachRate / arRange) * (maxTime - minTime));
  }

  // Abstract method that must be implemented by specific hit objects
  abstract evaluate(clickTime: number, clickPosition: Vector2): HitResult;

  // Base evaluation logic shared across hit object types
  protected baseEvaluate(clickTime: number): HitResultType {
    const timeDiff = Math.abs(clickTime - this.time);
    
    // Time windows for different hit results (in ms)
    const perfectWindow = 16;
    const greatWindow = 64;
    const goodWindow = 127;
    const badWindow = 151;
    
    if (timeDiff <= perfectWindow) return HitResultType.PERFECT;
    if (timeDiff <= greatWindow) return HitResultType.GREAT;
    if (timeDiff <= goodWindow) return HitResultType.GOOD;
    if (timeDiff <= badWindow) return HitResultType.BAD;
    return HitResultType.MISS;
  }

  // Check if a click position is within the hit object's area
  isPointInside(point: Vector2): boolean {
    const dx = this.position.x - point.x;
    const dy = this.position.y - point.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }
}
