import { NextRequest, NextResponse } from "next/server";
import { getStripe, stripeConfigured } from "@/lib/stripe/stripe-server";
import { getSparkLegalStripe, sparkLegalStripeConfigured } from "@/lib/stripe/sparklegal-stripe";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { siteConfig } from "@/config/site.config";
import { getSparkLegalRouting } from "@/lib/sparklegal";

// Revenue Ops Dashboard pipeline this app's payments belong to.
const PIPELINE_ID = "sparkwills";

export async function POST(req: NextRequest) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (!stripeConfigured) {
    return NextResponse.json(
      { error: "Stripe is not configured. Add test keys to .env.local." },
      { status: 503 },
    );
  }

  const { priceId, projectId, planType, storageRequested } = await req.json();

  // Price is determined by the will type chosen in the wizard: single or mirror.
  const expectedPriceId =
    planType === "mirror"
      ? process.env.STRIPE_PRICE_ID_MIRROR
      : process.env.STRIPE_PRICE_ID_SINGLE;
  if (!priceId || priceId !== expectedPriceId) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  // Optional storage add-on — a £1.99/month recurring subscription. When chosen,
  // the whole checkout switches to subscription mode and the one-off will price is
  // added to the first invoice.
  const storagePriceId = process.env.STRIPE_PRICE_ID_STORAGE;
  const addStorage = Boolean(storageRequested) && !!storagePriceId;

  // The will price only (excludes storage) — recorded as the "transaction" in the
  // revenue dashboard, so a bundled first month of storage isn't double-counted.
  const txnAmount =
    Number(
      String(
        planType === "mirror"
          ? siteConfig.pricing.mirror.price
          : siteConfig.pricing.single.price,
      ).replace(/[^0-9.]/g, ""),
    ) || 0;
  const productLabel = planType === "mirror" ? "Mirror wills" : "Single will";

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Storage is the only recurring item. With storage, run a subscription and put
  // the one-off will on the first invoice; without it, a plain one-time payment.
  const isSubscription = addStorage;

  // A SparkLegal partner's referred client, where that partner has chosen to
  // charge for SparkWills through their own connected Stripe account.
  // Checked live (never cached — a partner's choice can change at any time;
  // never trusted from client input either, for the same reason Stripe
  // Connect routing is a server-side-only decision).
  const routing = user.referralCode ? await getSparkLegalRouting(user.referralCode) : null;
  if (routing?.paymentEnabled && routing.connectedAccountId) {
    if (!sparkLegalStripeConfigured) {
      return NextResponse.json({ error: "SparkLegal payments aren't configured yet" }, { status: 503 });
    }
    const sparkLegalStripe = getSparkLegalStripe();

    // This is a different Stripe account from the one priceId/storagePriceId
    // were created in — those IDs don't exist here, so the line item is
    // built inline instead. The storage add-on isn't offered on this path —
    // it's a separate recurring product of Spark's own, not something a
    // partner's connected account should be collecting for.
    const checkoutSession = await sparkLegalStripe.checkout.sessions.create({
      customer_email: user.email,
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(txnAmount * 100),
            product_data: { name: `${productLabel} — ${siteConfig.business.name}` },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/projects/${projectId}/download?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/projects/${projectId}/preview?cancelled=true`,
      metadata: { userId: user.id, projectId: projectId || "", planType, storageRequested: "false", product: "wills" },
      payment_intent_data: { transfer_data: { destination: routing.connectedAccountId } },
      billing_address_collection: "auto",
    });

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url });
  }

  const stripe = getStripe();

  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ["card"],
    mode: isSubscription ? "subscription" : "payment",
    line_items: isSubscription
      ? [
          { price: storagePriceId as string, quantity: 1 },
          { price: priceId, quantity: 1 },
        ]
      : [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/projects/${projectId}/download?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXTAUTH_URL}/projects/${projectId}/preview?cancelled=true`,
    metadata: {
      userId: user.id,
      projectId: projectId || "",
      planType,
      storageRequested: addStorage ? "true" : "false",
      pipelineId: PIPELINE_ID,
      txnAmount: String(txnAmount),
      label: productLabel,
    },
    ...(isSubscription && {
      subscription_data: {
        metadata: {
          userId: user.id,
          projectId: projectId || "",
          kind: "storage",
          pipelineId: PIPELINE_ID,
          txnAmount: String(txnAmount),
          label: `${siteConfig.business.name} storage`,
        },
      },
    }),
    allow_promotion_codes: true,
    billing_address_collection: "auto",
  });

  return NextResponse.json({
    sessionId: checkoutSession.id,
    url: checkoutSession.url,
  });
}
