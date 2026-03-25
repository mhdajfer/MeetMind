import { OAuthProfile } from "../dto/OAuthProfile";

export interface IOAuthProviderService {
  verifyToken(token: string): Promise<OAuthProfile>;
}

