import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { claudeModel, getAnthropic } from "@/lib/ai/claude";
import { conciergeSystemPrompt } from "@/lib/ai/prompts/concierge";
import { createConciergeTools } from "@/lib/concierge/tools";
import { CONCIERGE_LIMITS, type ConciergeReply, type ConciergeWidget } from "@/lib/concierge/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { visitorKey } from "@/lib/visitor";

export const maxDuration = 60;

// Only plain text turns are accepted from the browser: no tool blocks, so a
// visitor can't forge tool results.
const requestSchema = z.object({
  messages: z
    .array(
      z.discriminatedUnion("role", [
        z.object({
          role: z.literal("user"),
          content: z.string().trim().min(1).max(CONCIERGE_LIMITS.messageChars),
        }),
        z.object({ role: z.literal("assistant"), content: z.string().max(4000) }),
      ]),
    )
    .min(1)
    .max(60)
    .refine((m) => m.at(-1)?.role === "user", "last message must be from the visitor"),
});

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function conciergeModel(): string {
  return process.env.CONCIERGE_MODEL || claudeModel();
}

async function withinLimits(request: Request): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("concierge_take", {
    p_key: visitorKey(request, "concierge"),
    p_visitor_limit: CONCIERGE_LIMITS.visitorPerDay,
    p_global_limit: CONCIERGE_LIMITS.globalPerDay,
  });
  if (error) throw new Error(`Rate limit check failed: ${error.message}`);
  return data === true;
}

/** The API needs alternating turns starting with the visitor; merge or drop anything else. */
function normaliseHistory(messages: z.infer<typeof requestSchema>["messages"]) {
  const recent = messages.slice(-CONCIERGE_LIMITS.historyMessages);
  const turns: Anthropic.Beta.BetaMessageParam[] = [];
  for (const m of recent) {
    const last = turns.at(-1);
    if (!last && m.role === "assistant") continue;
    if (last && last.role === m.role) {
      last.content = `${last.content as string}\n\n${m.content}`;
    } else {
      turns.push({ role: m.role, content: m.content });
    }
  }
  return turns;
}

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse(
      `Messages can be up to ${CONCIERGE_LIMITS.messageChars} characters. Shorten it and try again.`,
      400,
    );
  }

  try {
    if (!(await withinLimits(request))) {
      return errorResponse(
        "You've reached today's chat limit. You can still browse the shop and make a card or song directly.",
        429,
      );
    }

    const widgets: ConciergeWidget[] = [];
    const shown: string[] = [];
    const final = await getAnthropic().beta.messages.toolRunner({
      model: conciergeModel(),
      max_tokens: 2000,
      system: conciergeSystemPrompt(),
      messages: normaliseHistory(parsed.data.messages),
      tools: createConciergeTools(widgets, shown, request),
      output_config: { effort: "low" },
      max_iterations: 6,
      thread: false, // send the full (short) history each turn; nothing is kept server-side
    });

    let reply = final.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    if (final.stop_reason === "refusal") {
      reply =
        "I can't help with that one, but I'd love to help you find a gift. Who are you shopping for?";
    } else if (!reply) {
      reply = widgets.length
        ? "Here are a few ideas:"
        : "Sorry, I lost my train of thought. Could you say that again?";
    }

    const body: ConciergeReply = {
      reply,
      widgets,
      shownNote: shown.length ? `(Shown to the visitor: ${shown.join("; ")}.)` : "",
    };
    return NextResponse.json(body);
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error("[concierge] AI failed", err.status, err.message);
      return errorResponse("I'm a bit swamped right now. Try again in a few seconds.", 503);
    }
    console.error("[concierge] failed", err);
    return errorResponse("Something went wrong on our side. Try again in a minute.", 500);
  }
}
