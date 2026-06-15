# CLAUDE.md — Protective Property Trust Will (PPT Will) SaaS

Consumer-facing tool that guides England & Wales couples through creating mirror
**Protective Property Trust Wills** (life-interest trust wills). Produces legal
*information* and populated document templates — **not** legal advice. See the
build brief for full legal background.

## Tech stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (design tokens in `tailwind.config.ts` / `app/globals.css`)
- Prisma ORM — **SQLite** for local dev (`prisma/dev.db`), Postgres in production
- NextAuth.js (credentials + Google OAuth) — *not wired yet*
- Stripe (payment gate + webhooks), pdf-lib (PDF generation), Resend (email), AWS S3 (storage)

## Local environment (Windows)
- **Node 24 is installed at `C:\Program Files\nodejs\` but is NOT on PATH.**
  In each PowerShell command, prepend it first:
  `$env:Path = "$env:ProgramFiles\nodejs;$env:Path"; npm ...`
- Shell is **Windows PowerShell 5.1** — no `&&`, no ternary, no `-SkipHttpErrorCheck`.
  Use `;` to sequence and `if ($?) { ... }` for conditional chaining.
- The Bash tool is also available but Node is not on its PATH either.

## Database
- Local dev uses **SQLite**. Prisma does not support native `enum` on SQLite, so
  enums from the brief (`plan`, `paymentStatus`, `status`, `coupleType`, …) are
  modelled as `String` fields backed by TypeScript unions in `lib/constants.ts`.
- For production: switch `datasource.provider` to `postgresql`, set `DATABASE_URL`,
  and (optionally) restore native enums.
- Common commands (run with the PATH prefix above):
  `npx prisma generate`, `npx prisma db push`, `npx prisma studio`, `npx prisma migrate dev`

## Conventions
- Import alias: `@/*` → project root.
- Legal disclaimer (`lib/constants.ts` → `DISCLAIMER`) must appear on every
  generated PDF page (footer), the preview screen, the download screen, and the
  account dashboard. Do not remove it.
- Never auto-populate witness fields — leave blank signature lines in PDFs.
- Version-stamp every generated document (v1, v2 …) with a timestamp.
- Stripe webhook must be idempotent (check the `StripeEvent` table first).
- Never log or store card data — Stripe holds all PCI scope.
- Never commit `.env` / `.env.local`.

## Status
Foundation built (scaffold, schema, design system, landing + eligibility).
Auth, wizard, PDF generation, and Stripe flows are staged next.
