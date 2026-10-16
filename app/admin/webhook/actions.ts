"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function sendTestWebhookEvent() {
  const supabase = await createClient();

  // Create a realistic sample Meta WhatsApp Cloud API / Coexistence webhook payload
  const samplePayload = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "WHATSAPP_BUSINESS_ACCOUNT_ID",
        changes: [
          {
            value: {
              messaging_product: "whatsapp",
              metadata: {
                display_phone_number: "263770000000",
                phone_number_id: "PHONE_NUMBER_ID",
              },
              contacts: [
                {
                  profile: { name: "Tendai Mutasa" },
                  wa_id: "263772123456",
                },
              ],
              messages: [
                {
                  from: "263772123456",
                  id: "wamid.HBgLMjYzNzcyMTIzNDU2FQIAEhgg" + Math.random().toString(36).substring(2, 9),
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: {
                    body: "Hello, is the Kombera Kirsty Executive Black Leather 4-piece suite available on layby?",
                  },
                  type: "text",
                },
              ],
            },
            field: "messages",
          },
        ],
      },
    ],
  };

  // Direct insert to whatsapp_raw_events via server action
  const { data: rawEvent, error } = await supabase
    .from("whatsapp_raw_events")
    .insert({
      payload: samplePayload,
      processed: false,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  // Also trigger parser
  const { parseWhatsAppEvent } = await import("@/lib/whatsapp/parser");
  await parseWhatsAppEvent(rawEvent.id, samplePayload);

  revalidatePath("/admin/webhook");
  revalidatePath("/admin/messages");
  revalidatePath("/admin/leads");
  return { success: true, eventId: rawEvent.id };
}

export async function clearRawEvents() {
  const supabase = await createClient();
  await supabase.from("whatsapp_raw_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  revalidatePath("/admin/webhook");
  return { success: true };
}
