import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type Kind = "product" | "card" | "lyrics" | "song_audio" | "voice_greeting" | "premium";
export const KIND_LABELS: Record<Kind, string> = {
  premium: "Premium memberships",
  product: "Shop downloads",
  card: "Cards",
  lyrics: "Song lyrics",
  song_audio: "Sung songs",
  voice_greeting: "Voice greetings",
};

export type Stats = {
  rangeDays: number;
  liveOnly: boolean;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;
  revenuePence: number;
  orders: number;
  averageOrderPence: number;
  visits: number;
  galleryClicks: number;
  /** Paid orders ÷ views of product and creator pages (shop items, /cards, /lyrics). */
  conversionRate: number;
  checkoutStarts: number;
  conciergeOpens: number;
  giftLinksMade: number;
  testOrdersExcluded: number;
  testOrdersIncluded: number;
  byKind: { kind: Kind; label: string; orders: number; revenuePence: number }[];
  daily: { date: string; revenuePence: number; orders: number; visits: number }[];
  topProducts: { name: string; orders: number; revenuePence: number }[];
  topDesigns: { name: string; orders: number }[];
  topGallery: { title: string; clicks: number; affiliate: boolean }[];
  topPages: { path: string; views: number }[];
};

type OrderRow = {
  kind: Kind;
  amount_pence: number;
  paid_at: string;
  stripe_session_id: string;
  /** Stripe test-mode payment. */
  test?: boolean;
  product: { name: string } | null;
  generation: { design_id: string | null } | null;
};
type EventRow = { type: string; path: string; ref_id: string | null; created_at: string };

const day = (iso: string) => iso.slice(0, 10);

function topN<T>(map: Map<string, T>, score: (v: T) => number, n = 5) {
  return [...map.entries()].sort((a, b) => score(b[1]) - score(a[1])).slice(0, n);
}

/** Aggregated numbers for the dashboard and the AI summary. No customer details. */
export async function getStats(
  rangeDays: 7 | 30,
  liveOnly: boolean,
  now = new Date(),
): Promise<Stats> {
  const db = createAdminClient();
  const since = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);

  const [ordersRes, eventsRes, galleryRes, designsRes, membershipRes] = await Promise.all([
    db
      .from("orders")
      .select(
        "kind, amount_pence, paid_at, stripe_session_id, product:products(name), generation:generations(design_id)",
      )
      .eq("status", "paid")
      // Premium cards and songs are £0 orders covered by a membership: the
      // membership payments below are the revenue, so they're left out here.
      .eq("source", "checkout")
      .gte("paid_at", since.toISOString())
      .returns<OrderRow[]>(),
    db
      .from("events")
      .select("type, path, ref_id, created_at")
      .gte("created_at", since.toISOString())
      .limit(100_000)
      .returns<EventRow[]>(),
    db.from("gallery_items").select("id, title, is_affiliate"),
    db.from("card_designs").select("slug, name"),
    db
      .from("subscription_payments")
      .select("stripe_invoice_id, amount_pence, paid_at, livemode")
      .is("refunded_at", null)
      .gte("paid_at", since.toISOString()),
  ]);
  for (const r of [ordersRes, eventsRes, galleryRes, designsRes, membershipRes]) {
    if (r.error) throw new Error(`Loading stats failed: ${r.error.message}`);
  }

  const memberships: OrderRow[] = (membershipRes.data ?? []).map((p) => ({
    kind: "premium",
    amount_pence: p.amount_pence as number,
    paid_at: p.paid_at as string,
    stripe_session_id: p.stripe_invoice_id as string,
    test: !p.livemode,
    product: null,
    generation: null,
  }));
  const allOrders = [...(ordersRes.data ?? []), ...memberships];
  const isTest = (o: OrderRow) => o.test ?? o.stripe_session_id.startsWith("cs_test_");
  const orders = liveOnly ? allOrders.filter((o) => !isTest(o)) : allOrders;
  const events = eventsRes.data ?? [];

  const revenuePence = orders.reduce((s, o) => s + o.amount_pence, 0);
  const pageViews = events.filter((e) => e.type === "page_view");
  const buyingPageViews = pageViews.filter(
    (e) => e.path.startsWith("/shop/") || e.path === "/cards" || e.path === "/lyrics",
  ).length;
  // Add-ons are bought from the studio, not from a product page, so they're left out of conversion.
  const primaryOrders = orders.filter(
    (o) => o.kind === "product" || o.kind === "card" || o.kind === "lyrics",
  ).length;

  // Daily series, including empty days so the chart has no gaps.
  const daily = new Map<string, { revenuePence: number; orders: number; visits: number }>();
  for (let i = rangeDays - 1; i >= 0; i--) {
    daily.set(day(new Date(now.getTime() - i * 86_400_000).toISOString()), {
      revenuePence: 0,
      orders: 0,
      visits: 0,
    });
  }
  for (const o of orders) {
    const d = daily.get(day(o.paid_at));
    if (d) {
      d.revenuePence += o.amount_pence;
      d.orders += 1;
    }
  }
  for (const e of pageViews) {
    const d = daily.get(day(e.created_at));
    if (d) d.visits += 1;
  }

  const byKind = new Map<Kind, { orders: number; revenuePence: number }>();
  const products = new Map<string, { orders: number; revenuePence: number }>();
  const designs = new Map<string, number>();
  const designNames = new Map(
    (designsRes.data ?? []).map((d) => [d.slug as string, d.name as string]),
  );
  for (const o of orders) {
    const k = byKind.get(o.kind) ?? { orders: 0, revenuePence: 0 };
    k.orders += 1;
    k.revenuePence += o.amount_pence;
    byKind.set(o.kind, k);
    if (o.kind === "product" && o.product) {
      const p = products.get(o.product.name) ?? { orders: 0, revenuePence: 0 };
      p.orders += 1;
      p.revenuePence += o.amount_pence;
      products.set(o.product.name, p);
    }
    if (o.kind === "card" && o.generation?.design_id) {
      const name = designNames.get(o.generation.design_id) ?? o.generation.design_id;
      designs.set(name, (designs.get(name) ?? 0) + 1);
    }
  }

  const galleryInfo = new Map((galleryRes.data ?? []).map((g) => [g.id as string, g]));
  const galleryClicks = new Map<string, number>();
  const pages = new Map<string, number>();
  for (const e of events) {
    if (e.type === "gallery_click" && e.ref_id)
      galleryClicks.set(e.ref_id, (galleryClicks.get(e.ref_id) ?? 0) + 1);
    if (e.type === "page_view") pages.set(e.path, (pages.get(e.path) ?? 0) + 1);
  }

  return {
    rangeDays,
    liveOnly,
    periodStart: day(since.toISOString()),
    periodEnd: day(now.toISOString()),
    revenuePence,
    orders: orders.length,
    averageOrderPence: orders.length ? Math.round(revenuePence / orders.length) : 0,
    visits: pageViews.length,
    galleryClicks: events.filter((e) => e.type === "gallery_click").length,
    conversionRate: buyingPageViews ? primaryOrders / buyingPageViews : 0,
    checkoutStarts: events.filter((e) => e.type === "checkout_start").length,
    conciergeOpens: events.filter((e) => e.type === "cta_click" && e.ref_id === "concierge:open")
      .length,
    giftLinksMade: events.filter(
      (e) => e.type === "cta_click" && e.ref_id?.startsWith("share:create"),
    ).length,
    testOrdersExcluded: liveOnly ? allOrders.filter(isTest).length : 0,
    testOrdersIncluded: liveOnly ? 0 : allOrders.filter(isTest).length,
    byKind: (Object.keys(KIND_LABELS) as Kind[]).map((kind) => ({
      kind,
      label: KIND_LABELS[kind],
      orders: byKind.get(kind)?.orders ?? 0,
      revenuePence: byKind.get(kind)?.revenuePence ?? 0,
    })),
    daily: [...daily.entries()].map(([date, d]) => ({ date, ...d })),
    topProducts: topN(products, (p) => p.revenuePence).map(([name, p]) => ({ name, ...p })),
    topDesigns: topN(designs, (n) => n).map(([name, n]) => ({ name, orders: n })),
    topGallery: topN(galleryClicks, (n) => n).map(([id, clicks]) => ({
      title: (galleryInfo.get(id)?.title as string | undefined) ?? "Removed item",
      clicks,
      affiliate: Boolean(galleryInfo.get(id)?.is_affiliate),
    })),
    topPages: topN(pages, (n) => n, 6).map(([path, views]) => ({ path, views })),
  };
}
