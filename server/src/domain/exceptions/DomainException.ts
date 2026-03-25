import { AppError } from "./AppError";

/**
 * Base class for all domain exceptions.
 * Domain exceptions represent business rule violations.
 */
export abstract class DomainException extends AppError {
  constructor(message: string, code: string, statusCode: number = 400) {
    super(message, code, statusCode);
  }
}

export class EmailNotVerifiedException extends DomainException {
  constructor(email?: string) {
    super(
      email ? `Email ${email} is not verified` : "Email is not verified",
      "EMAIL_NOT_VERIFIED",
      403
    );
  }
}

export class InvalidTokenException extends DomainException {
  constructor(reason?: string) {
    super(
      reason ? `Invalid token: ${reason}` : "Invalid token",
      "INVALID_TOKEN",
      401
    );
  }
}

export class TokenNotFoundException extends DomainException {
  constructor() {
    super("Token not found or has been revoked", "TOKEN_NOT_FOUND", 401);
  }
}

export class UserNotFoundException extends DomainException {
  constructor(identifier?: string) {
    super(
      identifier ? `User not found: ${identifier}` : "User not found",
      "USER_NOT_FOUND",
      404
    );
  }
}

export class UserCreationFailedException extends DomainException {
  constructor(reason?: string) {
    super(
      reason ? `Failed to create user: ${reason}` : "Failed to create user",
      "USER_CREATION_FAILED",
      500
    );
  }
}
