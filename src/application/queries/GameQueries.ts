import { Query, QueryHandler } from './Query';
import { Beatmap, BeatmapMetadata } from '../../domain/entities/Beatmap';
import { GameSession } from '../../domain/entities/GameSession';
import { HitObject } from '../../domain/entities/HitObject';
import { Score } from '../../domain/value-objects/Score';
import { Grade, HitResultType } from '../../shared/types/game';

// Query to get all available beatmaps
export interface GetAvailableBeatmapsQuery extends Query {
  type: 'GET_AVAILABLE_BEATMAPS';
}

// Query to get visible hit objects at current time
export interface GetVisibleHitObjectsQuery extends Query {
  type: 'GET_VISIBLE_HIT_OBJECTS';
  timestamp: number;
}

// Query to get current game session stats
export interface GetGameSessionStatsQuery extends Query {
  type: 'GET_GAME_SESSION_STATS';
}

// Query to get user's high scores
export interface GetUserHighScoresQuery extends Query {
  type: 'GET_USER_HIGH_SCORES';
  beatmapId: string;
  limit?: number;
}

// DTOs
export interface BeatmapSummaryDTO {
  id: string;
  title: string;
  artist: string;
  creator: string;
  version: string;
  difficulty: number;
  bpm: number;
  length: number; // in seconds
  thumbnailUrl?: string;
}

export interface GameSessionStatsDTO {
  score: number;
  combo: number;
  maxCombo: number;
  accuracy: number;
  grade: Grade;
  hitCounts: {
    perfect: number;
    great: number;
    good: number;
    bad: number;
    miss: number;
  };
}

export interface HighScoreDTO {
  id: string;
  username: string;
  score: number;
  maxCombo: number;
  accuracy: number;
  grade: Grade;
  date: Date;
}

// Handler for GetAvailableBeatmapsQuery
export class GetAvailableBeatmapsQueryHandler implements QueryHandler<GetAvailableBeatmapsQuery, BeatmapSummaryDTO[]> {
  constructor(
    private beatmapRepository: { getAll: () => Promise<Beatmap[]> }
  ) {}

  async execute(_query: GetAvailableBeatmapsQuery): Promise<BeatmapSummaryDTO[]> {
    const beatmaps = await this.beatmapRepository.getAll();
    
    return beatmaps.map(beatmap => ({
      id: beatmap.id,
      title: beatmap.metadata.title,
      artist: beatmap.metadata.artist,
      creator: beatmap.metadata.creator,
      version: beatmap.metadata.version,
      difficulty: this.calculateOverallDifficulty(beatmap),
      bpm: beatmap.difficulty.bpm,
      length: Math.floor(beatmap.totalLength / 1000), // Convert ms to seconds
      thumbnailUrl: beatmap.metadata.backgroundImage
    }));
  }

  private calculateOverallDifficulty(beatmap: Beatmap): number {
    // This is a simplified version of osu!'s star rating calculation
    // In a real implementation, this would be more complex
    const { approachRate, overallDifficulty, circleSize } = beatmap.difficulty;
    return (approachRate + overallDifficulty + circleSize) / 3;
  }
}

// Handler for GetVisibleHitObjectsQuery
export class GetVisibleHitObjectsQueryHandler implements QueryHandler<GetVisibleHitObjectsQuery, HitObject[]> {
  constructor(
    private currentGameSession: () => GameSession
  ) {}

  async execute(query: GetVisibleHitObjectsQuery): Promise<HitObject[]> {
    const gameSession = this.currentGameSession();
    return gameSession.getVisibleHitObjects(query.timestamp);
  }
}

// Handler for GetGameSessionStatsQuery
export class GetGameSessionStatsQueryHandler implements QueryHandler<GetGameSessionStatsQuery, GameSessionStatsDTO> {
  constructor(
    private currentGameSession: () => GameSession
  ) {}

  async execute(_query: GetGameSessionStatsQuery): Promise<GameSessionStatsDTO> {
    const gameSession = this.currentGameSession();
    const score = gameSession.score;
    const hitResults = score.hitResults;
    
    return {
      score: score.points,
      combo: score.currentCombo,
      maxCombo: score.maxCombo,
      accuracy: score.accuracy,
      grade: score.calculateGrade(),
      hitCounts: {
        perfect: hitResults.get(HitResultType.PERFECT) || 0,
        great: hitResults.get(HitResultType.GREAT) || 0,
        good: hitResults.get(HitResultType.GOOD) || 0,
        bad: hitResults.get(HitResultType.BAD) || 0,
        miss: hitResults.get(HitResultType.MISS) || 0
      }
    };
  }
}

// Handler for GetUserHighScoresQuery
export class GetUserHighScoresQueryHandler implements QueryHandler<GetUserHighScoresQuery, HighScoreDTO[]> {
  constructor(
    private scoreRepository: { 
      getHighScores: (beatmapId: string, limit?: number) => Promise<{ 
        id: string, 
        username: string, 
        score: number, 
        maxCombo: number, 
        accuracy: number, 
        grade: Grade, 
        date: Date 
      }[]>
    }
  ) {}

  async execute(query: GetUserHighScoresQuery): Promise<HighScoreDTO[]> {
    return this.scoreRepository.getHighScores(
      query.beatmapId,
      query.limit || 10
    );
  }
}
