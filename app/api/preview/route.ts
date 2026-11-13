import { NextResponse } from "next/server";
import { CARD_PROMPT_VERSION } from "@/lib/ai/prompts/card";
import { LYRICS_PROMPT_VERSION } from "@/lib/ai/prompts/lyrics";
import { designSuits, getCardDesign } from "@/lib/card-designs";
import { currentCustomer } from "@/lib/account";
import { claimPremium, createPremiumOrder, releasePremium, type PremiumClaim } from "@/lib/premium";
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

    // Premium members: the item comes out of their allowance and is unlocked
    // straight away. Everyone else (and members who've used it up) gets the
    // usual free preview, within the daily preview limits.
    const customer = await currentCustomer();
    const claim = await claimPremium(customer, body.kind === "card" ? "card" : "song");
    if (!claim && !(await takePreview(request))) {
      return errorResponse(
        `You've had today's ${PREVIEW_LIMITS.visitorPerDay} free previews. Come back tomorrow, or buy one you've already previewed.`,
        429,
      );
    }

    const id = await createGeneration(body, designSlug, claim);
    return NextResponse.json({ url: `/${body.kind === "card" ? "cards" : "lyrics"}/${id}`, premium: Boolean(claim) });
  } catch (err) {
    console.error("[preview] failed", err);
    return errorResponse("Your preview couldn't start. Try again in a minute.", 500);
  }
}

type PreviewBody = ReturnType<typeof previewRequestSchema.parse>;

/** Saves the form as a generation; for members, also the £0 premium order (allowance given back on failure). */
async function createGeneration(body: PreviewBody, designSlug: string | null, claim: PremiumClaim | null): Promise<string> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("generations")
    .insert({
      kind: body.kind,
      design_id: designSlug,
      user_id: claim?.userId ?? null,
      input: {
        ...body.input,
        promptVersion: body.kind === "card" ? CARD_PROMPT_VERSION : LYRICS_PROMPT_VERSION,
      },
    })
    .select("id")
    .single();
  if (error) {
    if (claim) await releasePremium(claim);
    throw new Error(`Creating preview failed: ${error.message}`);
  }
  if (claim) {
    try {
      await createPremiumOrder(claim, data.id, body.kind);
    } catch (err) {
      await releasePremium(claim);
      await db.from("generations").delete().eq("id", data.id);
      throw err;
    }
  }
  return data.id;
}
