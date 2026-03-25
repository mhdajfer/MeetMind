"use client";
import useSyncNextAuthToAppSession from "../useSyncNextAuthToAppSession";

export default function Layout({ children }: { children: React.ReactNode }) {
  useSyncNextAuthToAppSession();
  return <>{children}</>;
}
