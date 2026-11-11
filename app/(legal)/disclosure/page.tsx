import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, Section } from "@/components/ui/legal-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Affiliate disclosure",
  description: `How ${site.name} may earn a commission from links in the gallery.`,
};

export default function DisclosurePage() {
  return (
    <LegalPage
      path="/disclosure"
      title="Affiliate disclosure"
      intro="Some links in our gallery are affiliate links. Here’s what that means for you."
    >
      <Section id="what" title="What an affiliate link is">
        <p>
          When you click an affiliate link in the{" "}
          <Link href="/gallery" className="underline underline-offset-4">
            gallery
          </Link>{" "}
          and then buy something from that shop, the shop may pay us a small commission. You pay
          the same price either way.
        </p>
        <p>Gallery items that are affiliate links are labelled as such next to the item.</p>
      </Section>

      <Section id="choose" title="How we choose what to show">
        <p>
          We pick gift ideas we think people will like, whether or not they pay us. A commission
          never changes how we describe a product.
        </p>
      </Section>

      <Section id="shops" title="Buying from other shops">
        <p>
          Gallery products are sold by the other shops, not by {site.name}. Their prices,
          delivery, returns and privacy are covered by their own terms. Prices can change, so
          check the shop&rsquo;s page before you buy.
        </p>
        <p>
          We count clicks on gallery links to see which ideas are popular. That count has no
          personal details: see our{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            privacy notice
          </Link>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
