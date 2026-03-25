import jwt from "jsonwebtoken";
import {
  IJwtService,
  AccessTokenPayload,
  RefreshTokenPayload,
} from "../../application/ports/IJwtService";
import { IConfigurationService } from "../../application/ports/IConfigurationService";

export class JwtService implements IJwtService {
  constructor(private readonly configService: IConfigurationService) {}

  signAccessToken(payload: AccessTokenPayload): string {
    const secret = this.configService.getJwtAccessSecret();
    if (!secret) throw new Error("JWT access secret is not configured");
    return jwt.sign(payload, secret, {
      expiresIn: this.configService.getJwtAccessTtl(),
    } as jwt.SignOptions);
  }

  signRefreshToken(payload: { sub: string }): string {
    const secret = this.configService.getJwtRefreshSecret();
    if (!secret) throw new Error("JWT refresh secret is not configured");
    return jwt.sign(payload, secret, {
      expiresIn: this.configService.getJwtRefreshTtl(),
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): AccessTokenPayload | null {
    try {
      return jwt.verify(
        token,
        this.configService.getJwtAccessSecret()
      ) as AccessTokenPayload;
    } catch {
      return null;
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      return jwt.verify(
        token,
        this.configService.getJwtRefreshSecret()
      ) as RefreshTokenPayload;
    } catch {
      return null;
    }
  }
}
