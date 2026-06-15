// ─────────────────────────────────────────────────────────────────────────
//  SITE CONFIG — the single source of truth for everything client-specific.
//
//  For a new white-label client, this whole value is generated from their
//  onboarding form by scripts/generate-client.mjs. The type lives in
//  ./site-config.types.ts. Nothing client-specific should live anywhere else.
// ─────────────────────────────────────────────────────────────────────────

import type { SiteConfig } from "./site-config.types";

export type { SiteConfig, ColorScale } from "./site-config.types";

export const siteConfig: SiteConfig = {
  business: {
    name: "SparkWills",
    legalName: "SparkWills Limited",
    shortName: "SparkWills",
    contactEmail: "noreply@sparkwills.co.uk",
  },

  brand: {
    logo: {
      // src: "/logo.svg",  // ← drop a client's logo in /public and set this
      monogram: "S",
    },
    palette: {
      primary: {
        50: "#fff7ed",
        100: "#ffedd5",
        200: "#fed7aa",
        300: "#fdba74",
        400: "#fb923c",
        500: "#f97316",
        600: "#ea580c",
        700: "#c2410c",
        800: "#9a3412",
        900: "#7c2d12",
        950: "#431407",
      },
      surface: {
        50: "#fffaf3",
        100: "#fdf2e6",
        200: "#f7e6d3",
        300: "#eed8c1",
      },
      background: "#fffaf3",
      foreground: "#9a3412",
      success: "#2f855a",
      warning: "#b7791f",
      danger: "#c53030",
    },
    fonts: {
      display: "var(--font-display), Georgia, serif",
      body: "var(--font-body), system-ui, sans-serif",
    },
  },

  legal: {
    jurisdiction: "England & Wales",
    lawAsAt: "June 2026",
    disclaimer:
      "This application provides legal information and document templates only. It does not constitute legal advice. We are not solicitors and do not accept liability for any loss arising from use of documents produced by this application. Estate planning is complex and your individual circumstances may require professional advice. You should consult a qualified solicitor before executing any will or trust document. The law reflected in this application is the law of England & Wales as at June 2026.",
    disclaimerShort:
      "Legal information only — not legal advice. Consult a solicitor before executing any will. England & Wales only.",
  },

  pricing: {
    single: { label: "Single Will", price: "£39", cadence: "one-time" },
    mirror: { label: "Mirror Wills", price: "£69", cadence: "one-time" },
  },

  consultation: {
    signpost:
      "Our experts can help. Get in touch for an expert consultation and we'll talk through the right option for your circumstances.",
    leadsEmail: "leads@example.com",
  },

  executors: {
    recommendedExecutor: {
      enabled: true,
      // ↓ White-label clients replace this with their own recommended solicitor.
      name: "Premier Solicitors (Bedford) Limited",
      address: "Premier House, Lurke Street, Bedford, Bedfordshire MK40 3HU",
      blurb:
        "Appointing the right executor is crucial to ensuring your wishes are carried out smoothly and without unnecessary stress for your loved ones. Premier Solicitors (Bedford) Limited offer professional, impartial, and efficient estate management.",
      benefits: [
        "Expertise you can trust — they navigate the legal and financial complexities on your behalf.",
        "Impartial and conflict-free — unlike family executors, they remain neutral, ensuring fair distribution and preventing disputes.",
        "Efficient probate handling — they streamline the process and avoid unnecessary delays.",
        "Relieve the burden on loved ones — they handle the paperwork, tax filings, and legal requirements.",
      ],
      clause:
        "I appoint the persons who at the date of my death are directors of Premier Solicitors (Bedford) Limited of Premier House, Lurke Street, Bedford, Bedfordshire MK40 3HU, or such other firm succeeding to or carrying on its practice, as executors of my Will. I express the wish that two and only two of the directors shall prove my Will.",
    },
  },

  storage: {
    enabled: true,
    label: "Secure document storage",
    price: "£1.99",
    cadence: "/month",
    blurb:
      "We'll store your signed original will safely, with your details registered so your executors can retrieve it when needed.",
    // ↓ Replace with the client's storage address.
    postalAddress:
      "Storage Team\nPremier Solicitors\nPremier House\nLurke Street\nBedford\nMK40 3HU",
    instructions:
      "Once your will is signed and witnessed, post the original (not a copy) to the address above using a tracked or signed-for service. We'll confirm safe receipt and register your will.",
  },

  meta: {
    title: "SparkWills | Simple online wills",
    description:
      "Create a straightforward single or mirror will online with SparkWills, for England & Wales. Legal information and document templates — not legal advice.",
  },
};
