"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createPromise(formData: FormData) {
  const supabase = await createClient();

  const contactId = formData.get("contactId") as string;
  const promiseType = formData.get("promiseType") as string;
  const promisedAmount = formData.get("promisedAmount") ? parseFloat(formData.get("promisedAmount") as string) : null;
  const promisedDate = formData.get("promisedDate") as string;
  const notes = formData.get("notes") as string;

  const { error } = await supabase.from("promises").insert({
    contact_id: contactId || null,
    promise_type: promiseType || "PAYMENT",
    promised_amount: promisedAmount,
    promised_date: promisedDate || null,
    notes,
    status: "PENDING",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/promises");
  return { success: true };
}

export async function updatePromiseStatus(promiseId: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("promises")
    .update({ status })
    .eq("id", promiseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/promises");
  return { success: true };
}
