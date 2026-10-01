// SparkLegal partner free-access verification (Aug 2026). Calls
// spark-partner-dashboard to confirm a referral code belongs to a partner
// with a currently active SparkLegal subscription, before granting free
// access — fails CLOSED (false) on any missing config, network error, or
// non-OK response, never open. A referral code alone is never sufficient;
// anyone could pass an arbitrary ?ref= value.
export async function verifySparkLegalReferralCode(referralCode: string): Promise<boolean> {
  const baseUrl = process.env.SPARK_PARTNER_DASHBOARD_URL;
  const apiKey = process.env.SPARKLEGAL_STATS_API_KEY;
  if (!baseUrl || !apiKey) return false;

  try {
    const res = await fetch(
      `${baseUrl}/api/sparklegal/verify?ref=${encodeURIComponent(referralCode)}`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" },
    );
    if (!res.ok) return false;
    const body = (await res.json()) as { valid?: boolean };
    return body.valid === true;
  } catch {
    return false;
  }
}
