import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * SparkLegal partner attribution (Aug 2026) — per-referral-code stats for
 * spark-partner-dashboard's Will Bank Value calculation.
 *
 * Counts COMPLETED projects, not paid ones — a SparkLegal partner account
 * uses this product free (see lib/sparklegal.ts / User.sparkLegalFreeAccess),
 * so paymentStatus is structurally never "paid" for them; counting paid
 * projects here would always return zero regardless of how much real work
 * a partner has done. "Completed" means the documents were actually
 * generated (status compiled/executed/stored), which is the real signal of
 * a genuine case, free or paid.
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

  return NextResponse.json({
    ref,
    completedProjects: completedProjects.length,
    recommendedExecutorProjects,
  });
}
