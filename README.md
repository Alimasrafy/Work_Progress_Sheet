# Work Progress Platform

A Next.js + Prisma internal operations platform for managing website work, payments, invoices, and reporting.

Quick checks and commands:

- Install: `corepack pnpm install --frozen-lockfile`
- Typecheck: `corepack pnpm run typecheck`
- Lint: `corepack pnpm run lint`
- Build: `corepack pnpm run build`
- Dev: `corepack pnpm run dev`

Deployment:
- Use PostgreSQL (or Neon) as `DATABASE_URL` and set `SHADOW_DATABASE_URL` for migrations.
- Set `NEXTAUTH_SECRET` and `NEXTAUTH_URL` in production.
- See `DEPLOYMENT.md` for more details.
