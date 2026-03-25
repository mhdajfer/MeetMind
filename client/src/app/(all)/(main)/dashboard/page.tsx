"use client";

import { signOut, useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();
  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8">
        <h1 className="text-2xl font-bold mb-4 text-center">Dashboard</h1>
        <p>Signed in as {session?.user?.email}</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-4 px-5 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
        >
          Sign out
        </button>
      </div>
    </>
  );
}
