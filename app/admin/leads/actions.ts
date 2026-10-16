"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateLeadStatus(leadId: string, status: string, notes?: string) {
  const supabase = await createClient();

  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  const { error } = await supabase.from("leads").update(updateData).eq("id", leadId);

  if (error) {
    console.error("Error updating lead status:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/leads");
  return { success: true };
}

export async function markLeadReviewed(leadId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({ needs_review: false, updated_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/leads");
  return { success: true };
}

export async function triggerAiExtraction() {
  const { extractSalesInsights } = await import("@/lib/whatsapp/extractor");
  const result = await extractSalesInsights();
  revalidatePath("/admin/leads");
  revalidatePath("/admin/promises");
  revalidatePath("/admin/messages");
  return { success: true, ...result };
}

