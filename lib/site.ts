import { formatPrice } from "@/lib/format";
import { CARD_PRICE_PENCE, PREVIEW_LIMITS, SONG_PRICE_BY_LENGTH } from "@/lib/pricing";

/**
 * Brand and landing-page copy. Placeholder values — replace with the real
 * brand name, headline and prices when they're decided (PRD §9, open questions).
 */
export const site = {
  name: "Snowpost",
  headline: "Intentional words and songs for your loved ones.",
  tagline: "It takes a little to be intentional. It costs less to be kind.",
  description:
    "Personal Christmas cards and sung songs, written for the person you're giving them to. Preview free, pay only if you love it.",
  // Static so the page can be fully prerendered (no request-time Date).
  copyrightYear: 2026,
} as const;

export const nav = [
  { href: "/cards", label: "Make a card" },
  { href: "/lyrics", label: "Write a song" },
  { href: "/shop", label: "Browse the shop" },
  { href: "/gallery", label: "See the gallery" },
] as const;

export const legalLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refunds", label: "Refunds" },
  { href: "/disclosure", label: "Affiliate disclosure" },
] as const;

/** Display prices, derived from the same constants checkout charges (lib/pricing.ts). */
export const displayPrices = {
  card: formatPrice(CARD_PRICE_PENCE),
  /** Lowest song price (short); longer songs cost more. */
  song: formatPrice(SONG_PRICE_BY_LENGTH.short),
  songMax: formatPrice(SONG_PRICE_BY_LENGTH.long),
} as const;

export const cardSteps = [
  {
    title: "Tell us about them",
    body: "Their name, how you know them, and the tone you want. Add a detail only you would know.",
  },
  {
    title: "Preview it free",
    body: "We write a short, original message and show you the finished card. Not quite right? Try one more version, free.",
  },
  {
    title: "Love it? Pay once",
    body: `${displayPrices.card} through Stripe, no account needed. Then edit the words or rewrite up to three more times.`,
  },
  {
    title: "Download and send",
    body: "Get a print-ready PNG and PDF, 5×7 inches, or send it as a gift link.",
  },
] as const;

export const faqs = [
  {
    q: "Do I need an account?",
    a: "No. You pay with Stripe and we link your order to your email address and order number.",
  },
  {
    q: "Can I see it before I pay?",
    a: `Yes. You see the whole card, or the full lyrics and a 15-second sung sample, before paying, and you can try one more version free. Downloads unlock once you pay. You can start up to ${PREVIEW_LIMITS.visitorPerDay} free previews a day.`,
  },
  {
    q: "How much does a song cost?",
    a: `From ${displayPrices.song} to ${displayPrices.songMax}, depending on length. That one price covers the lyrics and the full sung recording.`,
  },
  {
    q: "Are the cards and songs original?",
    a: "Yes. Every message and song is written new from your details. We never copy or rework existing songs or poems.",
  },
  {
    q: "How long do download links last?",
    a: "Each link works for 24 hours. For 30 days you can get a fresh one from your order page.",
  },
  {
    q: "Can I get a refund?",
    a: "Downloads start straight away, so you give up the usual 14-day cancellation right when you buy. If a file is broken or doesn't arrive, contact us and we'll fix it or refund you.",
  },
] as const;
