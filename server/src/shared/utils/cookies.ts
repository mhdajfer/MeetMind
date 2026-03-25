export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none";
  domain?: string;
}

/**
 * Create base cookie options from configuration values.
 * Accepts parameters instead of importing config directly — pure function.
 */
export function createCookieOptions(
  secure: boolean,
  domain?: string
): CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: "strict",
    domain,
  };
}

