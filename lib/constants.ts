// ─────────────────────────────────────────────────────────────────────────
// Shared constants & enum unions.
//
// Client-specific values (jurisdiction, disclaimer, pricing, consultation copy)
// are re-exported from config/site.config.ts so the rest of the app can keep
// importing them from here, while a white-label client only edits the config.
// The enum unions below are product structure (same for all clients) and are
// the source of truth for the String columns in prisma/schema.prisma.
// ─────────────────────────────────────────────────────────────────────────

import { siteConfig } from "@/config/site.config";

/** The law reflected in the app, as a date string used in the disclaimer. */
export const JURISDICTION = siteConfig.legal.jurisdiction;
export const LAW_AS_AT = siteConfig.legal.lawAsAt;

/** Mandatory disclaimer — must appear on every generated PDF page (footer),
 *  the preview screen, the download screen, and the account dashboard. */
export const DISCLAIMER = siteConfig.legal.disclaimer;

/** Short disclaimer for compact footers. */
export const DISCLAIMER_SHORT = siteConfig.legal.disclaimerShort;

// ─── Enum unions (mirror the String columns in the Prisma schema) ───

export const PLANS = ["free", "single", "annual"] as const;
export type Plan = (typeof PLANS)[number];

export const PAYMENT_STATUSES = ["unpaid", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PROJECT_STATUSES = [
  "draft",
  "review",
  "compiled",
  "executed",
  "stored",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const COUPLE_TYPES = ["married", "civil_partner", "cohabiting"] as const;
export type CoupleType = (typeof COUPLE_TYPES)[number];

export const DOCUMENT_TYPES = [
  "will_p1",
  "will_p2",
  "cover_sheet",
  "signing_guide",
  "storage_guide",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// ─── Pricing (display only — real amounts come from Stripe / site.config) ───

export const PRICING = siteConfig.pricing;

// ─── Eligibility gate (Stage 1) ───

export interface EligibilityQuestion {
  id: string;
  question: string;
  /** The answer required to remain eligible. */
  requiredAnswer: boolean;
  /** Shown when the user fails this question. */
  failMessage: string;
}

export const ELIGIBILITY_QUESTIONS: EligibilityQuestion[] = [
  {
    id: "resident",
    question: "Are you resident in England or Wales?",
    requiredAnswer: true,
    failMessage:
      "This service covers the law of England & Wales only. Wills in Scotland and Northern Ireland follow different rules — get in touch and we'll point you in the right direction.",
  },
  {
    id: "straightforward",
    question:
      "Are your wishes straightforward (no business assets, trusts, or complex estate)?",
    requiredAnswer: true,
    failMessage:
      "A simple online will suits straightforward estates. If your situation is more complex — business assets, a property trust, or competing claims — get in touch for an expert consultation.",
  },
  {
    id: "ageOver18",
    question: "Are you aged 18 or over?",
    requiredAnswer: true,
    failMessage:
      "You must be aged 18 or over to make a valid will in England & Wales (Wills Act 1837).",
  },
  {
    id: "mentalCapacity",
    question: "Do you have the mental capacity to make a will today?",
    requiredAnswer: true,
    failMessage:
      "A valid will requires testamentary capacity. If there is any doubt about capacity, get in touch for an expert consultation before proceeding (a medical opinion on capacity may also be helpful).",
  },
];

export const CONSULTATION_SIGNPOST = siteConfig.consultation.signpost;
