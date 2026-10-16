"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createLaybyAgreement(formData: FormData) {
  const supabase = await createClient();

  const contactId = formData.get("contactId") as string;
  const productName = formData.get("productName") as string;
  const totalPrice = parseFloat(formData.get("totalPrice") as string);
  const depositPaid = parseFloat((formData.get("depositPaid") as string) || "0");
  const notes = formData.get("notes") as string;

  const balanceDue = Math.max(0, totalPrice - depositPaid);

  const { data: layby, error } = await supabase
    .from("layby_agreements")
    .insert({
      contact_id: contactId || null,
      product_name: productName,
      total_price: totalPrice,
      deposit_paid: depositPaid,
      balance_due: balanceDue,
      status: balanceDue === 0 ? "COMPLETED" : "ACTIVE",
      notes,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating layby:", error);
    return { error: error.message };
  }

  // If initial deposit made, record payment
  if (depositPaid > 0 && layby?.id) {
    await supabase.from("layby_payments").insert({
      layby_id: layby.id,
      amount: depositPaid,
      payment_method: (formData.get("paymentMethod") as string) || "EcoCash",
      reference: formData.get("reference") as string,
    });
  }

  revalidatePath("/admin/layby");
  return { success: true };
}

export async function recordLaybyPayment(formData: FormData) {
  const supabase = await createClient();

  const laybyId = formData.get("laybyId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const paymentMethod = (formData.get("paymentMethod") as string) || "EcoCash";
  const reference = formData.get("reference") as string;

  // 1. Insert payment record
  const { error: payErr } = await supabase.from("layby_payments").insert({
    layby_id: laybyId,
    amount,
    payment_method: paymentMethod,
    reference,
  });

  if (payErr) {
    return { error: payErr.message };
  }

  // 2. Fetch current balance
  const { data: layby } = await supabase
    .from("layby_agreements")
    .select("deposit_paid, balance_due, total_price")
    .eq("id", laybyId)
    .single();

  if (layby) {
    const newDeposit = Number(layby.deposit_paid || 0) + amount;
    const newBalance = Math.max(0, Number(layby.total_price) - newDeposit);
    const newStatus = newBalance === 0 ? "COMPLETED" : "ACTIVE";

    await supabase
      .from("layby_agreements")
      .update({
        deposit_paid: newDeposit,
        balance_due: newBalance,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", laybyId);
  }

  revalidatePath("/admin/layby");
  return { success: true };
}
