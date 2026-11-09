# CLAUDE.md

Instructions for Claude Code when working in this repository. Read `docs/PRD.md` for product requirements and the phased build plan; work one phase at a time and stop at each phase's checkpoint.

## Project summary

A Christmas-themed website: digital product store (Stripe), clickable store-links gallery, AI Christmas card and lyrics generators (pay before generating), admin dashboard with an AI-written sales summary, and a 3D landing page. Target: shippable in 2 days. Favour simple, working solutions over clever ones.

## Tech stack

- **Framework:** Next.js (App Router), TypeScript (strict), React Server Components by default
- **Styling:** Tailwind CSS; design tokens in `app/globals.css` as CSS variables
- **3D:** three, @react-three/fiber, @react-three/drei
- **Motion:** Lenis (smooth scroll), Motion (`motion/react`) for UI transitions — nothing heavier
- **Data/Auth/Files:** Supabase (Postgres + RLS, Storage, magic-link Auth) via `@supabase/ssr`
- **Payments:** Stripe Checkout (hosted) + webhooks + Stripe Tax
- **AI:** `@anthropic-ai/sdk` (Claude API)
- **Rendering cards:** `next/og` (Satori) for PNG, `pdf-lib` for PDF
- **Charts:** Recharts (admin only)
- **Validation:** Zod on every API input
- **Testing:** Playwright (e2e smoke), Vitest (small unit tests for pricing/validation)
- **Hosting:** Vercel (incl. Cron)
- **Package manager:** pnpm

Do not add dependencies beyond these without asking first.

## Folder structure

```
app/
  (site)/                 # public pages: page.tsx (landing), shop/, gallery/, cards/, lyrics/, checkout/success/
  (legal)/                # terms, privacy, refunds, disclosure
  admin/                  # dashboard (server-protected)
  api/
    checkout/route.ts
    stripe/webhook/route.ts
    download/[orderId]/route.ts
    generate/card/route.ts
    generate/lyrics/route.ts
    track/route.ts
    admin/summary/route.ts
components/
  three/                  # R3F scene, fallback image, canvas wrapper
  ui/                     # buttons, cards, inputs, dialogs
  sections/               # landing page sections
lib/
  stripe.ts               # server-only Stripe client + helpers
  supabase/               # server.ts, client.ts, admin.ts (service role, server-only)
  ai/                     # claude.ts, prompts/card.ts, prompts/lyrics.ts, prompts/summary.ts
  card-designs.ts         # design definitions
  analytics.ts            # track() helper using sendBeacon
  validation.ts           # Zod schemas
supabase/migrations/      # SQL migrations incl. RLS policies
tests/e2e/                # Playwright specs
public/                   # static assets, hero fallback image
```

## Commands

```bash
pnpm dev                     # local dev server
pnpm build                   # production build (must pass before finishing any phase)
pnpm lint                    # ESLint
pnpm typecheck               # tsc --noEmit
pnpm test                    # Vitest
pnpm test:e2e                # Playwright
supabase db push             # apply migrations
stripe listen --forward-to localhost:3000/api/stripe/webhook   # local webhooks
```

## Environment variables (names only — never commit values)

```
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
ANTHROPIC_API_KEY
ANTHROPIC_MODEL              # e.g. claude-sonnet-5-5
ADMIN_EMAILS                 # comma-separated allowlist
CRON_SECRET
RESEND_API_KEY               # optional (P1)
```

Keep `.env.example` in sync with this list. Never ask the user to paste key values into chat; tell them which variable to set and where.

## Rules

### Security
- Secret keys and the Supabase service-role client are **server-only** (`import 'server-only'`). Never expose them to client components.
- Orders become `paid` **only** in the Stripe webhook after `stripe.webhooks.constructEvent` verifies the signature. Never trust the success-page redirect or client data for payment state.
- Prices come from the database or server constants — never from the client request.
- Generation routes must check: order paid, `regen_count < 3`, generation not locked.
- RLS enabled on every table. Anon may only read active `products`/`gallery_items` and insert into `events`.
- All files (products, generated cards, uploads) in **private** buckets; serve via short-lived signed URLs.
- Validate every API input with Zod; enforce max lengths on all free-text fields.
- Never send customer emails or other personal data to Claude for the admin summary — aggregated numbers only.

### AI prompts
- Prompts live in `lib/ai/prompts/` as functions returning typed messages; keep them versioned and readable.
- Card and lyrics prompts: family-friendly, original wording, never reproduce or parody existing songs, poems or lyrics; respect requested tone and length.
- Return structured output (JSON validated with Zod) where the UI needs fields; retry once on a parse failure, then show a friendly error.
- Set sensible `max_tokens`; read the model from `ANTHROPIC_MODEL`.

### Accessibility
- Semantic HTML, visible focus states, colour contrast ≥ WCAG AA, labels on every input.
- Fully keyboard-usable; respect `prefers-reduced-motion` everywhere (3D, Lenis, Motion).
- The 3D canvas is decorative: `aria-hidden="true"`, with real text content outside it.

### 3D performance budget
- Load the scene with `next/dynamic` and `ssr: false`; headline and CTAs must render without it.
- Hero-scene JS ≤ ~250 KB gzipped; no large glTF models — prefer procedural geometry and one small HDR/environment.
- Clamp `dpr` to `[1, 1.5]`; use instancing/points for snow; pause rendering when the canvas is off-screen (`frameloop="demand"` or visibility check).
- Use drei `PerformanceMonitor` to drop effects on slow devices; static image fallback for reduced motion or WebGL failure.
- Targets: Lighthouse mobile Performance ≥ 80, LCP < 2.5 s, CLS < 0.1.

### Errors
- Every API route returns `{ error: string }` with a correct status code; log details server-side only.
- User-facing errors are friendly and say what to do next (e.g. "Your payment went through — refresh in a few seconds").
- Add `error.tsx` and `not-found.tsx`; never show stack traces to users.
- Stripe webhook handler is idempotent (upsert by `stripe_session_id`).

### Code style
- Server Components by default; `'use client'` only where interaction is needed.
- Small, named functions; no `any`; colocate component styles with Tailwind.
- Conventional commits; commit at the end of each phase.

## Skills to use

| When | Skill |
|---|---|
| Before designing any page or component — set a distinctive look, not a template | `frontend-design` |
| Setting up the hero scene: renderer, camera, animation loop | `threejs-fundamentals` |
| Writing the scene as React components, frame loop, adaptive performance | `threejs-react-three-fiber` |
| Shaping the ornament, snow (instancing/points) | `threejs-geometry` |
| Glass/metal ornament look | `threejs-materials` |
| Environment lighting and soft glow | `threejs-lighting` |
| Optional bloom on the ornament (drop on slow devices) | `threejs-postprocessing` |
| Any frame-rate or memory problem; final 3D check | `threejs-performance` |
| Black screen, invisible objects, wrong colours | `threejs-errors-rendering` |
| Writing/reviewing React and Next.js code, data fetching, bundle size | `vercel-react-best-practices` |
| End of each UI phase: accessibility and UX review | `web-design-guidelines` |
| Playwright checks of user journeys | `webapp-testing` |
| Preview and production deploys | `deploy-to-vercel` |

## Workflow

1. Read `docs/PRD.md` and confirm which phase you're on.
2. List the tasks for that phase, then build them in order.
3. Run `pnpm lint && pnpm typecheck && pnpm build` (and relevant tests) before declaring a phase done.
4. Check the phase's "Done" criteria in `docs/PRD.md` and report what passed, what didn't, and anything the user must provide next.
5. If something in scope can't fit the time box, say so and propose the cut from PRD §9 rather than silently skipping it.
