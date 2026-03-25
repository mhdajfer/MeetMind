// src/hooks/useSyncNextAuthToAppSession.ts
"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

/**
 * After NextAuth sign-in completes on the client, exchange the NextAuth ID token with your Express backend.
 * Backend will verify the id_token with Google and set HttpOnly cookies (access + refresh).
 * We call it once per session.
 */
export default function useSyncNextAuthToAppSession() {
  const { data: session, status } = useSession();
  const calledRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (status === "authenticated" && !calledRef.current) {
        try {
          const idToken = (session as any)?.idToken;
          if (!idToken) {
            console.warn(
              "No idToken present in NextAuth session; ensure auth.ts stores idToken in jwt callback."
            );
            calledRef.current = true; // avoid infinite attempts
            return;
          }

          // POST to your Express backend to exchange id_token for app tokens (cookies)
          const resp = await fetch(
            `${
              process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000"
            }/auth/google`,
            {
              method: "POST",
              credentials: "include",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token: idToken }),
            }
          );

          if (!resp.ok) {
            console.error(
              "session-to-backend exchange failed",
              await resp.text()
            );
            console.log("response from backend but error /auth/google :", resp);
            // Optionally sign out local session or show error
          } else {
            console.log("response from backend /auth/google :", resp);
            // success: backend set HttpOnly cookies
          }
        } catch (err) {
          console.error("Failed to sync NextAuth session to backend", err);
        } finally {
          calledRef.current = true;
        }
      }

      if (status === "unauthenticated") {
        calledRef.current = false;
      }
    };

    run();
  }, [status, session]);
}
