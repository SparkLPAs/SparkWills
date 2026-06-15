import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/email/email";
import { reviewReminderEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";

const REVIEW_AFTER_YEARS = 3;
const REMIND_AGAIN_AFTER_YEARS = 1;

/**
 * Finds wills compiled ~3+ years ago that haven't been reminded in the last
 * year, and emails their owners a review reminder.
 *
 * Protected by CRON_SECRET — the caller must send `Authorization: Bearer <secret>`.
 * On Vercel, configure this as a Cron Job (see vercel.json); Vercel injects the
 * CRON_SECRET bearer automatically. Add `?dryRun=true` to preview without sending.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true";

  const now = new Date();
  const reviewCutoff = new Date(now);
  reviewCutoff.setFullYear(now.getFullYear() - REVIEW_AFTER_YEARS);
  const remindCutoff = new Date(now);
  remindCutoff.setFullYear(now.getFullYear() - REMIND_AGAIN_AFTER_YEARS);

  const due = await prisma.willProject.findMany({
    where: {
      status: { in: ["compiled", "executed", "stored"] },
      compiledAt: { lte: reviewCutoff },
      OR: [{ lastReminderAt: null }, { lastReminderAt: { lte: remindCutoff } }],
    },
    select: {
      id: true,
      compiledAt: true,
      user: { select: { email: true, name: true } },
    },
  });

  const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard`;
  let sent = 0;

  for (const project of due) {
    if (dryRun) continue;
    await sendEmail(
      reviewReminderEmail(
        project.user.email,
        dashboardUrl,
        project.user.name ?? undefined,
      ),
    );
    await prisma.willProject.update({
      where: { id: project.id },
      data: { lastReminderAt: now },
    });
    sent++;
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    due: due.length,
    sent,
  });
}
