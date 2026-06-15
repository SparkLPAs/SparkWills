"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DisplayPrices } from "@/lib/stripe/prices";
import { siteConfig } from "@/config/site.config";

export function PaymentGate({
  projectId,
  willType,
  stripeConfigured,
  prices,
}: {
  projectId: string;
  willType: "single" | "mirror";
  stripeConfigured: boolean;
  prices: DisplayPrices;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [storageRequested, setStorageRequested] = useState(false);

  const storage = siteConfig.storage;
  const plan = willType === "mirror" ? prices.mirror : prices.single;

  async function handleCheckout() {
    setLoading("pay");
    setError(null);
    const priceId =
      willType === "mirror"
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_MIRROR
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_SINGLE;

    const res = await fetch("/api/payments/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId, projectId, planType: willType, storageRequested }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setError(data.error ?? "Could not start checkout.");
    setLoading(null);
  }

  async function devComplete() {
    setLoading("dev");
    const res = await fetch("/api/payments/dev-complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, storageRequested }),
    });
    if (res.ok) {
      router.push(`/projects/${projectId}/download`);
      return;
    }
    setError("Dev bypass failed.");
    setLoading(null);
  }

  return (
    <div>
      <div className="mx-auto max-w-md">
        <div className="card flex flex-col p-6">
          <h3 className="font-serif text-lg font-semibold text-navy-800">
            {plan.label}
          </h3>
          <p className="mt-2 font-serif text-3xl font-bold text-navy-900">
            {plan.price}{" "}
            <span className="text-base font-normal text-navy-500">
              {plan.cadence}
            </span>
          </p>
          <ul className="mt-4 flex-1 space-y-2 text-sm text-navy-700">
            <li>
              {willType === "mirror"
                ? "✓ Both mirror wills + all documents"
                : "✓ Your will + all documents"}
            </li>
            <li>✓ Download as PDF &amp; ZIP</li>
            <li>✓ Signing &amp; storage guides</li>
            <li>✓ One-off payment — no subscription</li>
          </ul>
          <button
            onClick={handleCheckout}
            disabled={!!loading || !stripeConfigured}
            className="btn-primary mt-6"
          >
            {loading === "pay" ? "Redirecting…" : `Pay ${plan.price}`}
          </button>
        </div>
      </div>

      {/* Storage add-on */}
      {storage.enabled && (
        <label className="mx-auto mt-6 flex max-w-md cursor-pointer items-start gap-3 rounded-lg border border-navy-200 bg-cream-50 p-4">
          <input
            type="checkbox"
            checked={storageRequested}
            onChange={(e) => setStorageRequested(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-navy-300 text-navy-800 focus:ring-navy-500"
          />
          <span className="text-sm text-navy-800">
            <span className="font-semibold">
              Add {storage.label} — {storage.price}
              <span className="font-normal text-navy-500">{storage.cadence}</span>
            </span>
            <span className="mt-0.5 block text-navy-600">{storage.blurb}</span>
          </span>
        </label>
      )}

      {error && (
        <p className="mx-auto mt-4 max-w-md rounded-md bg-red-50 p-3 text-sm text-danger">
          {error}
        </p>
      )}

      <p className="mt-4 text-center text-xs text-navy-500">
        Payments are processed securely by Stripe. We never store your card details.
      </p>

      {!stripeConfigured && (
        <div className="mx-auto mt-6 max-w-md rounded-lg border border-dashed border-navy-300 bg-cream-100 p-4 text-center">
          <p className="text-sm font-medium text-navy-700">
            Developer mode — Stripe test keys not configured
          </p>
          <p className="mt-1 text-xs text-navy-500">
            Add real Stripe test keys to <code>.env.local</code> to exercise live
            checkout. For now you can simulate a successful payment to continue.
          </p>
          <button
            onClick={devComplete}
            disabled={!!loading}
            className="btn-secondary mt-3"
          >
            {loading === "dev"
              ? "Processing…"
              : `Simulate payment (dev)${storageRequested ? " + storage" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
