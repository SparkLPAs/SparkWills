import type Stripe from "stripe";
import { unstable_cache } from "next/cache";
import { getStripe, stripeConfigured } from "@/lib/stripe/stripe-server";
import { PRICING } from "@/lib/constants";

export interface DisplayPrice {
  label: string;
  price: string; // formatted, e.g. "£39"
  cadence: string; // "one-time" | "/year" | "/month"
}

export interface DisplayPrices {
  single: DisplayPrice;
  mirror: DisplayPrice;
  /** true when the amounts came live from Stripe; false = fallback constants. */
  live: boolean;
}

const CURRENCY_SYMBOL: Record<string, string> = {
  gbp: "£",
  usd: "$",
  eur: "€",
};

function formatAmount(unitAmount: number | null, currency: string): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? currency.toUpperCase() + " ";
  const value = (unitAmount ?? 0) / 100;
  const str = Number.isInteger(value) ? value.toString() : value.toFixed(2);
  return `${symbol}${str}`;
}

function cadenceOf(price: Stripe.Price): string {
  if (price.type === "recurring" && price.recurring) {
    return `/${price.recurring.interval}`;
  }
  return "one-time";
}

function productName(price: Stripe.Price, fallback: string): string {
  const product = price.product;
  if (product && typeof product === "object" && "name" in product && product.name) {
    return product.name as string;
  }
  return fallback;
}

/**
 * Returns the prices to display on the payment gate. When Stripe is configured
 * with real keys + price IDs, the amounts (and product names) are pulled live
 * from Stripe; otherwise it falls back to the constants in lib/constants.ts.
 */
async function fetchDisplayPrices(): Promise<DisplayPrices> {
  const fallback: DisplayPrices = {
    single: { ...PRICING.single },
    mirror: { ...PRICING.mirror },
    live: false,
  };

  const singleId = process.env.STRIPE_PRICE_ID_SINGLE;
  const mirrorId = process.env.STRIPE_PRICE_ID_MIRROR;
  if (!stripeConfigured || !singleId || !mirrorId) return fallback;

  try {
    const stripe = getStripe();
    const [single, mirror] = await Promise.all([
      stripe.prices.retrieve(singleId, { expand: ["product"] }),
      stripe.prices.retrieve(mirrorId, { expand: ["product"] }),
    ]);

    return {
      single: {
        label: productName(single, PRICING.single.label),
        price: formatAmount(single.unit_amount, single.currency),
        cadence: cadenceOf(single),
      },
      mirror: {
        label: productName(mirror, PRICING.mirror.label),
        price: formatAmount(mirror.unit_amount, mirror.currency),
        cadence: cadenceOf(mirror),
      },
      live: true,
    };
  } catch (err) {
    console.error("Failed to load live Stripe prices, using fallback:", err);
    return fallback;
  }
}

/**
 * Cached wrapper — repeat views reuse the last result for up to an hour instead
 * of calling Stripe each time. Tune `revalidate` (seconds) to taste; a Stripe
 * `price.updated` webhook could call revalidateTag for instant refresh later.
 */
export const getDisplayPrices = unstable_cache(
  fetchDisplayPrices,
  ["stripe-display-prices"],
  { revalidate: 3600, tags: ["stripe-prices"] },
);
