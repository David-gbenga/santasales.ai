import "server-only";
import {
  SONG_STYLES,
  VOCALS,
  type GreetingVoiceId,
  type SongStyle,
  type Vocal,
} from "@/lib/audio-options";
import { requireEnv } from "@/lib/env";
import { parseLyricsBody } from "@/lib/lyrics-render";
import type { LyricsText } from "@/lib/validation";

/**
 * Minimal ElevenLabs REST client (no SDK dependency). Uses only the
 * Text to Speech and Music endpoints, which the restricted key allows.
 */
const API = "https://api.elevenlabs.io/v1";

export class ElevenLabsError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function post(path: string, body: unknown, timeoutMs: number): Promise<Buffer> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "xi-api-key": requireEnv("ELEVENLABS_API_KEY"), "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ElevenLabsError(
      `ElevenLabs ${path} → HTTP ${res.status}: ${detail.slice(0, 300)}`,
      res.status,
    );
  }
  const audio = Buffer.from(await res.arrayBuffer());
  if (audio.length < 1000)
    throw new ElevenLabsError(`ElevenLabs ${path} returned ${audio.length} bytes`, 502);
  return audio;
}

/** Spoken greeting as MP3. */
export function speak(voiceId: GreetingVoiceId, text: string): Promise<Buffer> {
  return post(
    `/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    { text, model_id: "eleven_multilingual_v2" },
    60_000,
  );
}

/** Roughly how long a lyric line takes to sing, used to size each section. */
const MS_PER_LINE = 4200;
const MAX_SONG_MS = 5 * 60_000;

/**
 * Builds an ElevenLabs composition plan from saved lyrics: one chunk per
 * section, lyrics passed verbatim, styles from the buyer's choices.
 */
export function compositionPlan(lyrics: LyricsText, style: SongStyle, vocal: Vocal) {
  const positive = [
    ...SONG_STYLES[style].styles,
    VOCALS[vocal].style,
    "christmas",
    "clear sung lyrics",
  ];
  const negative = ["explicit", "spoken word", "rap", "distorted vocals"];
  const chunks = parseLyricsBody(lyrics.body)
    .filter((s) => s.lines.length > 0)
    .map((s) => ({
      text: `${s.label ? `[${s.label}]\n` : ""}${s.lines.map((l) => l.slice(0, 200)).join("\n")}`,
      duration_ms: Math.min(120_000, Math.max(3_000, s.lines.length * MS_PER_LINE + 2_000)),
      positive_styles: positive,
      negative_styles: negative,
    }));
  // Keep inside ElevenLabs' 5-minute limit by trimming the last sections.
  let total = 0;
  return {
    chunks: chunks.filter((c) => {
      total += c.duration_ms;
      return total <= MAX_SONG_MS;
    }),
  };
}

/** Sung song as MP3. Synchronous: ElevenLabs returns the file when it's ready. */
export function composeSong(lyrics: LyricsText, style: SongStyle, vocal: Vocal): Promise<Buffer> {
  return post(
    "/music?output_format=mp3_44100_128",
    { model_id: "music_v2_5", composition_plan: compositionPlan(lyrics, style, vocal) },
    280_000,
  );
}

/** Length of the free sung preview clip. */
export const PREVIEW_CLIP_MS = 15_000;

/**
 * Short sung preview of the chorus (or the first section if there's no
 * chorus), for the free song preview before payment. ~250 credits.
 */
export function composePreviewClip(lyrics: LyricsText, style: SongStyle, vocal: Vocal): Promise<Buffer> {
  const sections = parseLyricsBody(lyrics.body).filter((s) => s.lines.length > 0);
  const chorus = sections.find((s) => s.label?.toLowerCase().startsWith("chorus")) ?? sections[0];
  if (!chorus) throw new ElevenLabsError("No lyrics to sing", 422);
  const plan = compositionPlan({ title: lyrics.title, body: `[${chorus.label ?? "Chorus"}]\n${chorus.lines.join("\n")}` }, style, vocal);
  plan.chunks = plan.chunks.slice(0, 1).map((c) => ({ ...c, duration_ms: PREVIEW_CLIP_MS }));
  return post("/music?output_format=mp3_44100_128", { model_id: "music_v2_5", composition_plan: plan }, 120_000);
}
