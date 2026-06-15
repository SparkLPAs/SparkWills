// Generate a white-label client config from an intake JSON.
//
//   node scripts/generate-client.mjs intake/example-client.json
//
// Writes generated/<slug>/site.config.ts and generated/<slug>/.env.
// Drop those into a fresh clone (config/site.config.ts + .env.local), add the
// logo to /public, provision the secrets, and deploy.
import { promises as fs } from "fs";
import path from "path";

// ── colour helpers ─────────────────────────────────────────────────────────
const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return { r: parseInt(f.slice(0, 2), 16), g: parseInt(f.slice(2, 4), 16), b: parseInt(f.slice(4, 6), 16) };
};
const toHex = ({ r, g, b }) =>
  "#" + [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("");
const mix = (a, b, t) => ({ r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t });
const WHITE = { r: 255, g: 255, b: 255 };
const BLACK = { r: 0, g: 0, b: 0 };
const WARM = { r: 120, g: 100, b: 70 };

function generatePrimaryScale(baseHex) {
  const base = hexToRgb(baseHex);
  const tint = (t) => toHex(mix(base, WHITE, t));
  const shade = (t) => toHex(mix(base, BLACK, t));
  return {
    50: tint(0.92), 100: tint(0.84), 200: tint(0.7), 300: tint(0.55),
    400: tint(0.4), 500: tint(0.28), 600: tint(0.16), 700: tint(0.07),
    800: baseHex.toLowerCase(), 900: shade(0.18), 950: shade(0.34),
  };
}
function generateSurfaceScale(surfaceHex) {
  const s = hexToRgb(surfaceHex);
  return {
    50: surfaceHex.toLowerCase(),
    100: toHex(mix(s, WARM, 0.04)),
    200: toHex(mix(s, WARM, 0.1)),
    300: toHex(mix(s, WARM, 0.18)),
  };
}

// ── validation ───────────────────────────────────────────────────────────
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
function assert(cond, msg) { if (!cond) { console.error("✗ " + msg); process.exit(1); } }

function validate(i) {
  assert(i.businessName, "businessName is required");
  assert(i.legalName, "legalName is required");
  assert(EMAIL.test(i.contactEmail || ""), "contactEmail must be a valid email");
  assert(i.branding && HEX.test(i.branding.primaryColor || ""), "branding.primaryColor must be a hex colour");
  assert(!i.branding.surfaceColor || HEX.test(i.branding.surfaceColor), "branding.surfaceColor must be a hex colour");
  assert(i.pricing && i.pricing.singlePrice && i.pricing.annualPrice, "pricing.singlePrice and annualPrice are required");
  assert(i.legal && i.legal.lawAsAt, "legal.lawAsAt is required");
  assert(EMAIL.test(i.consultation?.leadsEmail || ""), "consultation.leadsEmail must be a valid email");
  assert(i.deployment && i.deployment.domain, "deployment.domain is required");
}

function buildDisclaimer(legalName, jurisdiction, lawAsAt, isSolicitorFirm) {
  const liability = isSolicitorFirm
    ? `${legalName} does not accept liability for any loss arising from use of documents produced by this application.`
    : "We are not solicitors and do not accept liability for any loss arising from use of documents produced by this application.";
  return `This application provides legal information and document templates only. It does not constitute legal advice. ${liability} Estate planning is complex and your individual circumstances may require professional advice. You should consult a qualified solicitor before executing any will or trust document. The law reflected in this application is the law of ${jurisdiction} as at ${lawAsAt}.`;
}

const FONTS = {
  classic: { display: "var(--font-display), Georgia, serif", body: "var(--font-body), system-ui, sans-serif" },
  modern: { display: "var(--font-display), 'Helvetica Neue', Arial, sans-serif", body: "var(--font-body), system-ui, sans-serif" },
  humanist: { display: "var(--font-display), 'Palatino Linotype', serif", body: "var(--font-body), system-ui, sans-serif" },
};

const DEFAULT_EXEC_BLURB =
  "Appointing the right executor is crucial to ensuring your wishes are carried out smoothly and without unnecessary stress for your loved ones. Our recommended solicitors offer professional, impartial, and efficient estate management.";
const DEFAULT_EXEC_BENEFITS = [
  "Expertise you can trust — they navigate the legal and financial complexities on your behalf.",
  "Impartial and conflict-free — unlike family executors, they remain neutral, ensuring fair distribution and preventing disputes.",
  "Efficient probate handling — they streamline the process and avoid unnecessary delays.",
  "Relieve the burden on loved ones — they handle the paperwork, tax filings, and legal requirements.",
];

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ── main ───────────────────────────────────────────────────────────────────
const intakePath = process.argv[2] || "intake/example-client.json";
const raw = await fs.readFile(intakePath, "utf8");
const i = JSON.parse(raw);
validate(i);

const jurisdiction = i.legal.jurisdiction || "England & Wales";
const shortName = i.shortName || i.businessName;
const monogram = (i.branding.monogram || i.businessName.trim()[0]).toUpperCase();
const fonts = FONTS[i.branding.fontPair || "classic"];
const surfaceHex = i.branding.surfaceColor || "#fdfbf7";
const primary = generatePrimaryScale(i.branding.primaryColor);

const config = {
  business: {
    name: i.businessName,
    legalName: i.legalName,
    shortName,
    contactEmail: i.contactEmail,
  },
  brand: {
    logo: {
      ...(i.branding.logoFilename ? { src: "/" + i.branding.logoFilename } : {}),
      monogram,
    },
    palette: {
      primary,
      surface: generateSurfaceScale(surfaceHex),
      background: surfaceHex.toLowerCase(),
      foreground: i.branding.primaryColor.toLowerCase(),
      success: "#2f855a",
      warning: "#b7791f",
      danger: "#c53030",
    },
    fonts,
  },
  legal: {
    jurisdiction,
    lawAsAt: i.legal.lawAsAt,
    disclaimer: i.legal.customDisclaimer?.trim() || buildDisclaimer(i.legalName, jurisdiction, i.legal.lawAsAt, !!i.legal.isSolicitorFirm),
    disclaimerShort: `Legal information only — not legal advice. Consult a solicitor before executing any will. ${jurisdiction} only.`,
  },
  pricing: {
    single: { label: i.pricing.singleLabel || "Single Project", price: i.pricing.singlePrice, cadence: "one-time" },
    annual: { label: i.pricing.annualLabel || "Unlimited Annual", price: i.pricing.annualPrice, cadence: "/year" },
  },
  consultation: {
    signpost: i.consultation.signpost?.trim() || "Our experts can help. Get in touch for an expert consultation and we'll talk through the right option for your circumstances.",
    leadsEmail: i.consultation.leadsEmail,
  },
  executors: {
    recommendedExecutor: {
      enabled: !!(i.recommendedExecutor && i.recommendedExecutor.enabled),
      name: i.recommendedExecutor?.name || "Our recommended solicitors",
      address: i.recommendedExecutor?.address || "",
      blurb: i.recommendedExecutor?.blurb?.trim() || DEFAULT_EXEC_BLURB,
      benefits: i.recommendedExecutor?.benefits?.length ? i.recommendedExecutor.benefits : DEFAULT_EXEC_BENEFITS,
      ...(i.recommendedExecutor?.clause?.trim()
        ? { clause: i.recommendedExecutor.clause.trim() }
        : {}),
    },
  },
  meta: {
    title: i.meta?.title || `${i.businessName} | Protective Property Trust Wills`,
    description: i.meta?.description || `Create a pair of Protective Property Trust Wills with ${i.businessName}, for couples in ${jurisdiction}.`,
  },
};

const configFile = `import type { SiteConfig } from "./site-config.types";

export type { SiteConfig, ColorScale } from "./site-config.types";

// Generated by scripts/generate-client.mjs from ${path.basename(intakePath)}.
export const siteConfig: SiteConfig = ${JSON.stringify(config, null, 2)};
`;

const envFile = `# Generated for ${i.businessName}. Fill the provisioned + connect-later values.
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"
NEXTAUTH_URL="https://${i.deployment.domain}"
NEXTAUTH_SECRET="GENERATE with: openssl rand -base64 32"
CRON_SECRET="GENERATE a long random string"
USE_LOCAL_STUBS="true"   # set to "false" once Stripe + email are connected

# Stripe — their account (connect later, ideally via Stripe Connect)
STRIPE_SECRET_KEY=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID_SINGLE=""
STRIPE_PRICE_ID_ANNUAL=""
NEXT_PUBLIC_STRIPE_PRICE_ID_SINGLE=""
NEXT_PUBLIC_STRIPE_PRICE_ID_ANNUAL=""

# Email (connect later) — needs a verified sender domain
RESEND_API_KEY=""
EMAIL_FROM="${i.businessName} <${i.contactEmail}>"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
`;

const slug = slugify(i.businessName);
const outDir = path.join("generated", slug);
await fs.mkdir(outDir, { recursive: true });
await fs.writeFile(path.join(outDir, "site.config.ts"), configFile);
await fs.writeFile(path.join(outDir, ".env"), envFile);

console.log(`✓ Generated site for "${i.businessName}" → ${outDir}/`);
console.log(`  primary scale: 50 ${primary[50]} … 800 ${primary[800]} … 950 ${primary[950]}`);
console.log(`  monogram: ${monogram}${i.branding.logoFilename ? `   logo: /${i.branding.logoFilename}` : ""}`);
console.log("\nNext steps:");
console.log(`  1. Copy ${outDir}/site.config.ts  → config/site.config.ts  (in the client's clone)`);
console.log(`  2. Copy ${outDir}/.env            → .env.local  and fill the GENERATE/connect-later values`);
if (i.branding.logoFilename) console.log(`  3. Add their logo at public/${i.branding.logoFilename}`);
console.log(`  4. Run prisma against their Postgres, then deploy.`);
