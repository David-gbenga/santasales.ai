import type { LYRIC_LENGTHS, LYRIC_STYLES } from "@/lib/validation";

/** Labels for the lyrics form's choices. Keys must match the Zod enums. */
export const LYRIC_STYLE_LABELS: Record<
  (typeof LYRIC_STYLES)[number],
  { label: string; hint: string }
> = {
  cheerful: { label: "Cheerful", hint: "Upbeat and easy to sing along to" },
  sentimental: { label: "Sentimental", hint: "Tender and heartfelt" },
  funny: { label: "Funny", hint: "Playful, good-natured teasing" },
};

export const LYRIC_LENGTH_LABELS: Record<
  (typeof LYRIC_LENGTHS)[number],
  { label: string; hint: string }
> = {
  short: { label: "Short", hint: "One verse and a chorus" },
  standard: { label: "Standard", hint: "Two verses and a chorus" },
  long: { label: "Long", hint: "Two verses, chorus and a bridge" },
};
