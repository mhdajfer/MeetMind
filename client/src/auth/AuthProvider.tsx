// src/auth/AuthProvider.tsx
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { loadGoogleIdentity } from "./googleLoader";
import { api, setAccessToken } from "../services/api";

type User = {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  // add enterprise fields: tenantId, roles, permissions, metadata, ...
  tenantId?: string | null;
  roles?: string[];
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
  children: React.ReactNode;
  googleClientId: string;
  backendAuthPath?: string; // default /auth/google
};

export const AuthProvider: React.FC<Props> = ({
  children,
  googleClientId,
  backendAuthPath = "/auth/google",
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // init google sdk
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadGoogleIdentity(googleClientId);
        if (!mounted) return;

        // Optionally, check session on mount
        try {
          // Try to get current session from backend (cookie-based)
          const res = await api.get("/auth/me");
          setUser(res.data?.user ?? null);
          const accessToken = res.data?.accessToken ?? null;
          if (accessToken) setAccessToken(accessToken);
        } catch {
          // not logged in
        }
      } catch (e) {
        console.error("Failed loading Google Identity SDK", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [googleClientId]);

  // Called when Google returns an ID token
  const onGoogleCredential = async (response: any) => {
    try {
      const idToken = response?.credential;
      if (!idToken) throw new Error("No credential from Google");

      // Post idToken to backend to verify + mint JWT
      // If backend sets httpOnly cookie, it may return 200 + user object.
      const res = await api.post(backendAuthPath, { id_token: idToken });

      // If backend returns tokens in body (accessToken), store in memory
      const { accessToken, user: userObj } = res.data ?? {};

      if (accessToken) {
        setAccessToken(accessToken);
      }

      setUser(userObj ?? null);
      // revoke google one-tap if you don't need it
    } catch (err) {
      console.error("Google sign-in failed", err);
      throw err;
    }
  };

  const signInWithGoogle = () => {
    const google = (window as any).google;
    if (!google?.accounts?.id) {
      throw new Error("Google Identity Services not loaded");
    }

    // You can render a popup style prompt or use one-tap / button
    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: onGoogleCredential,
      ux_mode: "popup", // popup avoids redirect; use "redirect" if you prefer
    });

    // show the popup prompt (this triggers credential callback)
    google.accounts.id.prompt(); // will show the One Tap or a chooser
    // Alternatively, render the button:
    // google.accounts.id.renderButton(document.getElementById('gbtn'), { theme: 'outline', size: 'large' });
  };

  const signOut = async () => {
    try {
      await api.post("/auth/logout");
      setUser(null);
      setAccessToken(null);
      // optionally revoke google sessions for sign out:
      // const google = (window as any).google;
      // google.accounts.id.disableAutoSelect();
    } catch (e) {
      console.error("Logout failed", e);
    }
  };

  const ctx: AuthContextValue = {
    user,
    loading,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={ctx}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
