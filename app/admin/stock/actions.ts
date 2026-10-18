"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function logStockMovement(formData: FormData) {
  const supabase = await createClient();

  const productId = formData.get("productId") as string;
  const variantId = formData.get("variantId") as string;
  const movementType = formData.get("movementType") as string; // 'PURCHASE_RESTOCK' | 'SALE_DEDUCTION'
  const quantity = Math.abs(parseInt(formData.get("quantity") as string, 10) || 1);
  const unitCostRaw = formData.get("unitCost") as string;
  const unitCost = unitCostRaw ? parseFloat(unitCostRaw) : null;
  const supplier = (formData.get("supplier") as string) || "Internal Workshop / Supplier";
  const notes = (formData.get("notes") as string) || "";

  try {
    // 1. Fetch current variant to adjust stock
    let targetVariantId = variantId;

    if (!targetVariantId && productId) {
      const { data: variants } = await supabase
        .from("product_variants")
        .select("id, stock_quantity")
        .eq("product_id", productId)
        .limit(1);

      if (variants && variants.length > 0) {
        targetVariantId = variants[0].id;
      }
    }

    if (targetVariantId) {
      const { data: currentVariant } = await supabase
        .from("product_variants")
        .select("stock_quantity")
        .eq("id", targetVariantId)
        .single();

      const currentStock = currentVariant?.stock_quantity ?? 0;
      const newStock =
        movementType === "PURCHASE_RESTOCK"
          ? currentStock + quantity
          : Math.max(0, currentStock - quantity);

      await supabase
        .from("product_variants")
        .update({ stock_quantity: newStock })
        .eq("id", targetVariantId);
    }

    // 2. Record immutable movement in stock_movements
    await supabase.from("stock_movements").insert({
      product_id: productId,
      variant_id: targetVariantId || null,
      movement_type: movementType,
      quantity: movementType === "PURCHASE_RESTOCK" ? quantity : -quantity,
      unit_cost: unitCost,
      supplier: supplier,
      reference_notes: notes,
      logged_by: "Store Admin",
    });

    revalidatePath("/admin/stock");
    revalidatePath("/admin");
    revalidatePath("/products");

    return { success: true };
  } catch (error: any) {
    console.error("[LOG_STOCK_MOVEMENT_ERROR]", error);
    return { error: error.message };
  }
}

export async function quickUpdateStock(variantId: string, newStock: number) {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("product_variants")
      .update({ stock_quantity: Math.max(0, newStock) })
      .eq("id", variantId);

    if (error) throw error;

    revalidatePath("/admin/stock");
    revalidatePath("/admin");
    revalidatePath("/products");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
