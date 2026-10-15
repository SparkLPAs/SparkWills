import Stripe from "stripe";

// A completely separate Stripe account from lib/stripe/stripe-server.ts
// (SparkWills' own payments) — this is the SparkLegal Connect platform
// (spark-partner-dashboard), where a partner connects an account to
// receive destination charges directly. A checkout session routed to a
// partner must be created with THIS client, not the normal one — the
// connected account doesn't exist from the normal account's perspective,
// and its own pre-created Price IDs aren't valid here either (see
// create-checkout-session's use of price_data instead of priceId).
export const sparkLegalStripeConfigured =
  !!process.env.SPARKLEGAL_STRIPE_SECRET_KEY &&
  (process.env.SPARKLEGAL_STRIPE_SECRET_KEY.startsWith("sk_") ||
    process.env.SPARKLEGAL_STRIPE_SECRET_KEY.startsWith("rk_"));

let _sparkLegalStripe: Stripe | null = null;

export function getSparkLegalStripe(): Stripe {
  if (!process.env.SPARKLEGAL_STRIPE_SECRET_KEY) {
    throw new Error("SPARKLEGAL_STRIPE_SECRET_KEY is not set");
  }
  if (!_sparkLegalStripe) {
    _sparkLegalStripe = new Stripe(process.env.SPARKLEGAL_STRIPE_SECRET_KEY, { typescript: true });
  }
  return _sparkLegalStripe;
}
