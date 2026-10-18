"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, ImageIcon } from "lucide-react";

interface ProductGalleryProps {
  images: string[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const safeImages = images && images.length > 0 ? images : ["/images/product-sofa.jpg"];
  const [activeIndex, setActiveIndex] = useState(0);

  const activeImage = safeImages[activeIndex] || safeImages[0];

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % safeImages.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };

  return (
    <div className="space-y-4">
      {/* Main Hero Viewport */}
      <div className="relative aspect-square md:aspect-[4/3] lg:aspect-square overflow-hidden bg-muted rounded-xl border border-border group shadow-sm">
        <Image
          src={activeImage}
          alt={`${productName} - View ${activeIndex + 1}`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
        />

        {/* Next / Previous Overlay Buttons (when multiple images) */}
        {safeImages.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-md flex items-center justify-center shadow-md transition opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur-md flex items-center justify-center shadow-md transition opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Image Counter Badge */}
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-mono font-medium">
              {activeIndex + 1} / {safeImages.length}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails Navigation Strip */}
      {safeImages.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          {safeImages.map((img, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                  isActive
                    ? "border-primary ring-2 ring-primary/30 shadow-md scale-95"
                    : "border-border hover:border-muted-foreground/50 opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
