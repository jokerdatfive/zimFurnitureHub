import { createClient } from "@/utils/supabase/server";
import { ProductCard } from "@/components/product-card";
import { getFallbackProducts, CATALOG_CATEGORIES } from "@/lib/catalog-data";

export const metadata = {
  title: "Shop All Collections | Kombera Kombera Furnitures",
  description: "Browse our entire collection of premium furniture.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  let displayProducts: any[] = [];
  let categoryName = "All Collections";

  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = await createClient();
      
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          base_price,
          product_variants (
            image_url
          ),
          categories!inner (
            name,
            slug
          )
        `);

      if (category) {
        query = query.eq('categories.slug', category);
      }

      if (q) {
        query = query.ilike('name', `%${q}%`);
      }

      const { data: productsData, error } = await query.order('created_at', { ascending: false });
      const products = (productsData || []) as any[];

      if (!error && products && products.length > 0) {
        displayProducts = products.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.base_price,
          image: p.product_variants?.[0]?.image_url || "/images/product-sofa.jpg"
        }));

        if (category) {
          const cat = products[0].categories as any;
          categoryName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
        }
      }
    }
  } catch (err: any) {
    console.warn("Supabase not available, using curated stock fallback:", err?.message);
  }

  // Gracefully fallback to curated stock products if database is unconfigured or empty
  if (displayProducts.length === 0) {
    const fallbackList = getFallbackProducts({ category, q });
    displayProducts = fallbackList.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.base_price,
      image: p.image_url,
    }));

    if (category) {
      const matchedCat = CATALOG_CATEGORIES.find((c) => c.slug.toLowerCase() === category.toLowerCase());
      categoryName = matchedCat ? matchedCat.name : category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
    }
  }

  if (q) {
    categoryName = `Search results for "${q}"`;
  }

  return (
    <div className="pt-24 pb-16 bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-12 border-b border-border pb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-foreground">
            {categoryName}
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
