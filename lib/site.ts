import { formatPrice } from "@/lib/format";
import { CARD_PRICE_PENCE, LYRICS_PRICE_PENCE } from "@/lib/pricing";

/**
 * Brand and landing-page copy. Placeholder values — replace with the real
 * brand name, headline and prices when they're decided (PRD §9, open questions).
 */
export const site = {
  name: "Snowpost",
  tagline: "Christmas words, written for one person",
  description:
    "Personal Christmas cards and song lyrics, written for the person you're giving them to. Plus printables you can download tonight.",
  // Static so the page can be fully prerendered (no request-time Date).
  copyrightYear: 2026,
} as const;

export const nav = [
  { href: "/cards", label: "Cards" },
  { href: "/lyrics", label: "Lyrics" },
  { href: "/shop", label: "Shop" },
  { href: "/gallery", label: "Gallery" },
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
  lyrics: formatPrice(LYRICS_PRICE_PENCE),
} as const;

export const cardSteps = [
  {
    title: "Tell us about them",
    body: "Their name, how you know them, and the tone you want. Add a detail only you would know.",
  },
  {
    title: "Pay once",
    body: `${displayPrices.card} through Stripe. No account needed.`,
  },
  {
    title: "Read your message",
    body: "We write a short, original message for them. Not quite right? Try again up to three times, or edit the words yourself.",
  },
  {
    title: "Download and send",
    body: "Get a print-ready PNG and PDF, 5×7 inches.",
  },
] as const;

export const faqs = [
  {
    q: "Do I need an account?",
    a: "No. You pay with Stripe and we link your order to your email address and order number.",
  },
  {
    q: "Why do I pay before the message is written?",
    a: "Every message is written fresh for your recipient. Paying first covers that, and you get three rewrites plus the option to edit the words yourself.",
  },
  {
    q: "Are the cards and lyrics original?",
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
