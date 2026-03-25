import { IConfigurationService } from "../../application/ports/IConfigurationService";
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_TTL,
  JWT_REFRESH_TTL,
  COOKIE_DOMAIN,
  COOKIE_SECURE,
  GOOGLE_CLIENT_ID,
  DATABASE_URL,
  NODE_ENV,
  PORT,
  FRONTEND_ORIGIN,
} from "../../shared/config/environment";

export class ConfigurationService implements IConfigurationService {
  getJwtRefreshTtl(): string {
    return JWT_REFRESH_TTL;
  }

  getJwtAccessTtl(): string {
    return JWT_ACCESS_TTL;
  }

  getJwtAccessSecret(): string {
    return JWT_ACCESS_SECRET;
  }

  getJwtRefreshSecret(): string {
    return JWT_REFRESH_SECRET;
  }

  getCookieDomain(): string | undefined {
    return COOKIE_DOMAIN;
  }

  getCookieSecure(): boolean {
    return COOKIE_SECURE;
  }

  getGoogleClientId(): string {
    return GOOGLE_CLIENT_ID;
  }

  getDatabaseUrl(): string {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL is not configured");
    }
    return DATABASE_URL;
  }

  getNodeEnv(): string {
    return NODE_ENV;
  }

  getPort(): string {
    return PORT;
  }

  getFrontendOrigin(): string {
    return FRONTEND_ORIGIN;
  }
}
