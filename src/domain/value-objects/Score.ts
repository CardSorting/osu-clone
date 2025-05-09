import { HitResultType, Grade } from '../../shared/types/game';

export class Score {
  private _points: number = 0;
  private _maxCombo: number = 0;
  private _currentCombo: number = 0;
  private _hitResults: Map<HitResultType, number> = new Map([
    [HitResultType.MISS, 0],
    [HitResultType.BAD, 0],
    [HitResultType.GOOD, 0],
    [HitResultType.GREAT, 0],
    [HitResultType.PERFECT, 0]
  ]);
  private _totalHits: number = 0;
  private _totalPossibleHits: number;

  constructor(totalPossibleHits: number) {
    this._totalPossibleHits = totalPossibleHits;
  }

  get points(): number {
    return this._points;
  }

  get maxCombo(): number {
    return this._maxCombo;
  }

  get currentCombo(): number {
    return this._currentCombo;
  }

  get hitResults(): Map<HitResultType, number> {
    return new Map(this._hitResults);
  }

  get accuracy(): number {
    if (this._totalHits === 0) return 0;

    const weightedSum = 
      this._hitResults.get(HitResultType.PERFECT)! * 1.0 +
      this._hitResults.get(HitResultType.GREAT)! * 0.66 +
      this._hitResults.get(HitResultType.GOOD)! * 0.33 +
      this._hitResults.get(HitResultType.BAD)! * 0.1;
    
    return weightedSum / this._totalHits;
  }

  addResult(resultType: HitResultType, points: number): void {
    this._points += points;
    
    // Update hit results counter
    const currentCount = this._hitResults.get(resultType) || 0;
    this._hitResults.set(resultType, currentCount + 1);
    
    // Update combo
    if (resultType === HitResultType.MISS) {
      this._currentCombo = 0;
    } else {
      this._currentCombo++;
      if (this._currentCombo > this._maxCombo) {
        this._maxCombo = this._currentCombo;
      }
    }
    
    this._totalHits++;
  }

  calculateGrade(): Grade {
    const accuracy = this.accuracy;
    const perfectPercentage = (this._hitResults.get(HitResultType.PERFECT) || 0) / this._totalHits;
    const hasMisses = (this._hitResults.get(HitResultType.MISS) || 0) > 0;

    // SS: 100% accuracy
    if (accuracy >= 1.0) return Grade.SS;
    
    // S: >90% accuracy, >90% perfect hits, no misses
    if (accuracy >= 0.9 && perfectPercentage >= 0.9 && !hasMisses) return Grade.S;
    
    // A: >80% accuracy
    if (accuracy >= 0.8) return Grade.A;
    
    // B: >70% accuracy
    if (accuracy >= 0.7) return Grade.B;
    
    // C: >60% accuracy
    if (accuracy >= 0.6) return Grade.C;
    
    // D: >50% accuracy
    if (accuracy >= 0.5) return Grade.D;
    
    // F: <50% accuracy
    return Grade.F;
  }

  getCompletionRate(): number {
    return this._totalHits / this._totalPossibleHits;
  }
}
