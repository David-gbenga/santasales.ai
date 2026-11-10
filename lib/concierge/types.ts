/** Shapes shared by the concierge API and the chat widget (client-safe). */

export type ConciergeMessage = { role: "user" | "assistant"; content: string };

/** Fields posted unchanged to /api/preview when the shopper starts a preview. */
export type CardCheckoutInput = {
  recipientName: string;
  senderName: string;
  occasion: string;
  anonymous?: boolean;
  relationship?: string;
  tone: string;
  details: string;
};
export type SongCheckoutInput = {
  recipientName: string;
  senderName: string;
  occasion: string;
  anonymous?: boolean;
  relationship?: string;
  style: string;
  length: string;
  details: string;
};

/** Things the concierge can show under its reply. Built only from validated tool calls. */
export type ConciergeWidget =
  | {
      type: "product";
      id: string;
      name: string;
      priceLabel: string;
      imageUrl: string | null;
      href: string;
    }
  | {
      type: "gallery";
      id: string;
      title: string;
      imageUrl: string;
      url: string;
      store: string;
      isAffiliate: boolean;
    }
  | {
      type: "card_offer";
      designSlug: string;
      designName: string;
      imageUrl: string;
      teaser: string;
      priceLabel: string;
      recipientName: string;
      input: CardCheckoutInput;
    }
  | {
      type: "song_offer";
      teaser: string;
      priceLabel: string;
      summary: string;
      recipientName: string;
      input: SongCheckoutInput;
    };

export type ConciergeReply = {
  reply: string;
  widgets: ConciergeWidget[];
  /** Short note of what was shown, for the client to keep in history so the model remembers it. */
  shownNote: string;
};

export const CONCIERGE_LIMITS = {
  /** Messages a visitor can send per day. */
  visitorPerDay: 40,
  /** All visitors together per day; a cost backstop below the Anthropic spending limit. */
  globalPerDay: 3000,
  /** History sent with each request (older turns are dropped). */
  historyMessages: 20,
  messageChars: 800,
} as const;
