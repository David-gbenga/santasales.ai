import { NextResponse } from "next/server";
import { ElevenLabsError, composePreviewClip } from "@/lib/elevenlabs";
import { getLyricsGeneration, savePreviewAudio, uploadGenerated } from "@/lib/generations";
import { createAdminClient } from "@/lib/supabase/admin";
import { previewClipRequestSchema } from "@/lib/validation";

export const maxDuration = 120;

/** Clip links last an hour; the studio asks again on each visit. */
const CLIP_URL_TTL_SECONDS = 60 * 60;

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function signedUrl(path: string): Promise<string> {
  const { data, error } = await createAdminClient().storage.from("generated").createSignedUrl(path, CLIP_URL_TTL_SECONDS);
  if (error || !data) throw new Error(`Signing clip failed: ${error?.message}`);
  return data.signedUrl;
}

/**
 * 15-second sung clip of the chorus for a song preview. One clip per lyrics
 * version (the first draft, and again after the free re-roll), so a preview
 * can cost at most two clips however often the page is opened.
 */
export async function POST(request: Request) {
  const parsed = previewClipRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return errorResponse("That didn't make sense. Refresh and try again.", 400);

  try {
    const song = await getLyricsGeneration(parsed.data.generationId);
    if (!song?.text) return errorResponse("Your song is still being written.", 409);
    if (song.order?.status === "refunded") return errorResponse("This order was refunded.", 403);

    // One clip per free version: clip-1 for the first draft, clip-2 after the re-roll.
    const version = song.freeRerolls + 1;
    const path = `previews/${song.id}/clip-${version}.mp3`;
    if (song.previewAudioPath === path) return NextResponse.json({ url: await signedUrl(path) });

    const clip = await composePreviewClip(song.text, song.input.musicStyle, song.input.vocal, song.input.occasion);
    await uploadGenerated([{ path, body: clip, contentType: "audio/mpeg" }]);
    await savePreviewAudio(song.id, path);
    return NextResponse.json({ url: await signedUrl(path) });
  } catch (err) {
    if (err instanceof ElevenLabsError) {
      console.error("[preview/clip] ElevenLabs failed", err.status, err.message);
      return errorResponse("The sample couldn't be recorded just now. The lyrics are all there; try again in a minute.", 503);
    }
    console.error("[preview/clip] failed", err);
    return errorResponse("The sample couldn't be recorded just now. Try again in a minute.", 500);
  }
}
