// SparkLegal partner payment routing (Oct 2026). Calls spark-partner-dashboard
// live, every time it matters (checkout, never cached at registration — a
// partner's toggle can change at any time), to find out: is this referral
// code's partner genuinely subscribed to SparkLegal, and have they chosen to
// charge for SparkWills specifically through their own connected Stripe
// account? Fails CLOSED on any missing config, network error, or non-OK
// response — a referral code alone is never sufficient, and a failure here
// must never accidentally make something free or misroute a payment.
export interface SparkLegalRouting {
  subscribed: boolean;
  paymentEnabled: boolean;
  connectedAccountId: string | null;
}

const CLOSED: SparkLegalRouting = { subscribed: false, paymentEnabled: false, connectedAccountId: null };

export async function getSparkLegalRouting(referralCode: string): Promise<SparkLegalRouting> {
  const baseUrl = process.env.SPARK_PARTNER_DASHBOARD_URL;
  const apiKey = process.env.SPARKLEGAL_STATS_API_KEY;
  if (!baseUrl || !apiKey) return CLOSED;

  try {
    const res = await fetch(
      `${baseUrl}/api/sparklegal/verify?ref=${encodeURIComponent(referralCode)}&product=wills`,
      { headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store" },
    );
    if (!res.ok) return CLOSED;
    const body = (await res.json()) as Partial<SparkLegalRouting>;
    return {
      subscribed: body.subscribed === true,
      paymentEnabled: body.paymentEnabled === true,
      connectedAccountId: body.paymentEnabled === true ? body.connectedAccountId ?? null : null,
    };
  } catch {
    return CLOSED;
  }
}
