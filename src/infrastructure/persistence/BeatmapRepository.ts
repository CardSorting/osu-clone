import { Beatmap, BeatmapMetadata, BeatmapDifficulty } from '../../domain/entities/Beatmap';
import { HitCircle } from '../../domain/entities/HitCircle';
import { HitObject } from '../../domain/entities/HitObject';
import { Vector2 } from '../../shared/types/game';
import { StandardBeatmapFactory } from '../../domain/services/StandardBeatmapFactory';
import { TechnicalBeatmapFactory } from '../../domain/services/TechnicalBeatmapFactory';

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
    // Use the BeatmapCommands infrastructure to create demo beatmaps
    import('../../domain/services/StandardBeatmapFactory').then(({ StandardBeatmapFactory }) => {
      import('../../application/commands/BeatmapCommands').then(({ BeatmapFactoryResolver }) => {
        const factoryResolver = new BeatmapFactoryResolver();
        const standardFactory = new StandardBeatmapFactory();
        
        // Create a simple sample beatmap
        const beatmap1 = standardFactory.createBeatmap({
          id: 'sample-beatmap-1',
          title: 'Sample Song',
          artist: 'Sample Artist',
          creator: 'Sample Creator',
          difficulty: 5, // Medium difficulty
          duration: 30000, // 30 seconds
          bpm: 120,
          audioFile: 'assets/audio/sample-song.mp3',
          backgroundImage: 'assets/images/sample-background.jpg'
        });
        
        this.beatmaps.set(beatmap1.id, beatmap1);
        
        // Create a more advanced beatmap
        const beatmap2 = standardFactory.createBeatmap({
          id: 'sample-beatmap-2',
          title: 'Advanced Song',
          artist: 'Pro Artist',
          creator: 'Pro Creator',
          difficulty: 8, // Higher difficulty
          duration: 45000, // 45 seconds
          bpm: 160,
          audioFile: 'assets/audio/advanced-song.mp3',
          backgroundImage: 'assets/images/advanced-background.jpg'
        });
        
        this.beatmaps.set(beatmap2.id, beatmap2);
        
        // Create a technical beatmap with the TechnicalBeatmapFactory
        const technicalFactory = new TechnicalBeatmapFactory();
        const beatmap3 = technicalFactory.createBeatmap({
          id: 'sample-beatmap-3',
          title: 'Technical Rhythms',
          artist: 'Technical Master',
          creator: 'Tech Creator',
          difficulty: 9, // Higher difficulty
          duration: 60000, // 60 seconds
          bpm: 175,
          audioFile: 'assets/audio/technical-song.mp3',
          backgroundImage: 'assets/images/technical-background.jpg'
        });
        
        this.beatmaps.set(beatmap3.id, beatmap3);
      });
    });
  }

  /**
   * Create a new beatmap using the CQRS command pattern
   * @param params Creation parameters for the beatmap
   * @returns The created beatmap
   */
  async createDemoBeatmap(params: {
    title: string;
    artist: string;
    difficulty?: number;
    duration: number;
    style?: string;
    bpm?: number;
    audioFile?: string;
    backgroundImage?: string;
  }): Promise<Beatmap> {
    // Use the standard factory directly for simplicity
    // In a full implementation, you would use the CommandBus and CreateDemoBeatmapCommand
    const factory = new StandardBeatmapFactory();
    
    const beatmap = factory.createBeatmap({
      id: `beatmap_${Date.now()}`,
      title: params.title,
      artist: params.artist,
      difficulty: params.difficulty,
      duration: params.duration,
      bpm: params.bpm,
      audioFile: params.audioFile,
      backgroundImage: params.backgroundImage
    });
    
    // Save the beatmap
    await this.save(beatmap);
    
    return beatmap;
  }
}
