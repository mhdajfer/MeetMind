import type { NextAuthOptions, Profile } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    Google({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_ID || "",
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_AUTH_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.provider = account.provider;
      }
      if (account?.provider === "google") {
        const picture = (
          profile as (Profile & { picture?: string }) | null | undefined
        )?.picture;
        if (typeof picture === "string" && !("picture" in token)) {
          (token as JWT & { picture?: string }).picture = picture;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.image = token.picture as string;
      }
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      return session;
    },
  },
};
