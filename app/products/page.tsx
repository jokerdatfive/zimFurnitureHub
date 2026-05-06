import { createClient } from "@/utils/supabase/server";
import { ProductCard } from "@/components/product-card";

export const metadata = {
  title: "Shop All Collections | Zim Furniture Hub",
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

    if (error) {
      console.error("Error fetching products:", error);
    }

    if (category && products && products.length > 0) {
      const cat = products[0].categories as any;
      categoryName = Array.isArray(cat) ? cat[0]?.name : cat?.name;
    } else if (q) {
      categoryName = `Search results for "${q}"`;
    } else if (category) {
       // If category is provided but no products, we can try to fetch the category name separately or just show the slug
       categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
    }

    displayProducts = products?.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.base_price,
      image: p.product_variants?.[0]?.image_url || "/images/product-sofa.jpg"
    })) || [];
  } catch (err: any) {
    console.error("Failed to load products:", err);
    return (
      <div className="pt-32 pb-20 text-center bg-destructive/5 min-h-screen">
        <h3 className="text-xl font-serif text-destructive">Database Connection Error</h3>
        <p className="text-muted-foreground text-sm mt-2">{err.message || "Unknown error occurred"}</p>
        <p className="text-xs mt-4">Make sure NEXT_PUBLIC_SUPABASE_URL and ANON_KEY are set in Vercel.</p>
      </div>
    );
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
