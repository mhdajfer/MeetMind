import { IDatabaseClient, QueryResult } from "./IDatabaseClient";
import pool from "../config/database";

/**
 * PostgreSQL Database Client Implementation
 */
export class PostgresDatabaseClient implements IDatabaseClient {
  async query<T = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const result = await pool.query(text, params);
    return { rows: result.rows as T[] };
  }
}
