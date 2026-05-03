"use client";

import { ProductCard } from "@/components/product-card";

const products = [
  {
    id: "1",
    name: "Oslo Velvet Sofa",
    price: 3299,
    image: "/images/product-sofa.jpg",
  },
  {
    id: "2",
    name: "Nordic Oak Dining Table",
    price: 2199,
    image: "/images/product-dining-table.jpg",
  },
  {
    id: "3",
    name: "Minimalist Accent Chair",
    price: 899,
    image: "/images/product-accent-chair.jpg",
  },
  {
    id: "4",
    name: "Copenhagen Bedframe",
    price: 1899,
    image: "/images/product-bedframe.jpg",
  },
  {
    id: "5",
    name: "Scandinavian Side Table",
    price: 549,
    image: "/images/product-side-table.jpg",
  },
  {
    id: "6",
    name: "Modern Floor Lamp",
    price: 429,
    image: "/images/product-floor-lamp.jpg",
  },
  {
    id: "7",
    name: "Linen Lounge Chair",
    price: 1299,
    image: "/images/product-lounge-chair.jpg",
  },
  {
    id: "8",
    name: "Walnut Console Table",
    price: 1499,
    image: "/images/product-console-table.jpg",
  },
];

export function BestSellers() {
  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
            Most loved
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground text-balance">
            Best Sellers
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Our most sought-after pieces, chosen by discerning collectors worldwide.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
