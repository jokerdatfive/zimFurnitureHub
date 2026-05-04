import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { AddToCartButton } from "@/components/add-to-cart-button";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
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
      )
    `)
    .eq("slug", slug)
    .single();

  if (!product) {
    notFound();
  }

  const imageUrl = product.product_variants?.[0]?.image_url || "/images/product-sofa.jpg";
  const displayPrice = product.product_variants?.[0]?.price || product.base_price;
  const inStock = (product.product_variants?.[0]?.stock_quantity || 0) > 0;
  const categoryName = Array.isArray(product.categories) ? product.categories[0]?.name : product.categories?.name;

  return (
    <div className="pt-24 pb-16 bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Image Gallery */}
          <div className="relative aspect-square md:aspect-[4/3] lg:aspect-square overflow-hidden bg-muted rounded-sm">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Product Details */}
          <div className="flex flex-col justify-center">
            {categoryName && (
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
                {categoryName}
              </p>
            )}
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
              {product.name}
            </h1>
            <p className="text-2xl font-medium text-foreground mb-8">
              ${displayPrice.toLocaleString()}
            </p>
            
            <div className="prose prose-neutral dark:prose-invert mb-8">
              <p className="text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>

            <div className="space-y-6 pt-8 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Availability</span>
                <span className={inStock ? "text-green-600 dark:text-green-500 font-medium" : "text-destructive font-medium"}>
                  {inStock ? "In Stock" : "Out of Stock"}
                </span>
              </div>
              
              <AddToCartButton 
                product={{
                  id: product.id,
                  name: product.name,
                  price: displayPrice,
                  image: imageUrl
                }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
