"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Admin charts. Single series each (so no legend: the title names it), one
 * axis per chart (revenue and visits are separate charts, never dual-axis),
 * thin marks, recessive grid, hover tooltips, and a table view alongside.
 */
const SERIES = "#2a78d6"; // validated single hue (dataviz reference palette, slot 1)
const GRID = "#d5dee8";
const INK_MUTED = "#475873";

type Day = { date: string; revenuePence: number; orders: number; visits: number };

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
const pounds = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

const axis = { stroke: INK_MUTED, fontSize: 12, tickLine: false, axisLine: false } as const;

function TipBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-md border border-line-snow bg-white px-3 py-2 text-sm text-ink shadow-md">
      <p className="font-semibold">{title}</p>
      {lines.map((l) => (
        <p key={l} className="text-ink-muted">
          {l}
        </p>
      ))}
    </div>
  );
}

export function RevenueChart({ data }: { data: Day[] }) {
  return (
    <div
      className="h-56"
      role="img"
      aria-label="Revenue per day bar chart; the table below has the same numbers"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
          <CartesianGrid vertical={false} stroke={GRID} strokeWidth={1} />
          <XAxis dataKey="date" tickFormatter={shortDate} {...axis} minTickGap={16} />
          <YAxis
            tickFormatter={(v: number) => pounds(v)}
            {...axis}
            width={64}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgb(42 120 214 / 0.08)" }}
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <TipBox
                  title={shortDate(payload[0].payload.date)}
                  lines={[
                    `${pounds(payload[0].payload.revenuePence)} revenue`,
                    `${payload[0].payload.orders} orders`,
                  ]}
                />
              ) : null
            }
          />
          <Bar dataKey="revenuePence" fill={SERIES} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function VisitsChart({ data }: { data: Day[] }) {
  return (
    <div
      className="h-56"
      role="img"
      aria-label="Page views per day line chart; the table below has the same numbers"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={GRID} strokeWidth={1} />
          <XAxis dataKey="date" tickFormatter={shortDate} {...axis} minTickGap={16} />
          <YAxis {...axis} width={40} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: INK_MUTED, strokeWidth: 1, strokeDasharray: "3 3" }}
            content={({ active, payload }) =>
              active && payload?.[0] ? (
                <TipBox
                  title={shortDate(payload[0].payload.date)}
                  lines={[`${payload[0].payload.visits} page views`]}
                />
              ) : null
            }
          />
          <Line
            dataKey="visits"
            stroke={SERIES}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2, fill: SERIES }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
