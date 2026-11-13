# GiftPost Premium: accounts and the £25 subscription (proposal)

Status: **approved, being built** (13 November 2026). Stage A is done (7c13381). Stage B (Stripe subscription, webhook, portal, /premium) is done in test mode. Stages C and D are next.

## Decisions (13 November 2026)

- **Allowance per billing period: Option B**, chosen by the owner:
  - 15 songs, any length
  - 30 cards
  - 10 voice greetings

  Each item keeps 3 rewrites and 2 sung takes. Unused allowance doesn't roll over. The values are server constants in `lib/pricing.ts` (`PREMIUM_ALLOWANCE`).
- The following are defaults taken from the brief and can be changed:
  - **Interval:** every 30 days (Stripe `interval: day`, `interval_count: 30`).
  - **Failed payment:** access ends at the end of the paid period unless a renewal succeeds. While Stripe retries, the dashboard shows "Payment failed" with a button to update the card. A successful retry restores access straight away.
  - **Song lengths:** all lengths count as one song.
  - **14-day cancellation:** the subscriber asks for immediate access at checkout. A full refund within 14 days is given only if nothing has been made. Refunds are made by hand in Stripe.

## 1. What exists today (assessment)

| Area | Today | What it means for Premium |
|---|---|---|
| Auth | Supabase Auth via `@supabase/ssr` (`lib/supabase/auth.ts`). Used only for admins: magic link plus password (`app/admin/auth-actions.ts`). `app/auth/callback/route.ts` **signs out anyone who isn't an admin**. `proxy.ts` refreshes cookies on `/admin` and `/auth` only. | Reuse Supabase Auth for customers. Supabase hashes passwords (bcrypt) and handles sessions, email confirmation and password reset, so no new auth library is needed. The callback must stop signing out customers, and `/account` joins the proxy matcher. Admin access stays gated by `ADMIN_EMAILS`. |
| Payments | Stripe Checkout in `mode: "payment"` only (`app/api/checkout/route.ts`). The webhook handles `checkout.session.completed`, `async_payment_succeeded` and `charge.refunded`, idempotent through `stripe_session_id`. | Add a separate `mode: "subscription"` checkout and new webhook branches. The current handler must skip subscription sessions so they don't go through `markOrderPaid`. |
| Paid state | Everything keys off an **order**: generation access (`lib/generation-route.ts`, `isPaid` = order paid), downloads (`/api/download/[orderId]`), thank-you emails, and retention (anything with a paid order is kept). | **Key design choice:** when a subscriber makes a card or song, write a **£0 "premium" order** linked to the subscription. All the download, rewrite, finalize, email and retention code then works unchanged. Admin revenue is unaffected. Order counts filter by `source`. |
| Abuse limits | `preview_take` allows 5 previews per visitor per day and 400 per day site-wide. 1 free re-roll. 3 paid rewrites. 2 sung takes per song. | Subscribers get a per-billing-period allowance instead (section 4), taken atomically in SQL. The 400-per-day site-wide backstop stays. |
| Email | Resend over REST (`lib/email.ts`). `RESEND_API_KEY` is still not set in production. | Supabase's built-in mailer is limited to a few emails an hour, which caused the admin magic-link trouble. Sign-up confirmation and password reset need **Supabase custom SMTP pointed at Resend**. |
| Tests | Playwright e2e (55 smoke tests on production). Vitest can't run on the local Node 22.11. | Webhook and entitlement tests run as Playwright API tests against a local server, using Stripe **test mode** plus Stripe **test clocks** for renewal, failure and expiry. Vitest units run on CI or after upgrading local Node to 22.12 or later. |

Guest checkout is not touched. Products, cards and songs can still be bought without an account.

## 2. Real costs per item (for setting the allowance)

Prices fetched 13 November 2026:
- Claude Sonnet 5.5: $2 per million input tokens, $10 per million output tokens.
- ElevenLabs: Eleven Music $0.15 per generated minute (about 900–1,000 credits a minute). Text to Speech (Multilingual v2) $0.08 per 1,000 characters.

Token counts are estimates (about 3k in and 1–1.5k out per draft), not measured. £1 is taken as roughly $1.27.

| Item | What one item can trigger at most | Worst case | Typical |
|---|---|---|---|
| Card | 5 Claude drafts (first, re-roll, 3 rewrites). Rendering is free (Satori, pdf-lib). | ~$0.08 (**~6p**) | ~2p |
| Song, short (~40s) | 5 drafts, 2 × 15s preview clips, 2 sung takes | ~$0.43 (**~34p**) | ~15p |
| Song, standard (~1–1½ min) | same | ~$0.61 (**~48p**) | ~22p |
| Song, long (~2 min) | same | ~$0.83 (**~65p**) | ~30p |
| Voice greeting | 3 takes × ~500 characters | ~$0.12 (**~10p**) | ~4p |

Stripe takes about 1.5% + 20p of each £25 renewal (UK cards), roughly 58p. No VAT applies (below the threshold).

Unlimited use is not safe: one subscriber making 100 long songs in a month would cost about £65 against £24.42 received.

## 3. Proposed architecture (minimum change)

### Database (one new migration, additive only)
- `profiles`: `user_id` (pk, refers to `auth.users`, cascade), `full_name` (1–80 characters), `stripe_customer_id` (unique), timestamps.
- `subscriptions`: `stripe_subscription_id` (unique), `user_id`, `status` (Stripe's own values), `current_period_start`/`current_period_end`, `cancel_at_period_end`, `canceled_at`, `ended_at`, `latest_event_at`. One row per Stripe subscription. A partial unique index allows only one live (active, trialing or past_due) subscription per user.
- `stripe_events`: `event_id` pk, `type`, `processed_at`. A duplicate delivery is a no-op.
- `entitlement_usage`: (`subscription_id`, `period_start`, `kind`) → `count`. The security-definer RPC `entitlement_take(user, kind)` checks the subscription is live and under its limit, increments in one statement, and returns true or false. A matching `entitlement_release` hands the slot back if a generation fails.
- `generations.user_id` (nullable): links a subscriber's work to their account for history.
- `orders`: add `source` (`checkout` | `premium`, default `checkout`) and `subscription_id` (nullable). A premium order uses `stripe_session_id = 'premium:<generation_id>'`, `amount_pence = 0`, `status = 'paid'`. Existing rows stay exactly as they are.
- `account_events`: audit log of sign-up, subscription changes, payment failures and cancellations, written by the server only.
- **RLS:** a signed-in user may `select` only their own `profiles`, `subscriptions`, `entitlement_usage`, and generations and orders where `user_id = auth.uid()`. **No insert, update or delete for clients on any of these.** Only the service role (webhook and server routes) writes, so nobody can change their own status or dates.

### Stripe
- One Product, "GiftPost Premium", with a recurring £25 GBP Price looked up by `lookup_key = giftpost_premium` and created by a one-off script in test mode and in live mode. No price ID ever comes from the browser.
- `POST /api/subscribe` (signed in and email confirmed): reuses or creates the Stripe Customer stored on the profile, so there are no duplicates. Refuses if a live subscription exists and sends the user to the portal instead. Creates Checkout with `mode: "subscription"`, `client_reference_id = user.id`, metadata `user_id`, and the auto-renew consent text.
- `POST /api/billing-portal`: a Stripe Customer Portal session for the user's own customer (change card, cancel at period end, invoices).
- Webhook additions, each recorded in `stripe_events` first:
  - `checkout.session.completed` (mode subscription)
  - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
  - `invoice.paid`, `invoice.payment_failed`

  For every subscription event the handler **re-fetches the subscription from Stripe** and upserts it, so out-of-order or missed events can't leave stale state. The daily cron also reconciles live rows against Stripe.
- Access rule (server only): status `active` or `trialing` **and** `now < current_period_end`. Cancelling sets `cancel_at_period_end`, and access continues until the period ends.

### App
- **Pages:** `/signup`, `/login`, `/forgot-password`, `/reset-password`, `/account` (dashboard), `/premium` (plan, price and renewal terms).
- **Header:** "Sign in" or "My account". Logout is a server action.
- **Dashboard:** name and email, plan, status (Active, Cancelling, Expired, Payment failed), start date, next billing or access-end date, allowance left this period, history of cards and songs with downloads, and a "Manage subscription" button (portal). Users can edit their name and change their password.
- **Creating as a subscriber:** the existing card and song forms. When a signed-in subscriber starts one, the server takes an allowance slot and creates the generation with `user_id` and a premium order. It then behaves exactly like a paid item: no watermark, 3 rewrites, finalize, downloads. Guests and non-subscribers see today's flow unchanged.
- **Rate limits:**
  - Supabase Auth's own limits on sign-up, sign-in and reset.
  - A per-IP daily limit on our auth server actions, using the existing hashed-visitor approach.
  - The allowance RPC on generations.
- **Emails:**
  - Supabase sends confirmation and reset emails (through Resend SMTP).
  - We send "payment failed" and "subscription ended" notices through `lib/email.ts`.
  - Stripe can also send renewal and receipt emails (a Stripe setting).

### Legal (drafts for your review)
- **Terms:** a new subscription section covering:
  - price, the 30-day renewal and how to cancel (any time, in the portal)
  - access lasting to the end of the paid period
  - the allowance
  - the 14-day cancellation right for digital content, with an express request for immediate access
  - what happens on failed payment
- **Privacy notice:** account data (name, email, password hashed by Supabase), Stripe customer and subscription data, and how long accounts are kept, including account deletion on request.
- **UK subscription rules:** the DMCC Act 2024 subscription-contract regime (pre-contract information, renewal reminders, easy cancellation) may or may not be in force when you launch. I'll build reminders and one-click portal cancellation either way, but please check its commencement date before launch. This is not legal advice.

### Tests (all 15 asked for)
- **Playwright API and e2e, local server, Stripe test mode:**
  - sign-up, confirm, login, logout, reset (using Supabase `generateLink`, as with the admin tests)
  - subscribe with test card 4242, then activation through the real webhook (`stripe listen`)
  - signature rejection, and duplicate-event no-ops
  - renewal, failed payment and expiry with **Stripe test clocks**
  - cancellation through the portal API
  - unauthorised access: another user's account data and downloads, a non-subscriber calling premium routes, a client trying to write subscription rows through the anon key
  - allowance exhausted returns 402
  - the existing guest checkout specs re-run unchanged
- **Vitest units:** access rule and status mapping. These run once local Node is at least 22.12, or in CI.

### Build order (each stops for your check)
- **A:** migration, auth pages, account basics.
- **B:** Stripe subscription, webhook, portal.
- **C:** entitlements wired into the card and song routes, dashboard history.
- **D:** legal text, tests, production setup.

This is roughly 2–3 days of work.

## 4. Decisions needed from you before building

1. **Allowance per 30-day period.** No limit is set until you choose. Options, with worst-case cost to you:
   - **A:** 10 songs + 20 cards + 5 voice greetings. Worst case about £8.
   - **B (my suggestion):** 15 songs + 30 cards + 10 voice greetings. Worst case about £12, still about £12 margin even if every item is used to the maximum.
   - **C:** 25 songs + 50 cards + 20 voice greetings. Worst case about £20.

   Each item keeps today's 3 rewrites and 2 sung takes. Unused allowance doesn't roll over.
2. **Billing interval:** exactly every 30 days (Stripe `interval: day, interval_count: 30`, as you wrote) or calendar monthly (the more familiar "£25 a month"). Both work; only the wording and the dates differ.
3. **Failed payment:** Stripe retries for about a week (Smart Retries). Do subscribers keep access during retries (status "Payment failed", with a banner) or lose it at the first failure?
4. **Song lengths:** do all lengths, long included, come out of the same song allowance?
5. **Refunds within 14 days:** the standard approach is to ask for immediate access, so the cancellation right is lost once the subscriber has used the allowance, and to refund in full if nothing has been used. Is that your policy?
6. **Email delivery (your setup):** a Resend account with giftpost.co.uk verified, `RESEND_API_KEY` set in Vercel, and Resend's SMTP details entered in Supabase (Authentication → SMTP). In Supabase, also turn on **Confirm email** and add `https://www.giftpost.co.uk/auth/callback` to the redirect URLs.
