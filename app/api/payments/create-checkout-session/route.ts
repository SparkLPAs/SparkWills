import { NextRequest, NextResponse } from "next/server";
import { getStripe, stripeConfigured } from "@/lib/stripe/stripe-server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";

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

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
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

  // Storage is the only recurring item. With storage, run a subscription and put
  // the one-off will on the first invoice; without it, a plain one-time payment.
  const isSubscription = addStorage;

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
    },
    ...(isSubscription && {
      subscription_data: {
        metadata: {
          userId: user.id,
          projectId: projectId || "",
          kind: "storage",
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
