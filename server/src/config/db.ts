import pg from "pg";
import { logger } from "../utils/logger";
import path from "path";
import fs from "fs";

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
    await initDB();
    logger.info("✅ Database connection successful");
    return true;
  } catch (err) {
    logger.error({ err }, "❌ Database connection failed");
    return false;
  }
};

export async function initDB() {
  const schemaDir = path.join(__dirname, "../schemas");
  const files = fs.readdirSync(schemaDir);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(schemaDir, file), "utf-8");
    console.log(`Applying schema: ${file}`);
    await pool.query(sql);
  }

  console.log("✅ All database schemas initialized.");
}

export default pool;
