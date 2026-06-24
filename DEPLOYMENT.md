# Deployment Guide

## 1. Cleanup and repository state
- Keep only source files and tracked project files.
- Remove generated artifacts:
  - `node_modules/`
  - `.next/`
  - `.cache/`
  - `dist/`
  - `build/`
  - `coverage/`
  - `.DS_Store`
  - `*.log`
  - `*.db`, `*.sqlite` and `*.sqlite3`
- Commit only source code and configuration files.

## 2. Environment files
- `.env.example` should contain deployment placeholders.
- `.env` and `.env.local` are local-only and should never be committed.
- Ensure these values exist locally before starting the app:
  - `DATABASE_URL`
  - `SHADOW_DATABASE_URL`
  - `NEXTAUTH_URL`
  - `NEXTAUTH_SECRET`
  - `INITIAL_ADMIN_EMAIL`
  - `INITIAL_ADMIN_PASSWORD`
  - `SONET_EMAIL`
  - `SONET_PASSWORD`

## 3. PostgreSQL / Neon configuration
- Use a PostgreSQL-compatible database for deployment.
- Example connection string:
  - `postgresql://username:password@host:5432/database?schema=public`
- For Neon, use the connection string from the Neon dashboard.
- Set both `DATABASE_URL` and `SHADOW_DATABASE_URL`.

## 4. pnpm configuration
- The project uses `pnpm@11.9.0`.
- Approve build scripts once during install:
  - `corepack pnpm approve-builds --all`
- Then install dependencies:
  - `corepack pnpm install --frozen-lockfile`

## 5. Prisma migration
- After local env is configured, generate Prisma client and run migrations:
  - `corepack pnpm exec prisma generate --schema=prisma/schema.prisma`
  - `corepack pnpm exec prisma migrate dev --name init --schema=prisma/schema.prisma`
- If you are deploying to a remote database, use `prisma migrate deploy`.

## 6. Build verification
- Run the production build locally:
  - `corepack pnpm exec next build`
- Confirm no compilation errors and that routes are generated.

## 7. Vercel deployment
- Create or connect the GitHub repo in Vercel.
- Configure Vercel environment variables using production values.
- Deploy the `main` branch.
- Set `NEXTAUTH_URL` to the Vercel app URL.
- Set `NEXTAUTH_SECRET` to a strong random string.

## 8. Post-deploy checks
- Confirm the app can sign in with seeded credentials.
- Confirm database queries succeed on deployed app.
- Confirm exports, invoices, and reports pages render without errors.
