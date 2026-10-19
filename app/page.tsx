import { HeroSection } from "@/components/hero-section";
import { FeaturedCollections } from "@/components/featured-collections";
import { BestSellers } from "@/components/best-sellers";
import { ShowroomLocationMap } from "@/components/showroom-map";

export default function Home() {
  return (
    <main>
      <HeroSection />
      <FeaturedCollections />
      <BestSellers />
      <section className="py-16 sm:py-20 bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ShowroomLocationMap />
        </div>
      </section>
    </main>
  );
}
