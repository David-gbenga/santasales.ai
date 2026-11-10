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
import { generateLyricsRequestSchema, type LyricsInput, type LyricsText } from "@/lib/validation";

export const maxDuration = 60;

/** TXT sits next to the PDF; the download route derives its path from pdf_path. */
export const POST = createGenerationRoute<LyricsInput, LyricsText, LyricsGeneration>({
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

  async render(generation, text) {
    const credit = {
      recipientName: generation.input.recipientName,
      senderName: generation.input.senderName,
    };
    const base = `lyrics/${generation.id}`;
    await uploadGenerated([
      {
        path: `${base}/lyrics.pdf`,
        body: await renderLyricsPdf(text, credit),
        contentType: "application/pdf",
      },
      {
        path: `${base}/lyrics.txt`,
        body: renderLyricsTxt(text, credit),
        contentType: "text/plain",
      },
    ]);
    return { pdf: `${base}/lyrics.pdf` };
  },
});
