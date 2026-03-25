/**
 * Database Client Interface
 * Generic abstraction for database operations — no framework-specific types exposed.
 */
export interface QueryResult<T = any> {
  rows: T[];
}

export interface IDatabaseClient {
  query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
}

