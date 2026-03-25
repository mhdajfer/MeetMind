import { Email } from "../value-objects/Email";

/**
 * Domain Entity: User
 *
 * Pure domain entity with no infrastructure dependencies.
 * Contains only business logic and domain rules.
 */
export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly name: string | null,
    public readonly picture: string | null,
    public readonly providerUserId: string | null,
    public readonly provider: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Factory method to create a User from domain data.
   */
  static create(params: {
    id: string;
    email: string;
    name?: string | null;
    picture?: string | null;
    providerUserId?: string | null;
    provider?: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }): User {
    User.validate(params.id, params.email);

    return new User(
      params.id,
      params.email,
      params.name ?? null,
      params.picture ?? null,
      params.providerUserId ?? null,
      params.provider ?? null,
      params.createdAt ?? new Date(),
      params.updatedAt ?? new Date()
    );
  }

  /**
   * Domain validation rules.
   */
  private static validate(id: string, email: string): void {
    if (!id || id.trim().length === 0) {
      throw new Error("User ID is required");
    }
    // Delegate email validation to the Email value object
    Email.create(email);
  }

  /**
   * Business logic: Check if user has OAuth account linked.
   */
  hasOAuthAccount(provider: string): boolean {
    return this.provider === provider && this.providerUserId !== null;
  }

  /**
   * Business logic: Link OAuth account.
   * Returns a new User instance (immutability).
   */
  linkOAuthAccount(provider: string, providerUserId: string): User {
    if (this.hasOAuthAccount(provider)) {
      throw new Error(`User already has ${provider} account linked`);
    }

    return User.create({
      id: this.id,
      email: this.email,
      name: this.name,
      picture: this.picture,
      providerUserId,
      provider,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }

  /**
   * Convert to plain object for DTOs (presentation layer).
   */
  toPlainObject(): {
    id: string;
    email: string;
    name: string | null;
    picture: string | null;
  } {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      picture: this.picture,
    };
  }
}
