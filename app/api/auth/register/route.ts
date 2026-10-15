import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { sendEmail } from "@/lib/email/email";
import { welcomeEmail } from "@/lib/email/templates";

const RegisterSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200),
  name: z.string().max(120).optional(),
  // Carried over from app/eligibility via sessionStorage (see
  // ELIGIBILITY_STORAGE_KEY) — optional because it's only present when
  // registration followed straight on from a passed eligibility check.
  eligibilityAnswers: z
    .object({
      answers: z.record(z.string(), z.boolean()),
      confirmedAt: z.string(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists. Try signing in." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const name = parsed.data.name?.trim() || null;
  // SparkLegal partner attribution (Aug 2026) — set by middleware.ts on
  // first landing via ?ref=<code>, read here at the moment the account
  // itself is actually created. What this code actually unlocks (free,
  // charged via the partner's own Stripe, or nothing) is decided live at
  // checkout (see lib/sparklegal.ts), not cached here — a partner's
  // payment choice can change at any time.
  const referralCode = req.cookies.get("spark_ref")?.value || null;
  const eligibility = parsed.data.eligibilityAnswers;
  await prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      plan: "free",
      referralCode,
      eligibilityAnswers: eligibility?.answers,
      eligibilityConfirmedAt: eligibility ? new Date(eligibility.confirmedAt) : null,
    },
  });

  await sendEmail(welcomeEmail(email, name ?? undefined));

  return NextResponse.json({ ok: true }, { status: 201 });
}
