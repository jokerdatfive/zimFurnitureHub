"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
}

export function ProductCard({ id, name, price, image }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart({ id, name, price, image });
  };

  return (
    <div className="group">
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-muted mb-4">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Add to Cart Button - appears on hover */}
        <div className="absolute inset-0 flex items-end justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            onClick={handleAddToCart}
            className="w-full h-11 text-sm font-medium tracking-wide"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-1">
        <h3 className="font-serif text-lg text-foreground group-hover:text-foreground/80 transition-colors">
          {name}
        </h3>
        <p className="text-base font-medium text-foreground">
          ${price.toLocaleString()}
        </p>
      </div>

      {/* Mobile Add to Cart */}
      <Button
        onClick={handleAddToCart}
        variant="outline"
        className="w-full mt-4 h-10 text-sm font-medium tracking-wide md:hidden"
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        Add to Cart
      </Button>
    </div>
  );
}
