"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="h-8 w-20 animate-pulse rounded-md bg-cream-200" />;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/dashboard" className="btn-secondary">
          Dashboard
        </Link>
        <Link
          href="/account/settings"
          className="hidden text-navy-700 hover:text-navy-900 sm:inline"
        >
          Account
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="text-navy-700 hover:text-navy-900"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <Link
        href="/login"
        className="hidden text-navy-700 hover:text-navy-900 sm:inline"
      >
        Sign in
      </Link>
      <Link href="/eligibility" className="btn-primary">
        Get started
      </Link>
    </div>
  );
}
