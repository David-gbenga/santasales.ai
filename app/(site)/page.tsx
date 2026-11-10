import { ConciergeLauncher } from "@/components/concierge/concierge-launcher";
import { Faq } from "@/components/sections/faq";
import { FeaturedProducts } from "@/components/sections/featured-products";
import { GalleryTeaser } from "@/components/sections/gallery-teaser";
import { Hero } from "@/components/sections/hero";
import { HowCardsWork } from "@/components/sections/how-cards-work";

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <HowCardsWork />
      <GalleryTeaser />
      <Faq />
      <ConciergeLauncher />
    </>
  );
}
