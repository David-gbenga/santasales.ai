/**
 * Choices for the ElevenLabs add-ons (client-safe). Music styles never name
 * real artists or songs (ElevenLabs Music Terms 2.1).
 */

export const SONG_STYLES = {
  cosy: {
    label: "Cosy acoustic",
    hint: "Fireside guitar, gentle and warm",
    styles: ["cosy acoustic", "fingerpicked guitar", "warm", "intimate"],
  },
  pop: {
    label: "Upbeat pop",
    hint: "Bright, bouncy and catchy",
    styles: ["upbeat pop", "bright", "catchy", "handclaps"],
  },
  swing: {
    label: "Big band swing",
    hint: "Brass, swing, crooner energy",
    styles: ["big band swing", "brass section", "walking bass", "joyful"],
  },
  ballad: {
    label: "Piano ballad",
    hint: "Soft piano, heartfelt",
    styles: ["gentle piano ballad", "soft strings", "heartfelt", "emotional"],
  },
} as const;
export type SongStyle = keyof typeof SONG_STYLES;
export const SONG_STYLE_KEYS = Object.keys(SONG_STYLES) as [SongStyle, ...SongStyle[]];

export const VOCALS = {
  female: { label: "Female vocals", style: "female lead vocals" },
  male: { label: "Male vocals", style: "male lead vocals" },
} as const;
export type Vocal = keyof typeof VOCALS;
export const VOCAL_KEYS = Object.keys(VOCALS) as [Vocal, ...Vocal[]];

/** ElevenLabs built-in voices (premade, no cloning of real people). */
export const GREETING_VOICES = {
  JBFqnCBsd6RMkjVDRZzb: { name: "George", hint: "Warm, British, storyteller" },
  Xb7hH8MSUJpSbSDYk0k2: { name: "Alice", hint: "Clear, British, friendly" },
  pFZP5JQG7iQjIQuC4Bku: { name: "Lily", hint: "Soft, British, gentle" },
  onwK4e9ZLuTAKqWW03F9: { name: "Daniel", hint: "Deep, British, steady" },
} as const;
export type GreetingVoiceId = keyof typeof GREETING_VOICES;
export const GREETING_VOICE_IDS = Object.keys(GREETING_VOICES) as [
  GreetingVoiceId,
  ...GreetingVoiceId[],
];

export const GREETING_TEXT_MAX = 400;
