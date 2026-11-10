import { NextResponse } from "next/server";
import { getAddon, maxTakes, type Addon } from "@/lib/addons";
import { ElevenLabsError, composeSong, speak } from "@/lib/elevenlabs";
import {
  claimRewrite,
  getLyricsGeneration,
  releaseRewrite,
  uploadGenerated,
} from "@/lib/generations";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAudioRequestSchema, type VoiceGreetingInput } from "@/lib/validation";

// A full sung song can take a minute or two to compose.
export const maxDuration = 300;

type Reply = { audioReady: boolean; takesLeft: number; input: Addon["input"] };

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function reply(addon: Addon, takesUsed: number, audioReady: boolean) {
  const body: Reply = {
    audioReady,
    takesLeft: Math.max(0, maxTakes(addon.kind) - takesUsed),
    input: addon.input,
  };
  return NextResponse.json(body);
}

async function produceAudio(addon: Addon): Promise<Buffer> {
  if (addon.kind === "voice_greeting") return speak(addon.input.voiceId, addon.input.text);
  const parent = await getLyricsGeneration(addon.parentId);
  if (!parent?.text || !parent.locked) throw new Error(`Lyrics ${addon.parentId} not finished`);
  return composeSong(parent.text, addon.input.style, addon.input.vocal);
}

/**
 * Records (or re-records) a paid add-on with ElevenLabs. Each take is
 * claimed atomically before the paid API call and given back if it fails,
 * so takes can't exceed the limit and buyers don't lose one to an error.
 */
export async function POST(request: Request) {
  const parsed = generateAudioRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return errorResponse(
      issue?.path[0] === "greeting"
        ? `Check your greeting: ${issue.message}.`
        : "That request didn't make sense. Refresh and try again.",
      400,
    );
  }
  const body = parsed.data;

  try {
    let addon = await getAddon(body.generationId);
    if (!addon) return errorResponse("We couldn't find that recording.", 404);
    if (addon.order?.status !== "paid") {
      return errorResponse(
        "Your payment is still being confirmed. This will update in a few seconds.",
        409,
      );
    }

    if (body.action === "generate" && addon.audioPath) return reply(addon, addon.takesUsed, true);
    if (body.action === "retake" && !addon.audioPath)
      return errorResponse("The first recording isn't ready yet.", 409);
    if (addon.takesUsed >= maxTakes(addon.kind)) {
      return errorResponse(
        addon.kind === "song_audio"
          ? "You've used your retake for this song."
          : "You've used all your re-recordings for this greeting.",
        409,
      );
    }

    // A greeting retake may change the words or voice.
    if (body.action === "retake" && addon.kind === "voice_greeting" && body.greeting) {
      const input: VoiceGreetingInput = body.greeting;
      addon = { ...addon, input };
    }

    if (!(await claimRewrite(addon.id, addon.takesUsed))) {
      return errorResponse("We're already recording this. Wait a moment, then refresh.", 409);
    }
    const take = addon.takesUsed + 1;

    let audio: Buffer;
    try {
      audio = await produceAudio(addon);
    } catch (err) {
      await releaseRewrite(addon.id, take);
      throw err;
    }

    const path = `${addon.kind === "song_audio" ? "songs" : "greetings"}/${addon.id}/take-${take}.mp3`;
    await uploadGenerated([{ path, body: audio, contentType: "audio/mpeg" }]);
    const { error } = await createAdminClient()
      .from("generations")
      .update({ output_text: JSON.stringify({ audioPath: path }), input: addon.input })
      .eq("id", addon.id);
    if (error) throw new Error(`Saving recording failed: ${error.message}`);

    return reply(addon, take, true);
  } catch (err) {
    if (err instanceof ElevenLabsError) {
      console.error(
        "[generate/audio] ElevenLabs failed",
        body.generationId,
        err.status,
        err.message,
      );
      return errorResponse(
        err.status === 429 || err.status >= 500
          ? "The recording studio is busy. Try again in a minute; you haven't lost a take."
          : "We couldn't record that. Try different words, or contact us and we'll sort it out.",
        err.status === 429 || err.status >= 500 ? 503 : 422,
      );
    }
    console.error("[generate/audio] failed", body.generationId, err);
    return errorResponse(
      "Something went wrong on our side. Try again in a minute; you haven't lost a take.",
      500,
    );
  }
}
