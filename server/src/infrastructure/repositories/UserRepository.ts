import { randomUUID } from "crypto";
import {
  IUserRepository,
  CreateUserParams,
} from "../../application/ports/IUserRepository";
import { User } from "../../domain/entities/User";
import { OAuthProvider } from "../../application/dto/OAuthProfile";
import { IDatabaseClient } from "../database/IDatabaseClient";
import { UserCreationFailedException } from "../../domain/exceptions";
import { DatabaseQueryException } from "../exceptions/InfrastructureException";

export class UserRepository implements IUserRepository {
  constructor(private readonly db: IDatabaseClient) {}

  /**
   * Map a raw database row to a domain User entity.
   * This mapping lives in the repository (infrastructure), NOT in the domain.
   */
  private toDomainEntity(row: any): User {
    return User.create({
      id: row.id,
      email: row.email,
      name: row.name ?? null,
      picture: row.picture ?? null,
      providerUserId: row.provider_user_id ?? null,
      provider: row.provider ?? null,
      createdAt:
        row.created_at instanceof Date
          ? row.created_at
          : new Date(row.created_at),
      updatedAt:
        row.updated_at instanceof Date
          ? row.updated_at
          : new Date(row.updated_at),
    });
  }

  async findByOAuthAccount(
    provider: OAuthProvider,
    providerUserId: string
  ): Promise<User | null> {
    try {
      const result = await this.db.query(
        "SELECT * FROM users WHERE provider = $1 AND provider_user_id = $2",
        [provider, providerUserId]
      );
      if (result.rows.length === 0) return null;
      return this.toDomainEntity(result.rows[0]);
    } catch (error) {
      throw new DatabaseQueryException(
        `findByOAuthAccount(${provider}, ${providerUserId})`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const result = await this.db.query(
        "SELECT * FROM users WHERE id = $1 LIMIT 1",
        [id]
      );
      if (result.rows.length === 0) return null;
      return this.toDomainEntity(result.rows[0]);
    } catch (error) {
      throw new DatabaseQueryException(
        `findById(${id})`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.db.query(
        "SELECT * FROM users WHERE email = $1 LIMIT 1",
        [email]
      );
      if (result.rows.length === 0) return null;
      return this.toDomainEntity(result.rows[0]);
    } catch (error) {
      throw new DatabaseQueryException(
        `findByEmail(${email})`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async create(params: CreateUserParams): Promise<User> {
    try {
      const { email, name, picture } = params;
      const id = randomUUID();

      await this.db.query(
        "INSERT INTO users (id, email, name, picture) VALUES ($1, $2, $3, $4)",
        [id, email, name ?? null, picture ?? null]
      );

      const result = await this.db.query(
        "SELECT * FROM users WHERE id = $1 LIMIT 1",
        [id]
      );

      if (result.rows.length === 0) {
        throw new UserCreationFailedException(
          "User was not found after creation"
        );
      }

      return this.toDomainEntity(result.rows[0]);
    } catch (error) {
      if (error instanceof UserCreationFailedException) throw error;
      throw new DatabaseQueryException(
        "create",
        error instanceof Error ? error : undefined
      );
    }
  }

  async linkOAuthAccount(
    userId: string,
    provider: OAuthProvider,
    providerUserId: string
  ): Promise<User> {
    try {
      await this.db.query(
        "UPDATE users SET provider_user_id = $1, provider = $2 WHERE id = $3",
        [providerUserId, provider, userId]
      );

      const result = await this.db.query(
        "SELECT * FROM users WHERE id = $1 LIMIT 1",
        [userId]
      );

      if (result.rows.length === 0) {
        throw new DatabaseQueryException(
          `User not found after linking OAuth account: ${userId}`
        );
      }

      return this.toDomainEntity(result.rows[0]);
    } catch (error) {
      if (error instanceof DatabaseQueryException) throw error;
      throw new DatabaseQueryException(
        `linkOAuthAccount(${userId}, ${provider})`,
        error instanceof Error ? error : undefined
      );
    }
  }
}
