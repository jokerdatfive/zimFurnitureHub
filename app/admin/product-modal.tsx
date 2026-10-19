"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { addProduct, updateProduct } from "./actions";
import { Image as ImageIcon, Plus, Palette, Sparkles, DollarSign, Package, Trash2, UploadCloud } from "lucide-react";
import type { StoredProduct } from "@/lib/db/unified-store";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: StoredProduct | any | null;
  categories: { id: string; name: string }[];
}

export function ProductModal({
  isOpen,
  onClose,
  product,
  categories,
}: ProductModalProps) {
  const isEditing = Boolean(product);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [description, setDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [imagesList, setImagesList] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [colorsText, setColorsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Pre-fill fields whenever the product changes or modal opens
  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setCategoryId(product.category_id || categories[0]?.id || "");
      setPrice(product.base_price?.toString() || "");
      setStock((product.stock_quantity ?? 10).toString());
      setDescription(product.description || "");
      setIsFeatured(Boolean(product.is_featured));

      // Extract existing images
      const existingImages: string[] = [];
      if (Array.isArray(product.images) && product.images.length > 0) {
        existingImages.push(...product.images);
      } else if (product.product_images && product.product_images.length > 0) {
        product.product_images.forEach((img: any) => existingImages.push(img.url));
      } else if (product.image_url) {
        existingImages.push(product.image_url);
      }
      setImagesList(existingImages.length > 0 ? existingImages : ["/images/product-sofa.jpg"]);

      // Extract existing colors
      if (Array.isArray(product.colors)) {
        setColorsText(product.colors.join(", "));
      } else {
        const variantColors = (product.product_variants || [])
          .map((v: any) => v.name)
          .filter((n: string) => n && n !== "Standard");
        setColorsText(variantColors.join(", "));
      }
    } else {
      setName("");
      setCategoryId(categories[0]?.id || "");
      setPrice("");
      setStock("10");
      setDescription("");
      setIsFeatured(false);
      setImagesList(["/images/product-sofa.jpg"]);
      setColorsText("");
    }
    setErrorMsg("");
    setSuccessMsg("");
    setNewImageUrl("");
  }, [product, isOpen, categories]);

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    setImagesList((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  };

  const handleRemoveImage = (index: number) => {
    setImagesList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert file to local preview URL or data URL
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagesList((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const formData = new FormData();
    if (isEditing && product) {
      formData.set("id", product.id);
    }
    formData.set("name", name);
    formData.set("categoryId", categoryId);
    formData.set("price", price);
    formData.set("stock", stock);
    formData.set("description", description);
    formData.set("images", imagesList.join("\n"));
    formData.set("colors", colorsText);
    if (isFeatured) formData.set("isFeatured", "true");

    try {
      const res = isEditing ? await updateProduct(formData) : await addProduct(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(isEditing ? "Product updated successfully!" : "Product published successfully!");
        setTimeout(() => {
          onClose();
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <DialogHeader className="pb-4 border-b border-border">
          <DialogTitle className="font-serif text-2xl flex items-center gap-2 text-foreground">
            {isEditing ? (
              <>
                <Sparkles className="h-6 w-6 text-primary" />
                Edit Furniture Product
              </>
            ) : (
              <>
                <Plus className="h-6 w-6 text-primary" />
                Publish New Furniture Product
              </>
            )}
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {isEditing
              ? "Update stock, change prices, add showroom pictures, manage finishes, and set category."
              : "Create a new showroom piece with multiple pictures, color finishes, and live inventory level."}
          </p>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs rounded-md">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Product Name */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
              Product Title *
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Kombera 3pc Washed Oak Modular Kitchen Suite"
              className="w-full bg-background border border-border rounded-md px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Category & Price & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Category *
              </label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Price ($ USD) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  required
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="380.00"
                  className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-md text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Units in Stock
              </label>
              <div className="relative">
                <Package className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="10"
                  className="w-full pl-8 pr-3 py-2 bg-background border border-border rounded-md text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
              Description & Specifications *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Crafted from premium washed oak with brushed nickel handles, deep soft-closing drawers, and modular pantry units."
              className="w-full bg-background border border-border rounded-md px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Multiple Pictures & Image Upload Section */}
          <div className="space-y-3 p-4 bg-secondary/30 border border-border rounded-xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-primary" />
                Product Pictures ({imagesList.length} pictures)
              </label>
              <span className="text-[11px] text-muted-foreground">
                First image is main showroom hero picture
              </span>
            </div>

            {/* Live Picture Preview Strip with Remove Buttons */}
            {imagesList.length > 0 && (
              <div className="flex items-center gap-3 overflow-x-auto py-2 no-scrollbar">
                {imagesList.map((url, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-border bg-muted shrink-0 group shadow-xs"
                  >
                    <img
                      src={url}
                      alt={`Picture ${i + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/images/product-sofa.jpg";
                      }}
                    />
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="w-5 h-5 bg-rose-600 text-white rounded-full flex items-center justify-center text-xs shadow hover:bg-rose-700"
                        title="Remove image"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-[9px] text-center font-mono py-0.5">
                      {i === 0 ? "★ Hero" : `#${i + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add Image Controls: URL and File Upload */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder="Paste picture URL (e.g. /images/products/sofa.jpg or https://...)"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddImage();
                    }
                  }}
                  className="flex-1 bg-background border border-border rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddImage}
                  className="text-xs whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Picture
                </Button>
              </div>

              <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md text-xs cursor-pointer border border-border shrink-0">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload From Device</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Colors / Material Finishes */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
              <Palette className="h-4 w-4 text-primary" />
              Available Colors & Finishes (Comma separated)
            </label>
            <input
              value={colorsText}
              onChange={(e) => setColorsText(e.target.value)}
              placeholder="e.g. Washed Oak, Dark Walnut, Teak Finish, Charcoal Grey"
              className="w-full bg-background border border-border rounded-md px-3.5 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Customers can click these color options on the website to choose their preferred finish.
            </p>
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="isFeatured" className="text-sm font-medium text-foreground cursor-pointer">
              Feature on Homepage & Best Sellers
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]">
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Publish to Showroom"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
