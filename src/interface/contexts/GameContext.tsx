import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CommandBus } from '@/application/commands/Command';
import { QueryBus } from '@/application/queries/Query';
import { BeatmapRepository } from '@/infrastructure/persistence/BeatmapRepository';
import { GameSessionRepository } from '@/infrastructure/persistence/GameSessionRepository';
import { AudioService } from '@/infrastructure/audio/AudioService';
import { ThreeJsRenderer } from '@/infrastructure/rendering/ThreeJsRenderer';
import { InputHandler, InputEventType, InputEvent } from '@/infrastructure/input/InputHandler';
import { 
  StartGameCommandHandler, 
  ProcessHitCommandHandler,
  PauseGameCommandHandler,
  ResumeGameCommandHandler,
  EndGameCommandHandler
} from '@/application/commands/GameCommands';
import {
  GetAvailableBeatmapsQueryHandler,
  GetVisibleHitObjectsQueryHandler,
  GetGameSessionStatsQueryHandler
} from '@/application/queries/GameQueries';
import { Beatmap } from '@/domain/entities/Beatmap';
import { GameSession, GameState } from '@/domain/entities/GameSession';
import { HitObject } from '@/domain/entities/HitObject';
import { Vector2, HitResult } from '@/shared/types/game';

// Context state interface
interface GameContextState {
  isInitialized: boolean;
  isLoading: boolean;
  currentScreen: 'menu' | 'game' | 'results';
  availableBeatmaps: Beatmap[];
  selectedBeatmap: Beatmap | null;
  currentSession: GameSession | null;
  score: number;
  combo: number;
  accuracy: number;
}

// Context actions interface
interface GameContextActions {
  initialize: () => Promise<void>;
  loadBeatmaps: () => Promise<void>;
  selectBeatmap: (beatmapId: string) => Promise<void>;
  startGame: (beatmapId: string) => Promise<void>;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  goToMenu: () => void;
  goToResults: () => void;
}

// Combined context type
type GameContextType = {
  state: GameContextState;
  actions: GameContextActions;
};

// Create the context with default values
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Infrastructure services
  const beatmapRepositoryRef = useRef<BeatmapRepository | null>(null);
  const gameSessionRepositoryRef = useRef<GameSessionRepository | null>(null);
  const audioServiceRef = useRef<AudioService | null>(null);
  const rendererRef = useRef<ThreeJsRenderer | null>(null);
  const inputHandlerRef = useRef<InputHandler | null>(null);
  const commandBusRef = useRef<CommandBus | null>(null);
  const queryBusRef = useRef<QueryBus | null>(null);
  const gameContainerRef = useRef<HTMLDivElement | null>(null);

  // Animation frame ref for game loop
  const animationFrameRef = useRef<number | null>(null);

  // Context state
  const [state, setState] = useState<GameContextState>({
    isInitialized: false,
    isLoading: false,
    currentScreen: 'menu',
    availableBeatmaps: [],
    selectedBeatmap: null,
    currentSession: null,
    score: 0,
    combo: 0,
    accuracy: 0
  });

  // Initialize game systems
  const initialize = async (): Promise<void> => {
    if (state.isInitialized) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Create infrastructure components
      beatmapRepositoryRef.current = new BeatmapRepository();
      gameSessionRepositoryRef.current = new GameSessionRepository();
      audioServiceRef.current = new AudioService();
      
      // Command and query buses
      commandBusRef.current = new CommandBus();
      queryBusRef.current = new QueryBus();
      
      // Register command handlers
      if (commandBusRef.current && beatmapRepositoryRef.current && gameSessionRepositoryRef.current) {
        commandBusRef.current.registerHandler('START_GAME', new StartGameCommandHandler(
          beatmapRepositoryRef.current,
          gameSessionRepositoryRef.current
        ));
        
        commandBusRef.current.registerHandler('PROCESS_HIT', new ProcessHitCommandHandler(
          () => gameSessionRepositoryRef.current!.getCurrentSession()
        ));
        
        commandBusRef.current.registerHandler('PAUSE_GAME', new PauseGameCommandHandler(
          () => gameSessionRepositoryRef.current!.getCurrentSession()
        ));
        
        commandBusRef.current.registerHandler('RESUME_GAME', new ResumeGameCommandHandler(
          () => gameSessionRepositoryRef.current!.getCurrentSession()
        ));
        
        commandBusRef.current.registerHandler('END_GAME', new EndGameCommandHandler(
          () => gameSessionRepositoryRef.current!.getCurrentSession(),
          gameSessionRepositoryRef.current
        ));
      }
      
      // Register query handlers
      if (queryBusRef.current && beatmapRepositoryRef.current && gameSessionRepositoryRef.current) {
        queryBusRef.current.registerHandler('GET_AVAILABLE_BEATMAPS', new GetAvailableBeatmapsQueryHandler(
          beatmapRepositoryRef.current
        ));
        
        queryBusRef.current.registerHandler('GET_VISIBLE_HIT_OBJECTS', new GetVisibleHitObjectsQueryHandler(
          () => gameSessionRepositoryRef.current!.getCurrentSession()
        ));
        
        queryBusRef.current.registerHandler('GET_GAME_SESSION_STATS', new GetGameSessionStatsQueryHandler(
          () => gameSessionRepositoryRef.current!.getCurrentSession()
        ));
      }
      
      // Load available beatmaps
      await loadBeatmaps();
      
      setState(prev => ({ 
        ...prev, 
        isInitialized: true,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to initialize game systems:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Load available beatmaps
  const loadBeatmaps = async (): Promise<void> => {
    if (!beatmapRepositoryRef.current || !queryBusRef.current) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const beatmaps = await beatmapRepositoryRef.current.getAll();
      
      setState(prev => ({
        ...prev,
        availableBeatmaps: beatmaps,
        isLoading: false
      }));
    } catch (error) {
      console.error('Failed to load beatmaps:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Select a beatmap
  const selectBeatmap = async (beatmapId: string): Promise<void> => {
    if (!beatmapRepositoryRef.current) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const beatmap = await beatmapRepositoryRef.current.getById(beatmapId);
      
      setState(prev => ({
        ...prev,
        selectedBeatmap: beatmap,
        isLoading: false
      }));
    } catch (error) {
      console.error(`Failed to select beatmap ${beatmapId}:`, error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Start a new game with the selected beatmap
  const startGame = async (beatmapId: string): Promise<void> => {
    if (!commandBusRef.current || !gameSessionRepositoryRef.current || !audioServiceRef.current) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Initialize renderer if game container is available
      if (gameContainerRef.current && !rendererRef.current) {
        rendererRef.current = new ThreeJsRenderer(gameContainerRef.current);
      }
      
      // Initialize input handler
      if (gameContainerRef.current && !inputHandlerRef.current) {
        inputHandlerRef.current = new InputHandler(gameContainerRef.current);
        inputHandlerRef.current.on(InputEventType.CLICK, handleInputEvent);
      }
      
      // Start a new game session
      const gameSession = await commandBusRef.current.execute<
        { type: 'START_GAME', beatmapId: string, timestamp: number },
        GameSession
      >({
        type: 'START_GAME',
        beatmapId,
        timestamp: performance.now()
      });
      
      // Set as current session
      gameSessionRepositoryRef.current.setCurrentSession(gameSession);
      
      // Load audio
      await audioServiceRef.current.loadAudio(
        beatmapId,
        gameSession.beatmap.metadata.audioFile
      );
      
      // Start renderer and input handler
      if (rendererRef.current) rendererRef.current.start();
      if (inputHandlerRef.current) inputHandlerRef.current.enable();
      
      // Play audio
      audioServiceRef.current.play(beatmapId);
      
      // Start game loop
      startGameLoop();
      
      setState(prev => ({
        ...prev,
        currentSession: gameSession,
        currentScreen: 'game',
        isLoading: false,
        score: 0,
        combo: 0,
        accuracy: 0
      }));
    } catch (error) {
      console.error(`Failed to start game with beatmap ${beatmapId}:`, error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Handle input events from InputHandler
  const handleInputEvent = (event: InputEvent): void => {
    if (!commandBusRef.current || !gameSessionRepositoryRef.current) return;
    
    if (event.type === InputEventType.CLICK) {
      // Process hit attempt
      commandBusRef.current.execute({
        type: 'PROCESS_HIT',
        position: event.position || { x: 0, y: 0 }, // Default to center if no position
        timestamp: event.timestamp
      });
    }
  };

  // Start the game loop
  const startGameLoop = (): void => {
    if (animationFrameRef.current !== null) return;
    
    const gameLoop = (timestamp: number) => {
      updateGameState(timestamp);
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  // Stop the game loop
  const stopGameLoop = (): void => {
    if (animationFrameRef.current === null) return;
    
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  };

  // Update game state each frame
  const updateGameState = async (timestamp: number): Promise<void> => {
    if (!gameSessionRepositoryRef.current || !queryBusRef.current || !rendererRef.current) return;
    
    try {
      if (!gameSessionRepositoryRef.current.hasActiveSession()) return;
      
      const session = gameSessionRepositoryRef.current.getCurrentSession();
      
      // Check for completed game
      if (session.state === GameState.COMPLETED) {
        stopGameLoop();
        goToResults();
        return;
      }
      
      // Get visible hit objects
      const visibleHitObjects = await queryBusRef.current.execute<
        { type: 'GET_VISIBLE_HIT_OBJECTS', timestamp: number },
        HitObject[]
      >({
        type: 'GET_VISIBLE_HIT_OBJECTS',
        timestamp
      });
      
      // Update renderer with visible objects
      rendererRef.current.clear();
      rendererRef.current.addHitObjects(visibleHitObjects);
      
      // Check for missed objects
      session.checkForMissedObjects(timestamp);
      
      // Update game stats
      const stats = await queryBusRef.current.execute<
        { type: 'GET_GAME_SESSION_STATS' },
        { score: number, combo: number, accuracy: number }
      >({
        type: 'GET_GAME_SESSION_STATS'
      });
      
      setState(prev => ({
        ...prev,
        score: stats.score,
        combo: stats.combo,
        accuracy: stats.accuracy
      }));
    } catch (error) {
      console.error('Error in game loop:', error);
    }
  };

  // Pause the current game
  const pauseGame = (): void => {
    if (!commandBusRef.current || !audioServiceRef.current) return;
    
    if (state.currentSession) {
      const timestamp = performance.now();
      
      commandBusRef.current.execute({
        type: 'PAUSE_GAME',
        timestamp
      });
      
      if (state.selectedBeatmap) {
        audioServiceRef.current.pause(state.selectedBeatmap.id);
      }
      
      stopGameLoop();
    }
  };

  // Resume a paused game
  const resumeGame = (): void => {
    if (!commandBusRef.current || !audioServiceRef.current) return;
    
    if (state.currentSession && state.currentSession.state === GameState.PAUSED) {
      const timestamp = performance.now();
      
      commandBusRef.current.execute({
        type: 'RESUME_GAME',
        timestamp
      });
      
      if (state.selectedBeatmap) {
        audioServiceRef.current.resume(state.selectedBeatmap.id);
      }
      
      startGameLoop();
    }
  };

  // End the current game
  const endGame = (): void => {
    if (!commandBusRef.current || !audioServiceRef.current) return;
    
    commandBusRef.current.execute({
      type: 'END_GAME'
    });
    
    if (state.selectedBeatmap) {
      audioServiceRef.current.stop(state.selectedBeatmap.id);
    }
    
    if (rendererRef.current) {
      rendererRef.current.clear();
      rendererRef.current.stop();
    }
    
    if (inputHandlerRef.current) {
      inputHandlerRef.current.disable();
    }
    
    stopGameLoop();
  };

  // Navigate to the menu screen
  const goToMenu = (): void => {
    if (state.currentSession) {
      endGame();
    }
    
    setState(prev => ({
      ...prev,
      currentScreen: 'menu',
      currentSession: null
    }));
  };

  // Navigate to the results screen
  const goToResults = (): void => {
    setState(prev => ({
      ...prev,
      currentScreen: 'results'
    }));
  };

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      stopGameLoop();
      
      if (rendererRef.current) {
        rendererRef.current.stop();
      }
      
      if (inputHandlerRef.current) {
        inputHandlerRef.current.cleanup();
      }
    };
  }, []);

  // Context value
  const contextValue: GameContextType = {
    state,
    actions: {
      initialize,
      loadBeatmaps,
      selectBeatmap,
      startGame,
      pauseGame,
      resumeGame,
      endGame,
      goToMenu,
      goToResults
    }
  };

  return (
    <GameContext.Provider value={contextValue}>
      <div 
        ref={gameContainerRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'relative'
        }}
      >
        {children}
      </div>
    </GameContext.Provider>
  );
};

// Custom hook to use the game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  
  return context;
};
