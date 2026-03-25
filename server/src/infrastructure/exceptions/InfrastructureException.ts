import { AppError } from "../../domain/exceptions/AppError";

/**
 * Base class for infrastructure-level exceptions.
 * These represent errors in the infrastructure layer (database, external services).
 */
export abstract class InfrastructureException extends AppError {
  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    public readonly originalError?: Error
  ) {
    super(message, code, statusCode);
  }
}

/**
 * Database query error.
 */
export class DatabaseQueryException extends InfrastructureException {
  constructor(operation: string, originalError?: Error) {
    super(
      `Database query failed: ${operation}`,
      "DATABASE_QUERY_ERROR",
      500,
      originalError
    );
  }
}
