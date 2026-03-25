import { Request, Response, NextFunction } from "express";

export function requireRefreshToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.refresh_token;

  if (!token) {
    return res.status(401).json({
      error: "Refresh token missing",
    });
  }

  next();
}

