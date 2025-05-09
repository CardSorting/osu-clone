import { Beatmap, BeatmapMetadata, BeatmapDifficulty } from '../../domain/entities/Beatmap';
import { HitCircle } from '../../domain/entities/HitCircle';
import { HitObject } from '../../domain/entities/HitObject';
import { Vector2 } from '../../shared/types/game';

export class BeatmapRepository {
  private beatmaps: Map<string, Beatmap> = new Map();

  constructor() {
    // Initialize with some sample beatmaps
    this.initializeSampleBeatmaps();
  }

  async getById(id: string): Promise<Beatmap> {
    const beatmap = this.beatmaps.get(id);
    
    if (!beatmap) {
      throw new Error(`Beatmap with id ${id} not found`);
    }
    
    return beatmap;
  }

  async getAll(): Promise<Beatmap[]> {
    return Array.from(this.beatmaps.values());
  }

  async save(beatmap: Beatmap): Promise<void> {
    this.beatmaps.set(beatmap.id, beatmap);
  }

  private initializeSampleBeatmaps(): void {
    // Create a simple sample beatmap
    const sampleBeatmapId = 'sample-beatmap-1';
    const metadata: BeatmapMetadata = {
      id: sampleBeatmapId,
      title: 'Sample Song',
      artist: 'Sample Artist',
      creator: 'Sample Creator',
      version: 'Normal',
      audioFile: 'assets/audio/sample-song.mp3',
      backgroundImage: 'assets/images/sample-background.jpg',
      previewTime: 10000 // 10 seconds into the song
    };
    
    const difficulty: BeatmapDifficulty = {
      approachRate: 5,
      circleSize: 4,
      overallDifficulty: 5,
      healthDrain: 5,
      sliderMultiplier: 1.4,
      bpm: 120
    };
    
    // Create hit objects at specific times
    const hitObjects: HitObject[] = this.generateSampleHitObjects(difficulty.approachRate);
    
    // Create and store the beatmap
    const beatmap = new Beatmap(sampleBeatmapId, metadata, difficulty, hitObjects);
    this.beatmaps.set(sampleBeatmapId, beatmap);
    
    // Create another sample beatmap
    const sampleBeatmapId2 = 'sample-beatmap-2';
    const metadata2: BeatmapMetadata = {
      id: sampleBeatmapId2,
      title: 'Advanced Song',
      artist: 'Pro Artist',
      creator: 'Pro Creator',
      version: 'Hard',
      audioFile: 'assets/audio/advanced-song.mp3',
      backgroundImage: 'assets/images/advanced-background.jpg',
      previewTime: 15000 // 15 seconds into the song
    };
    
    const difficulty2: BeatmapDifficulty = {
      approachRate: 8,
      circleSize: 6,
      overallDifficulty: 7,
      healthDrain: 6,
      sliderMultiplier: 1.8,
      bpm: 160
    };
    
    // Create hit objects at specific times with higher density
    const hitObjects2: HitObject[] = this.generateSampleHitObjects(difficulty2.approachRate, 180);
    
    // Create and store the beatmap
    const beatmap2 = new Beatmap(sampleBeatmapId2, metadata2, difficulty2, hitObjects2);
    this.beatmaps.set(sampleBeatmapId2, beatmap2);
  }

  // Generate some sample hit objects for testing
  private generateSampleHitObjects(approachRate: number, density: number = 100): HitObject[] {
    const hitObjects: HitObject[] = [];
    const playFieldWidth = 512; // osu! standard playfield width
    const playFieldHeight = 384; // osu! standard playfield height
    
    // Generate objects across 30 seconds of gameplay
    let timeOffset = 1000; // Start 1 second in
    const endTime = 30000; // 30 seconds total
    
    while (timeOffset < endTime) {
      // Generate a random position within the playfield
      const position: Vector2 = {
        x: Math.random() * playFieldWidth,
        y: Math.random() * playFieldHeight
      };
      
      // Create a hit circle
      const hitCircle = new HitCircle(
        `circle_${timeOffset}`,
        position,
        timeOffset,
        approachRate
      );
      
      hitObjects.push(hitCircle);
      
      // Add time for the next object based on the density parameter
      // Lower density value means objects appear more frequently
      timeOffset += density + Math.random() * 100;
    }
    
    return hitObjects;
  }
}
