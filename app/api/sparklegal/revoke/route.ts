import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * SparkLegal partner free-access revocation (Aug 2026) — called from
 * spark-partner-dashboard's Stripe webhook whenever a partner's SparkLegal
 * subscription stops being active/trialing (failed payment, cancellation).
 * Flips sparkLegalFreeAccess off for every account registered under this
 * referral code, so already-registered accounts stop working going
 * forward — new registrations are already blocked separately, since
 * verifySparkLegalReferralCode checks live status on every signup.
 *
 * Protected the same way as /api/sparklegal/stats — a shared secret, the
 * only legitimate caller is spark-partner-dashboard itself.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SPARKLEGAL_STATS_API_KEY;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const ref = req.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Missing ref" }, { status: 400 });
  }

  const result = await prisma.user.updateMany({
    where: { referralCode: ref, sparkLegalFreeAccess: true },
    data: { sparkLegalFreeAccess: false },
  });

  return NextResponse.json({ ref, revokedCount: result.count });
}
