// Creates a 100%-off promotion code that makes the WILL free but leaves the
// storage subscription chargeable.
//
//   node scripts/create-free-code.mjs FREEWILL [maxRedemptions]
//
// The safety here is Stripe's coupon `applies_to.products`: the coupon is bound
// to the single + mirror will products only. Storage lives on a different
// product, so the discount cannot reach it — even when a customer buys a will
// and storage together in one subscription checkout.
//
// Always create giveaway codes with this script rather than in the Stripe
// dashboard. A coupon created by hand has no product restriction unless you
// remember to add one, and an unrestricted 100%-off coupon zeroes the whole
// first invoice — handing over a free month of storage with the will.
import { promises as fs } from "fs";
import Stripe from "stripe";

const code = (process.argv[2] || "").trim().toUpperCase();
const maxRedemptions = process.argv[3] ? Number(process.argv[3]) : undefined;

if (!code) {
  console.error("Usage: node scripts/create-free-code.mjs CODE [maxRedemptions]");
  process.exit(1);
}
if (maxRedemptions !== undefined && (!Number.isInteger(maxRedemptions) || maxRedemptions < 1)) {
  console.error("maxRedemptions must be a positive whole number.");
  process.exit(1);
}

const env = await fs.readFile(".env.local", "utf8");
const key = env.match(/STRIPE_SECRET_KEY="?(sk_[^"\n\r]+)"?/);
if (!key || key[1].includes("stub")) {
  console.error("No real STRIPE_SECRET_KEY in .env.local.");
  process.exit(1);
}
const idOf = (name) => {
  const m = env.match(new RegExp(`${name}="?(price_[^"\\n\\r]+)"?`));
  return m ? m[1] : undefined;
};

const singleId = idOf("STRIPE_PRICE_ID_SINGLE");
const mirrorId = idOf("STRIPE_PRICE_ID_MIRROR");
const storageId = idOf("STRIPE_PRICE_ID_STORAGE");
if (!singleId || !mirrorId) {
  console.error("STRIPE_PRICE_ID_SINGLE and STRIPE_PRICE_ID_MIRROR must be set in .env.local.");
  process.exit(1);
}

const stripe = new Stripe(key[1]);

const productOf = async (priceId) => {
  const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
  return typeof price.product === "string" ? price.product : price.product.id;
};

const willProducts = [...new Set(await Promise.all([productOf(singleId), productOf(mirrorId)]))];

// Refuse to build the coupon if storage shares a product with the wills —
// applies_to works at product level, so that would leak the discount onto it.
if (storageId) {
  const storageProduct = await productOf(storageId);
  if (willProducts.includes(storageProduct)) {
    console.error(
      `Storage price ${storageId} shares product ${storageProduct} with a will price.\n` +
        "Give storage its own Stripe product, otherwise a will discount also discounts storage.",
    );
    process.exit(1);
  }
}

const coupon = await stripe.coupons.create({
  name: `Free will — ${code}`,
  percent_off: 100,
  // "once" so a code redeemed inside a storage subscription discounts only the
  // first invoice's will line, never the recurring storage months.
  duration: "once",
  applies_to: { products: willProducts },
});

const promo = await stripe.promotionCodes.create({
  coupon: coupon.id,
  code,
  ...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
});

console.log(`Created promotion code ${promo.code}`);
console.log(`  coupon:     ${coupon.id} (100% off, once)`);
console.log(`  applies to: ${willProducts.join(", ")} (wills only)`);
console.log(`  storage:    not discounted — still charged at the normal rate`);
console.log(
  `  redemptions: ${maxRedemptions ? `limited to ${maxRedemptions}` : "unlimited (set a limit as the 2nd argument)"}`,
);
console.log("\nCustomers enter this code on the Stripe checkout page.");
