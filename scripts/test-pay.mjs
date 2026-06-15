// One-off: proves the Stripe TEST account processes the 4242 card by creating
// and confirming a £69 PaymentIntent with the pm_card_visa test token. This is a
// standalone charge (not tied to a Checkout Session) — it confirms card
// processing works; the in-app checkout uses the hosted page.
import { promises as fs } from "fs";
import Stripe from "stripe";

const env = await fs.readFile(".env.local", "utf8");
const key = env.match(/STRIPE_SECRET_KEY="?(sk_[^"\n\r]+)"?/)[1];
const stripe = new Stripe(key);

const pi = await stripe.paymentIntents.create({
  amount: 6900,
  currency: "gbp",
  payment_method: "pm_card_visa",
  confirm: true,
  description: "SparkWills test — mirror wills (4242 verification)",
  automatic_payment_methods: { enabled: true, allow_redirects: "never" },
});

console.log("PaymentIntent:", pi.id);
console.log("Status:", pi.status); // expect "succeeded"
console.log("Amount:", `£${(pi.amount / 100).toFixed(2)} ${pi.currency.toUpperCase()}`);
