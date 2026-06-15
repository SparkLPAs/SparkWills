"use client";

import { useState } from "react";

export function ConsultationForm({ source }: { source?: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/consultation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, message, source }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="card p-8 text-center">
        <p className="text-2xl">✓</p>
        <h2 className="mt-2 font-serif text-xl font-semibold text-navy-900">
          Thank you — we&apos;ll be in touch
        </h2>
        <p className="mt-2 text-navy-700">
          One of our experts will contact you shortly to arrange your
          consultation.
        </p>
      </div>
    );
  }

  const inputClass =
    "mt-1 w-full rounded-md border border-navy-200 bg-white px-3 py-2 text-navy-900 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500";

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <div>
        <label htmlFor="c-name" className="block text-sm font-medium text-navy-800">
          Your name
        </label>
        <input
          id="c-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-email" className="block text-sm font-medium text-navy-800">
            Email
          </label>
          <input
            id="c-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="c-phone" className="block text-sm font-medium text-navy-800">
            Phone <span className="text-navy-400">(optional)</span>
          </label>
          <input
            id="c-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label htmlFor="c-msg" className="block text-sm font-medium text-navy-800">
          How can we help? <span className="text-navy-400">(optional)</span>
        </label>
        <textarea
          id="c-msg"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={inputClass}
          placeholder="Tell us a little about your circumstances."
        />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Sending…" : "Request a consultation"}
      </button>
      <p className="text-center text-xs text-navy-500">
        We&apos;ll only use your details to arrange your consultation.
      </p>
    </form>
  );
}
