// Creates the SparkWills products + prices in Stripe TEST mode and prints the
// price IDs. Safe: test mode only (no real charges). Re-running creates new
// products each time, so only run once (or archive duplicates afterwards).
import { promises as fs } from "fs";
import Stripe from "stripe";

const env = await fs.readFile(".env.local", "utf8");
const m = env.match(/STRIPE_SECRET_KEY="?(sk_[^"\n\r]+)"?/);
if (!m) {
  console.error("No STRIPE_SECRET_KEY in .env.local");
  process.exit(1);
}
if (!m[1].startsWith("sk_test_")) {
  console.error(
    "Refusing to run: STRIPE_SECRET_KEY is not a test key (must start with sk_test_).",
  );
  process.exit(1);
}

const stripe = new Stripe(m[1]);

async function makePriced(name, unitAmount, recurring) {
  const product = await stripe.products.create({ name });
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: unitAmount,
    currency: "gbp",
    ...(recurring ? { recurring: { interval: "month" } } : {}),
  });
  return price;
}

const single = await makePriced("SparkWills — Single Will", 3900, false);
const mirror = await makePriced("SparkWills — Mirror Wills", 6900, false);
const storage = await makePriced("SparkWills — Secure document storage", 199, true);

console.log("\nCreated TEST prices:\n");
console.log(`  STRIPE_PRICE_ID_SINGLE=${single.id}    (£39 one-time)`);
console.log(`  STRIPE_PRICE_ID_MIRROR=${mirror.id}    (£69 one-time)`);
console.log(`  STRIPE_PRICE_ID_STORAGE=${storage.id}    (£1.99/month)`);
console.log("\nDone.");
