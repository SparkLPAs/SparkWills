import type Stripe from "stripe";
import type { PaymentStatus } from "@/lib/constants";

/**
 * Resolve the `paymentStatus` a Stripe Checkout Session should produce, or null
 * if the session has not actually settled and must not unlock anything.
 *
 * The subtlety this exists for: when a 100%-off promotion code covers the whole
 * order, Stripe never reports `payment_status: "paid"` — there is no payment to
 * make, so it reports `no_payment_required` with `amount_total: 0`. Gating on
 * "paid" alone silently locks the customer out of the thing you just gave them.
 *
 * A settled session worth £0 is recorded as "comped" rather than "paid" so that
 * revenue counts don't book list price for a giveaway.
 */
export function settledStatusFor(
  session: Stripe.Checkout.Session,
): PaymentStatus | null {
  const settled =
    session.payment_status === "paid" ||
    session.payment_status === "no_payment_required";
  if (!settled) return null;

  return (session.amount_total ?? 0) === 0 ? "comped" : "paid";
}
