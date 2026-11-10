import { timingSafeEqual } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin-auth";
import { AiOutputError } from "@/lib/ai/claude";
import { generateWeeklySummary } from "@/lib/admin/summary";

export const maxDuration = 60;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Compared in constant time. */
function isCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret || secret.length < 16) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function run() {
  try {
    const summary = await generateWeeklySummary();
    return NextResponse.json(summary);
  } catch (err) {
    console.error("[admin/summary] failed", err);
    if (err instanceof AiOutputError || err instanceof Anthropic.APIError) {
      return errorResponse("The summary couldn't be written just now. Try again in a minute.", 503);
    }
    return errorResponse("Something went wrong. Try again in a minute.", 500);
  }
}

/** "Generate summary" button: signed-in admin only. */
export async function POST(request: Request) {
  if (!isCron(request) && !(await currentAdmin()))
    return errorResponse("Sign in as an admin first.", 401);
  return run();
}

/** Weekly Vercel Cron (vercel.json): CRON_SECRET only. */
export async function GET(request: Request) {
  if (!isCron(request)) return errorResponse("Not allowed.", 401);
  return run();
}
