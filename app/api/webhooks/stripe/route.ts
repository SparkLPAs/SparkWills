import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/stripe-server";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/email";
import { documentsReadyEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

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
        if (session.payment_status === "paid") {
          const { userId, projectId, planType, storageRequested } =
            session.metadata || {};
          // Both will types (single / mirror) are one-off purchases that unlock
          // the project's documents.
          if ((planType === "single" || planType === "mirror") && projectId) {
            await prisma.willProject.update({
              where: { id: projectId },
              data: {
                paymentStatus: "paid",
                stripeSessionId: session.id,
                storageRequested: storageRequested === "true",
              },
            });
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
