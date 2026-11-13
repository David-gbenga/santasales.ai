import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, List, Section, SellerDetails } from "@/components/ui/legal-page";
import { MAX_REGENERATIONS } from "@/lib/pricing";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Refunds",
  description: `When ${site.name} refunds digital downloads, cards and songs, and how to ask.`,
};

export default function RefundsPage() {
  return (
    <LegalPage
      path="/refunds"
      title="Refunds"
      intro="Everything we sell is digital and delivered straight away, and every card and song can be previewed free before you pay. So refunds are for things that go wrong, not for changing your mind."
    >
      <Section id="cancel" title="Changing your mind">
        <p>
          At checkout you ask for immediate access to your download, card or song, and accept that
          this ends the usual 14-day right to cancel for digital content. After that, we can&rsquo;t
          refund a purchase because you&rsquo;ve changed your mind.
        </p>
        <p>
          That&rsquo;s why cards and songs come with a free preview and a free re-write before you
          pay, and {MAX_REGENERATIONS} more versions plus editing after you pay. Please use them to
          get it right.
        </p>
      </Section>

      <Section id="premium" title="GiftPost Premium">
        <p>
          You can cancel your membership at any time in My account, and you keep Premium until the
          end of the period you&rsquo;ve paid for. Within 14 days of first joining, you can also
          ask for a refund: in full if you haven&rsquo;t made anything with Premium yet, otherwise
          for the share of the allowance you haven&rsquo;t used. The details are in{" "}
          <Link href="/terms#premium" className="underline underline-offset-4">
            section 12 of our terms
          </Link>
          .
        </p>
      </Section>

      <Section id="faulty" title="When something is wrong">
        <p>You can ask us to fix, replace or refund your purchase if:</p>
        <List>
          <li>a file doesn&rsquo;t open, is corrupted, or never arrived;</li>
          <li>a download isn&rsquo;t what its description said;</li>
          <li>
            a card or song came out broken or unusable (for example, the recording failed or cut
            off, or the card is missing its words) and a new version doesn&rsquo;t fix it;
          </li>
          <li>you were charged twice, or charged for something you didn&rsquo;t receive.</li>
        </List>
        <p>
          We&rsquo;ll usually try to fix or replace it first. If we can&rsquo;t, or it doesn&rsquo;t
          work, we refund you in full. Matters of taste in wording or music, after you&rsquo;ve
          previewed and approved the card or song, aren&rsquo;t faults.
        </p>
      </Section>

      <Section id="how" title="How to ask">
        <p>
          Email us from the address you paid with, saying what you bought, when, and what went
          wrong (forwarding your Stripe receipt is easiest):
        </p>
        <SellerDetails />
        <p>
          We reply within 3 working days. Refunds go back to the card you paid with, and Stripe
          usually takes 5 to 10 working days to show them on your statement.
        </p>
        <p>
          Your legal rights under the UK Consumer Rights Act 2015 are not affected by this policy.
        </p>
      </Section>
    </LegalPage>
  );
}
