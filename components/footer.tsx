import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

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

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Contact Us</h3>
            <ul className="mt-4 space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">
                  123 Design Avenue,<br />
                  Harare, Zimbabwe
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">+263 770 000 000</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">hello@komberakomberafurnitures.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kombera Kombera Furnitures. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest border border-border px-2 py-1 rounded">Visa</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest border border-border px-2 py-1 rounded">Mastercard</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest border border-border px-2 py-1 rounded">EcoCash</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
