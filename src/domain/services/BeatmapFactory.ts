import { Beatmap, BeatmapMetadata, BeatmapDifficulty } from '../entities/Beatmap';
import { BeatmapPattern } from '../value-objects/BeatmapPattern';
import { BeatmapTimingPoint } from '../value-objects/BeatmapTimingPoint';
import { HitObject } from '../entities/HitObject';
import { Vector2 } from '../../shared/types/game';

/**
 * Parameters for creating a beatmap
 */
export interface BeatmapCreationParams {
  id?: string;
  title: string;
  artist: string;
  creator?: string;
  version?: string;
  difficulty?: number; // 1-10 scale
  duration: number; // in milliseconds
  bpm?: number;
  audioFile?: string;
  backgroundImage?: string;
}

/**
 * Factory interface for creating beatmaps
 * Following the Factory pattern from DDD
 */
export interface BeatmapFactory {
  /**
   * Create a beatmap with the provided parameters
   * @param params Parameters for the beatmap
   * @returns A new Beatmap instance
   */
  createBeatmap(params: BeatmapCreationParams): Beatmap;
}

/**
 * Abstract base class for beatmap factories
 * Provides common functionality for different factory implementations
 */
export abstract class BaseBeatmapFactory implements BeatmapFactory {
  // Standard playfield dimensions
  protected readonly playfieldWidth = 512;
  protected readonly playfieldHeight = 384;
  
  // Default difficulty values if not specified
  protected readonly defaultApproachRate = 5;
  protected readonly defaultCircleSize = 4;
  protected readonly defaultOverallDifficulty = 5;
  protected readonly defaultHealthDrain = 5;
  protected readonly defaultBpm = 120;
  
  constructor(
    protected readonly creatorName: string = 'OSU Clone'
  ) {}

  /**
   * Create a beatmap with the provided parameters
   * Template method that defines the steps for creating a beatmap
   * @param params Parameters for the beatmap
   * @returns A new Beatmap instance
   */
  createBeatmap(params: BeatmapCreationParams): Beatmap {
    // 1. Generate ID if not provided
    const id = params.id ?? `beatmap_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // 2. Create metadata
    const metadata = this.createMetadata(id, params);
    
    // 3. Create difficulty settings based on requested difficulty level
    const difficulty = this.createDifficulty(params.difficulty ?? 5, params.bpm ?? this.defaultBpm);
    
    // 4. Create timing points
    const timingPoints = this.createTimingPoints(params);
    
    // 5. Generate hit objects
    const hitObjects = this.generateHitObjects(params, difficulty, timingPoints);
    
    // 6. Create and return the beatmap
    return new Beatmap(id, metadata, difficulty, hitObjects);
  }

  /**
   * Create metadata for the beatmap
   * @param id Beatmap ID
   * @param params Creation parameters
   * @returns Beatmap metadata
   */
  protected createMetadata(id: string, params: BeatmapCreationParams): BeatmapMetadata {
    return {
      id,
      title: params.title,
      artist: params.artist,
      creator: params.creator ?? this.creatorName,
      version: params.version ?? `v${params.difficulty ?? 5}`,
      audioFile: params.audioFile ?? `assets/audio/${id}.mp3`,
      backgroundImage: params.backgroundImage,
      previewTime: Math.floor(params.duration / 3) // Preview at 1/3 of the song
    };
  }

  /**
   * Create difficulty settings based on the desired difficulty level
   * @param difficultyLevel Difficulty level (1-10)
   * @param bpm Beats per minute
   * @returns Difficulty settings
   */
  protected createDifficulty(difficultyLevel: number, bpm: number): BeatmapDifficulty {
    // Clamp difficulty between 1-10
    const clampedDifficulty = Math.min(10, Math.max(1, difficultyLevel));
    
    // Scale approach rate, circle size, etc. based on difficulty
    const approachRate = this.scaleDifficultyValue(this.defaultApproachRate, clampedDifficulty);
    const circleSize = this.scaleDifficultyValue(this.defaultCircleSize, clampedDifficulty);
    const overallDifficulty = this.scaleDifficultyValue(this.defaultOverallDifficulty, clampedDifficulty);
    const healthDrain = this.scaleDifficultyValue(this.defaultHealthDrain, clampedDifficulty);
    
    // Higher difficulty can also mean faster sliders
    const sliderMultiplier = 1.0 + (clampedDifficulty / 20); // 1.05 to 1.5
    
    return {
      approachRate,
      circleSize,
      overallDifficulty,
      healthDrain,
      sliderMultiplier,
      bpm
    };
  }

  /**
   * Scale a difficulty value based on the overall difficulty level
   * @param baseValue Base value for the setting
   * @param difficultyLevel Difficulty level (1-10)
   * @returns Scaled value
   */
  protected scaleDifficultyValue(baseValue: number, difficultyLevel: number): number {
    // Difficulty 5 = baseValue
    // Difficulty 1 = baseValue * 0.7
    // Difficulty 10 = baseValue * 1.5
    const scaleFactor = 0.7 + (difficultyLevel / 10) * 0.8;
    return Math.min(10, Math.max(1, baseValue * scaleFactor));
  }

  /**
   * Create timing points for the beatmap
   * @param params Creation parameters
   * @returns Array of timing points
   */
  protected createTimingPoints(params: BeatmapCreationParams): BeatmapTimingPoint[] {
    // Basic implementation just creates a single timing point at the start
    const bpm = params.bpm ?? this.defaultBpm;
    
    return [
      new BeatmapTimingPoint(0, bpm, 4) // 4/4 time signature
    ];
  }

  /**
   * Generate hit objects for the beatmap
   * This is the main method that concrete factories must implement
   * @param params Creation parameters
   * @param difficulty Difficulty settings
   * @param timingPoints Timing points
   * @returns Array of hit objects
   */
  protected abstract generateHitObjects(
    params: BeatmapCreationParams,
    difficulty: BeatmapDifficulty,
    timingPoints: BeatmapTimingPoint[]
  ): HitObject[];

  /**
   * Helper method to generate a random position on the playfield
   * @param padding Padding from the edges
   * @returns Random position
   */
  protected generateRandomPosition(padding: number = 50): Vector2 {
    return {
      x: padding + Math.random() * (this.playfieldWidth - 2 * padding),
      y: padding + Math.random() * (this.playfieldHeight - 2 * padding)
    };
  }
}
