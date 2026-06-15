# Client onboarding — form → config/env mapping

This is the spec for taking a new white-label client live. It defines:
1. **The onboarding form** — what to ask a client (build this into your SaaS platform).
2. **What you provision** — values you generate, not ask for.
3. **What's connected later** — Stripe, email, Google.
4. **The mapping table** — every field → where it lands.

The form produces a `ClientIntake` (see `intake/client-intake.ts` for the typed,
validated contract, and `intake/example-client.json` for a filled example). The
generator (Step C) turns that intake into `config/site.config.ts` + a `.env`
template + a logo slot.

---

## 1. The onboarding form (what to ask the client)

### A. Business identity
| Field | Ask | Notes / validation |
|---|---|---|
| Business name | "What name should appear across the site?" | Public-facing; required |
| Legal entity name | "Your registered legal entity (for the disclaimer/terms)" | Required |
| Short name | "A short version for footers/tabs (optional)" | Defaults to business name |
| Contact email | "Customer-facing contact email" | Valid email |

### B. Branding
| Field | Ask | Notes |
|---|---|---|
| Logo | "Upload your logo (SVG or PNG, transparent background)" | Optional; if none, a monogram is used |
| Monogram | "A single letter for the fallback mark" | Defaults to first letter of business name |
| Primary brand colour | "Your main brand colour (hex)" | Required; **one** colour — we generate the full shade scale |
| Background tone | "Background tone (optional hex)" | Defaults to a warm off-white |
| Font style | "Choose a type style: Classic / Modern / Humanist" | Maps to a curated font pairing |

### C. Pricing (display)
| Field | Ask | Notes |
|---|---|---|
| Single price + label | "Price for a single will pair" | e.g. "£49". The **real charge** comes from their Stripe price (connected later); this is the display/fallback |
| Annual price + label | "Price for the unlimited annual plan" | e.g. "£89" |

### D. Legal
| Field | Ask | Notes |
|---|---|---|
| Jurisdiction | "Which jurisdiction?" | Defaults to England & Wales (the only one currently supported — flag if different) |
| Law as at | "Date the legal content is current to" | e.g. "June 2026" |
| Custom disclaimer | "Custom disclaimer text (optional)" | If blank, we generate a standard one naming their legal entity |
| Solicitor firm? | "Are you a regulated solicitor firm?" | Adjusts the disclaimer wording |

### E. Consultation routing
| Field | Ask | Notes |
|---|---|---|
| Consultation copy | "Message shown when the DIY tool isn't a fit (optional)" | Defaults to standard wording |
| Leads inbox | "Where should consultation enquiries be sent?" | Valid email |

### E2. Recommended executor (optional)
| Field | Ask | Notes |
|---|---|---|
| Offer a professional executor? | "Do you want to offer a recommended professional executor in the Executors step?" | Toggles the dropdown choice |
| Firm name / address | "Your recommended solicitor/firm details" | Shown when the user selects them; appointed in the will |
| Pitch + benefits | "A short pitch and benefit bullets (optional)" | Sensible defaults provided if blank |

### F. Deployment
| Field | Ask | Notes |
|---|---|---|
| Domain | "Your domain (e.g. wills.yourfirm.co.uk) or a subdomain you'd like" | Drives `NEXTAUTH_URL` + the hosting domain |

### G. SEO (optional)
| Field | Ask | Notes |
|---|---|---|
| Page title / description | "Custom homepage title & description (optional)" | Sensible defaults derived from name + jurisdiction |

---

## 2. What YOU provision (not asked of the client)
Generated per deployment — never collected on the form:
| Value | Env var | How |
|---|---|---|
| Database | `DATABASE_URL` | Provision a Postgres (Neon/Supabase) per client |
| Auth secret | `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| Cron secret | `CRON_SECRET` | Long random string |
| Stub flag | `USE_LOCAL_STUBS` | `false` in production |

## 3. Connected LATER (per client, when they're ready)
| Capability | Env / setup |
|---|---|
| Payments | Their Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_SINGLE/ANNUAL` (eventually via Stripe **Connect**) |
| Email | `RESEND_API_KEY` + a verified sender domain; `EMAIL_FROM` |
| Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional) |

---

## 4. Mapping table (intake → destination)

| Intake field | Destination |
|---|---|
| `businessName` | `config.business.name` |
| `legalName` | `config.business.legalName` |
| `shortName` | `config.business.shortName` (default: `businessName`) |
| `contactEmail` | `config.business.contactEmail` |
| `branding.logoFilename` | `/public/<file>` + `config.brand.logo.src` |
| `branding.monogram` | `config.brand.logo.monogram` (default: `businessName[0]`) |
| `branding.primaryColor` | `config.brand.palette.primary` (expanded to 50–950) |
| `branding.surfaceColor` | `config.brand.palette.surface` + `palette.background` |
| `branding.fontPair` | font selection in `app/layout.tsx` |
| `pricing.*` | `config.pricing.*` (display) |
| `legal.jurisdiction` | `config.legal.jurisdiction` |
| `legal.lawAsAt` | `config.legal.lawAsAt` |
| `legal.customDisclaimer` / `isSolicitorFirm` | `config.legal.disclaimer` (generated if blank) |
| `consultation.signpost` | `config.consultation.signpost` |
| `consultation.leadsEmail` | `config.consultation.leadsEmail` |
| `recommendedExecutor.*` | `config.executors.recommendedExecutor.*` (defaults if blank) |
| `deployment.domain` | `NEXTAUTH_URL` env + hosting domain |
| `meta.title` / `meta.description` | `config.meta.*` (defaults derived) |

---

## 5. How a submission becomes a site (Step C — next)
```
client fills form  →  ClientIntake JSON  →  generator script
   →  writes config/site.config.ts
   →  writes .env (with provisioned + placeholder-for-later values)
   →  reminds you to drop the logo file in /public
   →  you deploy
```
The generator validates the intake against `ClientIntakeSchema`, expands the single
brand colour into a full palette, builds the disclaimer, and writes the config —
so onboarding is reduced to: **collect form → run generator → add logo → deploy.**
