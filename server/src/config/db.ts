import pg from "pg";
import { logger } from "../utils/logger";

const { Pool } = pg;

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection and log the result
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query("SELECT NOW()");
    client.release();
    logger.info("✅ Database connection successful");
    return true;
  } catch (err) {
    logger.error({ err }, "❌ Database connection failed");
    return false;
  }
};

export default pool;
