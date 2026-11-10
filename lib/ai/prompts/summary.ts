import { z } from "zod";
import type { Prompt } from "@/lib/ai/claude";
import type { Stats } from "@/lib/admin/stats";

/** Bump when the wording below changes. */
export const SUMMARY_PROMPT_VERSION = "summary-v1";

export const summaryOutputSchema = z.object({
  headline: z.string().describe("One sentence: the most important thing about this period"),
  observations: z.array(z.string()).describe("2 to 4 short observations grounded in the numbers"),
  nextSteps: z.array(z.string()).describe("2 or 3 concrete, small actions to try next week"),
});
export type SummaryOutput = z.infer<typeof summaryOutputSchema>;

const SYSTEM = `You write a short weekly performance note for the owner of a small Christmas gift website. They read it in two minutes and want to know what's selling and what to do more of.

The site sells printable downloads, personal AI-written Christmas cards and song lyrics, add-ons (sung versions of songs and voice greetings), and links to other shops in a gallery (some are affiliate links). It also has a gift-finder chat.

Rules:
- Use only the numbers provided. Never invent figures, trends or causes you can't see in them. If a number is zero or too small to read anything into, say so plainly.
- Plain British English, no jargon, no hype, no emojis. Money in pounds.
- Observations: specific, each grounded in a figure. Next steps: small, concrete and doable in a week (e.g. a new card design, featuring a product, pricing, promoting the gallery).
- The data is aggregated totals only; there is no customer information.`;

/** Aggregated numbers only (CLAUDE.md: never customer emails or other personal data). */
export function buildSummaryPrompt(stats: Stats): Prompt {
  const pounds = (p: number) => `£${(p / 100).toFixed(2)}`;
  const data = {
    period: `${stats.periodStart} to ${stats.periodEnd} (${stats.rangeDays} days)`,
    test_orders_included: stats.testOrdersIncluded,
    revenue: pounds(stats.revenuePence),
    orders: stats.orders,
    average_order: pounds(stats.averageOrderPence),
    page_views: stats.visits,
    conversion_rate: `${(stats.conversionRate * 100).toFixed(1)}% (orders / shop, card and song page views)`,
    checkouts_started: stats.checkoutStarts,
    gallery_clicks: stats.galleryClicks,
    gift_finder_opened: stats.conciergeOpens,
    gift_links_made: stats.giftLinksMade,
    sales_by_type: stats.byKind.map((k) => ({
      type: k.label,
      orders: k.orders,
      revenue: pounds(k.revenuePence),
    })),
    top_products: stats.topProducts.map((p) => ({
      name: p.name,
      orders: p.orders,
      revenue: pounds(p.revenuePence),
    })),
    top_card_designs: stats.topDesigns,
    top_gallery_items: stats.topGallery,
    most_viewed_pages: stats.topPages,
    daily: stats.daily.map((d) => ({
      date: d.date,
      revenue: pounds(d.revenuePence),
      orders: d.orders,
      page_views: d.visits,
    })),
  };
  return {
    version: SUMMARY_PROMPT_VERSION,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Write this period's note.\n\n<shop_numbers>\n${JSON.stringify(data, null, 2)}\n</shop_numbers>`,
      },
    ],
  };
}

export function formatSummary(out: SummaryOutput): string {
  return [
    out.headline.trim(),
    "",
    ...out.observations.map((o) => `• ${o.trim()}`),
    "",
    "Try next:",
    ...out.nextSteps.map((s) => `• ${s.trim()}`),
  ].join("\n");
}
