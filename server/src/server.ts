import express from "express";
import http from "http";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { initSocketServer } from "./presentation/sockets/SocketServer";
import healthRoutes from "./presentation/routes/health.routes";
import authRoutes from "./presentation/routes/auth.routes";
import { errorHandler } from "./presentation/middlewares/errorHandler";
import { rateLimiterMiddleware } from "./presentation/middlewares/rateLimiter";
import { logger } from "./shared/utils/logger";
import {
  PORT,
  NODE_ENV,
  FRONTEND_ORIGIN,
} from "./shared/config/environment";
import pool, {
  testDatabaseConnection,
  runMigrations,
} from "./infrastructure/config/database";

const app = express();

// ── Core middlewares ────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ──────────────────────────────────────────────────
app.use(rateLimiterMiddleware);

// ── Routes ─────────────────────────────────────────────────────────
app.use("/api", healthRoutes);
app.use("/auth", authRoutes);

// ── Error handler (must be last) ───────────────────────────────────
app.use(errorHandler);

// ── Server startup ─────────────────────────────────────────────────
const server = http.createServer(app);
const io = initSocketServer(server);

server.listen(PORT, async () => {
  logger.info(
    { pid: process.pid, port: PORT, env: NODE_ENV },
    "Server started"
  );

  await testDatabaseConnection();
  await runMigrations();
});

// ── Graceful shutdown ──────────────────────────────────────────────
const shutdown = async () => {
  logger.info("Received shutdown signal, closing server...");

  try {
    io.close();
    await pool.end();
    logger.info("Database pool closed");

    server.close(() => {
      logger.info("HTTP server closed. Exiting process.");
      process.exit(0);
    });
  } catch (err) {
    logger.error({ err }, "Error during shutdown");
    process.exit(1);
  }

  setTimeout(() => {
    logger.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10_000);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
