import express from "express";
import http from "http";
import helmet from "helmet";
import cors from "cors";
import { initSocketServer } from "./sockets/socket.server";
import healthRoutes from "./routes/health.routes";
import { errorHandler } from "./middlewares/error.middleware";
import { logger } from "./utils/logger";
import { PORT, NODE_ENV } from "./config";
import { rateLimiterMiddleware } from "./middlewares/rateLimiter";
import pool, { testDatabaseConnection } from "./config/db";

const app = express();

// basic middlewares
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// small example rate limit for HTTP endpoints using rate-limiter-flexible
app.use(async (req, res, next) => {
  try {
    await rateLimiterMiddleware(req, res, next);
    next();
  } catch (err) {
    res.status(429).json({ error: "Too many requests" });
  }
});

app.use("/api", healthRoutes);

// error handler
app.use(errorHandler);

const server = http.createServer(app);

// socket.io server
const io = initSocketServer(server);

server.listen(PORT, async () => {
  logger.info(
    { pid: process.pid, port: PORT, env: NODE_ENV },
    "Server started"
  );

  // Initialize database connection
  await testDatabaseConnection();
});

// Graceful shutdown
const shutdown = async () => {
  logger.info("Received shutdown signal, closing server...");

  try {
    // Close socket.io server
    io.close();

    // Close database connection pool
    await pool.end();
    logger.info("Database pool closed");

    // Close HTTP server
    server.close(() => {
      logger.info("HTTP server closed. Exiting process.");
      process.exit(0);
    });
  } catch (err) {
    logger.error({ err }, "Error during shutdown");
    process.exit(1);
  }

  // Force exit after 10s
  setTimeout(() => {
    logger.error({
      message: "Could not close connections in time, forcefully shutting down",
    });
    process.exit(1);
  }, 10_000);
};

// handle signals
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
