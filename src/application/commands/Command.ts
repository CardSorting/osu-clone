/**
 * Base interface for all command objects
 * Commands represent actions that change the state of the application
 */
export interface Command {
  type: string;
}

/**
 * Base interface for all command handlers
 * Command handlers execute commands and produce results
 */
export interface CommandHandler<T extends Command, R> {
  execute(command: T): Promise<R>;
}

/**
 * Registry for command handlers
 * Maps command types to their handlers
 */
export class CommandBus {
  private handlers: Map<string, CommandHandler<any, any>> = new Map();

  registerHandler<T extends Command, R>(
    commandType: string,
    handler: CommandHandler<T, R>
  ): void {
    this.handlers.set(commandType, handler);
  }

  async execute<T extends Command, R>(command: T): Promise<R> {
    const handler = this.handlers.get(command.type);
    
    if (!handler) {
      throw new Error(`No handler registered for command type ${command.type}`);
    }
    
    return handler.execute(command);
  }
}
