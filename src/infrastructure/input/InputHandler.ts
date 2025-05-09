import { Vector2 } from '../../shared/types/game';

/**
 * Types of input events that the game can process
 */
export enum InputEventType {
  CLICK = 'CLICK',
  KEY_PRESS = 'KEY_PRESS',
  KEY_RELEASE = 'KEY_RELEASE'
}

/**
 * Interface for input event data
 */
export interface InputEvent {
  type: InputEventType;
  position?: Vector2;
  key?: string;
  timestamp: number;
}

/**
 * Type for event handlers
 */
export type InputEventHandler = (event: InputEvent) => void;

/**
 * InputHandler manages user interactions with the game
 * It captures mouse/touch inputs and keyboard events
 */
export class InputHandler {
  private element: HTMLElement;
  private eventHandlers: Map<InputEventType, InputEventHandler[]> = new Map();
  private isEnabled: boolean = false;
  
  // Key state tracking (for continuous key presses)
  private keysDown: Set<string> = new Set();
  
  // Default keys for osu! gameplay
  private readonly PRIMARY_KEYS = ['z', 'x'];
  private readonly SECONDARY_KEYS = ['keyZ', 'keyX']; // For KeyboardEvent.code
  
  constructor(element: HTMLElement) {
    this.element = element;
    this.setupEventListeners();
  }

  /**
   * Enable input handling
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * Disable input handling
   */
  disable(): void {
    this.isEnabled = false;
    this.keysDown.clear();
  }

  /**
   * Register an event handler for a specific input event type
   */
  on(eventType: InputEventType, handler: InputEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove an event handler
   */
  off(eventType: InputEventType, handler: InputEventHandler): void {
    if (!this.eventHandlers.has(eventType)) return;
    
    const handlers = this.eventHandlers.get(eventType)!;
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Set up DOM event listeners
   */
  private setupEventListeners(): void {
    // Mouse events
    this.element.addEventListener('mousedown', this.handleMouseDown);
    document.addEventListener('mouseup', this.handleMouseUp);
    
    // Touch events for mobile
    this.element.addEventListener('touchstart', this.handleTouchStart);
    document.addEventListener('touchend', this.handleTouchEnd);
    
    // Keyboard events
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    
    // Prevent context menu on right click
    this.element.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Clean up event listeners
   */
  cleanup(): void {
    this.element.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mouseup', this.handleMouseUp);
    
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchend', this.handleTouchEnd);
    
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    
    this.element.removeEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Convert a DOM event to canvas/game coordinates
   */
  private getElementCoordinates(clientX: number, clientY: number): Vector2 {
    const rect = this.element.getBoundingClientRect();
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  /**
   * Emit an input event to all registered handlers
   */
  private emitEvent(event: InputEvent): void {
    if (!this.isEnabled) return;
    
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  /**
   * Handle mouse down events
   */
  private handleMouseDown = (e: MouseEvent): void => {
    const position = this.getElementCoordinates(e.clientX, e.clientY);
    
    this.emitEvent({
      type: InputEventType.CLICK,
      position,
      timestamp: performance.now()
    });
  };

  /**
   * Handle mouse up events
   */
  private handleMouseUp = (e: MouseEvent): void => {
    // Could be used for sliders or draggable elements
  };

  /**
   * Handle touch start events
   */
  private handleTouchStart = (e: TouchEvent): void => {
    e.preventDefault(); // Prevent scrolling
    
    const touch = e.touches[0];
    const position = this.getElementCoordinates(touch.clientX, touch.clientY);
    
    this.emitEvent({
      type: InputEventType.CLICK,
      position,
      timestamp: performance.now()
    });
  };

  /**
   * Handle touch end events
   */
  private handleTouchEnd = (e: TouchEvent): void => {
    // Could be used for sliders or draggable elements
  };

  /**
   * Handle key down events
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    const code = e.code;
    
    // Only process if this is a new key press
    if (this.keysDown.has(key)) return;
    
    // Check if this is a valid gameplay key
    if (
      this.PRIMARY_KEYS.includes(key) || 
      this.SECONDARY_KEYS.includes(code)
    ) {
      this.keysDown.add(key);
      
      this.emitEvent({
        type: InputEventType.KEY_PRESS,
        key,
        timestamp: performance.now()
      });
      
      // For osu!, key presses are equivalent to clicks at the center of the active object
      this.emitEvent({
        type: InputEventType.CLICK,
        // Don't provide position - game logic will determine the "auto" position
        timestamp: performance.now()
      });
    }
  };

  /**
   * Handle key up events
   */
  private handleKeyUp = (e: KeyboardEvent): void => {
    const key = e.key.toLowerCase();
    
    if (this.keysDown.has(key)) {
      this.keysDown.delete(key);
      
      this.emitEvent({
        type: InputEventType.KEY_RELEASE,
        key,
        timestamp: performance.now()
      });
    }
  };

  /**
   * Check if a specific key is currently pressed
   */
  isKeyDown(key: string): boolean {
    return this.keysDown.has(key.toLowerCase());
  }
}
