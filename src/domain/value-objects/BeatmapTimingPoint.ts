/**
 * Represents a timing point in a beatmap, which defines tempo and other timing-related properties
 * This is a Value Object as defined in DDD - immutable and identified by its attributes
 */
export class BeatmapTimingPoint {
  constructor(
    private readonly _time: number,  // Time position in milliseconds
    private readonly _bpm: number,   // Beats per minute
    private readonly _meter: number, // Time signature numerator (e.g., 4 for 4/4)
    private readonly _isInherited: boolean = false, // Whether this timing point inherits tempo
    private readonly _volume: number = 100, // Volume percentage (0-100)
    private readonly _velocityMultiplier: number = 1.0 // Affects slider velocity
  ) {}

  get time(): number {
    return this._time;
  }

  get bpm(): number {
    return this._bpm;
  }

  get meter(): number {
    return this._meter;
  }

  get isInherited(): boolean {
    return this._isInherited;
  }

  get volume(): number {
    return this._volume;
  }

  get velocityMultiplier(): number {
    return this._velocityMultiplier;
  }

  // Calculate milliseconds per beat for timing calculations
  get millisecondsPerBeat(): number {
    return 60000 / this._bpm;
  }

  // Create a copy with modified attributes
  withChanges(changes: Partial<{
    time: number;
    bpm: number;
    meter: number;
    isInherited: boolean;
    volume: number;
    velocityMultiplier: number;
  }>): BeatmapTimingPoint {
    return new BeatmapTimingPoint(
      changes.time ?? this._time,
      changes.bpm ?? this._bpm,
      changes.meter ?? this._meter,
      changes.isInherited ?? this._isInherited,
      changes.volume ?? this._volume,
      changes.velocityMultiplier ?? this._velocityMultiplier
    );
  }
}
