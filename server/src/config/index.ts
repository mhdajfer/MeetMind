import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });

export const PORT = process.env.PORT;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
export const RATE_LIMIT_POINTS = Number(process.env.RATE_LIMIT_POINTS || 100);
export const DATABASE_URL = process.env.DATABASE_URL;
export const RATE_LIMIT_DURATION = Number(
  process.env.RATE_LIMIT_DURATION || 60
);
export const LOG_LEVEL = process.env.LOG_LEVEL || "info";

if (!DEEPGRAM_API_KEY) {
  // throw here to fail fast in production
  if (NODE_ENV === "production") {
    throw new Error("DEEPGRAM_API_KEY is required in production");
  }
}

if (!DATABASE_URL) {
  // throw here to fail fast in production
  // if (NODE_ENV === "production") {
  throw new Error("DATABASE_URL is required in production");
  // }
}
