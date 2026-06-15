import Stripe from "stripe";

/** True when a real Stripe secret key is set (standard `sk_` or restricted `rk_`). */
export const stripeConfigured =
  !!process.env.STRIPE_SECRET_KEY &&
  (process.env.STRIPE_SECRET_KEY.startsWith("sk_") ||
    process.env.STRIPE_SECRET_KEY.startsWith("rk_")) &&
  !process.env.STRIPE_SECRET_KEY.includes("stub");

/** True when local stubs are enabled (no live external services). */
export const useLocalStubs = process.env.USE_LOCAL_STUBS === "true";

// Instantiated lazily so a missing/stub key never crashes the whole app at import.
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
  }
  return _stripe;
}
