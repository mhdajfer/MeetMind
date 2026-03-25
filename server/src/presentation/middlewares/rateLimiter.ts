import { RateLimiterMemory } from "rate-limiter-flexible";
import {
  RATE_LIMIT_POINTS,
  RATE_LIMIT_DURATION,
} from "../../shared/config/environment";
import { Request, Response, NextFunction } from "express";

const rateLimiter = new RateLimiterMemory({
  points: RATE_LIMIT_POINTS,
  duration: RATE_LIMIT_DURATION,
});

export async function rateLimiterMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await rateLimiter.consume(req.ip || "127.0.0.1");
    next();
  } catch {
    res.status(429).json({ error: "Too Many Requests" });
    return;
  }
}
