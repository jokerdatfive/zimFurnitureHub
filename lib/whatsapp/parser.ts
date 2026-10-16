import { createClient } from "@supabase/supabase-js";

// Helper to get service role client or fallback
export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export interface ParseResult {
  contactsUpserted: number;
  messagesInserted: number;
  leadsCreated: number;
  errors: string[];
}

export async function parseWhatsAppEvent(rawEventId: string, payload: any): Promise<ParseResult> {
  const supabase = getSupabaseAdmin();
  const result: ParseResult = {
    contactsUpserted: 0,
    messagesInserted: 0,
    leadsCreated: 0,
    errors: [],
  };

  try {
    if (!payload || !payload.entry || !Array.isArray(payload.entry)) {
      // Mark as processed if it's an empty ping
      await supabase
        .from("whatsapp_raw_events")
        .update({ processed: true, error: "Empty or unrecognized payload structure" })
        .eq("id", rawEventId);
      return result;
    }

    for (const entry of payload.entry) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const val = change.value;
        if (!val) continue;

        // 1. Process Contacts
        const contactsMap = new Map<string, string>(); // wa_id/bsuid -> contact db uuid
        if (val.contacts && Array.isArray(val.contacts)) {
          for (const contact of val.contacts) {
            const waId = contact.wa_id || contact.phone || null;
            const bsuid = contact.bsuid || null;
            const profileName = contact.profile?.name || "WhatsApp Customer";

            if (!waId && !bsuid) continue;

            // Check if contact already exists
            let existingContact = null;
            if (waId) {
              const { data } = await supabase
                .from("whatsapp_contacts")
                .select("id, profile_name")
                .eq("wa_id", waId)
                .maybeSingle();
              existingContact = data;
            } else if (bsuid) {
              const { data } = await supabase
                .from("whatsapp_contacts")
                .select("id, profile_name")
                .eq("bsuid", bsuid)
                .maybeSingle();
              existingContact = data;
            }

            let contactId: string;
            if (existingContact) {
              contactId = existingContact.id;
              // update profile name if changed
              if (profileName && profileName !== existingContact.profile_name) {
                await supabase
                  .from("whatsapp_contacts")
                  .update({ profile_name: profileName, updated_at: new Date().toISOString() })
                  .eq("id", contactId);
              }
            } else {
              const { data: newContact, error: cErr } = await supabase
                .from("whatsapp_contacts")
                .insert({
                  wa_id: waId,
                  bsuid: bsuid,
                  phone: waId ? `+${waId.replace(/^\+/, '')}` : null,
                  profile_name: profileName,
                })
                .select("id")
                .single();

              if (cErr) {
                result.errors.push(`Error inserting contact ${waId}: ${cErr.message}`);
                continue;
              }
              contactId = newContact.id;
              result.contactsUpserted++;

              // Auto-create initial Lead
              const { error: lErr } = await supabase.from("leads").insert({
                contact_id: contactId,
                name: profileName,
                phone: waId ? `+${waId.replace(/^\+/, '')}` : null,
                status: "NEW",
                notes: "Auto-captured from inbound WhatsApp message.",
              });
              if (!lErr) result.leadsCreated++;
            }

            if (waId) contactsMap.set(waId, contactId);
            if (bsuid) contactsMap.set(bsuid, contactId);
          }
        }

        // 2. Process Inbound Messages (val.messages)
        if (val.messages && Array.isArray(val.messages)) {
          for (const msg of val.messages) {
            const senderWaId: string = msg.from || "";
            if (!senderWaId) continue;
            let contactId = contactsMap.get(senderWaId);

            if (!contactId) {
              // Lookup or create contact on the fly
              const { data: existing } = await supabase
                .from("whatsapp_contacts")
                .select("id")
                .eq("wa_id", senderWaId)
                .maybeSingle();

              if (existing) {
                contactId = existing.id;
              } else {
                const { data: created } = await supabase
                  .from("whatsapp_contacts")
                  .insert({
                    wa_id: senderWaId,
                    phone: `+${senderWaId.replace(/^\+/, '')}`,
                    profile_name: "Customer " + senderWaId.slice(-4),
                  })
                  .select("id")
                  .single();

                if (created && created.id) {
                  const newContactId: string = created.id;
                  contactId = newContactId;
                  contactsMap.set(senderWaId, newContactId);
                  result.contactsUpserted++;

                  await supabase.from("leads").insert({
                    contact_id: newContactId,
                    name: "Customer " + senderWaId.slice(-4),
                    phone: `+${senderWaId.replace(/^\+/, '')}`,
                    status: "NEW",
                  });
                  result.leadsCreated++;
                }
              }
            }

            if (!contactId) continue;

            // Get or create conversation thread
            let { data: conv } = await supabase
              .from("whatsapp_conversations")
              .select("id, unread_count")
              .eq("contact_id", contactId)
              .maybeSingle();

            if (!conv) {
              const { data: newConv } = await supabase
                .from("whatsapp_conversations")
                .insert({
                  contact_id: contactId,
                  last_message_at: new Date(Number(msg.timestamp) * 1000).toISOString(),
                  unread_count: 1,
                  status: "ACTIVE",
                })
                .select("id, unread_count")
                .single();
              conv = newConv;
            }

            // Extract message body text
            let bodyText = "";
            let mediaUrl = null;
            if (msg.type === "text") {
              bodyText = msg.text?.body || "";
            } else if (msg.type === "image") {
              bodyText = msg.image?.caption || "[Image]";
              mediaUrl = msg.image?.id || msg.image?.link || null;
            } else if (msg.type === "audio") {
              bodyText = "[Voice Note / Audio]";
            } else if (msg.type === "document") {
              bodyText = `[Document: ${msg.document?.filename || 'File'}]`;
            } else if (msg.type === "interactive") {
              bodyText = msg.interactive?.button_reply?.title || msg.interactive?.list_reply?.title || "[Interactive Reply]";
            } else {
              bodyText = `[${msg.type || "Message"}]`;
            }

            // Insert deduplicated message
            const { error: msgErr } = await supabase.from("whatsapp_messages").upsert(
              {
                conversation_id: conv?.id,
                contact_id: contactId,
                wam_id: msg.id,
                direction: "INBOUND",
                sender_type: "CUSTOMER",
                message_type: msg.type || "text",
                body: bodyText,
                media_url: mediaUrl,
                raw_data: msg,
                timestamp: new Date(Number(msg.timestamp) * 1000).toISOString(),
              },
              { onConflict: "wam_id" }
            );

            if (!msgErr) {
              result.messagesInserted++;
              if (conv?.id) {
                await supabase
                  .from("whatsapp_conversations")
                  .update({
                    last_message_at: new Date(Number(msg.timestamp) * 1000).toISOString(),
                    last_message_preview: bodyText.slice(0, 100),
                    unread_count: (conv.unread_count || 0) + 1,
                  })
                  .eq("id", conv.id);
              }
            } else {
              result.errors.push(`Error inserting message ${msg.id}: ${msgErr.message}`);
            }
          }
        }

        // 3. Process Outbound Echoes (Coexistence: smb_message_echoes or messages from business app/AI)
        const echoes = val.smb_message_echoes || val.echoes || [];
        if (Array.isArray(echoes)) {
          for (const echo of echoes) {
            const recipientWaId = echo.to || echo.recipient_id;
            let contactId = recipientWaId ? contactsMap.get(recipientWaId) : null;

            if (!contactId && recipientWaId) {
              const { data: existing } = await supabase
                .from("whatsapp_contacts")
                .select("id")
                .eq("wa_id", recipientWaId)
                .maybeSingle();
              if (existing) contactId = existing.id;
            }

            if (!contactId) continue;

            const { data: conv } = await supabase
              .from("whatsapp_conversations")
              .select("id")
              .eq("contact_id", contactId)
              .maybeSingle();

            const bodyText = echo.text?.body || (echo.type === "image" ? echo.image?.caption || "[Image]" : `[${echo.type || "Message"}]`);
            const senderType = echo.is_ai ? "BUSINESS_AI" : "BUSINESS_APP";

            await supabase.from("whatsapp_messages").upsert(
              {
                conversation_id: conv?.id,
                contact_id: contactId,
                wam_id: echo.id,
                direction: "OUTBOUND",
                sender_type: senderType,
                message_type: echo.type || "text",
                body: bodyText,
                raw_data: echo,
                timestamp: echo.timestamp ? new Date(Number(echo.timestamp) * 1000).toISOString() : new Date().toISOString(),
              },
              { onConflict: "wam_id" }
            );

            result.messagesInserted++;
          }
        }
      }
    }

    // Mark raw event as processed
    await supabase
      .from("whatsapp_raw_events")
      .update({
        processed: true,
        error: result.errors.length > 0 ? result.errors.join("; ") : null,
      })
      .eq("id", rawEventId);

    return result;
  } catch (err: any) {
    result.errors.push(err.message);
    await supabase
      .from("whatsapp_raw_events")
      .update({
        processed: false,
        error: `Exception in parser: ${err.message}`,
      })
      .eq("id", rawEventId);
    return result;
  }
}
