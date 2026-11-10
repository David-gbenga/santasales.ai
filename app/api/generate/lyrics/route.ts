import { generateStructured } from "@/lib/ai/claude";
import {
  buildLyricsPrompt,
  checkLyricsOutput,
  formatLyrics,
  lyricsOutputSchema,
} from "@/lib/ai/prompts/lyrics";
import { createGenerationRoute } from "@/lib/generation-route";
import { getLyricsGeneration, uploadGenerated, type LyricsGeneration } from "@/lib/generations";
import { renderLyricsPdf, renderLyricsTxt } from "@/lib/lyrics-render";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateLyricsRequestSchema,
  type GenerateLyricsRequest,
  type LyricsInput,
  type LyricsText,
} from "@/lib/validation";

export const maxDuration = 60;

/**
 * Every song comes sung (decision 2026-11-10): saving the lyrics creates
 * (or updates) the song's sung-recording entry, which the studio then
 * records through /api/generate/audio. It has no order of its own; it's
 * covered by the song's order.
 */
async function prepareSungVersion(song: LyricsGeneration, music: { musicStyle: string; vocal: string }) {
  const db = createAdminClient();
  const input = { style: music.musicStyle, vocal: music.vocal };
  const { data: existing, error } = await db
    .from("generations")
    .select("id")
    .eq("parent_id", song.id)
    .eq("kind", "song_audio")
    .limit(1)
    .maybeSingle<{ id: string }>();
  if (error) throw new Error(`Reading sung version failed: ${error.message}`);
  const write = existing
    ? db.from("generations").update({ input }).eq("id", existing.id)
    : db.from("generations").insert({ kind: "song_audio", parent_id: song.id, input });
  const { error: writeError } = await write;
  if (writeError) throw new Error(`Preparing sung version failed: ${writeError.message}`);
}

/** TXT sits next to the PDF; the download route derives its path from pdf_path. */
export const POST = createGenerationRoute<LyricsInput, LyricsText, LyricsGeneration, GenerateLyricsRequest>({
  label: "lyrics",
  noun: "song",
  finishPhrase: "save your song",
  requestSchema: generateLyricsRequestSchema,
  load: getLyricsGeneration,

  async write(generation, previous) {
    const output = await generateStructured({
      prompt: buildLyricsPrompt(generation.input, previous),
      schema: lyricsOutputSchema,
      check: (o) => checkLyricsOutput(o, generation.input.length),
      maxTokens: 6000,
      effort: "low",
    });
    return formatLyrics(output);
  },

  async render(generation, text, request) {
    const credit = {
      recipientName: generation.input.recipientName,
      senderName: generation.input.senderName,
    };
    const base = `lyrics/${generation.id}`;
    await uploadGenerated([
      { path: `${base}/lyrics.pdf`, body: await renderLyricsPdf(text, credit), contentType: "application/pdf" },
      { path: `${base}/lyrics.txt`, body: renderLyricsTxt(text, credit), contentType: "text/plain" },
    ]);
    await prepareSungVersion(generation, request.music ?? { musicStyle: generation.input.musicStyle, vocal: generation.input.vocal });
    return { pdf: `${base}/lyrics.pdf` };
  },
});
