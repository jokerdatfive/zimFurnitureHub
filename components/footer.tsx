import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, PhoneCall } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-secondary/50 border-t border-border">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand and About */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm">
              <BrandLogo variant="footer" />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              Kombera Kombera Furnitures — Elevating homes with contemporary organic living, handcrafted excellence, and timeless design.
            </p>
            <div className="mt-6 flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Shop</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="/products?category=living-room" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Living Room</Link></li>
              <li><Link href="/products?category=bedroom" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Bedroom</Link></li>
              <li><Link href="/products?category=dining-room" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Dining Room</Link></li>
              <li><Link href="/products" className="text-sm text-muted-foreground hover:text-foreground transition-colors">All Collections</Link></li>
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Our Story</Link></li>
              <li><Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Admin Panel</Link></li>
            </ul>
          </div>

          {/* Business Info */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Customer Care</h3>
            <ul className="mt-4 space-y-2">
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Shipping Policy</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact & Showroom Locations */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Showrooms & Branches</h3>
            <ul className="mt-4 space-y-3.5">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground leading-snug">
                  <span className="font-semibold text-foreground block">Main Showroom:</span>
                  10670 Harare Highglen Road<br />
                  (10 kilometres from Highglen)
                </div>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">Branches</span>
                <span className="text-sm font-medium text-foreground">Harare • Chiredzi</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="flex flex-col space-y-1">
                  <a href="https://wa.me/263716496040" target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono">
                    <span className="text-[11px] text-foreground font-semibold block">Showroom WhatsApp:</span>
                    +263 716 496 040
                  </a>
                  <a href="tel:0775362010" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono">
                    <span className="text-[11px] text-foreground font-semibold block">EcoCash / Mukuru / InnBucks (Direct Dial):</span>
                    0775 362 010
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex flex-col text-sm text-muted-foreground">
                  <a href="mailto:mugwavae@gmail.com" className="hover:text-foreground transition-colors font-mono">
                    mugwavae@gmail.com
                  </a>
                  <span className="text-xs opacity-75">sales@komberakomberafurnitures.com</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kombera Kombera Furnitures. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-xs text-muted-foreground font-medium">Direct Dial Payments:</span>
            <a
              href="tel:0775362010"
              title="Tap to call EcoCash line 0775362010 directly from your phonepad"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground bg-secondary/70 hover:bg-secondary border border-border hover:border-primary px-3 py-1.5 rounded-lg shadow-xs transition-colors"
            >
              <PhoneCall className="h-3.5 w-3.5 text-emerald-600" />
              <span>EcoCash: 0775 362 010</span>
            </a>
            <a
              href="tel:0775362010"
              title="Tap to call Mukuru line 0775362010 directly from your phonepad"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground bg-secondary/70 hover:bg-secondary border border-border hover:border-primary px-3 py-1.5 rounded-lg shadow-xs transition-colors"
            >
              <PhoneCall className="h-3.5 w-3.5 text-amber-600" />
              <span>Mukuru: 0775 362 010</span>
            </a>
            <a
              href="tel:0775362010"
              title="Tap to call InnBucks line 0775362010 directly from your phonepad"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-foreground bg-secondary/70 hover:bg-secondary border border-border hover:border-primary px-3 py-1.5 rounded-lg shadow-xs transition-colors"
            >
              <PhoneCall className="h-3.5 w-3.5 text-blue-600" />
              <span>InnBucks: 0775 362 010</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
