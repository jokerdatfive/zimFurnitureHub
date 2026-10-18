import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Package, Boxes, Sparkles, Plus } from "lucide-react";
import { ProductTableClient } from "./product-table-client";
import { CATALOG_PRODUCTS, CATALOG_CATEGORIES } from "@/lib/catalog-data";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Products & Catalog Management | KK Furnitures Admin",
  description: "Publish furniture, edit pictures, update prices, and manage color finishes.",
};

export default async function AdminPage() {
  const supabase = await createClient();

  // 1. Fetch products with categories, variants, and gallery images
  let products: any[] = [];
  try {
    const { data: dbProducts, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        slug,
        description,
        base_price,
        category_id,
        is_featured,
        created_at,
        categories (id, name),
        product_variants (
          id,
          sku,
          name,
          price,
          stock_quantity,
          image_url
        ),
        product_images (
          id,
          url,
          display_order
        )
      `)
      .order("created_at", { ascending: false });

    if (!error && dbProducts && dbProducts.length > 0) {
      products = dbProducts;
    }
  } catch (err) {
    console.warn("Could not query products from Supabase, using catalog fallback:", err);
  }

  // 2. Fetch categories
  let categories: { id: string; name: string }[] = [];
  try {
    const { data: dbCats, error: catErr } = await supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (!catErr && dbCats && dbCats.length > 0) {
      categories = dbCats;
    }
  } catch (err) {
    console.warn("Could not query categories from Supabase:", err);
  }

  // Fallbacks if empty
  if (categories.length === 0) {
    categories = CATALOG_CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
    }));
  }

  if (products.length === 0) {
    products = CATALOG_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      base_price: p.base_price,
      category_id: p.category_id,
      is_featured: p.is_featured,
      categories: { id: p.category_id, name: p.category_name },
      product_variants: [
        {
          id: `var-${p.id}`,
          sku: p.sku,
          name: "Standard",
          price: p.base_price,
          stock_quantity: p.stock_quantity,
          image_url: p.image_url,
        },
      ],
      product_images: [
        {
          id: `img-${p.id}`,
          url: p.image_url,
          display_order: 0,
        },
      ],
    }));
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground flex items-center gap-3">
            <Package className="h-7 w-7 text-primary" />
            Products & Catalog Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish new showroom furniture, update gallery pictures, set prices, and configure color finishes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/stock">
            <Button variant="outline" className="gap-2">
              <Boxes className="h-4 w-4 text-primary" />
              Stock & Asset Tracker
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Interactive Table & Modal Client */}
      <ProductTableClient products={products} categories={categories} />
    </div>
  );
}
