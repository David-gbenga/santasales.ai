import "server-only";
import { generateStructured } from "@/lib/ai/claude";
import { buildSummaryPrompt, formatSummary, summaryOutputSchema } from "@/lib/ai/prompts/summary";
import { getStats } from "@/lib/admin/stats";
import { createAdminClient } from "@/lib/supabase/admin";

export type SavedSummary = {
  periodStart: string;
  periodEnd: string;
  text: string;
  createdAt: string;
};

export async function getLatestSummary(): Promise<SavedSummary | null> {
  const { data, error } = await createAdminClient()
    .from("ai_summaries")
    .select("period_start, period_end, text, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Reading summary failed: ${error.message}`);
  return data
    ? {
        periodStart: data.period_start,
        periodEnd: data.period_end,
        text: data.text,
        createdAt: data.created_at,
      }
    : null;
}

/** Builds the last-7-days summary from aggregated numbers and stores it in ai_summaries. */
export async function generateWeeklySummary(): Promise<SavedSummary> {
  const stats = await getStats(7, false);
  const output = await generateStructured({
    prompt: buildSummaryPrompt(stats),
    schema: summaryOutputSchema,
    check: (o) =>
      o.observations.length < 1 || o.nextSteps.length < 1
        ? "needs at least one observation and one next step"
        : null,
    maxTokens: 4000,
    effort: "low",
  });
  const text = formatSummary(output);
  const { data, error } = await createAdminClient()
    .from("ai_summaries")
    .insert({ period_start: stats.periodStart, period_end: stats.periodEnd, text })
    .select("period_start, period_end, text, created_at")
    .single();
  if (error) throw new Error(`Saving summary failed: ${error.message}`);
  return {
    periodStart: data.period_start,
    periodEnd: data.period_end,
    text: data.text,
    createdAt: data.created_at,
  };
}
