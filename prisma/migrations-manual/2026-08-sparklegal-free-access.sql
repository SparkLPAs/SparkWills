-- SparkLegal partner free access (Aug 2026) — additive only, no data loss.
-- Run against production Postgres directly (this repo's own DB host's SQL
-- editor), or via `npx prisma db push` / `npx prisma migrate dev` from a
-- machine with a real DATABASE_URL connection.

ALTER TABLE "User" ADD COLUMN "sparkLegalFreeAccess" BOOLEAN NOT NULL DEFAULT false;
