import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from "@/lib/cart-context";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ShoppingCart } from "@/components/shopping-cart";
import './globals.css'

const cormorant = Cormorant_Garamond({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif"
});

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans"
});

export const metadata: Metadata = {
  title: 'Kombera Kombera Furnitures | Contemporary Organic Living',
  description: 'Discover luxury minimalist furniture and contemporary organic craftsmanship at Kombera Kombera Furnitures. Handcrafted with passion in Harare, Zimbabwe.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/branding/03_avatar_icon_transparent.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/branding/04_avatar_profile_luxury_badge.png',
        sizes: '32x32',
      },
    ],
    apple: '/branding/04_avatar_profile_luxury_badge.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${inter.variable} bg-background`}>
      <body className="font-sans antialiased">
        <CartProvider>
          <Navigation />
          {children}
          <Footer />
          <ShoppingCart />
        </CartProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
