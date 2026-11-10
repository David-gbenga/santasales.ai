import "server-only";
import { randomBytes } from "node:crypto";
import { getAddonsFor } from "@/lib/addons";
import { createAdminClient } from "@/lib/supabase/admin";
import { lyricsTextSchema, type LyricsText } from "@/lib/validation";
import { toOccasion, type Occasion } from "@/lib/occasions";

/** Signed media links on the gift page last an hour; the page itself makes fresh ones each visit. */
const MEDIA_TTL_SECONDS = 60 * 60;

type OrderRow = {
  id: string;
  status: string;
  kind: string;
  generation: { id: string; kind: string; locked: boolean } | null;
};

/** The buyer's order, if it's a paid, finished card or song (the only things that can be gifted). */
async function giftableOrder(orderId: string) {
  const { data, error } = await createAdminClient()
    .from("orders")
    .select("id, status, kind, generation:generations(id, kind, locked)")
    .eq("id", orderId)
    .maybeSingle<OrderRow>();
  if (error) throw new Error(`Reading order failed: ${error.message}`);
  if (!data || data.status !== "paid" || !data.generation) return null;
  if (!["card", "lyrics"].includes(data.generation.kind) || !data.generation.locked) return null;
  return data.generation;
}

export type ShareResult =
  { ok: true; token: string; active: boolean } | { ok: false; error: string };

/** Creates the gift link (or switches an existing one back on). One link per card or song. */
export async function createShare(orderId: string, note?: string): Promise<ShareResult> {
  const generation = await giftableOrder(orderId);
  if (!generation) return { ok: false, error: "Finish your card or song first, then share it." };

  const db = createAdminClient();
  const { data: existing, error } = await db
    .from("gift_shares")
    .select("token")
    .eq("generation_id", generation.id)
    .maybeSingle<{ token: string }>();
  if (error) throw new Error(`Reading share failed: ${error.message}`);

  if (existing) {
    const { error: updateError } = await db
      .from("gift_shares")
      .update({ revoked: false, ...(note !== undefined ? { note: note || null } : {}) })
      .eq("generation_id", generation.id);
    if (updateError) throw new Error(`Updating share failed: ${updateError.message}`);
    return { ok: true, token: existing.token, active: true };
  }

  const token = randomBytes(18).toString("base64url"); // 24 chars, ~144 bits
  const { error: insertError } = await db
    .from("gift_shares")
    .insert({ token, generation_id: generation.id, note: note || null });
  if (insertError) throw new Error(`Creating share failed: ${insertError.message}`);
  return { ok: true, token, active: true };
}

export async function revokeShare(orderId: string): Promise<ShareResult> {
  const generation = await giftableOrder(orderId);
  if (!generation) return { ok: false, error: "We couldn't find that order." };
  const { data, error } = await createAdminClient()
    .from("gift_shares")
    .update({ revoked: true })
    .eq("generation_id", generation.id)
    .select("token")
    .maybeSingle<{ token: string }>();
  if (error) throw new Error(`Turning off share failed: ${error.message}`);
  return data
    ? { ok: true, token: data.token, active: false }
    : { ok: false, error: "There's no link to turn off." };
}

/** The current link for a card or song, for the studio to show. */
export async function getShareFor(
  generationId: string,
): Promise<{ token: string; active: boolean } | null> {
  const { data, error } = await createAdminClient()
    .from("gift_shares")
    .select("token, revoked")
    .eq("generation_id", generationId)
    .maybeSingle<{ token: string; revoked: boolean }>();
  if (error) throw new Error(`Reading share failed: ${error.message}`);
  return data ? { token: data.token, active: !data.revoked } : null;
}

export type Gift = {
  kind: "card" | "lyrics";
  recipientName: string;
  /** Null when the buyer sent it anonymously. */
  senderName: string | null;
  occasion: Occasion;
  note: string | null;
  cardImageUrl: string | null;
  lyrics: LyricsText | null;
  songAudioUrl: string | null;
  greetingAudioUrl: string | null;
};

type ShareRow = {
  note: string | null;
  revoked: boolean;
  generation: {
    id: string;
    kind: "card" | "lyrics";
    locked: boolean;
    input: { recipientName?: string; senderName?: string; anonymous?: boolean; occasion?: unknown } | null;
    output_text: string | null;
    png_path: string | null;
    orders: { status: string }[];
  } | null;
};

async function signed(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await createAdminClient()
    .storage.from("generated")
    .createSignedUrl(path, MEDIA_TTL_SECONDS);
  if (error) throw new Error(`Signing ${path} failed: ${error.message}`);
  return data.signedUrl;
}

/** Everything the recipient's page shows, or null if the link is unknown, off or refunded. */
export async function loadGift(token: string): Promise<Gift | null> {
  const { data, error } = await createAdminClient()
    .from("gift_shares")
    .select(
      "note, revoked, generation:generations(id, kind, locked, input, output_text, png_path, orders(status))",
    )
    .eq("token", token)
    .maybeSingle<ShareRow>();
  if (error) throw new Error(`Reading gift failed: ${error.message}`);
  const g = data?.generation;
  if (!data || data.revoked || !g || !g.locked || g.orders[0]?.status !== "paid") return null;

  const addons = await getAddonsFor(g.id);
  const paidAudio = (kind: "song_audio" | "voice_greeting") => {
    const a = addons[kind];
    // Audio is only ever recorded after payment (the included sung song is covered by the
    // song order, already checked above), so a stored recording is safe to show.
    return a?.audioPath ?? null;
  };

  let lyrics: LyricsText | null = null;
  if (g.kind === "lyrics" && g.output_text) {
    try {
      const parsed = lyricsTextSchema.safeParse(JSON.parse(g.output_text));
      lyrics = parsed.success ? parsed.data : null;
    } catch {
      lyrics = null;
    }
  }

  const [cardImageUrl, songAudioUrl, greetingAudioUrl] = await Promise.all([
    g.kind === "card" ? signed(g.png_path) : Promise.resolve(null),
    signed(paidAudio("song_audio")),
    signed(paidAudio("voice_greeting")),
  ]);

  return {
    kind: g.kind,
    recipientName: g.input?.recipientName ?? "you",
    senderName: g.input?.anonymous ? null : (g.input?.senderName ?? null),
    occasion: toOccasion(g.input?.occasion),
    note: data.note,
    cardImageUrl,
    lyrics,
    songAudioUrl,
    greetingAudioUrl,
  };
}
