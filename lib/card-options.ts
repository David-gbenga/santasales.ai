import type { CARD_TONES, RELATIONSHIPS } from "@/lib/validation";

/** Labels for the card form's choices. Keys must match the Zod enums. */
export const CARD_RELATIONSHIP_LABELS: Record<(typeof RELATIONSHIPS)[number], string> = {
  partner: "My partner",
  parent: "My mum or dad",
  grandparent: "My grandparent",
  child: "My child",
  grandchild: "My grandchild",
  sibling: "My brother or sister",
  friend: "A friend",
  colleague: "A colleague",
  teacher: "A teacher",
  neighbour: "A neighbour",
  other: "Someone else",
};

export const CARD_TONE_LABELS: Record<
  (typeof CARD_TONES)[number],
  { label: string; hint: string }
> = {
  warm: { label: "Warm", hint: "Kind and cosy" },
  heartfelt: { label: "Heartfelt", hint: "Sincere, a bit emotional" },
  funny: { label: "Funny", hint: "Gentle, playful humour" },
  traditional: { label: "Traditional", hint: "Classic, elegant wishes" },
};
