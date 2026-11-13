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
      /** The visitor is a Premium member with cards left: no payment needed. */
      premium?: boolean;
    }
  | {
      type: "song_offer";
      teaser: string;
      priceLabel: string;
      summary: string;
      recipientName: string;
      input: SongCheckoutInput;
      /** The visitor is a Premium member with songs left: no payment needed. */
      premium?: boolean;
    }
  | {
      /** A button to a page on this site (fixed list, see SITE_LINKS). */
      type: "link";
      href: string;
      label: string;
      description?: string;
    };

export type ConciergeReply = {
  reply: string;
  widgets: ConciergeWidget[];
  /** Short note of what was shown, for the client to keep in history so the model remembers it. */
  shownNote: string;
};

/**
 * The only places Susan can send people (no free-form URLs), with the
 * button wording. Keys are what the model chooses from.
 */
export const SITE_LINKS = {
  premium: { href: "/premium", label: "See GiftPost Premium", description: "£25 every 30 days, cancel any time" },
  signup: { href: "/signup", label: "Create an account", description: "Needed only for Premium" },
  login: { href: "/login", label: "Sign in" },
  account: { href: "/account", label: "Go to My account", description: "Membership, your cards and songs" },
  forgot_password: { href: "/forgot-password", label: "Reset your password" },
  change_password: { href: "/account/password", label: "Change your password" },
  make_card: { href: "/cards", label: "Make a card" },
  write_song: { href: "/lyrics", label: "Write a song" },
  shop: { href: "/shop", label: "Browse the shop", description: "Printables, instant download" },
  gallery: { href: "/gallery", label: "See the gallery", description: "Gift ideas from other shops" },
  premium_terms: { href: "/terms#premium", label: "Premium terms", description: "Renewal, cancelling and refunds" },
  terms: { href: "/terms", label: "Terms of service" },
  refunds: { href: "/refunds", label: "Refunds policy" },
  privacy: { href: "/privacy", label: "Privacy notice" },
  bootcamp: { href: "/bootcamp", label: "Free AI bootcamp sign-up" },
} as const;
export type SiteLinkKey = keyof typeof SITE_LINKS;

export const CONCIERGE_LIMITS = {
  /** Messages a visitor can send per day. */
  visitorPerDay: 40,
  /** All visitors together per day; a cost backstop below the Anthropic spending limit. */
  globalPerDay: 3000,
  /** History sent with each request (older turns are dropped). */
  historyMessages: 20,
  messageChars: 800,
} as const;
