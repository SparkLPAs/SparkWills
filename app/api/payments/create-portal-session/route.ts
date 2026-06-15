import { NextResponse } from "next/server";
import { getStripe, stripeConfigured } from "@/lib/stripe/stripe-server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function POST() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (!stripeConfigured) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 404 },
    );
  }

  const portalSession = await getStripe().billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/account/settings`,
  });

  return NextResponse.json({ url: portalSession.url });
}
