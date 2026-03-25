/**
 * Configuration Service Interface
 * Provides configuration values without exposing implementation details.
 */
export interface IConfigurationService {
  getJwtRefreshTtl(): string;
  getJwtAccessTtl(): string;
  getJwtAccessSecret(): string;
  getJwtRefreshSecret(): string;
  getCookieDomain(): string | undefined;
  getCookieSecure(): boolean;
  getGoogleClientId(): string;
  getDatabaseUrl(): string;
  getNodeEnv(): string;
  getPort(): string;
  getFrontendOrigin(): string;
}

