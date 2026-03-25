import dotenv from "dotenv";
dotenv.config();

const env = process.env;

// Server
export const PORT = env.PORT || "4000";
export const NODE_ENV = env.NODE_ENV || "development";
export const FRONTEND_ORIGIN = env.FRONTEND_ORIGIN || "http://localhost:3001";

// Database
export const DATABASE_URL = env.DATABASE_URL;

// External services
export const DEEPGRAM_API_KEY = env.DEEPGRAM_API_KEY;

// Rate limiting
export const RATE_LIMIT_POINTS = Number(env.RATE_LIMIT_POINTS || 100);
export const RATE_LIMIT_DURATION = Number(env.RATE_LIMIT_DURATION || 60);

// Logging
export const LOG_LEVEL = env.LOG_LEVEL || "info";

// Google OAuth
export const GOOGLE_CLIENT_ID = env.GOOGLE_AUTH_CLIENT_ID || "";

// JWT — no insecure defaults in production
export const JWT_ACCESS_SECRET =
  env.APP_ACCESS_TOKEN_SECRET ||
  (NODE_ENV !== "production" ? "dev_access_secret_CHANGE_ME" : "");
export const JWT_REFRESH_SECRET =
  env.APP_REFRESH_TOKEN_SECRET ||
  (NODE_ENV !== "production" ? "dev_refresh_secret_CHANGE_ME" : "");
export const JWT_ACCESS_TTL = env.APP_ACCESS_TOKEN_TTL || "15m";
export const JWT_REFRESH_TTL = env.APP_REFRESH_TOKEN_TTL || "30d";

// Cookie
export const COOKIE_DOMAIN = env.COOKIE_DOMAIN || undefined;
export const COOKIE_SECURE =
  env.COOKIE_SECURE === "true" || NODE_ENV === "production";

// ── Startup validation ─────────────────────────────────────────────
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

if (NODE_ENV === "production") {
  if (!env.APP_ACCESS_TOKEN_SECRET || !env.APP_REFRESH_TOKEN_SECRET) {
    throw new Error(
      "APP_ACCESS_TOKEN_SECRET and APP_REFRESH_TOKEN_SECRET are required in production"
    );
  }
  if (!DEEPGRAM_API_KEY) {
    throw new Error("DEEPGRAM_API_KEY is required in production");
  }
}

