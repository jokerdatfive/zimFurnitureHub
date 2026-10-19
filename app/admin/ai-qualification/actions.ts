"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/db/supabase-admin";
import { isAuthenticatedAdmin } from "@/lib/auth/admin-auth";
import { createLayby } from "@/lib/db/unified-store";
import { recordLaybyPayment } from "@/app/admin/layby/actions";
import type { AiSuggestion } from "@/lib/db/types";

type Result = { success: true } | { error: string };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Atomically claims a PENDING suggestion so a double click or two admins
 * cannot apply the same suggestion twice. Returns it with its contact.
 */
async function claim(id: string): Promise<AiSuggestion | null> {
  const { data } = await supabaseAdmin
    .from("ai_suggestions")
    .update({ status: "APPLIED", resolved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "PENDING")
    .select("*, contact:wa_contacts(push_name, phone_number)")
    .maybeSingle();
  return (data as AiSuggestion | null) ?? null;
}

async function release(id: string) {
  await supabaseAdmin.from("ai_suggestions").update({ status: "PENDING", resolved_at: null }).eq("id", id);
}

async function guarded(id: string, work: (s: AiSuggestion) => Promise<Result>): Promise<Result> {
  if (!(await isAuthenticatedAdmin())) return { error: "Not authorized" };
  const suggestion = await claim(id);
  if (!suggestion) return { error: "This suggestion was already handled." };

  try {
    const result = await work(suggestion);
    if ("error" in result) {
      await release(id);
      return result;
    }
    revalidatePath("/admin/ai-qualification");
    return result;
  } catch (err: any) {
    await release(id);
    return { error: err.message || "Action failed" };
  }
}

/** PAYMENT_CONFIRMED -> adds an installment to a chosen layby account */
export async function applyPaymentSuggestion(
  id: string,
  input: { laybyId: string; amount: number; method: string; reference?: string }
): Promise<Result> {
  if (!input.laybyId) return { error: "Choose which layby account this payment belongs to." };
  if (!(input.amount > 0)) return { error: "Enter the amount that was paid." };

  return guarded(id, async () => {
    const form = new FormData();
    form.set("laybyId", input.laybyId);
    form.set("amount", String(input.amount));
    form.set("paymentMethod", input.method || "EcoCash");
    form.set("reference", input.reference ? `WhatsApp: ${input.reference}` : "Confirmed in WhatsApp chat");
    const res = await recordLaybyPayment(form);
    return res.error ? { error: res.error } : { success: true };
  });
}

/** LAYBY_REQUEST -> opens a new layby account linked to the WhatsApp contact */
export async function applyLaybySuggestion(
  id: string,
  input: { customerName: string; productName: string; totalPrice: number; deposit: number; method: string }
): Promise<Result> {
  if (!input.productName.trim()) return { error: "Product name is required." };
  if (!(input.totalPrice > 0)) return { error: "Enter the agreed total price." };
  if (input.deposit < 0 || input.deposit > input.totalPrice) return { error: "Deposit must be between 0 and the total price." };

  return guarded(id, async (s) => {
    await createLayby({
      waContactId: s.contact_id,
      customerName: input.customerName || s.contact?.push_name || "WhatsApp Customer",
      customerPhone: s.contact?.phone_number ? `+${s.contact.phone_number}` : "",
      productName: input.productName.trim(),
      totalPrice: input.totalPrice,
      depositPaid: input.deposit,
      paymentMethod: input.method || "EcoCash",
      notes: "Created from an AI suggestion (WhatsApp chat).",
    });
    revalidatePath("/admin/layby");
    revalidatePath("/admin/whatsapp-analytics");
    return { success: true };
  });
}

/** PROMISE -> logs a customer commitment */
export async function applyPromiseSuggestion(
  id: string,
  input: { date: string; amount?: number | null; type: "PAYMENT" | "VISIT" | "CALL_BACK" }
): Promise<Result> {
  return guarded(id, async (s) => {
    const { error } = await supabaseAdmin.from("promises").insert({
      wa_contact_id: s.contact_id,
      promise_type: input.type,
      promised_amount: input.amount && input.amount > 0 ? input.amount : null,
      promised_date: ISO_DATE.test(input.date) ? input.date : null,
      notes: s.detail || s.title,
      status: "PENDING",
    });
    if (error) return { error: error.message };
    revalidatePath("/admin/promises");
    return { success: true };
  });
}

/** ORDER -> acknowledged by the admin (no automatic stock or money change) */
export async function acknowledgeOrderSuggestion(id: string): Promise<Result> {
  return guarded(id, async () => ({ success: true }));
}

export async function dismissSuggestion(id: string): Promise<Result> {
  if (!(await isAuthenticatedAdmin())) return { error: "Not authorized" };
  const { error } = await supabaseAdmin
    .from("ai_suggestions")
    .update({ status: "DISMISSED", resolved_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "PENDING");
  if (error) return { error: error.message };
  revalidatePath("/admin/ai-qualification");
  return { success: true };
}
