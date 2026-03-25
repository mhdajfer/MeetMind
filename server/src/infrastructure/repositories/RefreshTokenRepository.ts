import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import {
  IRefreshTokenRepository,
  RefreshTokenRecord,
  CreateRefreshTokenParams,
} from "../../application/ports/IRefreshTokenRepository";
import { IDatabaseClient } from "../database/IDatabaseClient";
import { DatabaseQueryException } from "../exceptions/InfrastructureException";

const SALT_ROUNDS = 10;

export class RefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly db: IDatabaseClient) {}

  /**
   * Map a raw database row to a RefreshTokenRecord (camelCase).
   */
  private toRecord(row: any): RefreshTokenRecord {
    return {
      id: row.id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: new Date(row.expires_at),
      revoked: row.revoked,
      replacedBy: row.replaced_by ?? null,
      userAgent: row.user_agent ?? null,
      ip: row.ip ?? null,
      createdAt: row.created_at ? new Date(row.created_at) : undefined,
    };
  }

  async create(params: CreateRefreshTokenParams): Promise<RefreshTokenRecord> {
    try {
      const { userId, token, expiresAt, userAgent, ip } = params;
      const id = randomUUID();
      const tokenHash = await bcrypt.hash(token, SALT_ROUNDS);

      await this.db.query(
        "INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, user_agent, ip) VALUES ($1, $2, $3, $4, $5, $6)",
        [id, userId, tokenHash, expiresAt, userAgent ?? null, ip ?? null]
      );

      const result = await this.db.query(
        "SELECT * FROM refresh_tokens WHERE id = $1 LIMIT 1",
        [id]
      );

      return this.toRecord(result.rows[0]);
    } catch (error) {
      throw new DatabaseQueryException(
        "create refresh token",
        error instanceof Error ? error : undefined
      );
    }
  }

  async findValidByUserIdAndToken(
    userId: string,
    token: string
  ): Promise<RefreshTokenRecord | null> {
    try {
      const result = await this.db.query(
        "SELECT * FROM refresh_tokens WHERE user_id = $1 AND revoked = false AND expires_at > NOW() ORDER BY created_at DESC",
        [userId]
      );

      for (const row of result.rows) {
        const ok = await bcrypt.compare(token, row.token_hash);
        if (ok) return this.toRecord(row);
      }

      return null;
    } catch (error) {
      throw new DatabaseQueryException(
        `findValidByUserIdAndToken(${userId})`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async revokeById(id: string): Promise<void> {
    try {
      await this.db.query(
        "UPDATE refresh_tokens SET revoked = true WHERE id = $1",
        [id]
      );
    } catch (error) {
      throw new DatabaseQueryException(
        `revokeById(${id})`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async revokeAllForUser(userId: string): Promise<void> {
    try {
      await this.db.query(
        "UPDATE refresh_tokens SET revoked = true WHERE user_id = $1",
        [userId]
      );
    } catch (error) {
      throw new DatabaseQueryException(
        `revokeAllForUser(${userId})`,
        error instanceof Error ? error : undefined
      );
    }
  }

  async replace(
    oldTokenId: string | null,
    userId: string,
    newToken: string,
    expiresAt: Date,
    userAgent?: string,
    ip?: string
  ): Promise<RefreshTokenRecord> {
    try {
      const created = await this.create({
        userId,
        token: newToken,
        expiresAt,
        userAgent,
        ip,
      });

      if (oldTokenId) {
        await this.db.query(
          "UPDATE refresh_tokens SET revoked = true, replaced_by = $1 WHERE id = $2",
          [created.id, oldTokenId]
        );
      }

      return created;
    } catch (error) {
      if (error instanceof DatabaseQueryException) throw error;
      throw new DatabaseQueryException(
        `replace(${oldTokenId}, ${userId})`,
        error instanceof Error ? error : undefined
      );
    }
  }
}
