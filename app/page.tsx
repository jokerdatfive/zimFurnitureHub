"use client";

import { CartProvider } from "@/lib/cart-context";
import { Navigation } from "@/components/navigation";
import { HeroSection } from "@/components/hero-section";
import { FeaturedCollections } from "@/components/featured-collections";
import { BestSellers } from "@/components/best-sellers";
import { ShoppingCart } from "@/components/shopping-cart";

export default function Home() {
  return (
    <CartProvider>
      <Navigation />
      <main>
        <HeroSection />
        <FeaturedCollections />
        <BestSellers />
      </main>
      <ShoppingCart />
    </CartProvider>
  );
}
