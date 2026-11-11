import { NextResponse } from "next/server";
import { isCron } from "@/lib/cron";
import { applyRetention } from "@/lib/retention";

export const maxDuration = 60;

/** Daily Vercel Cron (vercel.json): deletes data past its retention period. CRON_SECRET only. */
export async function GET(request: Request) {
  if (!isCron(request)) return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  try {
    const report = await applyRetention();
    console.log("[cron/retention]", JSON.stringify(report));
    return NextResponse.json(report);
  } catch (err) {
    console.error("[cron/retention] failed", err);
    return NextResponse.json({ error: "Retention run failed." }, { status: 500 });
  }
}
