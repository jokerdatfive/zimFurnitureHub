import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Plus, Trash2, Package, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addProduct, deleteProduct, toggleProductStock } from "./actions";
import Image from "next/image";

export default async function AdminPage() {
  const supabase = await createClient();

  // Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch products, categories, and stock variants
  const { data: products } = await supabase
    .from("products")
    .select(`
      id,
      name,
      base_price,
      is_featured,
      categories (name),
      product_variants (id, stock_quantity)
    `)
    .order("created_at", { ascending: false });

  const { data: categories } = await supabase.from("categories").select("id, name");

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground flex items-center gap-3">
            <Package className="h-7 w-7 text-primary" />
            Inventory & Stock
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your showroom and warehouse furniture stock.</p>
        </div>
      </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Add Product Form */}
          <div className="lg:col-span-1">
            <div className="bg-secondary/30 p-8 rounded-sm border border-border sticky top-28">
              <h2 className="font-serif text-2xl font-medium mb-6 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Stock
              </h2>
              <form
                action={async (formData: FormData) => {
                  "use server";
                  await addProduct(formData);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Product Name</label>
                  <input name="name" required className="w-full bg-background border border-border rounded-sm px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Oslo Velvet Sofa" />
                </div>
                
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Category</label>
                  <select name="categoryId" required className="w-full bg-background border border-border rounded-sm px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    {categories?.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Base Price ($)</label>
                  <input name="price" type="number" step="0.01" required className="w-full bg-background border border-border rounded-sm px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="0.00" />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Description</label>
                  <textarea name="description" required rows={3} className="w-full bg-background border border-border rounded-sm px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Product details..." />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">Image URL</label>
                  <input name="imageUrl" className="w-full bg-background border border-border rounded-sm px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" placeholder="/images/product-sofa.jpg" />
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input type="checkbox" name="isFeatured" id="isFeatured" className="h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                  <label htmlFor="isFeatured" className="text-sm text-foreground">Feature on homepage</label>
                </div>

                <Button type="submit" className="w-full">
                  Update Stock
                </Button>
              </form>
            </div>
          </div>

          {/* Product List */}
          <div className="lg:col-span-2">
            <h2 className="font-serif text-2xl font-medium mb-6 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Current Inventory
            </h2>
            <div className="overflow-hidden border border-border rounded-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4">Product</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock Status</th>
                    <th className="px-6 py-4">Featured</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products?.map((product: any) => {
                    const variant = product.product_variants?.[0];
                    const stock = variant?.stock_quantity ?? 0;
                    const isSoldOut = stock <= 0;

                    return (
                      <tr key={product.id} className="hover:bg-secondary/10 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{product.name}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{product.categories?.name}</td>
                        <td className="px-6 py-4 text-sm text-foreground">${product.base_price.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm">
                          {variant ? (
                            <form
                              action={async () => {
                                "use server";
                                await toggleProductStock(variant.id, stock);
                              }}
                            >
                              <button
                                type="submit"
                                title="Click to toggle stock status"
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                  isSoldOut
                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                                }`}
                              >
                                {isSoldOut ? (
                                  <>
                                    <X className="h-3 w-3" />
                                    <span>Sold Out</span>
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-3 w-3" />
                                    <span>In Stock ({stock})</span>
                                  </>
                                )}
                              </button>
                            </form>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {product.is_featured ? (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Yes</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">No</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <form action={async (formData) => {
                            "use server";
                            const id = formData.get("id") as string;
                            await deleteProduct(id);
                          }}>
                            <input type="hidden" name="id" value={product.id} />
                            <button type="submit" className="text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                  {(!products || products.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        No products found in inventory.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
  );
}
