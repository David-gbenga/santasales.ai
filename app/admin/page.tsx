import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { RevenueChart, VisitsChart } from "@/components/admin/charts";
import { GenerateSummaryButton } from "@/components/admin/generate-summary-button";
import { requireAdmin } from "@/lib/admin-auth";
import { getLatestSummary } from "@/lib/admin/summary";
import { getStats, type Stats } from "@/lib/admin/stats";
import { formatPrice } from "@/lib/format";
import { sellerDetailsMissing } from "@/lib/site";

export const metadata: Metadata = { title: "Dashboard" };

export default function AdminDashboardPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<p className="p-8 text-ink-muted">Loading the dashboard…</p>}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

const percent = (n: number) => `${(n * 100).toFixed(n > 0 && n < 0.1 ? 1 : 0)}%`;

async function Dashboard({ searchParams }: Pick<PageProps<"/admin">, "searchParams">) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const range = sp.range === "30" ? 30 : 7;
  const liveOnly = sp.orders === "live";
  const [stats, summary] = await Promise.all([getStats(range, liveOnly), getLatestSummary()]);

  return (
    <AdminShell email={admin.email} current="/admin">
      {sellerDetailsMissing && (
        <p role="note" className="mb-6 rounded-md border border-berry/50 bg-white px-4 py-3 font-medium text-berry">
          Before launch: fill in your name, contact email and postal address in lib/site.ts
          (<code>seller</code>). The legal pages show them, and show a &ldquo;Draft&rdquo; warning
          until then.
        </p>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">How the shop is doing</h1>
          <p className="mt-1 text-ink-muted">
            {stats.periodStart} to {stats.periodEnd}
          </p>
        </div>
        <Filters range={range} liveOnly={liveOnly} />
      </div>

      {(stats.testOrdersIncluded > 0 || stats.testOrdersExcluded > 0) && (
        <p className="mt-4 rounded-md border border-line-snow bg-white px-4 py-2 text-sm text-ink-muted">
          {stats.testOrdersIncluded > 0
            ? `Includes ${stats.testOrdersIncluded} Stripe test-mode order${stats.testOrdersIncluded === 1 ? "" : "s"}. `
            : `${stats.testOrdersExcluded} test-mode order${stats.testOrdersExcluded === 1 ? "" : "s"} hidden. `}
          Delete test orders before launch so these numbers start clean.
        </p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Tile label="Revenue" value={formatPrice(stats.revenuePence)} />
        <Tile label="Orders" value={String(stats.orders)} />
        <Tile label="Average order" value={formatPrice(stats.averageOrderPence)} />
        <Tile label="Page views" value={String(stats.visits)} />
        <Tile label="Gallery clicks" value={String(stats.galleryClicks)} />
        <Tile
          label="Conversion"
          value={percent(stats.conversionRate)}
          hint="Orders ÷ shop, card and song page views"
        />
      </dl>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title="Revenue per day">
          <RevenueChart data={stats.daily} />
          <DailyTable stats={stats} column="revenue" />
        </Panel>
        <Panel title="Page views per day">
          <VisitsChart data={stats.daily} />
          <DailyTable stats={stats} column="visits" />
        </Panel>
      </div>

      <section
        aria-labelledby="summary-title"
        className="mt-8 rounded-xl border border-line-snow bg-white p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="summary-title" className="text-xl font-semibold">
            AI summary
          </h2>
          <GenerateSummaryButton />
        </div>
        {summary ? (
          <>
            <p className="mt-1 text-sm text-ink-muted">
              {summary.periodStart} to {summary.periodEnd} · written{" "}
              {summary.createdAt.slice(0, 16).replace("T", " ")} UTC
            </p>
            <div className="mt-4 max-w-prose whitespace-pre-line leading-relaxed">
              {summary.text}
            </div>
          </>
        ) : (
          <p className="mt-2 text-ink-muted">
            No summary yet. Generate one to get a short read-out of the last 7 days and what to try
            next.
          </p>
        )}
        <p className="mt-4 text-xs text-ink-muted">
          Only totals are sent to the AI: no names, emails or order details.
        </p>
      </section>

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Panel title="Sales by type">
          <Rows
            rows={stats.byKind.map((k) => ({
              label: k.label,
              value: `${k.orders} · ${formatPrice(k.revenuePence)}`,
              n: k.revenuePence,
            }))}
            empty="No sales yet."
          />
        </Panel>
        <Panel title="Top products">
          <Rows
            rows={stats.topProducts.map((p) => ({
              label: p.name,
              value: `${p.orders} · ${formatPrice(p.revenuePence)}`,
              n: p.revenuePence,
            }))}
            empty="No shop sales yet."
          />
        </Panel>
        <Panel title="Top card designs">
          <Rows
            rows={stats.topDesigns.map((d) => ({
              label: d.name,
              value: `${d.orders} cards`,
              n: d.orders,
            }))}
            empty="No cards sold yet."
          />
        </Panel>
        <Panel title="Top gallery items">
          <Rows
            rows={stats.topGallery.map((g) => ({
              label: `${g.title}${g.affiliate ? " (affiliate)" : ""}`,
              value: `${g.clicks} clicks`,
              n: g.clicks,
            }))}
            empty="No gallery clicks yet."
          />
        </Panel>
        <Panel title="Most viewed pages">
          <Rows
            rows={stats.topPages.map((p) => ({ label: p.path, value: `${p.views}`, n: p.views }))}
            empty="No page views yet."
          />
        </Panel>
        <Panel title="Other activity">
          <Rows
            rows={[
              { label: "Checkouts started", value: String(stats.checkoutStarts), n: 1 },
              { label: "Gift concierge opened", value: String(stats.conciergeOpens), n: 1 },
              { label: "Gift links made", value: String(stats.giftLinksMade), n: 1 },
            ]}
            empty=""
          />
        </Panel>
      </div>
    </AdminShell>
  );
}

function Filters({ range, liveOnly }: { range: 7 | 30; liveOnly: boolean }) {
  const link = (r: number, live: boolean) => `/admin?range=${r}${live ? "&orders=live" : ""}`;
  const pill = "inline-flex min-h-10 items-center rounded-full px-4 text-sm font-semibold";
  const on = "bg-ink text-snow";
  const off = "border border-ink/25 bg-white hover:border-ink";
  return (
    <div className="flex flex-wrap gap-2" aria-label="Filters">
      {[7, 30].map((r) => (
        <Link
          key={r}
          href={link(r, liveOnly)}
          aria-current={range === r ? "true" : undefined}
          className={`${pill} ${range === r ? on : off}`}
        >
          Last {r} days
        </Link>
      ))}
      <Link href={link(range, !liveOnly)} aria-pressed={!liveOnly} className={`${pill} ${off}`}>
        {liveOnly ? "Show test orders" : "Hide test orders"}
      </Link>
    </div>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line-snow bg-white p-4">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
      {hint && <dd className="mt-1 text-xs text-ink-muted">{hint}</dd>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line-snow bg-white p-5">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Rows({
  rows,
  empty,
}: {
  rows: { label: string; value: string; n: number }[];
  empty: string;
}) {
  if (!rows.length) return <p className="text-ink-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-line-snow">
      {rows.map((r) => (
        <li key={r.label} className="flex items-baseline justify-between gap-3 py-2">
          <span className="min-w-0 truncate">{r.label}</span>
          <span className="shrink-0 tabular-nums text-ink-muted">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

function DailyTable({ stats, column }: { stats: Stats; column: "revenue" | "visits" }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-ink-muted hover:text-ink">Show as a table</summary>
      <table className="mt-2 w-full text-left tabular-nums">
        <thead>
          <tr className="text-ink-muted">
            <th scope="col" className="py-1 font-medium">
              Date
            </th>
            <th scope="col" className="py-1 font-medium">
              {column === "revenue" ? "Revenue" : "Page views"}
            </th>
            {column === "revenue" && (
              <th scope="col" className="py-1 font-medium">
                Orders
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {stats.daily.map((d) => (
            <tr key={d.date} className="border-t border-line-snow">
              <td className="py-1">{d.date}</td>
              <td className="py-1">
                {column === "revenue" ? formatPrice(d.revenuePence) : d.visits}
              </td>
              {column === "revenue" && <td className="py-1">{d.orders}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
