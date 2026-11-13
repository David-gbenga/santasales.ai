import { formatPrice } from "@/lib/format";
import type { Occasion } from "@/lib/occasions";
import { CARD_PRICE_PENCE, PREVIEW_LIMITS, SONG_PRICE_BY_LENGTH } from "@/lib/pricing";

/** Brand and landing-page copy. Name and domain decided 2026-11-11. */
export const site = {
  name: "Giftpost",
  /** Production domain (giftpost.co.uk redirects to www). The live URL comes from NEXT_PUBLIC_SITE_URL. */
  domain: "giftpost.co.uk",
  /** Occasion the card and song forms start on. Change with the season. */
  seasonalOccasion: "christmas" as Occasion,
  headline: "Intentional words and songs for your loved ones.",
  tagline: "It takes a little to be intentional. It costs less to be kind.",
  description:
    "Personal cards and sung songs for birthdays, anniversaries, weddings, Christmas and every occasion, written for the person you're giving them to. Preview free, pay only if you love it.",
  // Static so the page can be fully prerendered (no request-time Date).
  copyrightYear: 2026,
} as const;

/**
 * Who sells on Giftpost, as shown on the legal pages. UK law requires the
 * seller's name, a contact email and a geographic address.
 *
 * Filled in 2026-11-11. A value starting with "[" counts as a placeholder:
 * while any remains, the legal pages show a
 * warning banner and the admin dashboard flags it.
 */
export const seller = {
  /** Your full legal name, or "Jane Smith trading as Giftpost". */
  legalName: "Tech Reyal Ltd trading as Giftpost",
  /** Where customers and data-protection requests go. */
  email: "info@techreyal.org",
  /** A UK postal address where you can receive letters. */
  address: "12B Southchurch Road, Southend-on-Sea, SS1 2NE",
  /** Update when the terms or privacy notice change. */
  lastUpdated: "11 November 2026",
} as const;

/** True while any seller detail is still a [placeholder]. */
export const sellerDetailsMissing = [seller.legalName, seller.email, seller.address].some((v) =>
  v.startsWith("["),
);

export const nav = [
  { href: "/cards", label: "Make a card" },
  { href: "/lyrics", label: "Write a song" },
  { href: "/shop", label: "Browse the shop" },
  { href: "/gallery", label: "See the gallery" },
  { href: "/premium", label: "Premium" },
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
    q: "Which occasions can I make a card or song for?",
    a: "Christmas, birthdays, anniversaries, weddings, Valentine’s Day, Mother’s and Father’s Day, congratulations, graduations, new babies, thank-yous, get well soon, retirements, or just because.",
  },
  {
    q: "Can I send a gift anonymously?",
    a: "Yes. Tick “Send anonymously” and your name won’t appear on the card, the song or the gift page. If you send the gift link from your own phone or email, they’ll see it came from you, so ask a friend to pass it on if it’s a real secret.",
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
