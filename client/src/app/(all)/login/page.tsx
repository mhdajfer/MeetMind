"use client";

import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const GOOGLE_CLIENT_ID =
  process.env.REACT_APP_GOOGLE_CLIENT_ID ||
  "875416576545-k2gm7tfa5p8cgrgo4fa9l0kh48huemlt.apps.googleusercontent.com";

export default function LoginPage() {
  const { data: session, status } = useSession();

  console.log("session");

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4 text-center text-white">
          Login Page
        </h1>
        {!session && (
          <div>
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              Sign in with Google
            </button>
            {/* <GoogleSignInButton /> */}
          </div>
        )}
      </div>
    </>
  );
}
