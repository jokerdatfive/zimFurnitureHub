"use server";

import { supabaseAdmin } from "@/lib/db/supabase-admin";
import { isAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import { revalidatePath } from "next/cache";

export async function createPromise(formData: FormData) {
  if (!(await isAuthenticatedAdmin())) return { error: "Not authorized" };

  const contactId = formData.get("contactId") as string;
  const promiseType = formData.get("promiseType") as string;
  const promisedAmount = formData.get("promisedAmount") ? parseFloat(formData.get("promisedAmount") as string) : null;
  const promisedDate = formData.get("promisedDate") as string;
  const notes = formData.get("notes") as string;

  const { error } = await supabaseAdmin.from("promises").insert({
    wa_contact_id: contactId || null,
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
  if (!(await isAuthenticatedAdmin())) return { error: "Not authorized" };

  const { error } = await supabaseAdmin
    .from("promises")
    .update({ status })
    .eq("id", promiseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/promises");
  return { success: true };
}
