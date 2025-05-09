import { Command, CommandHandler } from './Command';
import { Beatmap } from '../../domain/entities/Beatmap';
import { BeatmapFactory } from '../../domain/services/BeatmapFactory';
import { StandardBeatmapFactory } from '../../domain/services/StandardBeatmapFactory';
import { TechnicalBeatmapFactory } from '../../domain/services/TechnicalBeatmapFactory';

/**
 * Beatmap factory resolver that returns the appropriate factory based on style
 */
export class BeatmapFactoryResolver {
  private factories: Map<string, BeatmapFactory> = new Map();
  
  constructor() {
    // Register available beatmap factories
    this.registerFactory('standard', new StandardBeatmapFactory());
    this.registerFactory('technical', new TechnicalBeatmapFactory());
    
    // Alternative names/aliases
    this.registerFactory('normal', new StandardBeatmapFactory());
    this.registerFactory('tech', new TechnicalBeatmapFactory());
    this.registerFactory('advanced', new TechnicalBeatmapFactory());
  }
  
  /**
   * Register a factory for a specific style
   * @param style The beatmap style
   * @param factory The factory to use for this style
   */
  registerFactory(style: string, factory: BeatmapFactory): void {
    this.factories.set(style.toLowerCase(), factory);
  }
  
  /**
   * Resolve the factory to use for a given style
   * @param style The beatmap style
   * @returns The factory to use
   */
  resolveFactory(style: string): BeatmapFactory {
    const factory = this.factories.get(style.toLowerCase());
    if (!factory) {
      // If no factory for this style, use the standard factory
      return this.factories.get('standard') || new StandardBeatmapFactory();
    }
    return factory;
  }
}

/**
 * Command to create a new demo beatmap
 */
export interface CreateDemoBeatmapCommand extends Command {
  type: 'CREATE_DEMO_BEATMAP';
  title: string;
  artist: string;
  difficulty?: number; // 1-10 scale
  duration: number; // in milliseconds
  style?: string; // beatmap style (standard, stream, technical, etc.)
  bpm?: number;
  audioFile?: string;
  backgroundImage?: string;
}

/**
 * Handler for the CreateDemoBeatmapCommand
 * Uses a factory to create a beatmap based on the requested style
 */
export class CreateDemoBeatmapCommandHandler implements CommandHandler<CreateDemoBeatmapCommand, Beatmap> {
  constructor(
    private beatmapFactoryResolver: BeatmapFactoryResolver,
    private beatmapRepository: { save: (beatmap: Beatmap) => Promise<void> }
  ) {}

  async execute(command: CreateDemoBeatmapCommand): Promise<Beatmap> {
    // 1. Resolve the appropriate factory based on style
    const style = command.style || 'standard';
    const factory = this.beatmapFactoryResolver.resolveFactory(style);
    
    // 2. Create beatmap using the factory
    const beatmap = factory.createBeatmap({
      title: command.title,
      artist: command.artist,
      difficulty: command.difficulty,
      duration: command.duration,
      bpm: command.bpm,
      audioFile: command.audioFile,
      backgroundImage: command.backgroundImage
    });
    
    // 3. Save to repository
    await this.beatmapRepository.save(beatmap);
    
    return beatmap;
  }
}

/**
 * Command to import a beatmap from an external source
 */
export interface ImportBeatmapCommand extends Command {
  type: 'IMPORT_BEATMAP';
  sourceFile: string; // Path to the beatmap file
}

/**
 * Handler for the ImportBeatmapCommand
 * Imports a beatmap from an external source
 */
export class ImportBeatmapCommandHandler implements CommandHandler<ImportBeatmapCommand, Beatmap> {
  constructor(
    private beatmapRepository: { save: (beatmap: Beatmap) => Promise<void> }
  ) {}

  async execute(command: ImportBeatmapCommand): Promise<Beatmap> {
    // In a real implementation, this would parse the beatmap file
    // For now, we'll just create a dummy beatmap
    
    // 1. Create a simple beatmap
    const beatmap = new StandardBeatmapFactory().createBeatmap({
      title: `Imported from ${command.sourceFile}`,
      artist: 'Unknown Artist',
      duration: 60000 // 1 minute dummy duration
    });
    
    // 2. Save to repository
    await this.beatmapRepository.save(beatmap);
    
    return beatmap;
  }
}
