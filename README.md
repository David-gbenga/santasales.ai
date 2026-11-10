# Snowpost (working name)

A Christmas-themed store: digital downloads, a store-links gallery, AI-written cards and song lyrics (pay first, then generate), and an admin dashboard. See [docs/PRD.md](docs/PRD.md) for requirements and the phased build plan, and [CLAUDE.md](CLAUDE.md) for engineering rules.

## Requirements

- Node.js **22.12 or later** (older 22.x breaks the Tailwind build and Vitest)
- pnpm 12: `npm i -g pnpm@12.18.0`
- Docker Desktop (only for running Supabase locally)

## Getting started

```bash
pnpm install
cp .env.example .env.local   # then fill in the values
pnpm dev
```

## Supabase

Schema, RLS policies and private storage buckets live in `supabase/migrations/`. The Supabase CLI runs through `npx`, so nothing needs installing globally.

**Hosted project (first time):**

1. Create a project at supabase.com (London region) and enable email magic-link sign-in.
2. Put the project URL, anon key and service-role key in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
3. Link and push the migrations:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push --remote   # CLI v3 targets the local stack unless --remote is given
   ```

**Local stack (optional):** `npx supabase start` runs Postgres, Auth and Storage in Docker and applies the migrations. To check RLS against it:

```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f supabase/tests/rls_check.sql
```

### What the database allows

| Table | Public (anon key) | Server (service role) |
|---|---|---|
| `products` | Read active rows, without `file_path` | Full |
| `gallery_items` | Read active rows | Full |
| `events` | Insert only (type, path, ref_id, referrer) | Full |
| `orders`, `generations`, `ai_summaries` | Nothing | Full |

Storage buckets `products`, `generated` and `uploads` are private; files are served through short-lived signed URLs from server routes. The `media` bucket is public-read for display images (product previews, gallery images, card backgrounds); only the service role can upload, PNG/JPEG/WebP up to 5 MB.

To add products, gallery items or card designs before the Phase 6 admin forms exist, see PRD §6a ("Managing content").

Because anon can't read `products.file_path`, public queries must list columns explicitly (`select('id, slug, name, …')`); `select('*')` fails.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Local dev server |
| `pnpm build` | Production build |
| `pnpm lint` / `pnpm typecheck` | ESLint / TypeScript |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Playwright smoke tests (set `PLAYWRIGHT_BASE_URL` to test a running server) |
