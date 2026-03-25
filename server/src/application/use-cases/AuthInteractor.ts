import { IAuthInteractor } from "../ports/IAuthInteractor";
import { IUserRepository } from "../ports/IUserRepository";
import { IRefreshTokenRepository } from "../ports/IRefreshTokenRepository";
import { IJwtService } from "../ports/IJwtService";
import { IOAuthProviderService } from "../ports/IOAuthProviderService";
import { IConfigurationService } from "../ports/IConfigurationService";
import {
  SignInResultDTO,
  RotateTokenResultDTO,
  GetCurrentUserResultDTO,
} from "../dto/AuthDTO";
import {
  EmailNotVerifiedException,
  InvalidTokenException,
  TokenNotFoundException,
  UserNotFoundException,
} from "../../domain/exceptions";
import { ms } from "../../shared/utils/time.util";

export class AuthInteractor implements IAuthInteractor {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: IJwtService,
    private readonly oAuthService: IOAuthProviderService,
    private readonly configService: IConfigurationService
  ) {}

  async authenticateWithOAuth(
    token: string,
    userAgent?: string,
    ip?: string
  ): Promise<SignInResultDTO> {
    const profile = await this.oAuthService.verifyToken(token);

    if (!profile.emailVerified) {
      throw new EmailNotVerifiedException(profile.email);
    }

    // Find or create user
    let user = await this.userRepository.findByOAuthAccount(
      profile.provider,
      profile.providerUserId
    );

    if (!user) {
      user = await this.userRepository.findByEmail(profile.email);

      if (user) {
        user = await this.userRepository.linkOAuthAccount(
          user.id,
          profile.provider,
          profile.providerUserId
        );
      }
    }

    if (!user) {
      user = await this.userRepository.create({
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
      });

      user = await this.userRepository.linkOAuthAccount(
        user.id,
        profile.provider,
        profile.providerUserId
      );
    }

    if (!user) {
      throw new UserNotFoundException("Failed to create or retrieve user");
    }

    // Create tokens
    const accessToken = this.tokenService.signAccessToken({
      sub: user.id,
      email: user.email,
    });
    const refreshToken = this.tokenService.signRefreshToken({ sub: user.id });

    // Persist refresh token
    const refreshTtl = this.configService.getJwtRefreshTtl();
    const refreshExpiresAt = new Date(Date.now() + ms(refreshTtl));

    await this.refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: refreshExpiresAt,
      userAgent,
      ip,
    });

    return {
      user: user.toPlainObject(),
      accessToken,
      refreshToken,
      refreshExpiresAt,
    };
  }

  async rotateRefreshToken(
    refreshToken: string,
    userAgent?: string,
    ip?: string
  ): Promise<RotateTokenResultDTO> {
    const verified = this.tokenService.verifyRefreshToken(refreshToken);
    if (!verified) {
      throw new InvalidTokenException("Refresh token verification failed");
    }

    const userId = verified.sub;

    const found = await this.refreshTokenRepository.findValidByUserIdAndToken(
      userId,
      refreshToken
    );
    if (!found) {
      throw new TokenNotFoundException();
    }

    // Rotate: create new, revoke old
    const newRefresh = this.tokenService.signRefreshToken({ sub: userId });
    const refreshTtl = this.configService.getJwtRefreshTtl();
    const newExpiresAt = new Date(Date.now() + ms(refreshTtl));

    await this.refreshTokenRepository.replace(
      found.id,
      userId,
      newRefresh,
      newExpiresAt,
      userAgent,
      ip
    );

    const newAccess = this.tokenService.signAccessToken({ sub: userId });

    return {
      accessToken: newAccess,
      refreshToken: newRefresh,
      refreshExpiresAt: newExpiresAt,
    };
  }

  async getCurrentUser(accessToken: string): Promise<GetCurrentUserResultDTO> {
    if (!accessToken) {
      return { user: null };
    }

    const payload = this.tokenService.verifyAccessToken(accessToken);
    if (!payload) {
      return { user: null };
    }

    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      return { user: null };
    }

    return {
      user: user.toPlainObject(),
    };
  }

  async signOut(accessToken: string): Promise<void> {
    if (!accessToken) {
      return;
    }

    const payload = this.tokenService.verifyAccessToken(accessToken);
    if (payload) {
      await this.refreshTokenRepository.revokeAllForUser(payload.sub);
    }
  }
}
