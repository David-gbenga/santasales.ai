import "server-only";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { designSuits, getActiveCardDesigns } from "@/lib/card-designs";
import type { ConciergeWidget } from "@/lib/concierge/types";
import { formatPrice } from "@/lib/format";
import { getActiveGalleryItems, storeHost } from "@/lib/gallery";
import { LYRIC_LENGTH_LABELS, LYRIC_STYLE_LABELS } from "@/lib/lyrics-options";
import { mediaUrl } from "@/lib/media";
import { SONG_STYLES, SONG_STYLE_KEYS, VOCAL_KEYS } from "@/lib/audio-options";
import { OCCASION_KEYS } from "@/lib/occasions";
import { CARD_PRICE_PENCE, SONG_PRICE_BY_LENGTH, songPricePence } from "@/lib/pricing";
import { getActiveProducts } from "@/lib/products";
import {
  CARD_TONES,
  LYRIC_LENGTHS,
  LYRIC_STYLES,
  RELATIONSHIPS,
  cardInputSchema,
  lyricsInputSchema,
} from "@/lib/validation";

const TEASER_MAX_WORDS = 18;

/** One opening line, no line breaks, short. Returns a problem or null. */
function checkTeaser(teaser: string): string | null {
  const t = teaser.trim();
  if (!t) return "teaser is empty";
  if (/\n/.test(t)) return "teaser must be a single line";
  if (t.split(/\s+/).length > TEASER_MAX_WORDS) return `teaser must be at most 15 words`;
  return null;
}

function issues(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ");
}

const personFields = {
  recipientName: z
    .string()
    .max(40)
    .describe("The recipient's name as it should appear, e.g. 'Grandad Ken'"),
  senderName: z.string().max(40).describe("The buyer's own name. Ask if you don't know it."),
  occasion: z.enum(OCCASION_KEYS).describe("What the card or song is for"),
  anonymous: z
    .boolean()
    .optional()
    .describe("True to keep the buyer's name off the card or song and its gift page"),
  relationship: z
    .enum(RELATIONSHIPS)
    .optional()
    .describe("Who the recipient is to the buyer, if known"),
  details: z
    .string()
    .max(500)
    .describe("What the buyer told you about the person, in plain words, for the writer"),
  teaser: z
    .string()
    .max(140)
    .describe("ONE original opening line, at most 15 words. Never the full text."),
};

/**
 * Tools for one concierge request. Display tools push validated widgets into
 * `widgets`; nothing here takes payment or creates a checkout session (the
 * shopper's Pay click does that through /api/checkout).
 */
export function createConciergeTools(widgets: ConciergeWidget[], shown: string[]) {
  const searchGifts = betaZodTool({
    name: "search_gifts",
    description:
      "Search this site's shop printables and the gallery of gift ideas from other shops. Returns ids, names and prices to choose from. Call before recommending anything.",
    inputSchema: z.object({
      query: z
        .string()
        .max(100)
        .optional()
        .describe("Keywords about the person or gift, e.g. 'gardening', 'kids'"),
      maxPricePounds: z
        .number()
        .min(0)
        .max(1000)
        .optional()
        .describe("Budget ceiling in pounds, if given"),
    }),
    async run({ query, maxPricePounds }) {
      const [products, gallery] = await Promise.all([getActiveProducts(), getActiveGalleryItems()]);
      const words = (query ?? "")
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length > 2);
      const matches = (text: string) =>
        words.length === 0 || words.some((w) => text.toLowerCase().includes(w));

      let shop = products.filter(
        (p) => maxPricePounds === undefined || p.price_pence <= maxPricePounds * 100,
      );
      const shopMatches = shop.filter((p) => matches(`${p.name} ${p.description}`));
      if (shopMatches.length) shop = shopMatches;
      let ideas = gallery;
      const ideaMatches = gallery.filter((g) => matches(g.title));
      if (ideaMatches.length) ideas = ideaMatches;

      return JSON.stringify({
        note:
          words.length && !shopMatches.length && !ideaMatches.length
            ? "Nothing matched those words exactly; here is everything available."
            : undefined,
        shop: shop.map((p) => ({
          id: p.id,
          name: p.name,
          price: formatPrice(p.price_pence, p.currency),
          description: p.description.slice(0, 160),
        })),
        gallery: ideas.map((g) => ({
          id: g.id,
          title: g.title,
          store: storeHost(g.target_url),
          affiliate: g.is_affiliate,
          note: "Price is on the other shop's site.",
        })),
        ourPersonalGifts: {
          card: `Personal card for any occasion, ${formatPrice(CARD_PRICE_PENCE)}`,
          song: `Personal song for any occasion, written and sung: short ${formatPrice(SONG_PRICE_BY_LENGTH.short)}, standard ${formatPrice(SONG_PRICE_BY_LENGTH.standard)}, long ${formatPrice(SONG_PRICE_BY_LENGTH.long)}`,
        },
      });
    },
  });

  const showProducts = betaZodTool({
    name: "show_products",
    description:
      "Show shop products and/or gallery ideas to the visitor as cards with Buy/View buttons. Use ids from search_gifts. At most 3 of each.",
    inputSchema: z.object({
      productIds: z.array(z.string()).max(3).optional(),
      galleryIds: z.array(z.string()).max(3).optional(),
    }),
    async run({ productIds = [], galleryIds = [] }) {
      const [products, gallery] = await Promise.all([getActiveProducts(), getActiveGalleryItems()]);
      const names: string[] = [];
      for (const id of productIds) {
        const p = products.find((x) => x.id === id);
        if (!p) continue;
        widgets.push({
          type: "product",
          id: p.id,
          name: p.name,
          priceLabel: formatPrice(p.price_pence, p.currency),
          imageUrl: p.preview_image,
          href: `/shop/${p.slug}`,
        });
        names.push(p.name);
      }
      for (const id of galleryIds) {
        const g = gallery.find((x) => x.id === id);
        if (!g) continue;
        widgets.push({
          type: "gallery",
          id: g.id,
          title: g.title,
          imageUrl: g.image_url,
          url: g.target_url,
          store: storeHost(g.target_url),
          isAffiliate: g.is_affiliate,
        });
        names.push(`${g.title}${g.is_affiliate ? " (affiliate link)" : ""}`);
      }
      if (!names.length) return "None of those ids exist. Call search_gifts and use its ids.";
      shown.push(...names);
      return `Shown to the visitor: ${names.join(", ")}.`;
    },
  });

  const listCardDesigns = betaZodTool({
    name: "list_card_designs",
    description:
      "List the personal card designs with the occasions each suits (an empty list means any occasion), to pick one for offer_card.",
    inputSchema: z.object({}),
    async run() {
      const designs = await getActiveCardDesigns();
      return JSON.stringify(designs.map((d) => ({ slug: d.slug, name: d.name, occasions: d.occasions })));
    },
  });

  const offerCard = betaZodTool({
    name: "offer_card",
    description:
      "Show a personal card offer (any occasion) with a one-line teaser and a free-preview button. Needs the recipient's and buyer's names.",
    inputSchema: z.object({
      designSlug: z.string().max(64).describe("A slug from list_card_designs"),
      tone: z.enum(CARD_TONES),
      ...personFields,
    }),
    async run({ designSlug, teaser, ...rest }) {
      const designs = await getActiveCardDesigns();
      const design = designs.find(
        (d) => d.slug === designSlug && designSuits(d, rest.occasion),
      );
      if (!design)
        return `That design doesn’t suit this occasion or doesn’t exist. Choose one of: ${designs
          .filter((d) => designSuits(d, rest.occasion))
          .map((d) => d.slug)
          .join(", ")}.`;
      const teaserProblem = checkTeaser(teaser);
      if (teaserProblem) return `Not shown: ${teaserProblem}. Try again.`;
      const input = cardInputSchema.safeParse({ ...rest, relationship: rest.relationship ?? "" });
      if (!input.success)
        return `Not shown, fix this first (ask the visitor if needed): ${issues(input.error)}`;

      widgets.push({
        type: "card_offer",
        designSlug: design.slug,
        designName: design.name,
        imageUrl: mediaUrl(design.backgroundPath),
        teaser: teaser.trim(),
        priceLabel: formatPrice(CARD_PRICE_PENCE),
        recipientName: input.data.recipientName,
        input: { ...input.data, relationship: input.data.relationship ?? "" },
      });
      shown.push(`card offer for ${input.data.recipientName} (${design.name})`);
      return `Card offer shown with a free-preview button; the card costs ${formatPrice(CARD_PRICE_PENCE)} if they buy it.`;
    },
  });

  const offerSong = betaZodTool({
    name: "offer_song",
    description:
      "Show a personal song offer (any occasion; original lyrics, recorded as a sung song) with a one-line teaser and a free-preview button. Needs the recipient's and buyer's names.",
    inputSchema: z.object({
      style: z.enum(LYRIC_STYLES),
      length: z.enum(LYRIC_LENGTHS),
      musicStyle: z.enum(SONG_STYLE_KEYS).optional(),
      vocal: z.enum(VOCAL_KEYS).optional(),
      ...personFields,
    }),
    async run({ teaser, ...rest }) {
      const teaserProblem = checkTeaser(teaser);
      if (teaserProblem) return `Not shown: ${teaserProblem}. Try again.`;
      const input = lyricsInputSchema.safeParse({ ...rest, relationship: rest.relationship ?? "" });
      if (!input.success)
        return `Not shown, fix this first (ask the visitor if needed): ${issues(input.error)}`;

      widgets.push({
        type: "song_offer",
        teaser: teaser.trim(),
        priceLabel: formatPrice(songPricePence(input.data.length)),
        summary: `${SONG_STYLES[input.data.musicStyle].label} · ${LYRIC_STYLE_LABELS[input.data.style].label} · ${LYRIC_LENGTH_LABELS[input.data.length].hint}`,
        recipientName: input.data.recipientName,
        input: { ...input.data, relationship: input.data.relationship ?? "" },
      });
      shown.push(`song offer for ${input.data.recipientName}`);
      return `Song offer shown with a free-preview button; the song costs ${formatPrice(songPricePence(input.data.length))} if they buy it.`;
    },
  });

  return [searchGifts, showProducts, listCardDesigns, offerCard, offerSong];
}
