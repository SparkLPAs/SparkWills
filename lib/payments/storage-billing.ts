import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/stripe-server";

/**
 * Storage is the one thing that must always be paid for. Wills can be given
 * away with a 100%-off promotion code; the £1.99/month storage subscription
 * never can.
 *
 * scripts/create-free-code.mjs already builds giveaway coupons restricted to
 * the will products via `applies_to`, so a code made that way cannot touch
 * storage. This is the backstop for a coupon created by hand in the Stripe
 * dashboard, where the product restriction is easy to forget.
 *
 * The rule is deliberately narrow — a discount is removed only when it both:
 *   1. can reach the storage product (no `applies_to` restriction, or one that
 *      names storage), and
 *   2. outlives the first invoice (`duration` is not "once").
 *
 * Condition 2 matters for correctness, not just caution. A "once" coupon can
 * only affect the first invoice, which is already finalised by the time this
 * runs — stripping it then would race the will discount the customer was
 * legitimately given, and could re-bill them for the free will. Anything that
 * recurs, though, would hand over storage month after month, so it goes.
 */
export function wouldGiveStorageAway(
  coupon: Pick<Stripe.Coupon, "applies_to" | "duration">,
  storageProduct: string,
): boolean {
  const limitedTo = coupon.applies_to?.products;
  const reachesStorage =
    !limitedTo || limitedTo.length === 0 || limitedTo.includes(storageProduct);

  // A "once" coupon can only touch the already-finalised first invoice.
  return reachesStorage && coupon.duration !== "once";
}

export async function enforceStorageIsCharged(
  subscriptionId: string,
): Promise<void> {
  const storagePriceId = process.env.STRIPE_PRICE_ID_STORAGE;
  if (!storagePriceId) return;

  const stripe = getStripe();

  const [sub, storagePrice] = await Promise.all([
    stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["discounts.source.coupon"],
    }),
    stripe.prices.retrieve(storagePriceId),
  ]);

  const discounts = sub.discounts ?? [];
  if (discounts.length === 0) return;

  const storageProduct =
    typeof storagePrice.product === "string"
      ? storagePrice.product
      : storagePrice.product.id;

  const couponOf = (d: string | Stripe.Discount): Stripe.Coupon | null => {
    if (typeof d === "string") return null; // not expanded — can't judge it
    const coupon = d.source?.coupon;
    return coupon && typeof coupon !== "string" ? coupon : null;
  };

  const offending = discounts.filter((d) => {
    const coupon = couponOf(d);
    return coupon ? wouldGiveStorageAway(coupon, storageProduct) : false;
  });

  if (offending.length === 0) return;

  console.error(
    `Storage subscription ${sub.id} carried a recurring discount that would ` +
      `have given storage away free (coupons: ` +
      `${offending.map((d) => couponOf(d)?.id ?? "unknown").join(", ")}). ` +
      `Removing it so storage bills at the normal rate. Create giveaway codes ` +
      `with scripts/create-free-code.mjs, which restricts them to the wills.`,
  );

  await stripe.subscriptions.deleteDiscount(sub.id);
}
