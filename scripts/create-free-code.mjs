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

// Optional: everything it holds can be supplied through the environment instead.
const env = await fs.readFile(".env.local", "utf8").catch(() => "");

// STRIPE_SECRET_KEY from the environment wins over .env.local, so a live code
// can be created without pasting a live key into a file and having to remember
// to take it out again:
//   $env:STRIPE_SECRET_KEY="sk_live_..."; node scripts/create-free-code.mjs CODE
const fileKey = env.match(/STRIPE_SECRET_KEY="?(sk_[^"\n\r]+)"?/)?.[1];
const secretKey = process.env.STRIPE_SECRET_KEY || fileKey;
if (!secretKey || secretKey.includes("stub")) {
  console.error(
    "No real STRIPE_SECRET_KEY found (checked $env:STRIPE_SECRET_KEY, then .env.local).",
  );
  process.exit(1);
}

// Codes are per-mode: one made with a test key only works in test checkout.
const mode = secretKey.startsWith("sk_live_") ? "LIVE" : "TEST";
console.log(`Stripe mode: ${mode}${mode === "TEST" ? " (this code will NOT work for real customers)" : ""}\n`);
// Environment wins over .env.local here too, so live price IDs can be passed in
// alongside a live key without editing any files.
const idOf = (name) => {
  if (process.env[name]) return process.env[name];
  const m = env.match(new RegExp(`${name}="?(price_[^"\\n\\r]+)"?`));
  return m ? m[1] : undefined;
};

const singleId = idOf("STRIPE_PRICE_ID_SINGLE");
const mirrorId = idOf("STRIPE_PRICE_ID_MIRROR");
const storageId = idOf("STRIPE_PRICE_ID_STORAGE");
if (!singleId || !mirrorId) {
  console.error(
    "STRIPE_PRICE_ID_SINGLE and STRIPE_PRICE_ID_MIRROR must be set, in .env.local or the environment.",
  );
  process.exit(1);
}

const stripe = new Stripe(secretKey);

// Anything the Stripe API rejects (bad key, wrong mode, permissions) should read
// as one clear line, not a stack trace.
// A rejected top-level await surfaces as uncaughtException, not
// unhandledRejection — catch both so neither prints a stack trace.
const bail = (err) => {
  console.error(`Stripe error: ${err?.message ?? err}`);
  process.exit(1);
};
process.on("unhandledRejection", bail);
process.on("uncaughtException", bail);

const productOf = async (priceId) => {
  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    return typeof price.product === "string" ? price.product : price.product.id;
  } catch (err) {
    if (err?.code === "resource_missing") {
      console.error(
        `Price ${priceId} does not exist in ${mode} mode.\n` +
          (mode === "LIVE"
            ? "The price IDs in .env.local are test-mode ones. Pass the live price IDs too:\n" +
              '  $env:STRIPE_PRICE_ID_SINGLE="price_live..."  (and _MIRROR, _STORAGE)'
            : "Check the price IDs in .env.local."),
      );
      process.exit(1);
    }
    throw err;
  }
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
