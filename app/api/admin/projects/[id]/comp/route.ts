import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getAdminUser } from "@/lib/auth/admin";
import { sendEmail } from "@/lib/email/email";
import { documentsReadyEmail } from "@/lib/email/templates";

/**
 * PATCH /api/admin/projects/:id/comp — grant or revoke free access.
 *
 * Body: { comped: boolean }
 *
 * Granting sets paymentStatus to "comped", which unlocks the documents exactly
 * like a payment while keeping the project out of revenue counts. Use this to
 * gift a will to a specific person; for codes you hand out to many people,
 * create a 100%-off promotion code in Stripe instead.
 *
 * Revoking only ever touches a comped project — a real payment is never undone
 * here, since that would take away something the customer actually bought.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const comped = Boolean(body.comped);

  const project = await prisma.willProject.findUnique({
    where: { id: params.id },
    include: { user: true },
  });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (comped) {
    if (project.paymentStatus === "paid") {
      return NextResponse.json(
        { error: "Project is already paid for — nothing to comp." },
        { status: 409 },
      );
    }
    if (project.paymentStatus === "comped") {
      return NextResponse.json({ ok: true, paymentStatus: "comped" });
    }

    await prisma.willProject.update({
      where: { id: project.id },
      data: { paymentStatus: "comped" },
    });

    // Same "your documents are ready" nudge a paying customer gets.
    const url = `${process.env.NEXTAUTH_URL}/projects/${project.id}/download`;
    await sendEmail(
      documentsReadyEmail(
        project.user.email,
        url,
        project.user.name ?? undefined,
      ),
    ).catch((err) => {
      // Access is granted either way — don't fail the request on a mail error.
      console.error("Comp granted but notification email failed:", err);
    });

    return NextResponse.json({ ok: true, paymentStatus: "comped" });
  }

  if (project.paymentStatus !== "comped") {
    return NextResponse.json(
      { error: "Only comped access can be revoked." },
      { status: 409 },
    );
  }

  await prisma.willProject.update({
    where: { id: project.id },
    data: { paymentStatus: "unpaid" },
  });

  return NextResponse.json({ ok: true, paymentStatus: "unpaid" });
}
