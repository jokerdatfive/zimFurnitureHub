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
import { Image as ImageIcon, Plus, Palette, Sparkles, DollarSign, Package } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any | null; // If null, "Add Product" mode. If provided, "Edit Product" mode.
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
  const [imagesText, setImagesText] = useState("");
  const [colorsText, setColorsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Pre-fill fields whenever the product changes or modal opens
  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setCategoryId(product.category_id || categories[0]?.id || "");
      setPrice(product.base_price?.toString() || "");
      
      const variant = product.product_variants?.[0];
      setStock(variant?.stock_quantity?.toString() || "10");
      setDescription(product.description || "");
      setIsFeatured(Boolean(product.is_featured));

      // Extract existing images
      const existingImages: string[] = [];
      if (product.product_images && product.product_images.length > 0) {
        product.product_images.forEach((img: any) => existingImages.push(img.url));
      } else if (variant?.image_url) {
        existingImages.push(variant.image_url);
      }
      setImagesText(existingImages.join("\n"));

      // Extract existing colors / variants
      const existingColors = (product.product_variants || [])
        .map((v: any) => v.name)
        .filter((n: string) => n && n !== "Standard");
      setColorsText(existingColors.join(", "));
    } else {
      setName("");
      setCategoryId(categories[0]?.id || "");
      setPrice("");
      setStock("10");
      setDescription("");
      setIsFeatured(false);
      setImagesText("/images/product-sofa.jpg");
      setColorsText("");
    }
    setErrorMsg("");
  }, [product, isOpen, categories]);

  // Live image previews
  const previewImages = imagesText
    .split(/[\n,]/)
    .map((url) => url.trim())
    .filter((url) => url.length > 0 && (url.startsWith("http") || url.startsWith("/")));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const formData = new FormData();
    if (isEditing && product) {
      formData.set("id", product.id);
    }
    formData.set("name", name);
    formData.set("categoryId", categoryId);
    formData.set("price", price);
    formData.set("stock", stock);
    formData.set("description", description);
    formData.set("images", imagesText);
    formData.set("colors", colorsText);
    if (isFeatured) formData.set("isFeatured", "true");

    try {
      const res = isEditing ? await updateProduct(formData) : await addProduct(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        onClose();
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
              ? "Update prices, add or replace pictures, manage colors, and set category."
              : "Create a new showroom piece with multiple pictures, color finishes, and stock level."}
          </p>
        </DialogHeader>

        {errorMsg && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-md">
            {errorMsg}
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

          {/* Multiple Pictures / Gallery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-primary" />
                Product Pictures (Multiple URLs, one per line)
              </label>
              <span className="text-[11px] text-muted-foreground">
                {previewImages.length} {previewImages.length === 1 ? "picture" : "pictures"} detected
              </span>
            </div>
            <textarea
              rows={3}
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              placeholder={"/images/products/kitchen-suite-front.jpg\n/images/products/kitchen-suite-side.jpg\nhttps://example.com/drawer-detail.jpg"}
              className="w-full font-mono text-xs bg-background border border-border rounded-md p-3 focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
            />
            <p className="text-[11px] text-muted-foreground">
              Tip: The first picture will be the primary hero image. Add more picture URLs on new lines so buyers can see full showroom angles.
            </p>

            {/* Live Thumbnails Preview Strip */}
            {previewImages.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-medium text-muted-foreground block mb-2">Live Picture Previews:</span>
                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                  {previewImages.map((url, i) => (
                    <div
                      key={i}
                      className="relative w-16 h-16 rounded-md overflow-hidden border border-border bg-muted shrink-0 group"
                    >
                      <img
                        src={url}
                        alt={`Preview ${i + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/product-sofa.jpg";
                        }}
                      />
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] text-center font-mono py-0.5">
                        #{i + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              {loading ? "Saving..." : isEditing ? "Save Changes" : "Publish to Website"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
