import { HeroSection } from "@/components/hero-section";
import { FeaturedCollections } from "@/components/featured-collections";
import { BestSellers } from "@/components/best-sellers";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <FeaturedCollections />
      <BestSellers />
    </main>
  );
}
