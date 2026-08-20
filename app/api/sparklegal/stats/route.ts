import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * SparkLegal partner attribution (Aug 2026) — per-referral-code stats for
 * spark-partner-dashboard's Will Bank Value calculation. Only paid projects
 * count (matches app/admin/page.tsx's own "paidProjects" definition);
 * executor choice lives inside WillProject.data (a Json blob, not its own
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

  const paidProjects = await prisma.willProject.findMany({
    where: { paymentStatus: "paid", user: { referralCode: ref } },
    select: { data: true },
  });

  const recommendedExecutorProjects = paidProjects.filter(
    (p) => (p.data as { executorChoice?: string } | null)?.executorChoice === "recommended",
  ).length;

  return NextResponse.json({
    ref,
    paidProjects: paidProjects.length,
    recommendedExecutorProjects,
  });
}
