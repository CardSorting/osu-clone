/**
 * Audio Service for managing game audio playback and timing
 * This is a crucial component for a rhythm game
 */
export class AudioService {
  private audioContext: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private startTimes: Map<string, number> = new Map();
  private pauseTimes: Map<string, number> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();
  
  /**
   * Initialize the audio context
   * Must be called after a user interaction due to browser autoplay policies
   */
  initialize(): void {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Load an audio file and prepare it for playback
   * @param id Unique identifier for the audio
   * @param url URL of the audio file to load
   */
  async loadAudio(id: string, url: string): Promise<void> {
    if (!this.audioContext) {
      this.initialize();
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(id, audioBuffer);
    } catch (error) {
      console.error(`Failed to load audio ${id} from ${url}:`, error);
      throw new Error(`Failed to load audio ${id}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Play an audio file that has been loaded
   * @param id Identifier of the audio to play
   * @param loop Whether to loop the audio
   * @param volume Volume level (0-1)
   */
  play(id: string, loop: boolean = false, volume: number = 1.0): void {
    if (!this.audioContext) {
      this.initialize();
    }

    const audioBuffer = this.audioBuffers.get(id);
    if (!audioBuffer) {
      throw new Error(`Audio ${id} not loaded`);
    }

    // Stop any existing playback of this audio
    this.stop(id);

    // Create audio source
    const source = this.audioContext!.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = loop;

    // Create gain node for volume control
    const gainNode = this.audioContext!.createGain();
    gainNode.gain.value = volume;

    // Connect the audio routing
    source.connect(gainNode);
    gainNode.connect(this.audioContext!.destination);

    // Track the source and gain node
    this.activeSources.set(id, source);
    this.gainNodes.set(id, gainNode);

    // Record the start time
    const startTime = this.audioContext!.currentTime;
    this.startTimes.set(id, startTime);

    // Start playback
    source.start(0);

    // Handle cleanup when audio ends (if not looping)
    if (!loop) {
      source.onended = () => {
        this.activeSources.delete(id);
        this.startTimes.delete(id);
        this.gainNodes.delete(id);
      };
    }
  }

  /**
   * Pause audio playback
   * @param id Identifier of the audio to pause
   */
  pause(id: string): void {
    const source = this.activeSources.get(id);
    if (!source) return;

    // Record the time position when paused
    const elapsedTime = this.getElapsedTime(id);
    this.pauseTimes.set(id, elapsedTime);

    // Stop the current source
    source.stop(0);
    this.activeSources.delete(id);
  }

  /**
   * Resume audio from a paused state
   * @param id Identifier of the audio to resume
   */
  resume(id: string): void {
    const pauseTime = this.pauseTimes.get(id);
    if (pauseTime === undefined) return;

    const audioBuffer = this.audioBuffers.get(id);
    if (!audioBuffer) return;

    // Create a new source
    const source = this.audioContext!.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = this.activeSources.get(id)?.loop || false;

    // Get the existing gain node or create a new one
    let gainNode = this.gainNodes.get(id);
    if (!gainNode) {
      gainNode = this.audioContext!.createGain();
      gainNode.gain.value = 1.0;
      this.gainNodes.set(id, gainNode);
    }

    // Connect the audio routing
    source.connect(gainNode);
    gainNode.connect(this.audioContext!.destination);

    // Track the source
    this.activeSources.set(id, source);

    // Calculate the new start time to account for the pause
    const newStartTime = this.audioContext!.currentTime - pauseTime;
    this.startTimes.set(id, newStartTime);

    // Start playback from the paused position
    source.start(0, pauseTime);
    this.pauseTimes.delete(id);
  }

  /**
   * Stop audio playback
   * @param id Identifier of the audio to stop
   */
  stop(id: string): void {
    const source = this.activeSources.get(id);
    if (!source) return;

    source.stop(0);
    this.activeSources.delete(id);
    this.startTimes.delete(id);
    this.pauseTimes.delete(id);
  }

  /**
   * Set the volume of an audio
   * @param id Identifier of the audio
   * @param volume Volume level (0-1)
   */
  setVolume(id: string, volume: number): void {
    const gainNode = this.gainNodes.get(id);
    if (gainNode) {
      gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Get the current playback time of an audio in milliseconds
   * @param id Identifier of the audio
   * @returns Current playback time in milliseconds
   */
  getCurrentTime(id: string): number {
    return Math.floor(this.getElapsedTime(id) * 1000);
  }

  /**
   * Check if an audio is currently playing
   * @param id Identifier of the audio
   * @returns True if the audio is playing
   */
  isPlaying(id: string): boolean {
    return this.activeSources.has(id);
  }

  /**
   * Get the duration of an audio in milliseconds
   * @param id Identifier of the audio
   * @returns Duration in milliseconds
   */
  getDuration(id: string): number {
    const buffer = this.audioBuffers.get(id);
    return buffer ? Math.floor(buffer.duration * 1000) : 0;
  }

  /**
   * Helper method to calculate elapsed playback time
   */
  private getElapsedTime(id: string): number {
    const startTime = this.startTimes.get(id);
    if (startTime === undefined) return 0;

    const pauseTime = this.pauseTimes.get(id);
    if (pauseTime !== undefined) {
      return pauseTime;
    }

    return this.audioContext!.currentTime - startTime;
  }
}
