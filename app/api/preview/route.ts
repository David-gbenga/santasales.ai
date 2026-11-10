import { NextResponse } from "next/server";
import { CARD_PROMPT_VERSION } from "@/lib/ai/prompts/card";
import { LYRICS_PROMPT_VERSION } from "@/lib/ai/prompts/lyrics";
import { designSuits, getCardDesign } from "@/lib/card-designs";
import { PREVIEW_LIMITS } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";
import { previewRequestSchema } from "@/lib/validation";
import { takePreview } from "@/lib/visitor";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Starts a free preview: saves the form as an unpaid generation and returns
 * its studio URL, where the first draft is written. Counts against the
 * visitor's daily preview limit. Nothing can be downloaded until payment.
 */
export async function POST(request: Request) {
  const parsed = previewRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return errorResponse(
      issue?.path[0] === "input" ? `Check the form: ${issue.message}.` : "That didn't make sense. Refresh and try again.",
      400,
    );
  }
  const body = parsed.data;

  try {
    let designSlug: string | null = null;
    if (body.kind === "card") {
      const design = await getCardDesign(body.designSlug);
      if (!design) return errorResponse("That card design isn't available any more. Pick another one.", 404);
      if (!designSuits(design, body.input.occasion))
        return errorResponse("That design isn't made for this occasion. Pick another one.", 400);
      designSlug = design.slug;
    }

    if (!(await takePreview(request))) {
      return errorResponse(
        `You've had today's ${PREVIEW_LIMITS.visitorPerDay} free previews. Come back tomorrow, or buy one you've already previewed.`,
        429,
      );
    }

    const { data, error } = await createAdminClient()
      .from("generations")
      .insert({
        kind: body.kind,
        design_id: designSlug,
        input: {
          ...body.input,
          promptVersion: body.kind === "card" ? CARD_PROMPT_VERSION : LYRICS_PROMPT_VERSION,
        },
      })
      .select("id")
      .single();
    if (error) throw new Error(`Creating preview failed: ${error.message}`);

    return NextResponse.json({ url: `/${body.kind === "card" ? "cards" : "lyrics"}/${data.id}` });
  } catch (err) {
    console.error("[preview] failed", err);
    return errorResponse("Your preview couldn't start. Try again in a minute.", 500);
  }
}
