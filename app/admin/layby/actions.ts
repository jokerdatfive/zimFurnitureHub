"use server";

import { revalidatePath } from "next/cache";
import { createLayby, recordLaybyInstallment, logStockMovement, getLaybys, getProducts } from "@/lib/db/unified-store";

export async function createLaybyAgreement(formData: FormData) {
  try {
    const contactId = formData.get("contactId") as string;
    const customerName = (formData.get("customerName") as string) || "Showroom Customer";
    const customerPhone = (formData.get("customerPhone") as string) || "";
    const productName = formData.get("productName") as string;
    const totalPrice = parseFloat(formData.get("totalPrice") as string) || 0;
    const depositPaid = parseFloat((formData.get("depositPaid") as string) || "0");
    const paymentMethod = (formData.get("paymentMethod") as string) || "EcoCash";
    const notes = (formData.get("notes") as string) || "";

    await createLayby({
      contactId,
      customerName,
      customerPhone,
      productName,
      totalPrice,
      depositPaid,
      paymentMethod,
      notes,
    });

    revalidatePath("/admin/layby");
    revalidatePath("/admin/whatsapp-analytics");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating layby:", error);
    return { error: error.message || "Failed to create layby agreement" };
  }
}

export async function recordLaybyPayment(formData: FormData) {
  try {
    const laybyId = formData.get("laybyId") as string;
    const amount = parseFloat(formData.get("amount") as string) || 0;
    const paymentMethod = (formData.get("paymentMethod") as string) || "EcoCash";
    const reference = (formData.get("reference") as string) || "";

    const updated = await recordLaybyInstallment({
      laybyId,
      amount,
      paymentMethod,
      reference,
    });

    // If balance reached 0, automatically log stock sale deduction if linked to a product
    if (updated && updated.balance_due === 0) {
      const products = await getProducts();
      const matched = products.find((p) => p.name.toLowerCase().includes(updated.product_name.toLowerCase()) || updated.product_name.toLowerCase().includes(p.name.toLowerCase()));
      if (matched) {
        await logStockMovement({
          productId: matched.id,
          movementType: "SALE_DEDUCTION",
          quantity: 1,
          supplier: "Layby Full Settlement Collection",
          notes: `Delivered to ${updated.customer_name}. Final settlement paid in full.`,
        });
      }
    }

    revalidatePath("/admin/layby");
    revalidatePath("/admin/stock");
    revalidatePath("/admin/whatsapp-analytics");
    return { success: true };
  } catch (error: any) {
    return { error: error.message || "Failed to record payment" };
  }
}
