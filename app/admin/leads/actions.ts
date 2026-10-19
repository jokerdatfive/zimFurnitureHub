"use server";

import { revalidatePath } from "next/cache";
import { updateLeadStatus as storeUpdateLeadStatus, createLayby, logStockMovement } from "@/lib/db/unified-store";

export async function updateLeadStatus(leadId: string, status: any, notes?: string) {
  try {
    await storeUpdateLeadStatus(leadId, status, notes);
    revalidatePath("/admin/leads");
    revalidatePath("/admin/whatsapp-analytics");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating lead status:", error);
    return { error: error.message };
  }
}

export async function convertLeadToLayby(formData: FormData) {
  try {
    const leadId = formData.get("leadId") as string;
    const customerName = formData.get("customerName") as string;
    const customerPhone = formData.get("customerPhone") as string;
    const productName = formData.get("productName") as string;
    const totalPrice = parseFloat(formData.get("totalPrice") as string) || 0;
    const depositPaid = parseFloat(formData.get("depositPaid") as string) || 0;
    const paymentMethod = (formData.get("paymentMethod") as string) || "EcoCash";

    await createLayby({
      customerName,
      customerPhone,
      productName,
      totalPrice,
      depositPaid,
      paymentMethod,
      notes: `Converted from sales lead (${leadId})`,
    });

    await storeUpdateLeadStatus(leadId, "LAYBY", `Converted to Layby Plan: $${depositPaid} deposit paid.`);

    revalidatePath("/admin/leads");
    revalidatePath("/admin/layby");
    revalidatePath("/admin/whatsapp-analytics");

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function convertLeadToSale(formData: FormData) {
  try {
    const leadId = formData.get("leadId") as string;
    const productId = formData.get("productId") as string;
    const customerName = formData.get("customerName") as string;
    const notes = formData.get("notes") as string;

    if (productId) {
      await logStockMovement({
        productId,
        movementType: "SALE_DEDUCTION",
        quantity: 1,
        supplier: "WhatsApp Client Fulfillment",
        notes: `Sold to ${customerName}: ${notes || "Completed sale"}`,
      });
    }

    await storeUpdateLeadStatus(leadId, "CONVERTED", `Sale completed: ${notes || "Delivered/Collected"}`);

    revalidatePath("/admin/leads");
    revalidatePath("/admin/stock");
    revalidatePath("/admin/whatsapp-analytics");

    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function triggerAiExtraction() {
  const { extractSalesInsights } = await import("@/lib/whatsapp/extractor");
  const result = await extractSalesInsights();
  revalidatePath("/admin/leads");
  revalidatePath("/admin/promises");
  revalidatePath("/admin/whatsapp-analytics");
  return { success: true, ...result };
}
