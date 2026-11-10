# PRD — Christmas Digital Store

**Status:** Draft v1 · **Owner:** [Your name] · **Target build time:** 2 focused days

---

## 1. Overview

A Christmas-themed website that sells digital products, showcases external products through a clickable gallery, and sells AI-personalised Christmas cards and song lyrics. A 3D hero scene sets the tone on the landing page. An admin dashboard shows sales and traffic, with an AI-written summary of performance.

### Decisions already made
| Area | Decision |
|---|---|
| Stack | Next.js (App Router) + TypeScript + Tailwind + React Three Fiber, hosted on Vercel |
| Data & files | Supabase (Postgres, Storage, Auth) |
| Payments | Stripe Checkout (hosted); Stripe Tax off for now (individual seller, see F2) |
| AI | Claude API |
| Analytics | Own `events` table in Supabase, cookie-free |
| AI pricing model | ~~Pay before generating~~ — **changed 2026-11-10: preview first, pay to unlock** (see F11) |

### Assumptions (change these if wrong)
- A1. Prices are in GBP. Card £2.99. Song (lyrics + sung recording, one price) by length: short £2.99, standard £3.49, long £3.99 (decision 2026-11-10). Digital products set per product.
- A2. No customer accounts. Buyers are identified by their Stripe Checkout email and order ID.
- A3. One admin (you), signing in by email magic link.
- A4. Each card or song gets **1 free re-roll** as a preview, then **3 regenerations** after payment before the result is locked.
- A5. Card output is a single-sided PNG (1500×2100 px, 5×7 in at 300 dpi) plus a PDF of the same image.
- A6. Download links expire after **24 hours**; buyers can request a fresh link from the order page within 30 days.
- A7. Uploaded customer photos are deleted automatically after 30 days.
- A8. Launch market: UK customers first (see Risks re: EU VAT).

---

## 2. Target users

- **Gift buyers** (main audience): want something personal, quickly, on their phone, without creating an account.
- **Digital product buyers**: printables, templates, wallpapers, etc. Want instant download after paying.
- **Browsers**: arrive from social media, look at the gallery and click out to stores.
- **Admin (you)**: wants to see what's selling and what to do more of, in two minutes a week.

---

## 3. Core user journeys

**J1 — Buy a digital product**
Landing → Shop → Product page → "Buy" → Stripe Checkout → Success page with download button → file downloads.

**J2 — Click through to a store**
Landing → Gallery → click product image → opens store page in a new tab (click is logged).

**J3 — Create an AI card (preview first)**
Cards → choose design → describe the card, names, tone → "Write my card (free preview)" → studio shows the whole card with a PREVIEW watermark → one free re-roll → "Pay £2.99" → Stripe Checkout → back to the studio → regenerate (max 3) or edit wording → download PNG + PDF.

**J4 — Create a song (preview first)**
Lyrics → recipient, details, mood (cheerful / sentimental / funny), music style, singer, length (price shown per length) → "Write my song (free preview)" → full lyrics (watermarked) + 15-second sung sample of the chorus → one free re-roll → pay → regenerate (max 3) or edit → save → full sung recording is made → download MP3, PDF, TXT.

**J5 — Admin weekly check**
/admin → magic-link sign-in → KPIs, charts, top items → read AI summary (or click "Regenerate summary").

---

## 4. Features

Priority: **P0** = must ship in the 2 days · **P1** = ship if time allows · **P2** = later phase.

### F1. 3D landing page — P0
One hero scene (recommended: a slowly rotating glass ornament with falling snow), headline ("Intentional words and songs for your loved ones." with "It takes a little to be intentional. It costs less to be kind." under it, decision 2026-11-10), CTAs and nav: Make a card · Write a song · Browse the shop · See the gallery, then smooth-scrolling sections: featured products, how the card generator works, gallery teaser, FAQ, footer.

**User stories**
- As a visitor, I see an eye-catching festive scene immediately, so the site feels special.
- As a mobile visitor, the page loads fast and doesn't drain my battery.

**Acceptance criteria**
- 3D canvas is lazy-loaded; headline and CTAs render before it (no layout shift).
- `prefers-reduced-motion` or low-performance devices get a static image fallback.
- Lighthouse mobile: Performance ≥ 80, Accessibility ≥ 95, CLS < 0.1, LCP < 2.5 s.
- Holds ~60 fps on a mid-range laptop and ≥ 30 fps on a mid-range phone.
- All CTAs reachable and usable by keyboard; canvas is `aria-hidden` with a text alternative.

### F2. Digital product store — P0
Grid of products → product detail page → Stripe Checkout → secure download.

**Acceptance criteria**
- Products are managed in Supabase (`products` table); files live in a **private** storage bucket.
- Checkout uses Stripe-hosted Checkout. ~~`automatic_tax` enabled~~ — **changed 2026-11-09:** Stripe Tax is off because the seller is an individual below the UK VAT threshold; it can be turned back on with `AUTOMATIC_TAX_ENABLED` in `lib/stripe.ts`.
- Order is marked paid **only** by the verified Stripe webhook (`checkout.session.completed`), never by the success page.
- Success page shows a download button once the order is paid (polls briefly if the webhook is slower than the redirect).
- Download route checks the order is paid, then redirects to a Supabase signed URL valid for 24 h.
- Test purchase with card `4242 4242 4242 4242` works end-to-end.

### F3. Store-links gallery — P0
Masonry/grid of product images, each linking to an external store page.

**Acceptance criteria**
- Items managed in Supabase (`gallery_items`).
- Links open in a new tab with `rel="sponsored noopener"` for affiliate links, `rel="noopener"` otherwise.
- Each click is logged to `events` before navigation (using `navigator.sendBeacon`).
- Clear affiliate disclosure on the page (required by the ASA/CMA and most affiliate programmes).
- Only images you own or have permission to use (e.g. affiliate programme assets).

### F4. AI Christmas card generator — P0 (photo upload P1)
**Acceptance criteria**
- 3–4 designs at launch. ~~Defined in code (`lib/card-designs.ts`)~~ — **changed 2026-11-10:** designs live in a `card_designs` table (name, background image in the public `media` bucket, text layout, sort, active) so new designs can be added without a code change or redeploy.
- Inputs validated server-side (length limits, required fields).
- ~~Pay first~~ **Preview first (2026-11-10, F11):** form inputs saved to an unpaid `generations` row via `POST /api/preview`; the studio writes the first draft; paying (`POST /api/checkout` `{kind:"preview"}`) creates the order, and the webhook marks it paid.
- `/api/generate/card`: unpaid → first draft and one free re-roll only, no finalize or downloads; paid → `regen_count < 3` and not locked.
- Claude writes a message of 30–80 words matching tone and relationship; prompt tells it to stay family-friendly and not to reproduce existing poems or song lyrics.
- Customer can lightly edit the generated text before final render.
- **Added 2026-11-10 — own words:** the form's main field is "Describe the card in your own words" (≤ 500 chars) with tap-to-add idea chips; relationship becomes optional when the description says enough, and tone stays as a suggestion. Claude treats the description as the main brief and follows reasonable content/style wishes (mention X, make it rhyme, keep it short) without letting it override the safety and originality rules (prompt `card-v2`).
- PNG rendered server-side (`next/og` / Satori), PDF made from the PNG (`pdf-lib`), both stored in a private bucket and downloaded via signed URL.
- P1: optional photo upload (JPEG/PNG, ≤ 5 MB), stored privately, deleted after 30 days.

### F5. AI lyrics generator — P0
**Acceptance criteria**
- Same preview-first flow as F4 (`kind = 'lyrics'`), priced by length, and every song comes sung (F10).
- Claude writes **original** lyrics (verse/chorus structure) using the customer's details; must not copy or parody existing songs.
- Output downloadable as PDF and TXT.
- If a backing track is configured, the download page also offers the MP3 (a file you own the rights to).
- ~~Out of scope: AI-sung audio (P2).~~ Every song is now sung (F10, F11).

### F6. Admin dashboard with AI summary — P0 (scheduled summary P1)
**Acceptance criteria**
- `/admin` protected by Supabase Auth magic link; access only for emails in `ADMIN_EMAILS`.
- KPIs for a chosen range (7 / 30 days): revenue, orders, average order value, visits, gallery clicks, conversion rate (paid orders ÷ product/creator page views).
- Breakdown by kind (product / card / lyrics), top products, top card designs, top gallery items.
- Sales data comes from the `orders` table (written by the webhook), so the dashboard doesn't call Stripe on every load.
- "Generate summary" button sends **aggregated numbers only** (no emails or personal data) to Claude and stores the result in `ai_summaries`.
- P1: weekly automatic summary via Vercel Cron, protected by `CRON_SECRET`.
- **Added 2026-11-10 — content management:** admin forms in `/admin` to add and edit products (sellable file → private `products` bucket; preview image → public `media` bucket; name, description, price, active), gallery items (image, title, link, affiliate flag, order, active) and card designs (background image, name, layout, active). Uploads go through server routes using the service role. Until then, content is managed in the Supabase dashboard (see §6a).

### F8. Gift Concierge chat — P1 (added 2026-11-10, built as Phase 5b)
A chat on the landing page that asks who the gift is for, their budget and style, then recommends shop products (and gallery items, labelled as affiliate links), cards and songs, and starts checkout.

**Acceptance criteria**
- Claude with tool use (SDK tool runner, max 6 tool rounds per message). **As built:** `search_gifts` (shop + gallery), `show_products`, `list_card_designs`, `offer_card` and `offer_song` (validate the same fields as the forms and show the offer with a one-line teaser). **The agent never creates a checkout session**: offers carry the prepared fields, and the shopper's own click sends them to `POST /api/preview` (a free preview; F11), then they pay from the studio, so there is one payment path with server prices. The agent never sees payment details or changes prices.
- **Previews are teasers only** (decision 2026-11-10): the design plus one opening line (≤ 15 words); in chat. ~~The full card or song is written after payment~~ — the offer button now opens a full free preview (F11).
- Per-visitor limit (40 messages/day, keyed by a daily-rotating HMAC of the IP — no raw IPs stored) and a global cap (3,000 messages/day) via the `concierge_take` database function; the Anthropic spending limit is the backstop. **Model:** `CONCIERGE_MODEL` (Claude Haiku 5.5, decision 2026-11-10), falling back to `ANTHROPIC_MODEL`.
- Chats are not stored beyond what a checkout needs; the Privacy page mentions the concierge.
- Lazy-loaded (landing page stays ≥ 80 mobile Performance); keyboard and screen-reader usable, replies announced politely.
- Bundles (one payment, one discount) remain P2: v1 recommends several items, each with its own checkout.

### F9. Gift links and sharing — P1 (added 2026-11-10, built as Phase 5c)
- After a card or song is finished, the buyer can make one private gift link per item (`/gift/<24-char token>`, unguessable, `noindex`) with an optional note (≤ 300 chars), and switch it off or back on.
- The recipient's page shows the card image or lyrics plus any paid voice greeting and sung version, via signed URLs that last an hour.
- Sending uses the buyer's own apps: WhatsApp (`wa.me` link), email (`mailto:`), copy link, and the phone's share sheet. Nothing is sent from our servers (server email via Resend needs a verified domain; later).

### F10. ElevenLabs audio add-ons — P1 (added 2026-11-10, built as Phase 5c)
- **Sung version** of finished lyrics — **changed 2026-11-10: included in the song price, no separate add-on;** music style and singer are chosen on the form and can be changed before saving. Recorded when the song is saved: ElevenLabs Music `music_v2_5`, lyrics passed verbatim as a composition plan (one chunk per section), style (cosy acoustic / upbeat pop / big band swing / piano ballad) and singer (female/male). Two takes. MP3 download and on the gift page. Supersedes the "AI-sung songs" P2 item below.
- **Voice greeting** for a finished card or song (£1.49 placeholder): ElevenLabs text-to-speech, 4 built-in British voices (no voice cloning), ≤ 400 characters, three takes (words and voice editable).
- Add-ons are child generations linked by `generations.parent_id` (the voice greeting has its own order; the sung version is paid by the song's order); takes are claimed atomically and returned on failure. `ELEVENLABS_API_KEY` needs only Text to Speech and Music permissions.
- **Licensing to confirm with ElevenLabs before selling:** their Music Terms limit Starter/Creator/Pro plans to "individual use"; Scale/Business/Enterprise cover businesses. Monthly music-minute limits apply per plan.
### F11. Preview before payment — P0 (added 2026-11-10)
- Every card and song can be previewed in full before paying, but nothing can be downloaded until the webhook marks the order paid.
- Card preview: the whole card, rendered in the browser with a repeated "PREVIEW" watermark; PNG/PDF are only rendered after payment.
- Song preview: the full lyrics (watermarked) plus a 15-second sung sample of the chorus (ElevenLabs Music, one clip per free version, stored privately, served by 1-hour signed URL).
- One free re-roll per preview (`generations.free_rerolls`, 0–1), then 3 paid rewrites.
- Limits: 5 new previews per visitor per day (keyed, daily-rotating hash of the IP; no cookies) and 400 per day site-wide (`preview_take`), so Claude and ElevenLabs costs stay bounded.
- The concierge's card and song offers start a free preview too.

- **Live AI phone calls: out of scope** (decision 2026-11-10) — recipient consent rules (AI voices count as "artificial voices"), abuse risk, Twilio setup. Revisit post-launch with legal advice and a recipient opt-in step.

### F7. Legal & trust pages — P0
Terms (including AI-generated content terms placeholder), Privacy, Refunds (digital goods: customer consent to immediate supply / loss of the 14-day cancellation right under UK consumer law — checkbox or wording at checkout), Affiliate disclosure, Contact.

---

## 5. Out of scope (later phases)

- ~~**P2 — AI-sung songs**~~ — brought forward and built as F10 (ElevenLabs), 2026-11-10.
- **Later — Live AI-voiced phone calls** to recipients (consent, abuse and telephony setup; see F10).
- **Later — Server-sent emails** to recipients via Resend once a custom domain is verified.
- **P2 — Autonomous AI agent** that makes decisions (pricing, promotions) on its own.
- P2 — Customer accounts and order history.
- P2 — Physical printing/posting of cards.
- P2 — Discount codes and bundles (Stripe supports these; just not in this build).
- P2 — Multi-currency storefront.

---

## 6. Data model (Supabase / Postgres)

```sql
products (
  id uuid pk, slug text unique, name text, description text,
  price_pence int, currency text default 'gbp',
  file_path text,            -- private bucket path
  preview_image text, active bool default true, created_at timestamptz
)

gallery_items (
  id uuid pk, title text, image_url text, target_url text,
  is_affiliate bool, sort int, active bool default true
)

orders (
  id uuid pk, stripe_session_id text unique, email text,
  kind text check (kind in ('product','card','lyrics')),
  product_id uuid null references products,
  generation_id uuid null references generations,
  amount_pence int, tax_pence int, currency text,
  status text check (status in ('pending','paid','refunded')),
  created_at timestamptz, paid_at timestamptz
)

generations (
  id uuid pk, kind text check (kind in ('card','lyrics')),
  design_id text null, input jsonb, output_text text,
  png_path text null, pdf_path text null, photo_path text null,
  regen_count int default 0, locked bool default false,
  free_rerolls int default 0, preview_audio_path text null,   -- F11
  created_at timestamptz
)

events (
  id bigserial pk, type text,   -- 'page_view' | 'gallery_click' | 'cta_click' | 'checkout_start'
  path text, ref_id text null, referrer text null, created_at timestamptz
)

ai_summaries (
  id uuid pk, period_start date, period_end date, text text, created_at timestamptz
)

-- Added 2026-11-10 (built in Phase 4)
card_designs (
  id uuid pk, slug text unique, name text,
  background_path text,      -- path in the public media bucket
  layout jsonb,              -- text box position, font, colours
  sort int, active bool default true, created_at timestamptz
)
```

**Security:** Row Level Security on every table. Public (anon) can read active `products`, `gallery_items` and `card_designs` and insert into `events` only. Everything else goes through server routes using the service-role key.

**Storage buckets:** `products`, `generated` and `uploads` are **private** (paid or personal files, served only through short-lived signed URLs). `media` is **public read** (added 2026-11-10) for images meant to be seen: product previews, gallery images and card backgrounds. Only the service role can write to it; PNG, JPEG and WebP only, 5 MB max.

## 6a. Managing content (decision 2026-11-10)

Content must never require a code change.

- **Now (until Phase 6):** use the Supabase dashboard.
  - *New product:* upload the file to the `products` bucket and the preview image to `media`, then add a `products` row (price in pence; `file_path` = the products-bucket path; `preview_image` = the media public URL). It appears in the shop within about a minute.
  - *New gallery item:* upload the image to `media` (or use the affiliate programme's image URL) and add a `gallery_items` row.
  - *New card design:* upload the background to `media` and add a `card_designs` row.
  - To hide anything, set `active = false` rather than deleting (past orders reference products).
- **Phase 6:** admin forms in `/admin` do the same with uploads handled automatically (F6).

## 7. Key routes

| Route | Purpose |
|---|---|
| `/` | Landing page with 3D hero |
| `/shop`, `/shop/[slug]` | Store and product pages |
| `/gallery` | Store-links gallery |
| `/cards`, `/cards/[generationId]` | Card form; card studio after payment |
| `/lyrics`, `/lyrics/[generationId]` | Lyrics form; lyrics studio after payment |
| `/checkout/success` | Post-payment page (product downloads) |
| `/admin` | Dashboard |
| `/terms`, `/privacy`, `/refunds`, `/disclosure` | Legal pages |
| `POST /api/checkout` | Create Checkout Session (product, card or lyrics) |
| `POST /api/stripe/webhook` | Verify signature, mark orders paid |
| `GET /api/download/[orderId]` | Check payment, redirect to signed URL |
| `POST /api/generate/card` | Generate/regenerate card text, render PNG + PDF |
| `POST /api/generate/lyrics` | Generate/regenerate lyrics |
| `POST /api/track` | Log an analytics event |
| `POST /api/admin/summary` | Build AI summary (admin session or cron secret) |

---

## 8. Third-party services — what you need to set up

| Service | What to do | Gives you |
|---|---|---|
| **Stripe** | Create account; turn on Stripe Tax and set your UK tax registration status; get **test** keys; later create a live webhook endpoint | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| **Supabase** | Create project (London region); enable email magic link auth | URL, anon key, service-role key |
| **Anthropic** | Create API key with a spending limit | `ANTHROPIC_API_KEY` |
| **Vercel** | Create project linked to your GitHub repo; add env vars | Hosting, cron, preview deploys |
| **Domain** (P1) | Point your domain at Vercel | Custom URL |
| **Resend** (P1) | Account + verified domain, for "your download is ready" emails | `RESEND_API_KEY` |
| **Affiliate programmes** | e.g. Amazon Associates sign-up | Affiliate links and permitted images |

You add every key yourself in `.env.local` and the Vercel dashboard.

---

## 9. Risks and open questions

**Risks**
- **Timeline is tight.** The phased plan below totals roughly 18–22 hours — two long days (≈ 27–33 h with the Phase 6 content forms and the Phase 5b concierge added 2026-11-10). If you fall behind, cut in this order: photo upload on cards → Resend emails → scheduled summary → lyrics backing track → reduce card designs to 2 → admin content forms (fall back to the Supabase dashboard, §6a) → Gift Concierge (Phase 5b).
- **Pay-before-generate friction.** Customers can't see AI quality before paying. Mitigate with sample cards on the page, the 3-regeneration allowance and editable text.
- **Webhook delay.** The success redirect can arrive before the webhook. The studio/success pages poll the order status for up to ~20 seconds.
- **AI misuse.** Offensive names or messages. Mitigate with input limits, prompt guardrails, and text editing only after AI output.
- **VAT.** UK: you only need to register once over the VAT threshold, but Stripe Tax needs your status set correctly. EU: selling digital services to EU consumers can require EU VAT registration (OSS) from the first sale for a UK business. Safest launch option is UK-only checkout until you've confirmed with an accountant.
- **Copyright.** Lyrics must be original; gallery images must be yours or programme-provided; backing tracks must be owned or licensed.
- **AI cost.** Each paid order allows at most 4 generations, so cost per order stays small and capped.

**Open questions for you**
1. Final prices for cards, lyrics and each digital product?
2. Brand name, colours, logo and hero scene choice?
3. UK-only at launch, or UK + EU?
4. Do you have a backing track you own for the lyrics product?
5. Refund policy wording for digital goods?

---

## 10. Phased build plan

Each phase ends with a testable checkpoint. "You provide" lists what's needed **before** the phase starts.

### Day 1

**Phase 0 — Setup (1–2 h)**
- Scaffold Next.js + TypeScript + Tailwind; ESLint/Prettier; Playwright.
- Create Supabase project; write migrations for all tables + RLS; create private buckets `products`, `generated`, `uploads`.
- Add `.env.example`; connect Vercel; deploy.
- ✅ Done: blank site live on a Vercel URL; migrations applied; `pnpm build` passes.
- 🧾 You provide: Supabase, Stripe (test mode), Anthropic and Vercel accounts + keys in `.env.local`.

**Phase 1 — 3D landing page (3–4 h)**
- Design tokens (colours, type), layout, nav, footer.
- R3F hero (ornament + snow), lazy-loaded, with static fallback and reduced-motion support.
- Smooth-scroll sections and CTAs.
- ✅ Done: Lighthouse mobile targets in F1 met; fallback shows on reduced motion.
- 🧾 You provide: brand name, colours, headline copy, hero choice.

**Phase 2 — Store, Stripe and downloads (3–4 h)**
- Product grid and detail pages from Supabase.
- `/api/checkout`, `/api/stripe/webhook`, `/api/download/[orderId]`, success page.
- ✅ Done: test purchase → webhook marks order paid → file downloads → link stops working after expiry (test with a short expiry).
- 🧾 You provide: product files, preview images, names, prices; Stripe Tax settings.

**Phase 3 — Gallery and tracking (1–2 h)**
- Gallery grid, affiliate disclosure, `/api/track`, page-view tracking.
- ✅ Done: clicking an item opens the store and creates an `events` row.
- 🧾 You provide: gallery images and links.

### Day 2

**Phase 4 — AI card generator (3–4 h)**
- Design picker, form, pay-first checkout, card studio, Claude message generation, edit, render PNG/PDF, download.
- ✅ Done: pay → generate → regenerate (blocked after 3) → edit → download PNG and PDF.
- Includes the `card_designs` table (+ RLS) and seeding the launch designs into it (decision 2026-11-10).
- 🧾 You provide: 3–4 card background images, card price.

**Phase 5 — AI lyrics generator (1–2 h)**
- Reuse the pay-first flow; lyrics prompt; PDF/TXT export; optional MP3.
- ✅ Done: pay → generate → regenerate → download.
- 🧾 You provide: lyrics price; backing track MP3 (optional).

**Phase 5b — Gift Concierge chat (6–8 h, added 2026-11-10)**
- Chat widget, tools (F8), teaser previews, checkout hand-off, limits, tests.
- ✅ Done: a shopper can describe a recipient and budget, get product and card suggestions with a teaser, and land on Stripe Checkout for a card with the form fields pre-filled; limits stop runaway use; landing Lighthouse mobile ≥ 80.
- 🧾 You provide: whether the concierge should use a cheaper model (e.g. Haiku 5.5) than the card writer.

**Phase 5c — Gift links + ElevenLabs add-ons (≈ 1–1½ days, added 2026-11-10)**
- Gift link page and share buttons (F9); sung version and voice greeting add-ons (F10).
- ✅ Done: a finished card or song can be sent by link; a paid greeting and sung version record, download and play on the gift page; links can be switched off.
- 🧾 You provide: ElevenLabs key (Text to Speech + Music permissions) and confirmation of your ElevenLabs plan's commercial terms.

**Phase 6 — Admin dashboard + AI summary (2–3 h, plus ~2–3 h for content forms)**
- Magic-link auth + allowlist, KPI cards, charts, top lists, summary generation.
- Content forms for products, gallery items and card designs with file uploads (added 2026-11-10, see F6).
- ✅ Done: non-admin emails are refused; numbers match test orders; summary generates; a product, gallery item and card design can be added from `/admin` and appear on the site.
- 🧾 You provide: admin email address.

**Phase 7 — Hardening and launch (2 h)**
- Playwright smoke tests for J1–J4; accessibility and UI review; legal pages; error pages.
- Switch to Stripe live keys; create live webhook; final production deploy.
- ✅ Done: launch checklist below complete.

---

## 11. Launch checklist

- [ ] Stripe live keys set in Vercel; live webhook endpoint created and secret updated
- [ ] Stripe Tax enabled and tax registration status correct; checkout limited to agreed countries
- [ ] One real low-value purchase made and refunded on live mode
- [ ] Terms, Privacy, Refunds (digital goods wording), Affiliate disclosure pages published
- [ ] AI-generated content terms added (ownership/usage, no guarantee of uniqueness, acceptable use)
- [ ] All Playwright smoke tests pass against production
- [ ] Lighthouse mobile targets met on production
- [ ] RLS checked: anon key cannot read orders, generations or events
- [ ] Anthropic spending limit set
- [ ] Photo-deletion job (if photo upload shipped) scheduled
- [ ] Custom domain connected (P1)
