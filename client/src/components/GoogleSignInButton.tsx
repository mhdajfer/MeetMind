// src/components/GoogleSignInButton.tsx
import React from "react";
import { useAuth } from "../auth/AuthProvider";
import Image from "next/image";

export const GoogleSignInButton: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <button
      onClick={() => signInWithGoogle()}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 8,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "#fff",
        cursor: "pointer",
      }}
      aria-label="Sign in with Google"
    >
      <Image alt="Google logo" src="/icons/google.svg" width={18} height={18} />
      <span>Sign in with Google</span>
    </button>
  );
};
