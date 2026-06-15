import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { useLocalStubs, stripeConfigured } from "@/lib/stripe/stripe-server";
import { sendEmail } from "@/lib/email/email";
import { documentsReadyEmail } from "@/lib/email/templates";

/**
 * DEV ONLY. Marks a project as paid without going through Stripe, so the
 * compile/download flow can be exercised locally. Disabled once real Stripe
 * keys are configured.
 */
export async function POST(req: NextRequest) {
  if (!useLocalStubs || stripeConfigured) {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const { projectId, storageRequested } = await req.json().catch(() => ({}));
  const project = await prisma.willProject.findUnique({
    where: { id: projectId },
  });
  if (!project || project.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.willProject.update({
    where: { id: project.id },
    data: { paymentStatus: "paid", storageRequested: Boolean(storageRequested) },
  });

  const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (fullUser) {
    const url = `${process.env.NEXTAUTH_URL}/projects/${project.id}/download`;
    await sendEmail(
      documentsReadyEmail(fullUser.email, url, fullUser.name ?? undefined),
    );
  }

  return NextResponse.json({ ok: true });
}
