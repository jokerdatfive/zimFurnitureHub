"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16">
      <div className="mx-auto max-w-7xl w-full px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content Side */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-tight tracking-tight text-foreground text-balance">
              Elevated Living, Crafted for You.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Discover furniture that transforms spaces into sanctuaries. Where timeless design meets uncompromising quality.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/products" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full h-12 px-8 text-sm font-medium tracking-wide"
                >
                  Explore Collections
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/about" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 px-8 text-sm font-medium tracking-wide"
                >
                  Our Story
                </Button>
              </Link>
            </div>
          </div>

          {/* Image Side */}
          <div className="order-1 lg:order-2 relative">
            <div className="relative aspect-[4/5] lg:aspect-[3/4] w-full overflow-hidden rounded-sm bg-muted">
              <Image
                src="/images/hero-furniture.jpg"
                alt="Minimalist wooden furniture arrangement in a modern living space"
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Floating accent card */}
            <div className="absolute -bottom-6 -left-6 lg:-left-12 bg-card p-6 shadow-lg border border-border max-w-xs hidden md:block">
              <p className="text-sm text-muted-foreground uppercase tracking-widest mb-1">
                Craftsmanship
              </p>
              <p className="font-serif text-lg text-foreground">
                Handcrafted with precision and care
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Background decorative element */}
      <div className="absolute top-1/2 right-0 w-1/3 h-2/3 bg-secondary/50 -z-10 transform -translate-y-1/2" />
    </section>
  );
}
