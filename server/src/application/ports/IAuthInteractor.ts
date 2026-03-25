import {
  SignInResultDTO,
  RotateTokenResultDTO,
  GetCurrentUserResultDTO,
} from "../dto/AuthDTO";

export interface IAuthInteractor {
  authenticateWithOAuth(
    token: string,
    userAgent?: string,
    ip?: string
  ): Promise<SignInResultDTO>;
  rotateRefreshToken(
    refreshToken: string,
    userAgent?: string,
    ip?: string
  ): Promise<RotateTokenResultDTO>;
  getCurrentUser(accessToken: string): Promise<GetCurrentUserResultDTO>;
  signOut(accessToken: string): Promise<void>;
}
