import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * SparkLegal partner attribution (Aug 2026) — per-referral-code stats for
 * spark-partner-dashboard's Will Bank Value calculation.
 *
 * Counts COMPLETED projects, not paid ones — whether a SparkLegal partner's
 * client paid depends on that partner's own per-product toggle (see
 * lib/sparklegal.ts), which this stats endpoint has no reason to care
 * about. "Completed" means the documents were actually generated (status
 * compiled/executed/stored), which is the real signal of a genuine case,
 * free or paid.
 *
 * Executor choice lives inside WillProject.data (a Json blob, not its own
 * column), so it's read from each row rather than queried via a DB-level
 * filter — the per-partner dataset size is small enough that this is fine.
 *
 * Protected the same way as app/api/cron/review-reminders — a shared
 * secret, not a WillSuite-style per-partner credential, since the only
 * legitimate caller is spark-partner-dashboard itself.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.SPARKLEGAL_STATS_API_KEY;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Missing ref" }, { status: 400 });
  }

  const completedProjects = await prisma.willProject.findMany({
    where: { status: { in: ["compiled", "executed", "stored"] }, user: { referralCode: ref } },
    select: { data: true },
  });

  const recommendedExecutorProjects = completedProjects.filter(
    (p) => (p.data as { executorChoice?: string } | null)?.executorChoice === "recommended",
  ).length;

  // Real revenue, not Will Bank Value — only projects actually paid for via
  // this partner's connected Stripe account (sparkLegalPaidAt is only ever
  // set on that specific path; see app/api/webhooks/sparklegal-stripe and
  // app/projects/[id]/download). Calendar-month-to-date, UTC.
  const now = new Date();
  const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const paidThisMonth = await prisma.willProject.findMany({
    where: { sparkLegalPaidAt: { gte: firstOfMonth }, user: { referralCode: ref } },
    select: { sparkLegalAmountPaidPence: true },
  });
  const revenueThisMonthPence = paidThisMonth.reduce(
    (sum, p) => sum + (p.sparkLegalAmountPaidPence ?? 0),
    0,
  );

  return NextResponse.json({
    ref,
    completedProjects: completedProjects.length,
    recommendedExecutorProjects,
    revenueThisMonthPence,
    revenueThisMonthCount: paidThisMonth.length,
  });
}
