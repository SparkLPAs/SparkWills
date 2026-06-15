# Protective Property Trust Will — DIY SaaS

A consumer-facing tool that guides England & Wales couples through creating a pair
of mirror **Protective Property Trust Wills** (life-interest trust wills). It
produces legal *information* and populated document templates — **not** legal
advice. Built from `Claude_Code_Brief_ProtectiveWillTrust_v2_1.md`.

## Tech stack
- **Next.js 14** (App Router) + TypeScript + Tailwind CSS
- **Prisma 6** ORM — **SQLite** for local dev (`prisma/dev.db`); Postgres for prod
- **NextAuth** (credentials + optional Google OAuth), bcrypt password hashing
- **Stripe** (checkout + webhook + customer portal) — stubbed locally
- **pdf-lib** for PDF generation; **JSZip** for the download bundle
- AWS S3 / Resend email — stubbed locally (`USE_LOCAL_STUBS=true`)

## Running locally (Windows)
Node 24 is installed but **not on PATH**. In each shell, prepend it:
```powershell
$env:Path = "$env:ProgramFiles\nodejs;$env:Path"
```
Then, from this folder (`protective-will-trust`):
```powershell
npm install
npx prisma db push      # creates prisma/dev.db
npx prisma generate
npm run dev             # http://localhost:3000  (Claude preview uses port 3100)
```
> The Claude Code preview launches via `.claude/preview-launch-ppt.js` (config
> name `ppt-will-dev`, port 3100) because Node isn't on PATH and the app is in a
> subfolder.

### Test data
- Test user: `jason@example.com` / `testpassword123`
- `node scripts/seed-complete.mjs` — seeds a fully-valid (tenants-in-common) project
- `node scripts/seed-jt.mjs` — seeds a joint-tenants project (to exercise severance)
- `node scripts/set-admin.mjs [email]` — grants admin access (the `/admin` dashboard)
- `node scripts/backdate-compiled.mjs` — ages a compiled project 4 years to test review reminders

### Review-reminder cron
`GET /api/cron/review-reminders` emails owners of wills compiled 3+ years ago (not
reminded in the last year) and stamps `lastReminderAt`. It requires
`Authorization: Bearer $CRON_SECRET`. `vercel.json` schedules it daily at 09:00 UTC;
on Vercel the `CRON_SECRET` bearer is injected automatically. Add `?dryRun=true` to
preview without sending. Test locally:
```powershell
Invoke-RestMethod -Uri http://localhost:3000/api/cron/review-reminders `
  -Headers @{ Authorization = "Bearer $env:CRON_SECRET" }
```

## Environment
Copy `.env.example` → `.env.local`. `DATABASE_URL` also lives in `.env` (the
Prisma CLI reads `.env`, not `.env.local`). With `USE_LOCAL_STUBS=true`, Stripe/
S3/email are stubbed and a dev "Simulate payment" button unlocks compile/download
without real Stripe keys.

## User journey
Landing → eligibility gate → register → dashboard → 9-section wizard (autosaves) →
proof & check (validation flags + completeness) → payment gate → compile →
download (individual PDFs + ZIP) → signing & storage guides. Joint tenants are
routed through a severance sub-flow first. "Not a right fit" users are invited to
an **expert consultation** (lead captured to `ConsultationRequest`), not an
external solicitor.

## Status
**Phases 1–3 complete and verified in-browser.** Production build passes clean.

| Area | State |
|---|---|
| Auth (credentials + Google-ready), middleware-protected routes | done |
| Dashboard, project CRUD | done |
| 9-section wizard, debounced autosave, DB resume | done |
| Validation/proof (red/amber flags, completeness) | done |
| Severance sub-flow (Notice PDF + HMLR steps + confirm gate) | done |
| Payment gate (£39/£79) + Stripe checkout/webhook/portal code + dev bypass | done |
| PDF compile (cover, both wills, signing/storage guides, severance) + ZIP | done |
| Disclaimer on every PDF page + key screens | done |
| Document storage (local stub) + versioned records | done |
| Consultation lead-capture | done |
| Account settings + GDPR account deletion (cascade verified) | done |
| Transactional email (Resend) — welcome + documents-ready, stub fallback | done |
| Admin dashboard (stats, users, consultation leads) — `isAdmin`-gated | done |
| 3-year review-reminder emails — cron-triggered, `CRON_SECRET`-gated | done |

### Outstanding
- **Wire real services** — Stripe test keys, Resend (verified domain + key), Google OAuth in `.env.local`
- **Live pricing on landing page** — currently the constant; payment gate is live-from-Stripe (cached)
- **Stripe Connect** (white-label Step E) — per-client Stripe onboarding + application fees
- **Legal review** — have a solicitor review the will-clause templates before launch

> Production DB is handled: the schema is Postgres-ready (`node scripts/set-db.mjs postgres`), verified valid — see `docs/DEPLOY.md`.

## White-label (one app, many client sites)
This codebase is a **template**: everything client-specific lives in
**`config/site.config.ts`** — business name, logo, brand colour palette, fonts,
legal/disclaimer text, pricing, and consultation copy. The colours are injected as
CSS variables (`config/theme.ts` → root layout), so the entire UI re-themes from
that one file with no component changes. Verified: changing the name + primary
colour rebrands the whole site (header, footer, every button) instantly.

**Onboarding spec:** `docs/CLIENT-ONBOARDING.md` defines the client form, the
field→config/env mapping, and what you provision vs. connect later. The form
produces a `ClientIntake` (`intake/client-intake.ts` — typed + Zod-validated;
`intake/example-client.json` is a filled example).

**To spin up a new client site (with the generator):**
1. `node scripts/generate-client.mjs <intake.json>` — validates the intake,
   **expands their single brand colour into a full palette, builds the disclaimer**,
   and writes `generated/<slug>/site.config.ts` + `.env`.
2. Copy those into the client's clone (`config/site.config.ts` + `.env.local`).
3. Drop their logo in `/public` (matching `brand.logo.src`; else a monogram shows).
4. Fill the `.env.local` GENERATE/connect-later values, provision their Postgres, deploy.

Each client gets their own deployment + database + Stripe. (`generated/` is gitignored
and excluded from this app's TS build — it's output for client repos.)

**Deploying** (full runbook in `docs/DEPLOY.md`): provision a Postgres, switch the
DB with `node scripts/set-db.mjs postgres` (the schema is provider-agnostic, so it's
a one-line change — verified valid under Postgres), set env vars in Vercel, run
`npx prisma db push`, add the custom domain, deploy. The build command is
`prisma generate && next build` so the Prisma client regenerates on every deploy.

Not yet config-driven (deliberate, documented): the **font pairing** is swapped in
`app/layout.tsx` (next/font needs static imports), and **product-descriptor wording**
("a Protective Property Trust Will…") stays standard since it describes the legal
product, not the brand.

## Key implementation notes
- SQLite has no native Prisma enums → enum columns are `String`, backed by TS
  unions in `lib/constants.ts`. `WillProject.data` is a `Json` blob (set `{}` in
  code; no DB default — invalid on SQLite).
- Client-specific values are centralised in `config/site.config.ts`; `lib/constants.ts`
  re-exports the legal/pricing/consultation ones so existing imports still work.
- The will text comes from one generator (`lib/documents/will-content.ts`) used by
  **both** the web preview and the PDF, so they can't drift. Same for the severance
  notice (`lib/documents/severance-content.ts`).
- Running under OneDrive can cause `.next` build locks (`EINVAL readlink`); if a
  build fails that way, delete `.next` and rebuild.
