import { AppError } from "../../domain/exceptions/AppError";

/**
 * Base class for application-level exceptions.
 * These represent errors in the application layer (use cases).
 */
export abstract class ApplicationException extends AppError {
  constructor(message: string, code: string, statusCode: number = 500) {
    super(message, code, statusCode);
  }
}
