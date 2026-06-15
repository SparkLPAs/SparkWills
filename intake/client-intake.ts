import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────
//  CLIENT INTAKE — the contract for a new white-label client.
//
//  This is the structured data your onboarding form produces. The generator
//  (scripts/generate-client.mjs, Step C) turns a validated ClientIntake into
//  config/site.config.ts + a .env template + a logo slot.
//
//  Distinguishes:
//   • Client-provided  → everything in this schema (collected via the form)
//   • You provision    → DATABASE_URL, NEXTAUTH_SECRET, CRON_SECRET (generated at deploy)
//   • Connected later  → Stripe (Connect), Resend domain, Google OAuth
// ─────────────────────────────────────────────────────────────────────────

const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Must be a hex colour like #1a2b4a");

export const ClientIntakeSchema = z.object({
  // 1 — Business identity
  businessName: z.string().min(1).max(80),
  legalName: z.string().min(1).max(120),
  shortName: z.string().max(40).optional(), // defaults to businessName
  contactEmail: z.string().email(),

  // 2 — Branding
  branding: z.object({
    /** Filename of the logo they upload; placed at /public/<filename>. */
    logoFilename: z.string().max(120).optional(),
    /** Fallback monogram letter if no logo image (defaults to first letter of name). */
    monogram: z.string().length(1).optional(),
    /** Single brand colour — the generator expands this into the full 50–950 scale. */
    primaryColor: hexColor,
    /** Warm background base (defaults to a near-white). */
    surfaceColor: hexColor.optional(),
    /** Type pairing — maps to a font set wired in app/layout.tsx. */
    fontPair: z.enum(["classic", "modern", "humanist"]).default("classic"),
  }),

  // 3 — Pricing (display fallback; the live amount comes from their Stripe prices)
  pricing: z.object({
    singleLabel: z.string().max(40).default("Single Project"),
    singlePrice: z.string().max(16), // e.g. "£39"
    annualLabel: z.string().max(40).default("Unlimited Annual"),
    annualPrice: z.string().max(16), // e.g. "£79"
  }),

  // 4 — Legal
  legal: z.object({
    jurisdiction: z.string().max(60).default("England & Wales"),
    lawAsAt: z.string().max(40), // e.g. "June 2026"
    /** If blank, the generator builds a standard disclaimer naming legalName. */
    customDisclaimer: z.string().max(2000).optional(),
    /** Affects disclaimer wording ("we are not solicitors" vs solicitor firm). */
    isSolicitorFirm: z.boolean().default(false),
  }),

  // 5 — Consultation routing
  consultation: z.object({
    /** Copy shown when the DIY tool isn't a fit (defaults to standard wording). */
    signpost: z.string().max(400).optional(),
    /** Internal inbox notified of new leads. */
    leadsEmail: z.string().email(),
  }),

  // 6 — Recommended professional executor (optional partner solicitor)
  recommendedExecutor: z
    .object({
      enabled: z.boolean().default(false),
      name: z.string().max(120).optional(),
      address: z.string().max(200).optional(),
      blurb: z.string().max(600).optional(),
      benefits: z.array(z.string().max(200)).optional(),
      /** Exact will appointment clause; if omitted a standard one is generated. */
      clause: z.string().max(2000).optional(),
    })
    .optional(),

  // 7 — Deployment
  deployment: z.object({
    /** Custom domain (wills.theirfirm.co.uk) or chosen subdomain. */
    domain: z.string().max(120),
  }),

  // 7 — SEO meta (optional; sensible defaults derived from the above)
  meta: z
    .object({
      title: z.string().max(120).optional(),
      description: z.string().max(320).optional(),
    })
    .optional(),
});

export type ClientIntake = z.infer<typeof ClientIntakeSchema>;
