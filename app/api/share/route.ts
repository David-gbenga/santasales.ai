import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/env";
import { createShare, revokeShare } from "@/lib/gifts";
import { shareRequestSchema } from "@/lib/validation";

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

/** Creates or switches off the private gift link for a finished card or song. */
export async function POST(request: Request) {
  const parsed = shareRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return errorResponse("Notes can be up to 300 characters. Shorten it and try again.", 400);
  }

  try {
    const body = parsed.data;
    const result =
      body.action === "create"
        ? await createShare(body.orderId, body.note)
        : await revokeShare(body.orderId);
    if (!result.ok) return errorResponse(result.error, 404);
    return NextResponse.json({
      url: `${siteUrl(request)}/gift/${result.token}`,
      active: result.active,
    });
  } catch (err) {
    console.error("[share] failed", err);
    return errorResponse("The link couldn't be updated. Try again in a minute.", 500);
  }
}
