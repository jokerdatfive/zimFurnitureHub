import { createClient } from "@/utils/supabase/server";
import { ProductCard } from "@/components/product-card";

export const metadata = {
  title: "Shop All Collections | Zim Furniture Hub",
  description: "Browse our entire collection of premium furniture.",
};

export default async function ProductsPage() {
  const supabase = await createClient();
  
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      base_price,
      product_variants (
        image_url
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
  }

  const displayProducts = products?.map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.base_price,
    image: p.product_variants?.[0]?.image_url || "/images/product-sofa.jpg"
  })) || [];

  return (
    <div className="pt-24 pb-16 bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12 border-b border-border pb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-foreground">
            Shop All Collections
          </h1>
          <p className="mt-4 text-muted-foreground text-lg max-w-2xl">
            Explore our meticulously crafted pieces designed to elevate your living spaces.
          </p>
        </div>

        {displayProducts.length === 0 ? (
          <div className="text-center py-20 bg-secondary/30 rounded-lg">
            <h2 className="text-2xl font-serif text-foreground mb-4">No products available</h2>
            <p className="text-muted-foreground">Check back later or run the database seed script.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                slug={product.slug}
                price={product.price}
                image={product.image}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
