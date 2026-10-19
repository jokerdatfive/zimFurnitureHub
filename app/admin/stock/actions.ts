"use server";

import { revalidatePath } from "next/cache";
import { logStockMovement as storeLogStockMovement, quickUpdateProductStock } from "@/lib/db/unified-store";

export async function logStockMovement(formData: FormData) {
  try {
    const productId = formData.get("productId") as string;
    const movementType = (formData.get("movementType") as string) || "PURCHASE_RESTOCK";
    const quantity = Math.abs(parseInt(formData.get("quantity") as string, 10) || 1);
    const unitCostRaw = formData.get("unitCost") as string;
    const unitCost = unitCostRaw ? parseFloat(unitCostRaw) : null;
    const supplier = (formData.get("supplier") as string) || "Internal Workshop / Supplier";
    const notes = (formData.get("notes") as string) || "";

    await storeLogStockMovement({
      productId,
      movementType: movementType as 'PURCHASE_RESTOCK' | 'SALE_DEDUCTION',
      quantity,
      unitCost,
      supplier,
      notes,
      loggedBy: "Store Admin",
    });

    revalidatePath("/admin/stock");
    revalidatePath("/admin");
    revalidatePath("/admin/whatsapp-analytics");
    revalidatePath("/products");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    console.error("[LOG_STOCK_MOVEMENT_ERROR]", error);
    return { error: error.message || "Failed to log stock movement" };
  }
}

export async function quickUpdateStock(productId: string, newStock: number) {
  try {
    await quickUpdateProductStock(productId, newStock);

    revalidatePath("/admin/stock");
    revalidatePath("/admin");
    revalidatePath("/admin/whatsapp-analytics");
    revalidatePath("/products");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to update stock" };
  }
}
