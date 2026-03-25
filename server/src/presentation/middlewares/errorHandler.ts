import { Request, Response, NextFunction } from "express";
import { logger } from "../../shared/utils/logger";
import { AppError } from "../../domain/exceptions";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log with appropriate severity
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, "Application error");
    } else {
      logger.warn({ err }, "Business logic error");
    }
  } else {
    logger.error({ err }, "Unhandled error");
  }

  // Determine response
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    status = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err?.status) {
    status = err.status;
    code = err?.code || "ERROR";
    message = err?.message || "An error occurred";
  } else if (err?.message) {
    message = err.message;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const errorResponse: any = {
    error: {
      message:
        isProduction && status === 500 ? "Internal Server Error" : message,
      code,
    },
  };

  if (!isProduction && err?.stack) {
    errorResponse.error.stack = err.stack;
  }

  res.status(status).json(errorResponse);
};

