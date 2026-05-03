"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const collections = [
  {
    id: "sofas",
    title: "The Sofa Collection",
    description: "Luxurious comfort meets timeless design",
    image: "/images/collection-sofas.jpg",
  },
  {
    id: "dining",
    title: "Minimalist Dining",
    description: "Gather in refined elegance",
    image: "/images/collection-dining.jpg",
  },
  {
    id: "bedroom",
    title: "Premium Bedding",
    description: "Rest in pure sophistication",
    image: "/images/collection-bedroom.jpg",
  },
];

export function FeaturedCollections() {
  return (
    <section className="py-24 lg:py-32 bg-secondary/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
            Curated for you
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground text-balance">
            Featured Collections
          </h2>
        </div>

        {/* Collections Grid */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href="#"
              className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-muted"
            >
              <Image
                src={collection.image}
                alt={collection.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              
              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6 lg:p-8">
                <h3 className="font-serif text-xl lg:text-2xl text-white font-medium mb-2">
                  {collection.title}
                </h3>
                <p className="text-white/80 text-sm mb-4">
                  {collection.description}
                </p>
                <div className="flex items-center text-white text-sm font-medium group-hover:gap-3 gap-2 transition-all">
                  <span>Explore</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
