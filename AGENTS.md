<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: سينوفا إنترناشيونال (Sinova International)

Saudi building-materials marketplace. Next.js 16 (App Router, Server Actions) + Prisma 6 + SQLite, Arabic RTL UI, Tailwind v4, custom JWT session auth (`jose` + `bcryptjs`) with a DAL and `src/proxy.ts`.

### Commands (run after changes)

- `npm run lint` — ESLint (must pass).
- `npm run typecheck` — runs `next typegen` then `tsc --noEmit` (must pass). Run `next typegen` first; the `PageProps<"/...">` / `LayoutProps<"/...">` helpers are generated into `.next/types` and must be regenerated when routes change.
- `npm run build` — production build (verifies everything; routes are dynamic via `export const dynamic = "force-dynamic"` in the root layout).
- Database: `npm run db:push`, `npm run db:migrate`, `npm run db:seed`, `npm run db:studio`, `npm run db:generate`.

### Notes

- Database is **SQLite** (`DATABASE_URL="file:./dev.db"`, file created by `npm run db:push`). `SESSION_SECRET` must be set in `.env`.
- SQLite has no native enums, `Decimal`, or `mode: "insensitive"`: statuses/roles/units are `String`, money is `Float`. Keep this in mind when adding fields/queries.
- **Dual database mode:** the Prisma provider is chosen at generate/build time from `DATABASE_URL`. `scripts/prisma-sync.mjs` loads `.env`, and if `DATABASE_URL` starts with `postgres://`/`postgresql://` it writes a Postgres copy of `prisma/schema.prisma` (provider swapped) to the gitignored `prisma/schema.generated.prisma` and generates against it; otherwise it uses the SQLite schema. `npm run dev`/`db:generate`/`db:push` and `postinstall` all go through this script, so the client always matches the URL. Models are identical (String/Float only), so only the provider differs.
- **Deployment:** SQLite needs a persistent disk (Railway/Render/Fly.io/VPS); it cannot run on Vercel/Netlify/Lambda (`Unable to open the database file`). Vercel works only with Postgres: set `DATABASE_URL` (postgres; pooled URL is fine at runtime) + `SESSION_SECRET` (+ optional `ADMIN_EMAIL`/`ADMIN_PASSWORD`). If the Vercel Postgres/Neon integration only exposes `POSTGRES_URL`/`POSTGRES_PRISMA_URL`/`POSTGRES_URL_NON_POOLING`, `src/lib/prisma.ts` and `scripts/prisma-sync.mjs` auto-map them to `DATABASE_URL`/`DIRECT_URL`. `npm run build` runs `prisma db push` (using `DIRECT_URL` if set, for Neon/pooled DDL) and creates the admin. `next.config.ts` sets `outputFileTracingIncludes` for `node_modules/.prisma/client` so the query engine ships to Vercel. The `Dockerfile` targets a persistent-disk host, mounting SQLite at `file:/data/bunyan.db`; `npm run start` (`scripts/start.mjs`) runs `prisma db push`, optionally creates an admin, then `next start`. Use `npm run start:next` to skip the DB sync step.
- On Windows, `prisma generate` fails with `EPERM ... query_engine-windows.dll.node` while `next dev` is running; stop the dev server before regenerating.
- Prisma CLI on Windows may hang when invoked directly through some shells; run it with output redirected to a file if so. Prisma is pinned to 6.19.3 (do not use the `latest` dist-tag).
- The seed script runs via `node --import tsx prisma/seed.ts` (bare `tsx` is not on PATH when Prisma spawns the seed command).
- `cacheComponents` is intentionally disabled (`next.config.ts`) to use the classic dynamic rendering model.
- Order flow: only two roles exist — `ADMIN` and `CUSTOMER` (no suppliers). New orders land on the admin panel with `status: "PENDING"`. Only an admin manages the order items (`addOrderItem`/`updateOrderItem`/`removeOrderItem`, allowed only while `PENDING`; totals are recomputed) and accepts the order (`acceptOrder` → `CONFIRMED`, requires ≥1 item). Admins then advance the order (`PROCESSING`/`SHIPPED`/`DELIVERED`) or cancel it; customers may cancel while `PENDING`. Products are an admin-managed catalogue under `/admin/materials`. Order messaging is customer↔admin only.
