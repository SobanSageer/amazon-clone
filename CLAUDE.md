# CLAUDE.md — Project rules

Rebuilding amazon.com's core buy-flow in 24 hours for a hiring assignment, deployed live
and usable by anyone without signing in as me. See [PLAN.md](PLAN.md) for the phased
build order, data model, and what's explicitly left out — follow it; don't build ahead
of the current phase or add anything from its "Left out on purpose" list without asking.

Target: full core loop (Phases 0–6) live in ~8–10 hours, then polish.

## Stack

- Next.js 16, App Router, TypeScript. Its APIs differ from older Next versions — read
  the bundled docs per @AGENTS.md before writing Next-specific code.
- Tailwind CSS + shadcn/ui
- Prisma + Neon Postgres
- Auth.js for authentication
- Deployed on Vercel

## Database & environment

- Neon Postgres is connected through the **Vercel Storage integration** (not a
  standalone Neon project wired by hand).
- `DATABASE_URL` = Neon's **pooled** connection string (runtime queries).
  `DIRECT_URL` = Neon's **direct** (non-pooled) connection string (migrations only).
  This is Prisma 7 (pinned 7.10.0 — npm `latest` is an 8.0 RC; don't bump it):
  there is no `directUrl`. The CLI uses `datasource.url` in `prisma.config.ts`
  → `DIRECT_URL`; the app connects through the `@prisma/adapter-neon` driver adapter
  in `src/lib/db.ts` → `DATABASE_URL`. Generated client lives in `src/generated/prisma`
  (gitignored; `postinstall` and `build` regenerate it).
- The Vercel Neon integration names its direct string `DATABASE_URL_UNPOOLED`;
  `src/lib/direct-url.ts` falls back to it when `DIRECT_URL` isn't set.
- Migrations and seed run in the `vercel-build` script on every deploy (seed is
  idempotent). Testing happens on the live deploy — there is no local `.env`.
- `prisma generate` runs as part of the build step (`"build": "prisma generate && next
  build"`), so Vercel always builds against a fresh client.
- `AUTH_SECRET` is set in Vercel project env vars (and in `.env.local` for local dev).
  Never commit real secrets — `.env*` files except `.env.example` stay gitignored.
- `next.config` allow-lists DummyJSON's image CDN in `images.remotePatterns`.

## Data & seeding

- Seed ~150–200 real-looking products from the DummyJSON products dataset (images,
  ratings, categories included). Seed script lives under `prisma/` and is re-runnable
  against a fresh Neon database.
- Schema matches the entities and fields in [PLAN.md](PLAN.md)'s Data Model section —
  update that section first if the schema needs to diverge, so the doc stays truthful.

## Product rules

- Branding is Amazon's look (palette tokens `amz-*` in `globals.css`) with an
  **"amazon" text wordmark + "clone" tag** (`src/lib/site.ts`, `wordmark.tsx`) — never
  Amazon's logo artwork. A public page with the real logo next to a working sign-in and
  card form reads as phishing and gets flagged/taken down. Keep the "not affiliated /
  payments simulated" footer and the don't-reuse-your-Amazon-password note on sign-in.

- Guest users can browse, search, view products, and add to cart with **no account**.
  Cart persists for guests via a cookie-scoped session id.
- Login is required **only** at checkout. On login, the guest session's cart items
  reassign to the user's account rather than being lost.
- No demo account (retired 2026-09-21 at the user's request): reviewers create an
  account at checkout. Real sign-up/sign-in must stay working end to end.
- Product page has both **Add to Cart** and **Buy Now** (Buy Now adds the item and goes
  straight to checkout).
- Product page shows a **"More in this category"** rail: real products from the same
  category. Never fabricate "recommended for you" style personalization.
- Payments are simulated: a card-shaped form with client-side format validation only.
  No real payment gateway, no real charges, no storing card data.

## UI work

- Every screen is **mobile-responsive from the moment it's built**. Responsiveness is
  not deferred to a polish pass.
- Use the `frontend-design` skill **while building** every screen.
- Run `design-critique`, `ux-copy`, and `accessibility-review` **once per phase**, on
  that phase's screens, and fix what they surface **in a single batch** before the
  phase's deploy. Don't re-run the full review after every individual change.

## Deploy & commit discipline

- Deploy to Vercel early (Phase 0, before any product code) and again after every phase
  in PLAN.md — each phase ends in a deployable, deployed state, not just working
  locally.
- Commit after every working feature (not batched at the end of a phase). Small,
  working, deployable commits over large ones.
- Include `.agent-logs/` in every commit. Never add it to `.gitignore`. These logs are
  captured automatically by the hooks in `.claude/settings.json` — don't hand-edit
  entries after the fact.
- Some setup requires actions in the Vercel or Neon dashboard (linking the Storage
  integration, env vars, project settings). When one of those is needed, stop and tell
  the user exactly what to do rather than guessing or working around it.

## Scope discipline

- If a feature isn't in PLAN.md's core loop and isn't in the current phase, don't build
  it speculatively — flag it and move on. Judgement on this assignment is partly about
  what gets left out, not just what gets shipped.
