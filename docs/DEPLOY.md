# Deploying a client site

Each client gets their **own** deployment, database, and (later) Stripe. This is
the runbook to take one live on Vercel + a hosted Postgres.

Prereqs: a Vercel account, a Postgres provider (Neon or Supabase free tier are
fine), and the client's onboarding data.

---

## 1. Provision a Postgres database
Create a database (Neon / Supabase / Vercel Postgres) and copy its connection
string. It looks like:
```
postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
```

## 2. Prepare the client's repo
From a fresh clone of the template:
```bash
# 1. Generate their config from the intake JSON
node scripts/generate-client.mjs intake/<client>.json

# 2. Copy the generated files into place
cp generated/<slug>/site.config.ts config/site.config.ts
cp generated/<slug>/.env .env.local        # fill in the values below

# 3. Add their logo
#    drop the file in public/  (matching brand.logo.src in the config)

# 4. Switch the database to Postgres for production
node scripts/set-db.mjs postgres
```

## 3. Set environment variables
In Vercel (Project → Settings → Environment Variables), set:

**Provisioned by you**
| Var | Value |
|---|---|
| `DATABASE_URL` | the Postgres string from step 1 |
| `NEXTAUTH_URL` | the client's final URL, e.g. `https://wills.theirfirm.co.uk` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `CRON_SECRET` | a long random string |
| `USE_LOCAL_STUBS` | `false` once Stripe + email are connected (`true` until then) |

**Connected later** (leave blank until ready)
| Capability | Vars |
|---|---|
| Stripe | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_SINGLE/ANNUAL` (+ `NEXT_PUBLIC_` copies) |
| Email | `RESEND_API_KEY`, `EMAIL_FROM` (verified sender domain) |
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (optional) |

## 4. Initialise the database schema
Point your local `DATABASE_URL` (in `.env`) at the production Postgres once, then:
```bash
npx prisma db push      # creates all tables on the client's Postgres
```
(Each client starts with a fresh DB, so `db push` is enough — no migration history
needed. Re-run after any schema change.)

## 5. Deploy to Vercel
Push the repo to GitHub and import it into Vercel (or `vercel deploy`). Vercel
auto-detects Next.js. The build command is `prisma generate && next build`
(already set in package.json), so the Prisma client is generated on every deploy.

## 6. Custom domain
In Vercel → Domains, add `wills.theirfirm.co.uk`, follow the DNS instructions, and
make sure `NEXTAUTH_URL` matches it exactly (auth + email links depend on this).

## 7. Review-reminder cron
`vercel.json` already schedules `GET /api/cron/review-reminders` daily at 09:00 UTC.
Vercel injects the `CRON_SECRET` bearer automatically. (Note: Vercel **Hobby** allows
limited cron frequency; commercial use needs **Pro** — see notes.)

## 8. Connect Stripe + email (when the client is ready)
- **Stripe**: create their products/prices, add the keys + price IDs to Vercel,
  set the webhook endpoint to `https://<domain>/api/webhooks/stripe`, and flip
  `USE_LOCAL_STUBS=false`. (The long-term path is Stripe **Connect** — Step E.)
- **Email**: add a verified sender domain in Resend, set `RESEND_API_KEY` + `EMAIL_FROM`.

## 9. Smoke test
- Register an account → check the welcome email (once Resend is on)
- Run the wizard → proof → pay (real Stripe, or dev bypass if stubs still on) → download PDFs
- Grant yourself admin on their DB: `node scripts/set-admin.mjs you@domain` → visit `/admin`

---

## Notes & gotchas
- **Vercel Hobby is non-commercial.** A client-facing SaaS needs Vercel **Pro** (~$20/mo per project) — factor this into pricing.
- **Don't run `npm run build` while a dev server is live** on the same checkout — it corrupts `.next`. Stop dev / clear `.next` first.
- **Switch back to SQLite for local dev** with `node scripts/set-db.mjs sqlite`.
- Keep `provider = "sqlite"` committed in the template; flip to `postgres` only in the client's deployment clone.
