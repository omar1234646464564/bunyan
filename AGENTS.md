<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: بنيان (bunyan)

Saudi building-materials marketplace. Next.js 16 (App Router, Server Actions) + Prisma 6 + PostgreSQL, Arabic RTL UI, Tailwind v4, custom JWT session auth (`jose` + `bcryptjs`) with a DAL and `src/proxy.ts`.

### Commands (run after changes)

- `npm run lint` — ESLint (must pass).
- `npm run typecheck` — runs `next typegen` then `tsc --noEmit` (must pass). Run `next typegen` first; the `PageProps<"/...">` / `LayoutProps<"/...">` helpers are generated into `.next/types` and must be regenerated when routes change.
- `npm run build` — production build (verifies everything; routes are dynamic via `export const dynamic = "force-dynamic"` in the root layout).
- Database: `npm run db:push`, `npm run db:migrate`, `npm run db:deploy`, `npm run db:seed`, `npm run db:studio`, `npm run db:generate`.

### Notes

- Database is **PostgreSQL** (`DATABASE_URL` is a `postgresql://...` connection string, e.g. Neon/Supabase/Vercel Postgres). `SESSION_SECRET` must be set in `.env`.
- Statuses/roles/units are stored as `String` and money as `Float` (kept from the previous SQLite schema for code compatibility). Migrations live in `prisma/migrations`; `npm run build` runs `prisma generate` + `prisma migrate deploy` before `next build`, and `postinstall` runs `prisma generate`.
- Prisma CLI on Windows may hang when invoked directly through some shells; run it with output redirected to a file if so. Prisma is pinned to 6.19.3 (do not use the `latest` dist-tag).
- The seed script runs via `node --import tsx prisma/seed.ts` (bare `tsx` is not on PATH when Prisma spawns the seed command).
- `cacheComponents` is intentionally disabled (`next.config.ts`) to use the classic dynamic rendering model.
- Order flow: customers never pick/see a supplier. New orders land on the admin panel with `status: "AWAITING_SUPPLIER"` and `supplierId: null`. Only an admin manages the order items (`addOrderItem`/`updateOrderItem`/`removeOrderItem`, allowed only while `AWAITING_SUPPLIER`; totals are recomputed) and accepts the order (`acceptOrder` → `CONFIRMED`, requires an assigned approved supplier and ≥1 item). Assigning a supplier (`assignSupplier`) no longer confirms. Suppliers only see accepted orders (`status != "AWAITING_SUPPLIER"`) where `supplierId` matches theirs, and may only set `PROCESSING`/`SHIPPED`/`DELIVERED`. Order messaging is customer↔admin only (suppliers don't participate).
