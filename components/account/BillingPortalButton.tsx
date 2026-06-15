"use client";

import { useState } from "react";

export function BillingPortalButton({ enabled }: { enabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/payments/create-portal-session", {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setError(data.error ?? "Could not open the billing portal.");
    setLoading(false);
  }

  if (!enabled) {
    return (
      <p className="text-sm text-navy-500">
        The Stripe billing portal becomes available once live payment keys are
        configured.
      </p>
    );
  }

  return (
    <div>
      <button onClick={openPortal} disabled={loading} className="btn-secondary">
        {loading ? "Opening…" : "Manage billing"}
      </button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </div>
  );
}
