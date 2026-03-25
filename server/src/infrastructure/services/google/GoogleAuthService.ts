import { OAuth2Client } from "google-auth-library";
import { IOAuthProviderService } from "../../../application/ports/IOAuthProviderService";
import { OAuthProfile } from "../../../application/dto/OAuthProfile";
import { IConfigurationService } from "../../../application/ports/IConfigurationService";
import { GoogleTokenPayload } from "./GoogleTokenPayload";

export class GoogleAuthService implements IOAuthProviderService {
  private client: OAuth2Client;

  constructor(private readonly configService: IConfigurationService) {
    this.client = new OAuth2Client(this.configService.getGoogleClientId());
  }

  async verifyToken(token: string): Promise<OAuthProfile> {
    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: this.configService.getGoogleClientId(),
    });

    const payload: GoogleTokenPayload | undefined = ticket.getPayload();

    if (
      !payload ||
      !payload.email ||
      payload.email_verified === undefined ||
      !payload.sub ||
      !payload.name ||
      !payload.picture
    ) {
      throw new Error("Invalid Google token");
    }

    return {
      provider: "google",
      providerUserId: payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified,
      name: payload.name,
      picture: payload.picture,
    };
  }
}
