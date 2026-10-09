"use client";

import Image from "next/image";

interface BrandLogoProps {
  variant?: "navbar" | "footer" | "badge";
  className?: string;
}

export function BrandLogo({ variant = "navbar", className = "" }: BrandLogoProps) {
  if (variant === "badge") {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <Image
          src="/branding/04_avatar_profile_luxury_badge.png"
          alt="Kombera Kombera Furnitures Emblem"
          width={80}
          height={80}
          className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-2xl shadow-md"
          priority
        />
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={`flex flex-col items-start gap-3 group ${className}`}>
        {/* Horizontal Vector Logo (Light & Dark) */}
        <div className="relative h-14 sm:h-16 w-auto flex items-center">
          <Image
            src="/branding/kombera_kombera_logo_horizontal.svg"
            alt="Kombera Kombera Furnitures"
            width={320}
            height={74}
            className="h-12 sm:h-14 w-auto object-contain dark:hidden transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <Image
            src="/branding/kombera_kombera_logo_horizontal_white.svg"
            alt="Kombera Kombera Furnitures"
            width={320}
            height={74}
            className="h-12 sm:h-14 w-auto object-contain hidden dark:block transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </div>
      </div>
    );
  }

  // Default: Navbar
  return (
    <div className={`flex items-center gap-3 shrink-0 group ${className}`}>
      {/* Sculptural Double-K Curved Lounge Monogram Icon */}
      <div className="relative h-10 w-10 sm:h-11 sm:w-11 shrink-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-secondary/80 to-secondary/30 p-1 border border-border/50 group-hover:border-primary/30 transition-all duration-300 shadow-xs">
        <svg
          viewBox="0 0 500 500"
          className="h-full w-full object-contain"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="nav_terra" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D66847" />
              <stop offset="100%" stopColor="#A64325" />
            </linearGradient>
          </defs>
          <g transform="translate(130, 115) scale(1.5)">
            {/* Stem 1 */}
            <rect x="25" y="20" width="22" height="150" rx="11" className="fill-[#2C1E1A] dark:fill-white" />
            {/* Sweeping Top Curve */}
            <path
              d="M 47 95 C 65 65, 105 35, 140 35 C 160 35, 170 48, 165 65 C 160 80, 140 95, 115 102 Z"
              fill="url(#nav_terra)"
            />
            {/* Ergonomic Lower Curve */}
            <path
              d="M 47 105 C 75 110, 115 125, 135 155 C 145 168, 138 175, 125 175 C 105 175, 80 155, 47 115 Z"
              className="fill-[#2C1E1A] dark:fill-white"
            />
            {/* Stem 2 */}
            <rect x="110" y="45" width="20" height="125" rx="10" className="fill-[#2C1E1A] dark:fill-white" />
            {/* Second K Top Ribbon */}
            <path
              d="M 130 95 C 145 70, 175 48, 200 48 C 215 48, 222 58, 218 72 C 214 84, 195 98, 175 103 Z"
              fill="url(#nav_terra)"
            />
            {/* Second K Lower Ribbon */}
            <path
              d="M 130 105 C 150 112, 185 128, 202 152 C 210 163, 204 172, 192 172 C 175 172, 155 155, 130 115 Z"
              className="fill-[#2C1E1A] dark:fill-white"
            />
          </g>
        </svg>
      </div>

      {/* Editorial Luxury Typography */}
      <div className="flex flex-col justify-center leading-none">
        <span className="font-serif text-[17px] sm:text-[19px] lg:text-[21px] font-bold tracking-[0.03em] text-foreground group-hover:text-primary transition-colors duration-200">
          KOMBERA KOMBERA
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] sm:text-[10px] font-semibold tracking-[0.24em] text-[#B85334] dark:text-[#E2785B] uppercase">
            FURNITURES
          </span>
          <span className="hidden lg:inline-block w-1 h-1 rounded-full bg-border" />
          <span className="hidden lg:inline-block text-[8px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
            ORGANIC LIVING
          </span>
        </div>
      </div>
    </div>
  );
}
