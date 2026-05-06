"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addProduct(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseFloat(formData.get("price") as string);
  const categoryId = formData.get("categoryId") as string;
  const imageUrl = formData.get("imageUrl") as string;
  const isFeatured = formData.get("isFeatured") === "on";

  // 1. Create a slug from the name
  const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

  try {
    // 2. Insert into products
    const { data: product, error: pError } = await supabase
      .from("products")
      .insert({
        name,
        slug,
        description,
        base_price: price,
        category_id: categoryId,
        is_featured: isFeatured,
      })
      .select()
      .single();

    if (pError) throw pError;

    // 3. Insert into product_variants (at least one default variant)
    const { error: vError } = await supabase
      .from("product_variants")
      .insert({
        product_id: product.id,
        name: "Standard",
        price_modifier: 0,
        stock_quantity: 10, // Default stock
        image_url: imageUrl || "/images/product-sofa.jpg",
      });

    if (vError) throw vError;

    revalidatePath("/products");
    revalidatePath("/");
    
    return { success: true };
  } catch (error: any) {
    console.error("[ADD_PRODUCT_ERROR]", error);
    return { error: error.message };
  }
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/products");
  return { success: true };
}
