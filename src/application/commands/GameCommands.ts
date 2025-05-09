import { Command, CommandHandler } from './Command';
import { Vector2 } from '../../shared/types/game';
import { GameSession, GameState } from '../../domain/entities/GameSession';
import { Beatmap } from '../../domain/entities/Beatmap';

// Command to start a new game session with a specific beatmap
export interface StartGameCommand extends Command {
  type: 'START_GAME';
  beatmapId: string;
  timestamp: number;
}

// Command to process a hit attempt in the game
export interface ProcessHitCommand extends Command {
  type: 'PROCESS_HIT';
  position: Vector2;
  timestamp: number;
}

// Command to pause the current game
export interface PauseGameCommand extends Command {
  type: 'PAUSE_GAME';
  timestamp: number;
}

// Command to resume a paused game
export interface ResumeGameCommand extends Command {
  type: 'RESUME_GAME';
  timestamp: number;
}

// Command to end the current game
export interface EndGameCommand extends Command {
  type: 'END_GAME';
}

// Handler for StartGameCommand
export class StartGameCommandHandler implements CommandHandler<StartGameCommand, GameSession> {
  constructor(
    private beatmapRepository: { getById: (id: string) => Promise<Beatmap> },
    private gameSessionRepository: { save: (session: GameSession) => Promise<void> }
  ) {}

  async execute(command: StartGameCommand): Promise<GameSession> {
    // Get the beatmap from repository
    const beatmap = await this.beatmapRepository.getById(command.beatmapId);
    
    // Create a new game session
    const sessionId = `session_${Date.now()}`;
    const gameSession = new GameSession(sessionId, beatmap);
    
    // Start the game session with the provided timestamp
    gameSession.start(command.timestamp);
    
    // Save the game session
    await this.gameSessionRepository.save(gameSession);
    
    return gameSession;
  }
}

// Handler for ProcessHitCommand
export class ProcessHitCommandHandler implements CommandHandler<ProcessHitCommand, void> {
  constructor(
    private currentGameSession: () => GameSession
  ) {}

  async execute(command: ProcessHitCommand): Promise<void> {
    const gameSession = this.currentGameSession();
    
    if (gameSession.state !== GameState.PLAYING) {
      throw new Error('Cannot process hit when game is not in PLAYING state');
    }
    
    // Process the hit
    gameSession.processHit(command.position, command.timestamp);
    
    // Check for missed objects
    gameSession.checkForMissedObjects(command.timestamp);
  }
}

// Handler for PauseGameCommand
export class PauseGameCommandHandler implements CommandHandler<PauseGameCommand, void> {
  constructor(
    private currentGameSession: () => GameSession
  ) {}

  async execute(command: PauseGameCommand): Promise<void> {
    const gameSession = this.currentGameSession();
    gameSession.pause(command.timestamp);
  }
}

// Handler for ResumeGameCommand
export class ResumeGameCommandHandler implements CommandHandler<ResumeGameCommand, void> {
  constructor(
    private currentGameSession: () => GameSession
  ) {}

  async execute(command: ResumeGameCommand): Promise<void> {
    const gameSession = this.currentGameSession();
    gameSession.start(command.timestamp); // reusing start for resume
  }
}

// Handler for EndGameCommand
export class EndGameCommandHandler implements CommandHandler<EndGameCommand, void> {
  constructor(
    private currentGameSession: () => GameSession,
    private gameSessionRepository: { save: (session: GameSession) => Promise<void> }
  ) {}

  async execute(_command: EndGameCommand): Promise<void> {
    const gameSession = this.currentGameSession();
    gameSession.end();
    
    // Save the finalized game session
    await this.gameSessionRepository.save(gameSession);
  }
}
