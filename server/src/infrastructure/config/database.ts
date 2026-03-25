import pg from "pg";
import path from "path";
import fs from "fs";
import { logger } from "../../shared/utils/logger";
import { DATABASE_URL } from "../../shared/config/environment";

const { Pool } = pg;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

/**
 * Test the database connection and log the result.
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    logger.info("Database connection successful");
    return true;
  } catch (err) {
    logger.error({ err }, "Database connection failed");
    return false;
  }
};

/**
 * Apply all schema migration files.
 * In production, prefer a dedicated migration tool (e.g. node-pg-migrate).
 */
export async function runMigrations(): Promise<void> {
  const schemaFiles = [
    "user.schema.sql",
    "refresh_tokens.schema.sql",
    "meetings.schema.sql",
    "transcript_chunks.schema.sql",
    "ai_analysis.schema.sql",
  ];

  const migrationDir = path.join(__dirname, "../database/migrations");

  for (const file of schemaFiles) {
    const filePath = path.join(migrationDir, file);
    const sql = fs.readFileSync(filePath, "utf8");
    logger.info(`Applying migration: ${file}`);
    await pool.query(sql);
  }

  logger.info("All database schemas applied.");
}

export default pool;

