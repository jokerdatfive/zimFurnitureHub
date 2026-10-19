"use server";

import { revalidatePath } from "next/cache";
import { saveProduct, deleteProduct as storeDeleteProduct, quickUpdateProductStock } from "@/lib/db/unified-store";

/**
 * Parses multiline or comma-separated image URLs into a clean string array
 */
function parseImageUrls(rawUrls: string): string[] {
  if (!rawUrls) return [];
  return rawUrls
    .split(/[\n,]/)
    .map((url) => url.trim())
    .filter((url) => url.length > 0 && (url.startsWith("http") || url.startsWith("/")));
}

export async function addProduct(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "";
    const price = parseFloat(formData.get("price") as string) || 0;
    const categoryId = (formData.get("categoryId") as string) || "11111111-0000-0000-0000-000000000000";
    const rawImages = (formData.get("images") as string) || (formData.get("imageUrl") as string) || "";
    const isFeatured = formData.get("isFeatured") === "on" || formData.get("isFeatured") === "true";
    const colorsRaw = (formData.get("colors") as string) || "";
    const stock = parseInt(formData.get("stock") as string, 10) || 10;

    const images = parseImageUrls(rawImages);
    const colors = colorsRaw
      .split(/[\n,]/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const product = await saveProduct({
      name,
      description,
      price,
      categoryId,
      stock,
      images: images.length > 0 ? images : ["/images/product-sofa.jpg"],
      colors: colors.length > 0 ? colors : ["Standard Finish"],
      isFeatured,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/stock");
    revalidatePath("/products");
    revalidatePath("/");

    return { success: true, productId: product.id };
  } catch (error: any) {
    console.error("[ADD_PRODUCT_ERROR]", error);
    return { error: error.message || "Failed to add product" };
  }
}

export async function updateProduct(formData: FormData) {
  try {
    const productId = formData.get("id") as string;
    const name = formData.get("name") as string;
    const description = (formData.get("description") as string) || "";
    const price = parseFloat(formData.get("price") as string) || 0;
    const categoryId = (formData.get("categoryId") as string) || "11111111-0000-0000-0000-000000000000";
    const rawImages = (formData.get("images") as string) || "";
    const isFeatured = formData.get("isFeatured") === "on" || formData.get("isFeatured") === "true";
    const colorsRaw = (formData.get("colors") as string) || "";
    const stock = parseInt(formData.get("stock") as string, 10) || 0;

    const images = parseImageUrls(rawImages);
    const colors = colorsRaw
      .split(/[\n,]/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    await saveProduct({
      id: productId,
      name,
      description,
      price,
      categoryId,
      stock,
      images: images.length > 0 ? images : ["/images/product-sofa.jpg"],
      colors: colors.length > 0 ? colors : ["Standard Finish"],
      isFeatured,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/stock");
    revalidatePath("/products");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_PRODUCT_ERROR]", error);
    return { error: error.message || "Failed to update product" };
  }
}

export async function deleteProduct(productId: string) {
  try {
    await storeDeleteProduct(productId);
    revalidatePath("/admin");
    revalidatePath("/admin/stock");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to delete product" };
  }
}

export async function toggleProductStock(variantOrProductId: string, currentStock: number) {
  try {
    const newStock = currentStock > 0 ? 0 : 5;
    await quickUpdateProductStock(variantOrProductId, newStock);

    revalidatePath("/admin");
    revalidatePath("/admin/stock");
    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to toggle stock" };
  }
}
