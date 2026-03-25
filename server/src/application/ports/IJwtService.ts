export interface AccessTokenPayload {
  sub: string;
  email?: string;
  roles?: string[];
}

export interface RefreshTokenPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

export interface IJwtService {
  signAccessToken(payload: AccessTokenPayload): string;
  signRefreshToken(payload: { sub: string }): string;
  verifyAccessToken(token: string): AccessTokenPayload | null;
  verifyRefreshToken(token: string): RefreshTokenPayload | null;
}

