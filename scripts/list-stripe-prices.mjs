// Lists Stripe prices (test mode) so we can grab the price IDs.
import { promises as fs } from "fs";
import Stripe from "stripe";

const env = await fs.readFile(".env.local", "utf8");
const m = env.match(/STRIPE_SECRET_KEY="?(sk_[^"\n\r]+)"?/);
if (!m || m[1].includes("stub")) {
  console.error(
    "No real STRIPE_SECRET_KEY found in .env.local (still a stub). " +
      "Paste your SparkWills test secret key into .env.local first.",
  );
  process.exit(1);
}

const stripe = new Stripe(m[1]);
const prices = await stripe.prices.list({ limit: 100, expand: ["data.product"] });

if (prices.data.length === 0) {
  console.log("No prices found — create the products in Stripe first.");
} else {
  console.log("Your Stripe prices:\n");
  for (const p of prices.data) {
    if (!p.active) continue;
    const amount = p.unit_amount != null ? (p.unit_amount / 100).toFixed(2) : "?";
    const rec = p.recurring ? `/${p.recurring.interval}` : "one-time";
    const prod =
      p.product && typeof p.product === "object" && "name" in p.product
        ? p.product.name
        : p.product;
    console.log(`  ${p.id}   ${p.currency.toUpperCase()} ${amount} ${rec}   — ${prod}`);
  }
}
await Promise.resolve();
