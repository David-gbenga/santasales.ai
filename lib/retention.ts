import "server-only";
import { EVENT_RETENTION_DAYS, PREVIEW_RETENTION_DAYS } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";

/** At most this many unpaid previews are removed per run, so a run stays well inside its time limit. */
const BATCH = 300;

type Candidate = {
  id: string;
  orders: { id: string; status: string }[];
};

export type RetentionReport = {
  previewsDeleted: number;
  ordersDeleted: number;
  filesDeleted: number;
  eventsDeleted: number;
  usageRowsDeleted: number;
};

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

/**
 * Applies the retention periods promised in the privacy notice:
 * - unpaid card/song previews older than PREVIEW_RETENTION_DAYS, with any
 *   abandoned (pending) checkout, child add-on rows and stored sample clips;
 * - cookie-free analytics events older than EVENT_RETENTION_DAYS;
 * - daily rate-limit counters from before yesterday.
 * Anything with a paid or refunded order is never touched.
 */
export async function applyRetention(): Promise<RetentionReport> {
  const db = createAdminClient();
  const report: RetentionReport = {
    previewsDeleted: 0,
    ordersDeleted: 0,
    filesDeleted: 0,
    eventsDeleted: 0,
    usageRowsDeleted: 0,
  };

  // 1. Old unpaid previews.
  const { data: candidates, error } = await db
    .from("generations")
    .select("id, orders(id, status)")
    .in("kind", ["card", "lyrics"])
    .lt("created_at", daysAgo(PREVIEW_RETENTION_DAYS))
    .order("created_at", { ascending: true })
    .limit(BATCH)
    .returns<Candidate[]>();
  if (error) throw new Error(`Finding old previews failed: ${error.message}`);

  const unpaid = candidates.filter((g) => g.orders.every((o) => o.status === "pending"));
  if (unpaid.length > 0) {
    const ids = unpaid.map((g) => g.id);
    const { data: children, error: childError } = await db
      .from("generations")
      .select("id, orders(id, status)")
      .in("parent_id", ids)
      .returns<Candidate[]>();
    if (childError) throw new Error(`Finding add-ons failed: ${childError.message}`);
    // An add-on with its own paid order means the parent was paid for too; skip that family.
    const blocked = new Set(
      children.filter((c) => c.orders.some((o) => o.status !== "pending")).map((c) => c.id),
    );
    if (blocked.size > 0) throw new Error(`Paid add-ons found under unpaid previews: ${[...blocked].join(", ")}`);

    const childIds = children.map((c) => c.id);
    const orderIds = [...unpaid, ...children].flatMap((g) => g.orders.map((o) => o.id));

    if (orderIds.length) {
      const { error: e } = await db.from("orders").delete().in("id", orderIds).eq("status", "pending");
      if (e) throw new Error(`Deleting pending orders failed: ${e.message}`);
      report.ordersDeleted = orderIds.length;
    }

    // Sample clips live at previews/<id>/clip-<n>.mp3 (one per free version).
    const clips = ids.flatMap((id) => [`previews/${id}/clip-1.mp3`, `previews/${id}/clip-2.mp3`]);
    const { data: removed, error: storageError } = await db.storage.from("generated").remove(clips);
    if (storageError) throw new Error(`Deleting sample clips failed: ${storageError.message}`);
    report.filesDeleted = removed?.length ?? 0;

    if (childIds.length) {
      const { error: e } = await db.from("generations").delete().in("id", childIds);
      if (e) throw new Error(`Deleting add-ons failed: ${e.message}`);
    }
    const { error: e } = await db.from("generations").delete().in("id", ids);
    if (e) throw new Error(`Deleting previews failed: ${e.message}`);
    report.previewsDeleted = ids.length;
  }

  // 2. Old analytics events.
  const { count: events, error: eventsError } = await db
    .from("events")
    .delete({ count: "exact" })
    .lt("created_at", daysAgo(EVENT_RETENTION_DAYS));
  if (eventsError) throw new Error(`Deleting old events failed: ${eventsError.message}`);
  report.eventsDeleted = events ?? 0;

  // 3. Rate-limit counters: only today's matter.
  const yesterday = daysAgo(1).slice(0, 10);
  for (const table of ["preview_usage", "concierge_usage"] as const) {
    const { count, error: usageError } = await db
      .from(table)
      .delete({ count: "exact" })
      .lt("day", yesterday);
    if (usageError) throw new Error(`Clearing ${table} failed: ${usageError.message}`);
    report.usageRowsDeleted += count ?? 0;
  }

  return report;
}
