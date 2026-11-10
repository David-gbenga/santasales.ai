/**
 * Occasions a card or song can be for (client-safe). Keys are stored in
 * generations.input.occasion and card_designs.occasions; older orders have
 * no occasion and count as Christmas.
 */
export const OCCASIONS = {
  christmas: {
    label: "Christmas",
    adjective: "Christmas",
    greeting: "Merry Christmas",
    brief: "Christmas: warm festive wishes for the season and the year ahead.",
    music: "christmas, festive",
  },
  birthday: {
    label: "Birthday",
    adjective: "birthday",
    greeting: "Happy birthday",
    brief: "A birthday: celebrate them and wish them a great year ahead.",
    music: "celebratory birthday song",
  },
  anniversary: {
    label: "Anniversary",
    adjective: "anniversary",
    greeting: "Happy anniversary",
    brief: "An anniversary: celebrate the years together and the love shared.",
    music: "romantic, celebratory",
  },
  wedding: {
    label: "Wedding",
    adjective: "wedding",
    greeting: "Congratulations on your wedding",
    brief: "A wedding: congratulate the couple and wish them a happy life together.",
    music: "romantic wedding song, joyful",
  },
  valentines: {
    label: "Valentine’s Day",
    adjective: "Valentine’s",
    greeting: "Happy Valentine’s Day",
    brief: "Valentine’s Day: affectionate and romantic, or warm and playful for a friend.",
    music: "romantic love song",
  },
  mothers_day: {
    label: "Mother’s Day",
    adjective: "Mother’s Day",
    greeting: "Happy Mother’s Day",
    brief: "Mother’s Day: thank and celebrate a mum or mother figure.",
    music: "warm, tender, grateful",
  },
  fathers_day: {
    label: "Father’s Day",
    adjective: "Father’s Day",
    greeting: "Happy Father’s Day",
    brief: "Father’s Day: thank and celebrate a dad or father figure.",
    music: "warm, grateful, feel-good",
  },
  congratulations: {
    label: "Congratulations",
    adjective: "congratulations",
    greeting: "Congratulations",
    brief: "Congratulations on an achievement or good news: proud and celebratory.",
    music: "celebratory, triumphant, feel-good",
  },
  graduation: {
    label: "Graduation",
    adjective: "graduation",
    greeting: "Congratulations, graduate",
    brief: "A graduation: proud of the hard work, excited for what comes next.",
    music: "uplifting, proud, celebratory",
  },
  new_baby: {
    label: "New baby",
    adjective: "new baby",
    greeting: "Welcome to the world",
    brief: "A new baby: welcome the baby and congratulate the family. Gentle and joyful.",
    music: "gentle lullaby, joyful",
  },
  thank_you: {
    label: "Thank you",
    adjective: "thank-you",
    greeting: "Thank you",
    brief: "A thank-you: sincere gratitude for something specific they did.",
    music: "warm, grateful, gentle",
  },
  get_well: {
    label: "Get well soon",
    adjective: "get-well",
    greeting: "Get well soon",
    brief: "Get well soon: caring and hopeful, light rather than heavy. Never mention the illness unless the brief does.",
    music: "gentle, hopeful, comforting",
  },
  retirement: {
    label: "Retirement",
    adjective: "retirement",
    greeting: "Happy retirement",
    brief: "A retirement: celebrate their working years and the freedom ahead.",
    music: "celebratory, relaxed, feel-good",
  },
  just_because: {
    label: "Just because",
    adjective: "",
    greeting: "Thinking of you",
    brief: "No particular occasion: a just-because message to show they matter.",
    music: "warm, feel-good",
  },
} as const;

export type Occasion = keyof typeof OCCASIONS;
export const OCCASION_KEYS = Object.keys(OCCASIONS) as [Occasion, ...Occasion[]];
export const DEFAULT_OCCASION: Occasion = "christmas";

/** "a birthday card", "a Christmas song", "a card" (just because). */
export function giftPhrase(occasion: Occasion | undefined, noun: "card" | "song"): string {
  const adjective = OCCASIONS[occasion ?? DEFAULT_OCCASION].adjective;
  if (!adjective) return `a ${noun}`;
  return `${/^[aeiou]/i.test(adjective) ? "an" : "a"} ${adjective} ${noun}`;
}

/** Shown wherever an anonymous gift would otherwise name the sender. */
export const ANONYMOUS_SENDER = "Someone who cares about you";

/** The sender's name as the recipient may see it; null for an anonymous gift. */
export function visibleSender(input: { senderName: string; anonymous?: boolean }): string | null {
  return input.anonymous ? null : input.senderName;
}

/** A stored occasion, or Christmas for older orders (and anything unrecognised). */
export function toOccasion(value: unknown): Occasion {
  return typeof value === "string" && value in OCCASIONS ? (value as Occasion) : DEFAULT_OCCASION;
}

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * "A birthday song for Grandad, from Mia", or without the sender for an
 * anonymous gift. Used on song sheets, PDFs and the studio.
 */
export function creditLine(
  noun: "card" | "song",
  input: { recipientName: string; senderName: string; anonymous?: boolean; occasion?: unknown },
): string {
  const sender = visibleSender(input);
  return `${capitalise(giftPhrase(toOccasion(input.occasion), noun))} for ${input.recipientName}${sender ? `, from ${sender}` : ""}`;
}

/** Default words for a voice greeting, matched to the occasion and anonymity. */
export function defaultGreeting(
  noun: "card" | "song",
  input: { recipientName: string; senderName: string; anonymous?: boolean; occasion?: unknown },
): string {
  const hello = `${OCCASIONS[toOccasion(input.occasion)].greeting}, ${input.recipientName}!`;
  const middle = noun === "card" ? "I hope you love your card." : "This song is just for you.";
  const sender = visibleSender(input);
  return `${hello} ${middle} ${sender ? `Lots of love, ${sender}.` : "Lots of love."}`;
}
