import { Request, Response } from "express";
import { logger } from "../../shared/utils/logger";

export const healthController = (_req: Request, res: Response) => {
  logger.debug("Health check hit");
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

