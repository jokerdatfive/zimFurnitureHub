import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { getFallbackProductBySlug } from "@/lib/catalog-data";
import { ProductGallery } from "@/components/product-gallery";
import { MessageSquare, ShieldCheck, Truck, Clock } from "lucide-react";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let product: any = null;

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          slug,
          description,
          base_price,
          categories (
            name
          ),
          product_variants (
            sku,
            name,
            price,
            image_url,
            stock_quantity
          ),
          product_images (
            url,
            display_order
          )
        `)
        .eq("slug", slug)
        .single();

      if (!error && data) {
        product = data;
      }
    }
  } catch (err) {
    console.warn("Supabase not available for product detail, trying fallback:", err);
  }

  // Gracefully fallback to curated stock product
  if (!product) {
    const fallback = getFallbackProductBySlug(slug);
    if (fallback) {
      product = {
        id: fallback.id,
        name: fallback.name,
        slug: fallback.slug,
        description: fallback.description,
        base_price: fallback.base_price,
        categories: { name: fallback.category_name },
        product_variants: [
          {
            sku: fallback.slug.toUpperCase(),
            name: "Standard",
            price: fallback.base_price,
            image_url: fallback.image_url,
            stock_quantity: fallback.stock_quantity,
          },
        ],
        product_images: [
          {
            url: fallback.image_url,
            display_order: 0,
          },
        ],
      };
    }
  }

  if (!product) {
    notFound();
  }

  // Gather all product images (from product_images table, or variant image_url)
  const galleryImages: string[] = [];
  if (product.product_images && product.product_images.length > 0) {
    // Sort by display order
    const sorted = [...product.product_images].sort(
      (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );
    sorted.forEach((img: any) => {
      if (img.url && !galleryImages.includes(img.url)) {
        galleryImages.push(img.url);
      }
    });
  }

  // Add any variant images if not already included
  (product.product_variants || []).forEach((v: any) => {
    if (v.image_url && !galleryImages.includes(v.image_url)) {
      galleryImages.push(v.image_url);
    }
  });

  if (galleryImages.length === 0) {
    galleryImages.push("/images/product-sofa.jpg");
  }

  const primaryImage = galleryImages[0];
  const displayPrice = product.product_variants?.[0]?.price || product.base_price;
  const inStock = (product.product_variants?.[0]?.stock_quantity || 0) > 0;
  const categoryName = Array.isArray(product.categories) ? product.categories[0]?.name : product.categories?.name;
  const variants = product.product_variants || [];
  const colorVariants = variants.filter((v: any) => v.name && v.name !== "Standard");

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "263770000000";
  const whatsappOrderMessage = encodeURIComponent(
    `Hi KK Furnitures! I am interested in purchasing/layby for: "${product.name}" ($${displayPrice}). Could you please confirm current stock and delivery to Harare?`
  );

  return (
    <div className="pt-24 pb-16 bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Multi-Image Interactive Gallery */}
          <div>
            <ProductGallery images={galleryImages} productName={product.name} />
          </div>

          {/* Product Details & Ordering */}
          <div className="flex flex-col justify-center">
            {categoryName && (
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-3 font-semibold">
                {categoryName}
              </p>
            )}
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
              {product.name}
            </h1>
            <p className="text-3xl font-medium text-foreground mb-6 font-mono">
              ${Number(displayPrice).toLocaleString()}
            </p>

            <div className="prose prose-neutral dark:prose-invert mb-8">
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm sm:text-base">
                {product.description}
              </p>
            </div>

            {/* Color / Finish Variants */}
            {colorVariants.length > 0 && (
              <div className="mb-8 p-4 rounded-xl bg-secondary/40 border border-border">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2.5">
                  Available Colors & Finishes:
                </span>
                <div className="flex flex-wrap gap-2">
                  {colorVariants.map((v: any) => (
                    <span
                      key={v.id || v.sku || v.name}
                      className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground"
                    >
                      {v.name} {v.stock_quantity > 0 ? `(${v.stock_quantity} in stock)` : "(Sold out)"}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6 pt-6 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Availability</span>
                <span className={inStock ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-destructive font-semibold"}>
                  {inStock ? "In Stock (Showroom / Warehouse)" : "Currently Out of Stock"}
                </span>
              </div>

              {/* Direct Add to Cart */}
              <AddToCartButton
                product={{
                  id: product.id,
                  name: product.name,
                  price: displayPrice,
                  image: primaryImage,
                }}
              />

              {/* Instant WhatsApp Order / Layby Button */}
              <a
                href={`https://wa.me/${whatsappNumber}?text=${whatsappOrderMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                Inquire or Order via WhatsApp (Cash / Layby)
              </a>

              {/* Trust badges */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border text-center text-xs text-muted-foreground">
                <div className="flex flex-col items-center gap-1">
                  <Truck className="w-4 h-4 text-primary" />
                  <span>Doorstep Delivery</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Flexible Layby</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>Handcrafted Quality</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
