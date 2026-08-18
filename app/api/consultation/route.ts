import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { isLikelySpam } from "@/lib/spam-check";

const Schema = z.object({
  name: z.string().min(1, "Please enter your name").max(120),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().max(40).optional(),
  message: z.string().max(2000).optional(),
  source: z.string().max(40).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  // Checked before real validation, on the raw body — honeypot/renderedAt
  // aren't part of Schema, they're spam signals only. A fake "success"
  // response (no DB row, no CRM push) avoids tipping a bot off that it
  // was filtered.
  if (body && isLikelySpam(body)) {
    console.log("[consultation] Blocked a likely-spam submission");
    return NextResponse.json({ ok: true });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const user = await getSessionUser();

  const request = await prisma.consultationRequest.create({
    data: {
      name: parsed.data.name.trim(),
      email: parsed.data.email.toLowerCase().trim(),
      phone: parsed.data.phone?.trim() || null,
      message: parsed.data.message?.trim() || null,
      source: parsed.data.source || null,
      userId: user?.id ?? null,
    },
  });

  // In production this would notify the team via Resend; stubbed locally.
  console.log(
    `[consultation] New request ${request.id} from ${request.email} (source: ${request.source ?? "n/a"})`,
  );

  // Best-effort: also send this lead into the internal CRM leads board.
  try {
    const crmUrl = process.env.CRM_LEADS_URL;
    const crmSecret = process.env.LEADS_INBOUND_SECRET;
    if (crmUrl && crmSecret) {
      await fetch(crmUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${crmSecret}` },
        body: JSON.stringify({
          pipelineId: "sparkwills",
          name: request.name,
          email: request.email,
          phone: request.phone,
          source: request.source || "SparkWills consultation form",
          message: request.message,
        }),
      });
    }
  } catch (err) {
    console.error("[consultation] Failed to notify CRM:", err);
  }

  return NextResponse.json({ ok: true });
}
