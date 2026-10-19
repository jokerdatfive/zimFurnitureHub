"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { ShoppingCart, MessageCircle } from "lucide-react";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  slug?: string;
}

export function ProductCard({ id, name, price, image, slug }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({ id, name, price, image });
  };

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "263770000000";
  const cleanPhone = whatsappNumber.replace(/\D/g, "");
  const whatsappInquiryMessage = encodeURIComponent(
    `Hi KK Furnitures! I am interested in: "${name}" ($${price}). Could you please confirm if this piece is in stock and available for delivery from your Highglen Road showroom (or Chiredzi)?`
  );

  return (
    <div className="group flex flex-col justify-between">
      <div>
        {/* Image Container */}
        <Link href={slug ? `/products/${slug}` : "#"} className="block relative aspect-[4/5] overflow-hidden rounded-xl bg-muted mb-3 group-hover:opacity-95 transition-opacity">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Add to Cart Button - appears on hover */}
          <div className="absolute inset-0 flex items-end justify-center p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              onClick={handleAddToCart}
              className="w-full h-10 text-xs font-semibold tracking-wide bg-background/95 text-foreground hover:bg-background border border-border shadow-md"
            >
              <ShoppingCart className="h-3.5 w-3.5 mr-2" />
              Add to Cart
            </Button>
          </div>
        </Link>

        {/* Product Info */}
        <div className="space-y-1">
          <Link href={slug ? `/products/${slug}` : "#"}>
            <h3 className="font-serif text-base text-foreground font-semibold hover:text-primary transition-colors line-clamp-1">
              {name}
            </h3>
          </Link>
          <p className="text-sm font-bold font-mono text-foreground">
            ${price.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Action Buttons: Add to Cart & WhatsApp Inquiry Template */}
      <div className="mt-3 flex items-center gap-2">
        <a
          href={`https://wa.me/${cleanPhone}?text=${whatsappInquiryMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
          title={`Confirm availability for ${name} on WhatsApp`}
        >
          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
          <span>Confirm on WhatsApp</span>
        </a>

        <Button
          onClick={handleAddToCart}
          variant="outline"
          size="sm"
          className="h-8 px-2.5 text-xs md:hidden"
          title="Add to cart"
        >
          <ShoppingCart className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
