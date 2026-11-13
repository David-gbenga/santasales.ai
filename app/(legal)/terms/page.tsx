import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, List, Section, SellerDetails } from "@/components/ui/legal-page";
import { formatPrice } from "@/lib/format";
import {
  MAX_REGENERATIONS,
  PREMIUM_ALLOWANCE,
  PREMIUM_INTERVAL_DAYS,
  PREMIUM_PRICE_PENCE,
  PREVIEW_LIMITS,
} from "@/lib/pricing";
import { seller, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of service",
  description: `The terms for buying from ${site.name}: digital downloads, personal cards and sung songs.`,
};

export default function TermsPage() {
  return (
    <LegalPage
      path="/terms"
      title="Terms of service"
      intro={`These terms cover using ${site.name} and buying from us. They’re written to be read: if something isn’t clear, email us before you buy.`}
    >
      <Section id="who" title="1. Who we are">
        <p>
          {site.name} ({site.domain}) is run by {seller.legalName}. You can contact us at:
        </p>
        <SellerDetails />
        <p>
          &ldquo;We&rdquo; and &ldquo;us&rdquo; mean the seller above. &ldquo;You&rdquo; means the
          person using the site or buying from it.
        </p>
      </Section>

      <Section id="what" title="2. What we sell">
        <List>
          <li>
            <strong>Digital downloads</strong> from the shop, such as printables and wallpapers.
          </li>
          <li>
            <strong>Personal cards</strong>: a message written for the person you describe, laid
            out on a card design, as a PNG and PDF.
          </li>
          <li>
            <strong>Personal songs</strong>: original lyrics written for the person you describe,
            recorded as a sung song, as an MP3 with the words as a PDF and text file.
          </li>
          <li>
            <strong>Voice greetings</strong>: a short spoken message in a computer-generated
            voice, added to a card or song.
          </li>
          <li>
            <strong>GiftPost Premium</strong>: an optional membership for making cards, songs and
            voice greetings, described in{" "}
            <a href="#premium" className="underline underline-offset-4">
              section 12
            </a>
            . You don&rsquo;t need an account or a membership to buy anything else.
          </li>
        </List>
        <p>
          Everything is digital. Nothing is posted to you. The gallery also links to products on
          other shops; those are sold by those shops on their own terms, not by us (see our{" "}
          <Link href="/disclosure" className="underline underline-offset-4">
            affiliate disclosure
          </Link>
          ).
        </p>
      </Section>

      <Section id="previews" title="3. Free previews">
        <p>
          You can preview a card or song before paying: the whole card with a
          &ldquo;PREVIEW&rdquo; mark, or the full lyrics and a 15-second sung sample. Each preview
          includes one free re-write. Previews can&rsquo;t be downloaded. To keep the service fair
          and affordable, each visitor can start up to {PREVIEW_LIMITS.visitorPerDay} previews a
          day, and we may limit previews if they&rsquo;re being misused.
        </p>
      </Section>

      <Section id="buying" title="4. Prices and payment">
        <List>
          <li>Prices are shown in pounds sterling (GBP) and are the full price you pay us.</li>
          <li>
            Payment is taken by Stripe on its secure checkout page. We never see or store your card
            details.
          </li>
          <li>
            If you pay in another currency, your bank sets the exchange rate and may charge a fee.
            Any import or local taxes your country charges you directly are your responsibility.
          </li>
          <li>
            Your order is confirmed when Stripe tells us the payment succeeded. If something goes
            wrong with a payment, we&rsquo;ll refund it.
          </li>
          <li>
            We can refuse or cancel an order, for example if a price was clearly wrong or the
            content you asked for breaks section 7. If we do, we refund you in full.
          </li>
        </List>
      </Section>

      <Section id="cancel" title="5. Digital content and your right to cancel">
        <p>
          Downloads and generated content are supplied straight after payment. At checkout you ask
          for immediate access and accept that you lose the usual 14-day right to cancel for
          digital content once supply starts. This doesn&rsquo;t affect your rights if something is
          faulty: see our{" "}
          <Link href="/refunds" className="underline underline-offset-4">
            refunds policy
          </Link>
          .
        </p>
      </Section>

      <Section id="ai" title="6. Cards and songs made with AI">
        <List>
          <li>
            Messages and lyrics are written by an AI model (Anthropic&rsquo;s Claude) from what you
            tell us. Songs and voice greetings are produced with AI voice and music tools
            (ElevenLabs). Results vary, so check names, spelling and facts before you finish your
            card or song.
          </li>
          <li>
            After paying you can ask for up to {MAX_REGENERATIONS} new versions and edit the words
            yourself. Finishing a card or saving a song locks the words.
          </li>
          <li>
            Every card and song is written fresh, but we can&rsquo;t guarantee that wording, a tune
            or a voice is unique: similar phrases or melodies may appear elsewhere.
          </li>
          <li>
            We ask the AI never to copy or parody existing songs, poems or lyrics, and to keep
            things family-friendly. If you think a result copies someone else&rsquo;s work, tell us
            and we&rsquo;ll replace or withdraw it.
          </li>
        </List>
      </Section>

      <Section id="use" title="7. What you may and may not ask for">
        <p>You&rsquo;re responsible for what you type into the forms and the chat. Don&rsquo;t ask for, or include:</p>
        <List>
          <li>anything unlawful, hateful, harassing, threatening, sexual or violent;</li>
          <li>
            content meant to deceive, including pretending to be someone else, or a voice greeting
            presented as a real person speaking;
          </li>
          <li>
            other people&rsquo;s private information beyond what&rsquo;s needed for a kind
            personal message (no addresses, health details, financial or ID numbers);
          </li>
          <li>material you don&rsquo;t have the right to use, such as someone else&rsquo;s lyrics.</li>
        </List>
        <p>
          <strong>Anonymous gifts</strong> keep your name off the card, the song and the gift page.
          They&rsquo;re for surprises and secret admirers, not for sending anything unwelcome. We
          keep the sender&rsquo;s details with the order and may share them if the law requires
          it.
        </p>
        <p>We may refuse, remove or switch off content or gift links that break these rules.</p>
      </Section>

      <Section id="rights" title="8. Who owns what">
        <List>
          <li>
            <strong>Cards and songs you buy:</strong> you may use, print, share and give them for
            personal, non-commercial purposes, for example as a gift, at a party, or on your own
            social media. Please don&rsquo;t sell them, use them in advertising, or upload songs to
            streaming services. To the extent we have rights in them, we won&rsquo;t object to that
            personal use.
          </li>
          <li>
            <strong>Shop downloads:</strong> you get a personal licence to use and print them for
            yourself and your household. You may not resell, share or redistribute the files.
          </li>
          <li>
            <strong>Our site</strong>, designs, card backgrounds and branding belong to us or our
            licensors.
          </li>
          <li>
            <strong>What you type</strong> stays yours. You give us permission to use it to make
            and deliver your card or song (including sending it to the AI services named in our{" "}
            <Link href="/privacy" className="underline underline-offset-4">
              privacy notice
            </Link>
            ).
          </li>
        </List>
      </Section>

      <Section id="gifts" title="9. Gift links and downloads">
        <List>
          <li>
            A gift link is private, but anyone who has the link can open it. Share it only with the
            people you mean to, and switch it off from your studio page if you change your mind.
          </li>
          <li>
            Download links work for 24 hours. Your order page gives you fresh links for 30 days
            after buying, so save your files.
          </li>
        </List>
      </Section>

      <Section id="liability" title="10. Our responsibility to you">
        <p>
          If you&rsquo;re a consumer, you have legal rights, including under the UK Consumer Rights
          Act 2015, that these terms don&rsquo;t take away: digital content must be of satisfactory
          quality, fit for purpose and as described. If it isn&rsquo;t, we&rsquo;ll repair or
          replace it, or refund you.
        </p>
        <p>
          We aren&rsquo;t responsible for losses that weren&rsquo;t foreseeable, for problems caused
          by your device or connection, or for products sold by other shops linked from the
          gallery. Nothing here limits our liability where the law doesn&rsquo;t allow it, such as
          for death or personal injury caused by our negligence, or fraud.
        </p>
      </Section>

      <Section id="law" title="11. Changes and the law that applies">
        <p>
          We may update these terms; the version on this page when you place an order applies to
          that order. These terms are governed by the law of England and Wales. If you live
          elsewhere in the UK or abroad, you keep any consumer protections your local law gives
          you, and you can bring a claim in your local courts.
        </p>
      </Section>

      <Section id="premium" title="12. GiftPost Premium membership">
        <List>
          <li>
            <strong>What you get.</strong> GiftPost Premium costs {formatPrice(PREMIUM_PRICE_PENCE)}{" "}
            every {PREMIUM_INTERVAL_DAYS} days. In each {PREMIUM_INTERVAL_DAYS}-day period you can
            make up to {PREMIUM_ALLOWANCE.song} personal songs (any length),{" "}
            {PREMIUM_ALLOWANCE.card} personal cards and {PREMIUM_ALLOWANCE.voice_greeting} voice
            greetings on your own cards and songs. Each one comes with the same rewrites, editing
            and downloads as buying it on its own. Anything you don&rsquo;t use in a period
            doesn&rsquo;t carry over. Once you&rsquo;ve used a period&rsquo;s allowance, you can
            still buy cards and songs at the normal prices.
          </li>
          <li>
            <strong>Your account.</strong> Premium needs an account with a confirmed email address.
            Keep your password private and don&rsquo;t share your account; the allowance is for
            your own gifts. Sections 6 to 9 apply to everything you make with Premium.
          </li>
          <li>
            <strong>Payment and renewal.</strong> You pay through Stripe when you join, and your
            membership <strong>renews automatically every {PREMIUM_INTERVAL_DAYS} days</strong> at
            the same price, charged to the same card, until you cancel. Stripe emails you a receipt
            for each payment. If we ever change the price, we&rsquo;ll email you at least 30 days
            before it applies, and you can cancel before then.
          </li>
          <li>
            <strong>Cancelling.</strong> You can cancel at any time in{" "}
            <Link href="/account" className="underline underline-offset-4">
              My account
            </Link>{" "}
            (&ldquo;Manage or cancel subscription&rdquo;). Your membership then stops renewing and
            you keep Premium until the end of the period you&rsquo;ve already paid for. We
            don&rsquo;t refund part-used periods, except as below or where the law requires it.
          </li>
          <li>
            <strong>Your 14-day right to cancel.</strong> When you join, you ask for Premium to
            start straight away. You can still cancel within 14 days of first joining by emailing
            us. If you haven&rsquo;t made anything with Premium yet, we refund you in full. If you
            have, we refund the share of your first payment that matches the allowance you
            haven&rsquo;t used.
          </li>
          <li>
            <strong>If a payment fails.</strong> Stripe will try your card again over the following
            days. Premium is paused until a payment succeeds, and we&rsquo;ll email you so you can
            update your card in My account. If the payment still can&rsquo;t be taken, your
            membership ends.
          </li>
          <li>
            <strong>When it ends.</strong> Cards and songs you&rsquo;ve already made stay in My
            account, and their downloads stay available for 30 days after you made each one. We may
            end a membership that breaks section 7 or is used to resell our service; if we end it
            for any other reason, we refund the unused part of the current period.
          </li>
        </List>
      </Section>
    </LegalPage>
  );
}
