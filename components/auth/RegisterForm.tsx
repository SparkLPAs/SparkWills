"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Auto sign-in after successful registration.
    const signInRes = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (signInRes?.error) {
      setLoading(false);
      router.push("/login");
      return;
    }
    // Hard navigation so the server renders with the fresh session cookie.
    window.location.assign("/dashboard");
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="font-serif text-3xl font-bold text-navy-900">
        Create your account
      </h1>
      <p className="mt-2 text-navy-700">
        Your progress saves automatically as you build your wills.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-navy-800">
            Your name <span className="text-navy-400">(optional)</span>
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>
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
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
          <p className="mt-1 text-xs text-navy-500">At least 8 characters.</p>
        </div>

        {error && (
          <p className="rounded-md bg-red-50 p-3 text-sm text-danger" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-navy-800 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
