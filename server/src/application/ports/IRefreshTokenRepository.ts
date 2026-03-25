export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  replacedBy?: string | null;
  userAgent?: string | null;
  ip?: string | null;
  createdAt?: Date;
}

export interface CreateRefreshTokenParams {
  userId: string;
  token: string;
  expiresAt: Date;
  userAgent?: string;
  ip?: string;
}

export interface IRefreshTokenRepository {
  create(params: CreateRefreshTokenParams): Promise<RefreshTokenRecord>;
  findValidByUserIdAndToken(
    userId: string,
    token: string
  ): Promise<RefreshTokenRecord | null>;
  revokeById(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  replace(
    oldTokenId: string | null,
    userId: string,
    newToken: string,
    expiresAt: Date,
    userAgent?: string,
    ip?: string
  ): Promise<RefreshTokenRecord>;
}

