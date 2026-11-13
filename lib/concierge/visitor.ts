import "server-only";
import { currentCustomer } from "@/lib/account";
import { PREMIUM_ALLOWANCE, type PremiumKind } from "@/lib/pricing";
import { getAllowance, getSubscription, membershipState, type MembershipState } from "@/lib/subscriptions";

/**
 * What Susan may know about the visitor she's talking to: only their own
 * sign-in and membership status, read from their session cookie. Never
 * their name, email address, card details or what they've made.
 */
export type VisitorContext = {
  signedIn: boolean;
  emailConfirmed: boolean;
  membership: {
    state: MembershipState;
    /** Next payment (active), end of access (cancelling) or when it ended. */
    date: string;
    left: Record<PremiumKind, number> | null;
  } | null;
};

const SIGNED_OUT: VisitorContext = { signedIn: false, emailConfirmed: false, membership: null };

export async function loadVisitorContext(): Promise<VisitorContext> {
  try {
    const customer = await currentCustomer();
    if (!customer) return SIGNED_OUT;
    const sub = await getSubscription(customer.id);
    if (!sub) return { signedIn: true, emailConfirmed: customer.emailConfirmed, membership: null };
    const state = membershipState(sub);
    const allowance = state === "active" || state === "cancelling" ? await getAllowance(sub) : null;
    return {
      signedIn: true,
      emailConfirmed: customer.emailConfirmed,
      membership: {
        state,
        date: (state === "expired" ? (sub.ended_at ?? sub.current_period_end) : sub.current_period_end).slice(0, 10),
        left: allowance
          ? {
              song: allowance.song.limit - allowance.song.used,
              card: allowance.card.limit - allowance.card.used,
              voice_greeting: allowance.voice_greeting.limit - allowance.voice_greeting.used,
            }
          : null,
      },
    };
  } catch (err) {
    // Susan still helps if the account lookup fails; she just can't see the status.
    console.error("[concierge] visitor context failed", err);
    return SIGNED_OUT;
  }
}

const STATE_WORDS: Record<MembershipState, string> = {
  active: "Premium member, active",
  cancelling: "Premium member, cancelled: keeps Premium until the date shown, then it stops",
  payment_failed: "Premium paused: the last renewal payment failed; they should update their card in My account",
  expired: "Premium has ended; they can rejoin on the Premium page",
};

/** Plain facts for the model. */
export function describeVisitor(v: VisitorContext) {
  if (!v.signedIn) return { signedIn: false, note: "Not signed in on this browser (they may still have an account)." };
  return {
    signedIn: true,
    emailConfirmed: v.emailConfirmed,
    premium: v.membership
      ? {
          status: STATE_WORDS[v.membership.state],
          date: v.membership.date,
          leftThisPeriod: v.membership.left,
          allowancePerPeriod: PREMIUM_ALLOWANCE,
        }
      : "Not a Premium member.",
  };
}
