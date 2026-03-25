export type OAuthProvider = "google" | "github" | "apple";

export interface OAuthProfile {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

