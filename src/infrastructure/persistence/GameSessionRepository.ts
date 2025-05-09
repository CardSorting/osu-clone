import { GameSession } from '../../domain/entities/GameSession';

export class GameSessionRepository {
  private sessions: Map<string, GameSession> = new Map();
  private currentSession: GameSession | null = null;

  async getById(id: string): Promise<GameSession> {
    const session = this.sessions.get(id);
    
    if (!session) {
      throw new Error(`Game session with id ${id} not found`);
    }
    
    return session;
  }

  async getAll(): Promise<GameSession[]> {
    return Array.from(this.sessions.values());
  }

  async save(session: GameSession): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
    
    // If the current session was deleted, clear it
    if (this.currentSession?.id === id) {
      this.currentSession = null;
    }
  }

  setCurrentSession(session: GameSession): void {
    this.currentSession = session;
    this.save(session);
  }

  getCurrentSession(): GameSession {
    if (!this.currentSession) {
      throw new Error('No active game session found');
    }
    
    return this.currentSession;
  }

  hasActiveSession(): boolean {
    return this.currentSession !== null;
  }

  clearCurrentSession(): void {
    this.currentSession = null;
  }
}
