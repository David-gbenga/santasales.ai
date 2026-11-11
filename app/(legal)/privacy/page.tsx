import type { Metadata } from "next";
import { LegalPage, List, Section, SellerDetails } from "@/components/ui/legal-page";
import { PREVIEW_RETENTION_DAYS } from "@/lib/pricing";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: `What ${site.name} collects, why, who it's shared with and how long it's kept.`,
};

export default function PrivacyPage() {
  return (
    <LegalPage
      path="/privacy"
      title="Privacy notice"
      intro={`We collect as little as we can: enough to make your card or song, take payment and deliver your files. We don’t use advertising or tracking cookies, and we don’t sell your data.`}
    >
      <Section id="controller" title="1. Who is responsible for your data">
        <p>The data controller is:</p>
        <SellerDetails />
        <p>Email us with any privacy question or request.</p>
      </Section>

      <Section id="collect" title="2. What we collect and why">
        <List>
          <li>
            <strong>Order details</strong> from Stripe when you pay: your email address, the amount,
            and what you bought. We need these to deliver your order and keep tax records (legal
            obligation, and performing our contract with you). Stripe handles your card details;
            we never see them. We use your email address to send a thank-you with your order
            links, and to resend those links if you ask Susan, our chat helper, for them. We
            don&rsquo;t send marketing emails.
          </li>
          <li>
            <strong>What you type</strong> to make a card or song: names, who they are to you, your
            description, tone and music choices. We use it only to write, record and deliver that
            card or song (performing our contract, or taking steps at your request before it).
          </li>
          <li>
            <strong>Gift links</strong>: the optional note you add, and whether the link is on or
            off.
          </li>
          <li>
            <strong>Gift concierge chat (Susan)</strong>: your messages are sent to our AI provider
            to answer them. The conversation is kept in your own browser, not on our servers. If
            you ask Susan to resend your order links, the email address you give is used only to
            find your orders and send the links to that address.
          </li>
          <li>
            <strong>Site statistics</strong>, without cookies: which pages are viewed and which
            gallery links are clicked, with the referring website&rsquo;s name. These records
            contain no IP address or identifier (legitimate interests: understanding what&rsquo;s
            useful).
          </li>
          <li>
            <strong>Abuse limits</strong>: to cap free previews and chat messages, we store a
            scrambled code made from your IP address that changes every day and can&rsquo;t be
            turned back into the address (legitimate interests: keeping the service fair and
            affordable).
          </li>
          <li>
            <strong>Shop admins</strong> sign in with their email address; a sign-in cookie keeps
            them signed in. Visitors get no cookies.
          </li>
        </List>
      </Section>

      <Section id="others" title="3. People you write about">
        <p>
          Cards and songs are about someone else. Please only share details they&rsquo;d be happy
          for you to use in a gift, and nothing sensitive such as health, finances or addresses. If
          you&rsquo;re named in a card or song and want it removed, email us.
        </p>
      </Section>

      <Section id="processors" title="4. Who we share it with">
        <p>We use these companies to run the service. They act on our instructions:</p>
        <List>
          <li>
            <strong>Stripe</strong> (payments). Stripe also acts as a controller for fraud
            prevention and its legal duties.
          </li>
          <li>
            <strong>Anthropic</strong> (the Claude AI that writes messages and lyrics, answers the
            chat and drafts our private sales summaries, which contain totals only, never customer
            details).
          </li>
          <li>
            <strong>ElevenLabs</strong> (sung songs, song samples and voice greetings): receives
            the lyrics or greeting words.
          </li>
          <li>
            <strong>Resend</strong> (order emails): receives your email address and the order
            links we send you.
          </li>
          <li>
            <strong>Supabase</strong> (database, file storage and admin sign-in), with data stored
            in London.
          </li>
          <li>
            <strong>Vercel</strong> (website hosting).
          </li>
        </List>
        <p>
          Some of these companies are based in the United States and may process data there. We
          rely on UK-approved safeguards for those transfers, such as the UK Extension to the
          EU-US Data Privacy Framework or standard contractual clauses. We share data with others
          only if the law requires it.
        </p>
      </Section>

      <Section id="retention" title="5. How long we keep it">
        <List>
          <li>
            <strong>Unpaid previews</strong> (cards and songs you didn&rsquo;t buy) are deleted
            after {PREVIEW_RETENTION_DAYS} days.
          </li>
          <li>
            <strong>Orders and the cards and songs you bought</strong> are kept for up to six years
            after the end of the tax year, to meet tax record-keeping rules, then deleted. Download
            access ends after 30 days, and you can ask us to delete the content itself sooner.
          </li>
          <li>
            <strong>Site statistics</strong> are kept for up to two years.
          </li>
          <li>
            <strong>Abuse-limit codes</strong> are only useful for the day they&rsquo;re made and
            are cleared regularly.
          </li>
        </List>
      </Section>

      <Section id="rights" title="6. Your rights">
        <p>
          You can ask us for a copy of your data, to correct it, to delete it, to restrict or
          object to how we use it, or to receive it in a portable format. Email us, ideally from the
          address you paid with, and we&rsquo;ll reply within one month. Some data we must keep
          for tax law even if you ask us to delete it.
        </p>
        <p>
          If you&rsquo;re unhappy with how we handle your data, you can complain to the
          Information Commissioner&rsquo;s Office (ico.org.uk, 0303 123 1113), though we&rsquo;d
          appreciate the chance to sort it out first.
        </p>
      </Section>

      <Section id="children" title="7. Children">
        <p>
          The site isn&rsquo;t meant for children under 13, and only adults can buy. A card or song
          can of course be for a child.
        </p>
      </Section>

      <Section id="changes" title="8. Changes">
        <p>
          If we change how we use your data, we&rsquo;ll update this notice and the date at the top
          of the page.
        </p>
      </Section>
    </LegalPage>
  );
}
