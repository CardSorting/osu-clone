import { Vector2, HitObjectType, HitResult, HitResultType } from '../../shared/types/game';
import { HitObject } from './HitObject';

export class HitCircle extends HitObject {
  constructor(id: string, position: Vector2, time: number, approachRate: number) {
    super(id, position, time, approachRate);
    this.type = HitObjectType.CIRCLE;
  }

  clone(newPosition: Vector2, newTime: number): HitObject {
    const clonedCircle = new HitCircle(
      `${this.id}_clone_${Date.now()}`,
      newPosition,
      newTime,
      this.approachRate
    );
    
    // Copy other properties
    clonedCircle.radius = this.radius;
    clonedCircle.isHit = this.isHit;
    clonedCircle.hitTime = this.hitTime;
    
    return clonedCircle;
  }

  evaluate(clickTime: number, clickPosition: Vector2): HitResult {
    if (!this.isPointInside(clickPosition)) {
      return {
        type: HitResultType.MISS,
        points: 0,
        accuracy: 0,
        timestamp: clickTime
      };
    }

    const resultType = this.baseEvaluate(clickTime);
    this.isHit = resultType !== HitResultType.MISS;
    this.hitTime = clickTime;

    // Calculate points and accuracy based on result type
    let points = 0;
    let accuracy = 0;

    switch (resultType) {
      case HitResultType.PERFECT:
        points = 300;
        accuracy = 1;
        break;
      case HitResultType.GREAT:
        points = 100;
        accuracy = 0.66;
        break;
      case HitResultType.GOOD:
        points = 50;
        accuracy = 0.33;
        break;
      case HitResultType.BAD:
        points = 10;
        accuracy = 0.1;
        break;
      default:
        points = 0;
        accuracy = 0;
    }

    return {
      type: resultType,
      points,
      accuracy,
      timestamp: clickTime
    };
  }
}
