import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/stripe-server";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/email";
import { documentsReadyEmail } from "@/lib/email/templates";
import { settledStatusFor } from "@/lib/payments/checkout-outcome";

export const dynamic = "force-dynamic";

/**
 * Rewrite a completed session's `txnAmount` metadata to the amount Stripe
 * actually collected. It is set at session-creation time from list price, which
 * is stale the moment a promotion code is applied at checkout — including a
 * 100%-off code, where the real figure is 0.
 */
async function reconcileTxnAmount(session: Stripe.Checkout.Session) {
  const actual = ((session.amount_total ?? 0) / 100).toString();
  if (session.metadata?.txnAmount === actual) return;
  try {
    await getStripe().checkout.sessions.update(session.id, {
      metadata: { ...(session.metadata || {}), txnAmount: actual },
    });
  } catch (err) {
    // Non-fatal: access has already been granted, this only affects reporting.
    console.error("Could not reconcile txnAmount for", session.id, err);
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency — skip if already processed.
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
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        // "paid" or, when a 100%-off promotion code covers the order,
        // "no_payment_required" — the latter settles as "comped".
        const settledStatus = settledStatusFor(session);
        if (settledStatus) {
          const { userId, projectId, planType, storageRequested } =
            session.metadata || {};
          // Both will types (single / mirror) are one-off purchases that unlock
          // the project's documents.
          if ((planType === "single" || planType === "mirror") && projectId) {
            await prisma.willProject.update({
              where: { id: projectId },
              data: {
                paymentStatus: settledStatus,
                stripeSessionId: session.id,
                storageRequested: storageRequested === "true",
              },
            });

            // The session's txnAmount metadata was set to list price before the
            // customer had a chance to enter a discount code. Correct it to what
            // was actually collected so the revenue dashboard doesn't book list
            // price for a giveaway.
            await reconcileTxnAmount(session);

            if (userId) {
              const u = await prisma.user.findUnique({ where: { id: userId } });
              if (u) {
                const url = `${process.env.NEXTAUTH_URL}/projects/${projectId}/download`;
                await sendEmail(
                  documentsReadyEmail(u.email, url, u.name ?? undefined),
                );
              }
            }
          }
        }
        break;
      }

      // Storage is the only subscription. These only toggle the project's storage
      // flag — they must never grant document access (that comes from the one-off
      // will payment above).
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        if (sub.metadata?.kind !== "storage" || !sub.metadata?.projectId) break;
        const isActive = ["active", "trialing"].includes(sub.status);
        await prisma.willProject.update({
          where: { id: sub.metadata.projectId },
          data: { storageRequested: isActive },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        if (sub.metadata?.kind !== "storage" || !sub.metadata?.projectId) break;
        await prisma.willProject.update({
          where: { id: sub.metadata.projectId },
          data: { storageRequested: false },
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: invoice.customer as string },
        });
        if (user) console.log(`Payment failed for user ${user.email}`);
        break;
      }
    }

    await prisma.stripeEvent.update({
      where: { stripeEventId: event.id },
      data: { processed: true },
    });
  } catch (err) {
    console.error("Error processing webhook event:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
