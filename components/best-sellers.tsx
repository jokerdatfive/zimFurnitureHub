import { createClient } from "@/utils/supabase/server";
import { ProductCard } from "@/components/product-card";
import { getFallbackProducts } from "@/lib/catalog-data";

export async function BestSellers() {
  let displayProducts: any[] = [];

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
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
        .eq('is_featured', true)
        .limit(8);

      if (!error && products && products.length > 0) {
        displayProducts = products.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.base_price,
          image: p.product_variants?.[0]?.image_url || "/images/product-sofa.jpg"
        }));
      }
    }
  } catch (err: any) {
    console.warn("Supabase not available, using curated bestsellers fallback:", err?.message);
  }

  // Gracefully fallback to curated stock products if database is unconfigured or empty
  if (displayProducts.length === 0) {
    const fallbackList = getFallbackProducts({ featuredOnly: true });
    displayProducts = fallbackList.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.base_price,
      image: p.image_url,
    }));
  }

  return (
    <section className="py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
            Most loved
          </p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground text-balance">
            Best Sellers
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Our most sought-after pieces, chosen by discerning collectors worldwide.
          </p>
        </div>

        {/* Products Grid */}
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
      </div>
    </section>
  );
}
