import "server-only";

/** Who customer emails come from. The domain must be verified in Resend. */
export function emailFrom(): string {
  return process.env.EMAIL_FROM || "Giftpost <hello@giftpost.co.uk>";
}

/** True when an email provider is configured (RESEND_API_KEY is set). */
export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export type Email = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

/**
 * Sends one email through Resend's REST API (no SDK needed). Returns false
 * when email isn't configured or the send failed; details are logged
 * server-side only and never include the recipient's address.
 */
export async function sendEmail(email: Email): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not set; email not sent");
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: emailFrom(),
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
        ...(email.replyTo ? { reply_to: email.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[email] Resend rejected the email", res.status, (await res.text()).slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] sending failed", err);
    return false;
  }
}
