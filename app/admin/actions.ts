"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

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

/**
 * Creates a URL-friendly slug
 */
function createSlug(name: string): string {
  const base = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
  return `${base}-${Date.now().toString(36).slice(-4)}`;
}

export async function addProduct(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string) || 0;
  const categoryId = formData.get("categoryId") as string;
  const rawImages = (formData.get("images") as string) || (formData.get("imageUrl") as string) || "";
  const isFeatured = formData.get("isFeatured") === "on" || formData.get("isFeatured") === "true";
  const colorsRaw = (formData.get("colors") as string) || "";
  const initialStock = parseInt(formData.get("stock") as string, 10) || 10;

  const slug = createSlug(name);
  const images = parseImageUrls(rawImages);
  const primaryImage = images[0] || "/images/product-sofa.jpg";

  try {
    // 1. Insert Product
    const { data: product, error: pError } = await supabase
      .from("products")
      .insert({
        name,
        slug,
        description,
        base_price: price,
        category_id: categoryId || null,
        is_featured: isFeatured,
      })
      .select()
      .single();

    if (pError) throw pError;

    // 2. Insert Multiple Product Images into product_images
    if (images.length > 0) {
      const imageRecords = images.map((url, index) => ({
        product_id: product.id,
        url: url,
        display_order: index,
      }));

      await supabase.from("product_images").insert(imageRecords);
    } else {
      await supabase.from("product_images").insert({
        product_id: product.id,
        url: primaryImage,
        display_order: 0,
      });
    }

    // 3. Insert Product Variants (Colors / Finishes)
    const colorList = colorsRaw
      .split(/[\n,]/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (colorList.length > 0) {
      const variantRecords = colorList.map((colorName, idx) => ({
        product_id: product.id,
        sku: `${product.slug.toUpperCase().slice(0, 8)}-${idx + 1}`,
        name: colorName,
        price: price,
        stock_quantity: initialStock,
        image_url: images[idx] || primaryImage,
      }));

      await supabase.from("product_variants").insert(variantRecords);
    } else {
      // Default single variant
      await supabase.from("product_variants").insert({
        product_id: product.id,
        sku: `${product.slug.toUpperCase().slice(0, 10)}-STD`,
        name: "Standard",
        price: price,
        stock_quantity: initialStock,
        image_url: primaryImage,
      });
    }

    revalidatePath("/admin");
    revalidatePath("/admin/stock");
    revalidatePath("/products");
    revalidatePath("/");

    return { success: true, productId: product.id };
  } catch (error: any) {
    console.error("[ADD_PRODUCT_ERROR]", error);
    return { error: error.message };
  }
}

export async function updateProduct(formData: FormData) {
  const supabase = await createClient();

  const productId = formData.get("id") as string;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string) || 0;
  const categoryId = formData.get("categoryId") as string;
  const rawImages = (formData.get("images") as string) || "";
  const isFeatured = formData.get("isFeatured") === "on" || formData.get("isFeatured") === "true";
  const colorsRaw = (formData.get("colors") as string) || "";
  const stock = parseInt(formData.get("stock") as string, 10);

  const images = parseImageUrls(rawImages);
  const primaryImage = images[0] || "/images/product-sofa.jpg";

  try {
    // 1. Update Core Product Details
    const { error: pError } = await supabase
      .from("products")
      .update({
        name,
        description,
        base_price: price,
        category_id: categoryId || null,
        is_featured: isFeatured,
      })
      .eq("id", productId);

    if (pError) throw pError;

    // 2. Synchronize Product Images
    // Remove existing image records and insert updated ordered list
    await supabase.from("product_images").delete().eq("product_id", productId);

    if (images.length > 0) {
      const imageRecords = images.map((url, index) => ({
        product_id: productId,
        url: url,
        display_order: index,
      }));
      await supabase.from("product_images").insert(imageRecords);
    } else {
      await supabase.from("product_images").insert({
        product_id: productId,
        url: primaryImage,
        display_order: 0,
      });
    }

    // 3. Update or Sync Variants
    const colorList = colorsRaw
      .split(/[\n,]/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (colorList.length > 0) {
      // Clear old variants and write updated color list
      await supabase.from("product_variants").delete().eq("product_id", productId);

      const variantRecords = colorList.map((colorName, idx) => ({
        product_id: productId,
        sku: `${productId.slice(0, 6).toUpperCase()}-COL-${idx + 1}`,
        name: colorName,
        price: price,
        stock_quantity: isNaN(stock) ? 5 : stock,
        image_url: images[idx] || primaryImage,
      }));

      await supabase.from("product_variants").insert(variantRecords);
    } else {
      // Update existing variant price, image, and stock
      const { data: existingVariants } = await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", productId)
        .limit(1);

      if (existingVariants && existingVariants.length > 0) {
        await supabase
          .from("product_variants")
          .update({
            price: price,
            image_url: primaryImage,
            ...(isNaN(stock) ? {} : { stock_quantity: stock }),
          })
          .eq("id", existingVariants[0].id);
      } else {
        await supabase.from("product_variants").insert({
          product_id: productId,
          sku: `${productId.slice(0, 6).toUpperCase()}-STD`,
          name: "Standard",
          price: price,
          stock_quantity: isNaN(stock) ? 10 : stock,
          image_url: primaryImage,
        });
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/stock");
    revalidatePath("/products");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_PRODUCT_ERROR]", error);
    return { error: error.message };
  }
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/stock");
  revalidatePath("/products");
  revalidatePath("/");
  return { success: true };
}

export async function toggleProductStock(variantId: string, currentStock: number) {
  const supabase = await createClient();
  const newStock = currentStock > 0 ? 0 : 5;

  const { error } = await supabase
    .from("product_variants")
    .update({ stock_quantity: newStock })
    .eq("id", variantId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/stock");
  revalidatePath("/products");
  return { success: true };
}
