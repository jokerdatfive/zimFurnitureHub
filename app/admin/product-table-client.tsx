"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Check, X, Image as ImageIcon, Palette, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductModal } from "./product-modal";
import { deleteProduct, toggleProductStock } from "./actions";
import Link from "next/link";

interface ProductTableClientProps {
  products: any[];
  categories: { id: string; name: string }[];
}

export function ProductTableClient({
  products,
  categories,
}: ProductTableClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (prod: any) => {
    setEditingProduct(prod);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the catalog?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteProduct(id);
    } catch (err) {
      alert("Failed to delete product.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="font-serif text-2xl font-medium text-foreground">
            Current Catalog ({products.length} Products)
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Click &quot;Edit&quot; on any item to update pictures, prices, and color options, or publish new furniture.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
          <Plus className="h-4 w-4" />
          Publish New Product
        </Button>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden border border-border rounded-xl bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-secondary/40 text-muted-foreground uppercase text-[11px] font-semibold tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-4">Furniture Piece</th>
                <th className="px-4 py-4">Category</th>
                <th className="px-4 py-4">Price ($)</th>
                <th className="px-4 py-4">Gallery & Variants</th>
                <th className="px-4 py-4">Stock Status</th>
                <th className="px-4 py-4">Featured</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const variant = product.product_variants?.[0];
                const stock = variant?.stock_quantity ?? 0;
                const isSoldOut = stock <= 0;
                const imageCount = (product.product_images?.length || (variant?.image_url ? 1 : 0));
                const variantCount = product.product_variants?.length || 1;
                const thumbnail =
                  product.product_images?.[0]?.url ||
                  variant?.image_url ||
                  "/images/product-sofa.jpg";

                return (
                  <tr key={product.id} className="hover:bg-secondary/10 transition-colors">
                    {/* Thumbnail & Title */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-md overflow-hidden bg-muted border border-border shrink-0 relative">
                          <img
                            src={thumbnail}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "/images/product-sofa.jpg";
                            }}
                          />
                        </div>
                        <div>
                          <div className="font-medium text-foreground text-sm line-clamp-1">
                            {product.name}
                          </div>
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 mt-0.5"
                          >
                            <span>/{product.slug}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-4 text-muted-foreground">
                      {product.categories?.name || "General"}
                    </td>

                    {/* Base Price */}
                    <td className="px-4 py-4 font-mono font-semibold text-foreground">
                      ${Number(product.base_price || 0).toLocaleString()}
                    </td>

                    {/* Gallery & Colors Badge */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-secondary text-secondary-foreground font-medium">
                          <ImageIcon className="w-3 h-3 text-primary" />
                          {imageCount} {imageCount === 1 ? "photo" : "photos"}
                        </span>
                        {variantCount > 1 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium">
                            <Palette className="w-3 h-3" />
                            {variantCount} finishes
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Stock Status Toggle */}
                    <td className="px-4 py-4">
                      {variant ? (
                        <form
                          action={async () => {
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
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>

                    {/* Featured */}
                    <td className="px-4 py-4">
                      {product.is_featured ? (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                          Featured
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">Standard</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(product)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          title="Edit product, pictures & colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        {/* Delete Button */}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={deletingId === product.id}
                          onClick={() => handleDelete(product.id, product.name)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    No products found in the catalog. Click &quot;Publish New Product&quot; to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Add Modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editingProduct}
        categories={categories}
      />
    </>
  );
}
