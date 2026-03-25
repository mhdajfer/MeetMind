import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";

export function validateBody(schema: Schema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: error.details[0].message,
      });
    }

    req.body = value;
    next();
  };
}

