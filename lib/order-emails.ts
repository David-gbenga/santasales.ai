import "server-only";
import { createHmac } from "node:crypto";
import { AI_KIT } from "@/lib/ai-kit";
import { emailEnabled, sendEmail } from "@/lib/email";
import { requireEnv, siteUrl } from "@/lib/env";
import { formatPrice } from "@/lib/format";
import { DOWNLOAD_WINDOW_DAYS } from "@/lib/orders";
import { seller, site } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/admin";
import { visitorKey } from "@/lib/visitor";

/** How often order links can be emailed: per visitor, and per address, per day. */
export const ORDER_EMAIL_LIMITS = { visitorPerDay: 5, addressPerDay: 2 } as const;

type OrderRow = {
  id: string;
  kind: "product" | "card" | "lyrics" | "song_audio" | "voice_greeting";
  email: string | null;
  amount_pence: number;
  currency: string;
  generation_id: string | null;
  product: { name: string } | null;
};

const ORDER_COLUMNS = "id, kind, email, amount_pence, currency, generation_id, product:products(name)";

type OrderLine = { title: string; action: string; url: string; price: string };

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** What the buyer gets for one order, and the link that opens it. */
function lineFor(order: OrderRow, origin: string): OrderLine {
  const price = formatPrice(order.amount_pence, order.currency);
  const download = (format?: string) =>
    `${origin}/api/download/${order.id}${format ? `?format=${format}` : ""}`;
  switch (order.kind) {
    case "product":
      return { title: order.product?.name ?? "Your printable", action: "Download", url: download(), price };
    case "card":
      return { title: "Your personal card", action: "Open your card", url: `${origin}/cards/${order.generation_id}`, price };
    case "lyrics":
      return { title: "Your personal song", action: "Open your song", url: `${origin}/lyrics/${order.generation_id}`, price };
    case "song_audio":
      return { title: "Your sung recording", action: "Download MP3", url: download("mp3"), price };
    case "voice_greeting":
      return { title: "Your voice greeting", action: "Download MP3", url: download("mp3"), price };
  }
}

/** The free AI Builder Kit line, linked through one of the buyer's paid orders. */
function kitLine(orderId: string, origin: string): OrderLine[] {
  if (!AI_KIT.enabled) return [];
  return [{ title: AI_KIT.title, action: "Download the kit (PDF)", url: `${origin}/api/kit/${orderId}`, price: "Free with your order" }];
}

/** Builds the thank-you email listing each order with its link. */
export function buildThankYouEmail(lines: OrderLine[], kind: "purchase" | "resend") {
  const subject =
    kind === "purchase" ? `Thank you for your ${site.name} order` : `Your ${site.name} order links`;
  const intro =
    kind === "purchase"
      ? "Thank you so much for your order. It means a lot to a small shop like ours, and we hope it makes someone's day."
      : `You asked us to send your order links again. Here's everything bought with this email address in the last ${DOWNLOAD_WINDOW_DAYS} days.`;
  const footer = `Links work for ${DOWNLOAD_WINDOW_DAYS} days after purchase. Questions? Just reply to this email or write to ${seller.email}.`;

  const text = [
    "Hello,",
    "",
    intro,
    "",
    ...lines.map((l) => `- ${l.title} (${l.price}): ${l.url}`),
    "",
    footer,
    "",
    `With warm wishes,\nSusan and the ${site.name} team`,
    `https://www.${site.domain}`,
  ].join("\n");

  const rows = lines
    .map(
      (l) => `<tr><td style="padding:14px 0;border-bottom:1px solid #d5dee8">
<div style="font-weight:600;color:#13233f">${escapeHtml(l.title)}</div>
<div style="color:#475873;font-size:14px;margin:2px 0 10px">${escapeHtml(l.price)}</div>
<a href="${escapeHtml(l.url)}" style="display:inline-block;background:#f2a541;color:#13233f;text-decoration:none;font-weight:700;padding:10px 20px;border-radius:999px">${escapeHtml(l.action)}</a>
</td></tr>`,
    )
    .join("");

  const html = `<!doctype html><html><body style="margin:0;background:#f4f7fa;font-family:Helvetica,Arial,sans-serif;color:#13233f">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#13233f;color:#eef3f7;padding:20px 28px;font-family:Georgia,serif;font-size:24px"><span style="color:#f2a541">&#10035;</span> ${site.name}</td></tr>
<tr><td style="padding:28px">
<p style="margin:0 0 12px;font-size:16px">Hello,</p>
<p style="margin:0 0 20px;font-size:16px;line-height:1.5">${escapeHtml(intro)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
<p style="margin:20px 0 0;font-size:14px;line-height:1.5;color:#475873">${escapeHtml(footer)}</p>
<p style="margin:20px 0 0;font-size:16px">With warm wishes,<br>Susan and the ${site.name} team</p>
</td></tr></table>
<p style="font-size:12px;color:#475873;margin:16px 0 0">${escapeHtml(seller.legalName)}, ${escapeHtml(seller.address)}</p>
</td></tr></table></body></html>`;

  return { subject, html, text };
}

/**
 * Sends the thank-you email for a newly paid order, once. The order is
 * claimed (thankyou_sent_at set) before sending so Stripe webhook retries
 * can't send it twice; if sending fails the claim is released for a retry.
 * Never throws: a failed email must not fail the payment webhook.
 */
export async function sendThankYouForSession(sessionId: string): Promise<void> {
  if (!emailEnabled()) return;
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from("orders")
      .update({ thankyou_sent_at: new Date().toISOString() })
      .eq("stripe_session_id", sessionId)
      .eq("status", "paid")
      .is("thankyou_sent_at", null)
      .not("email", "is", null)
      .select(ORDER_COLUMNS)
      .returns<OrderRow[]>();
    if (error) throw new Error(error.message);
    const order = data?.[0];
    if (!order?.email) return; // already sent, not paid, or no email

    const sent = await sendEmail({
      to: order.email,
      replyTo: seller.email,
      ...buildThankYouEmail(
        [lineFor(order, siteUrl()), ...kitLine(order.id, siteUrl())],
        "purchase",
      ),
    });
    if (!sent) {
      await db.from("orders").update({ thankyou_sent_at: null }).eq("id", order.id);
    }
  } catch (err) {
    console.error("[order-emails] thank-you failed", err);
  }
}

/** Keyed hash of an address for rate limiting; the address itself isn't stored. */
function addressKey(email: string): string {
  return createHmac("sha256", requireEnv("SUPABASE_SERVICE_ROLE_KEY"))
    .update(`order-email:${email.trim().toLowerCase()}`)
    .digest("hex");
}

async function take(key: string, limit: number): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("order_email_take", {
    p_key: key,
    p_limit: limit,
  });
  if (error) throw new Error(`Order email limit check failed: ${error.message}`);
  return data === true;
}

/** Escapes LIKE wildcards so an address is matched literally (case-insensitive). */
function literalPattern(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export type ResendResult = "processed" | "limited" | "unavailable";

/**
 * Emails links for every paid order under `email` from the last
 * DOWNLOAD_WINDOW_DAYS days. The result never says whether orders exist
 * ("processed" either way), so nobody can use it to learn what someone
 * else bought: only the inbox owner sees the answer.
 */
export async function resendOrderLinks(email: string, request: Request): Promise<ResendResult> {
  if (!emailEnabled()) return "unavailable";
  const address = email.trim().toLowerCase();
  if (!(await take(visitorKey(request, "order-email"), ORDER_EMAIL_LIMITS.visitorPerDay)))
    return "limited";
  if (!(await take(addressKey(address), ORDER_EMAIL_LIMITS.addressPerDay))) return "limited";

  const since = new Date(Date.now() - DOWNLOAD_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(ORDER_COLUMNS)
    .ilike("email", literalPattern(address))
    .eq("status", "paid")
    .gte("paid_at", since)
    .order("paid_at", { ascending: false })
    .limit(20)
    .returns<OrderRow[]>();
  if (error) throw new Error(`Order lookup failed: ${error.message}`);
  if (!data?.length) return "processed";

  const origin = siteUrl(request);
  const sent = await sendEmail({
    to: address,
    replyTo: seller.email,
    ...buildThankYouEmail(
      [...data.map((o) => lineFor(o, origin)), ...kitLine(data[0].id, origin)],
      "resend",
    ),
  });
  if (!sent) console.error("[order-emails] resend email failed");
  return "processed";
}
