"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Menu, X, Shield } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";

export function Navigation() {
  const router = useRouter();
  const { getTotalItems, openCart } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const totalItems = getTotalItems();

  const navLinks = [
    { href: "/products?category=living-room", label: "Living" },
    { href: "/products?category=bedroom", label: "Bedroom" },
    { href: "/products?category=kitchen-dining", label: "Kitchen & Dining" },
    { href: "/about", label: "Our Story" },
  ];

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border transition-all">
      {/* Top Showroom & Branch Announcement Strip */}
      <div className="bg-primary text-primary-foreground text-[11px] py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 overflow-x-auto whitespace-nowrap">
        <span>📍 Showroom: 10670 Harare Highglen Road (10 km from Highglen)</span>
        <span className="opacity-40 hidden sm:inline">•</span>
        <span className="hidden sm:inline">Branches: Harare & Chiredzi</span>
        <span className="opacity-40 hidden md:inline">•</span>
        <a href="https://wa.me/263770000000" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80 font-mono">
          WhatsApp: +263 770 000 000
        </a>
      </div>

      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
          >
            <BrandLogo variant="navbar" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="relative">
              {searchOpen ? (
                <form onSubmit={handleSearch} className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
                  <input
                    type="text"
                    placeholder="Search..."
                    className="h-9 w-48 lg:w-64 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => !searchQuery && setSearchOpen(false)}
                  />
                </form>
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-foreground"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="h-5 w-5" />
                  <span className="sr-only">Search</span>
                </Button>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="relative text-foreground"
              onClick={openCart}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                  {totalItems}
                </span>
              )}
              <span className="sr-only">Shopping cart</span>
            </Button>

            {/* Discreet Staff Portal Icon */}
            <Link
              href="/admin"
              title="Staff Portal"
              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-md hover:bg-secondary/60"
            >
              <Shield className="h-4 w-4" />
              <span className="sr-only">Staff Portal</span>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              <div className="pt-3 border-t border-border">
                <Link
                  href="/admin"
                  className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>Staff Portal</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
