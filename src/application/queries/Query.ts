/**
 * Base interface for all query objects
 * Queries represent requests for data that don't change application state
 */
export interface Query {
  type: string;
}

/**
 * Base interface for all query handlers
 * Query handlers execute queries and return data
 */
export interface QueryHandler<T extends Query, R> {
  execute(query: T): Promise<R>;
}

/**
 * Registry for query handlers
 * Maps query types to their handlers
 */
export class QueryBus {
  private handlers: Map<string, QueryHandler<any, any>> = new Map();

  registerHandler<T extends Query, R>(
    queryType: string,
    handler: QueryHandler<T, R>
  ): void {
    this.handlers.set(queryType, handler);
  }

  async execute<T extends Query, R>(query: T): Promise<R> {
    const handler = this.handlers.get(query.type);
    
    if (!handler) {
      throw new Error(`No handler registered for query type ${query.type}`);
    }
    
    return handler.execute(query);
  }
}
