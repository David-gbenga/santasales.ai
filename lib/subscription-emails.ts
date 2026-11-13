import "server-only";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/env";
import { site } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionRow } from "@/lib/subscriptions";

type Notice = "payment_failed" | "ended";

const COPY: Record<Notice, { subject: string; body: string }> = {
  payment_failed: {
    subject: "Your GiftPost Premium payment didn't go through",
    body: "We couldn't take your GiftPost Premium renewal payment, so Premium is paused for now. Your bank will be tried again over the next few days. To keep using Premium straight away, update your card in My account.",
  },
  ended: {
    subject: "Your GiftPost Premium membership has ended",
    body: "Your GiftPost Premium membership has ended, so new Premium cards and songs are switched off. Everything you've already made stays in My account. You can rejoin any time.",
  },
};

/**
 * Account notices about the subscription. Never throws, so email trouble
 * can't fail the webhook. Sent at most once per Stripe event (the webhook's
 * idempotency check runs first).
 */
export async function sendSubscriptionNotice(sub: SubscriptionRow, notice: Notice): Promise<void> {
  try {
    if (!sub.user_id) return;
    const { data } = await createAdminClient().auth.admin.getUserById(sub.user_id);
    const to = data.user?.email;
    if (!to) return;
    const { subject, body } = COPY[notice];
    const link = `${siteUrl()}/account`;
    await sendEmail({
      to,
      subject,
      text: `${body}\n\nMy account: ${link}\n\n${site.name}`,
      html: `<p>${body}</p><p><a href="${link}">Go to My account</a></p><p>${site.name}</p>`,
    });
  } catch (err) {
    console.error("[subscription-emails] notice failed", notice, err);
  }
}
