import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getSparkLegalStripe } from "@/lib/stripe/sparklegal-stripe";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/email";
import { documentsReadyEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

// A SEPARATE webhook from app/api/webhooks/stripe — that one is subscribed
// to SparkWills' own Stripe account; this one is subscribed to the
// SparkLegal Connect platform (spark-partner-dashboard's Stripe account),
// where a partner's destination-charge checkout session actually lives
// (see lib/sparklegal.ts / create-checkout-session's partner-routed
// branch). Filters on metadata.product === "wills" since every app that
// routes through this same platform account receives every event Stripe
// sends to its own registered endpoint, regardless of which app's session
// it was.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getSparkLegalStripe().webhooks.constructEvent(
      rawBody,
      sig,
      process.env.SPARKLEGAL_STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("SparkLegal webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Same StripeEvent table as the main webhook — Stripe event IDs are
  // globally unique, so there's no collision risk sharing it across the
  // two accounts' webhooks.
  const existing = await prisma.stripeEvent.findUnique({
    where: { stripeEventId: event.id },
  });
  if (existing?.processed) {
    return NextResponse.json({ received: true });
  }

  await prisma.stripeEvent.upsert({
    where: { stripeEventId: event.id },
    create: {
      stripeEventId: event.id,
      type: event.type,
      processed: false,
      payload: event as unknown as object,
    },
    update: {},
  });

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, projectId, planType, product } = session.metadata || {};
      if (
        product === "wills" &&
        session.payment_status === "paid" &&
        (planType === "single" || planType === "mirror") &&
        projectId
      ) {
        await prisma.willProject.update({
          where: { id: projectId },
          data: {
            paymentStatus: "paid",
            stripeSessionId: session.id,
            storageRequested: false, // not offered on the partner-routed path
            // This webhook only ever fires for a genuine destination-charge
            // payment on the partner's connected account — see this file's
            // top comment — so amount_total here is real partner revenue.
            sparkLegalAmountPaidPence: session.amount_total ?? 0,
            sparkLegalPaidAt: new Date(),
          },
        });
        if (userId) {
          const u = await prisma.user.findUnique({ where: { id: userId } });
          if (u) {
            const url = `${process.env.NEXTAUTH_URL}/projects/${projectId}/download`;
            await sendEmail(documentsReadyEmail(u.email, url, u.name ?? undefined));
          }
        }
      }
    }

    await prisma.stripeEvent.update({
      where: { stripeEventId: event.id },
      data: { processed: true },
    });
  } catch (err) {
    console.error("Error processing SparkLegal webhook event:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
