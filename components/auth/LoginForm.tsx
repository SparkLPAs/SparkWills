"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-serif text-3xl font-bold text-navy-900">Sign in</h1>
      <p className="mt-2 text-navy-700">Welcome back. Continue your wills.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-navy-800">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-navy-800">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-navy-400">
            <span className="h-px flex-1 bg-cream-300" /> or{" "}
            <span className="h-px flex-1 bg-cream-300" />
          </div>
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="btn-secondary w-full"
          >
            Continue with Google
          </button>
        </>
      )}

      <p className="mt-6 text-center text-sm text-navy-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-navy-800 underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
