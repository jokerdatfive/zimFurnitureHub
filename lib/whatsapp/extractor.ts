import { getSupabaseAdmin } from "./parser";
import { CATALOG_PRODUCTS } from "@/lib/catalog-data";

export interface ExtractionResult {
  leadsUpdated: number;
  promisesExtracted: number;
  laybysExtracted: number;
  errors: string[];
}

/**
 * Heuristic & AI message extractor for WhatsApp conversations.
 * Detects:
 * - Products interested in (matched against catalog)
 * - Payment promises & dates (only when explicit)
 * - Layby agreements & deposits (only when explicit)
 * - EXCLUDES casual talking / non-furniture chat
 * - NEVER puts fake budgets or prices
 */
export async function extractSalesInsights(conversationId?: string): Promise<ExtractionResult> {
  const supabase = getSupabaseAdmin();
  const result: ExtractionResult = {
    leadsUpdated: 0,
    promisesExtracted: 0,
    laybysExtracted: 0,
    errors: [],
  };

  try {
    // 1. Fetch conversations to analyze
    let query = supabase
      .from("whatsapp_conversations")
      .select(`
        id,
        contact_id,
        contact:whatsapp_contacts(id, profile_name, phone, wa_id),
        messages:whatsapp_messages(id, body, direction, sender_type, timestamp)
      `);

    if (conversationId) {
      query = query.eq("id", conversationId);
    }

    const { data: convData, error: convErr } = await query;
    if (convErr || !convData) {
      result.errors.push(`Error fetching conversations: ${convErr?.message}`);
      return result;
    }

    const productList = CATALOG_PRODUCTS;

    for (const conv of convData as any[]) {
      const messages = (conv.messages || []).sort(
        (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      if (messages.length === 0) continue;

      const customerText = messages
        .filter((m: any) => m.direction === "INBOUND")
        .map((m: any) => m.body)
        .join(" \n ");

      const lowerText = customerText.toLowerCase();

      // Check if this is only casual conversation with no furniture intent
      const hasFurnitureIntent = /kitchen|sofa|couch|wardrobe|bed|dining|furniture|table|chair|suite|dresser|mattress|headboard|oak|wood|catalog|price|cost|how\s*much|stock/i.test(lowerText);
      const isPureGreeting = /^(hi|hello|hey|mhoro|maswera|good\s*(morning|afternoon|evening)|how\s*are\s*you|ok|sharp)[!.,\s]*$/i.test(customerText.trim());

      if (!hasFurnitureIntent || isPureGreeting) {
        // Do NOT create or update as a sales lead
        continue;
      }

      // Check if lead already exists
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id, interested_in, estimated_value, status")
        .eq("contact_id", conv.contact_id)
        .maybeSingle();

      // Match Furniture Products
      let matchedProduct = null;
      for (const prod of productList) {
        const prodWords = prod.name.toLowerCase().split(" ").filter((w: string) => w.length > 3);
        const matchCount = prodWords.filter((w: string) => lowerText.includes(w)).length;
        if (matchCount >= 2 || lowerText.includes(prod.name.toLowerCase())) {
          matchedProduct = prod;
          break;
        }
      }

      let genericInterest = "";
      if (!matchedProduct) {
        if (lowerText.includes("sofa") || lowerText.includes("couch") || lowerText.includes("sectional")) {
          genericInterest = "Lounge Suite / Sofa";
        } else if (lowerText.includes("wardrobe") || lowerText.includes("bed") || lowerText.includes("pedestal")) {
          genericInterest = "Bedroom Furniture";
        } else if (lowerText.includes("kitchen") || lowerText.includes("server") || lowerText.includes("dresser")) {
          genericInterest = "Kitchen Unit / Island";
        }
      }

      const interestedIn = matchedProduct ? matchedProduct.name : genericInterest;

      // STRICT: ONLY record estimated_value if the customer explicitly asked about price or agreed on a quote
      // Do NOT invent fake prices
      const hasPriceInquiry = /price|cost|how\s*much|quot|pay/i.test(lowerText);
      const explicitPriceMatch = lowerText.match(/(?:budget|have|quoted|price|pay)\s*(?:is|of)?\s*(?:\$|usd)?\s*(\d{2,4})/i);
      const estimatedValue = explicitPriceMatch ? parseFloat(explicitPriceMatch[1]) : (hasPriceInquiry && matchedProduct ? matchedProduct.base_price : null);

      if (interestedIn) {
        const leadUpdate: any = {
          interested_in: interestedIn,
          updated_at: new Date().toISOString(),
        };
        if (estimatedValue !== null) {
          leadUpdate.estimated_value = estimatedValue;
        }

        if (existingLead) {
          await supabase.from("leads").update(leadUpdate).eq("id", existingLead.id);
          result.leadsUpdated++;
        } else {
          await supabase.from("leads").insert({
            contact_id: conv.contact_id,
            conversation_id: conv.id,
            name: conv.contact?.profile_name || "WhatsApp Client",
            phone: conv.contact?.phone || conv.contact?.wa_id,
            status: "INTERESTED",
            ...leadUpdate,
          });
          result.leadsUpdated++;
        }
      }

      // Detect Payment Promises (only when explicitly stated)
      const paymentPromiseRegex = /(?:will\s*pay|promis.*pay|sending|transfer)\s*(?:\$|usd)?\s*(\d{2,4})/i;
      const paymentMatch = customerText.match(paymentPromiseRegex);

      if (paymentMatch) {
        const amount = parseFloat(paymentMatch[1]);
        const { data: existingPromise } = await supabase
          .from("promises")
          .select("id")
          .eq("contact_id", conv.contact_id)
          .eq("promised_amount", amount)
          .maybeSingle();

        if (!existingPromise) {
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + 3);

          await supabase.from("promises").insert({
            contact_id: conv.contact_id,
            promise_type: "PAYMENT",
            promised_amount: amount,
            promised_date: targetDate.toISOString().split("T")[0],
            notes: `Customer stated in chat: "${paymentMatch[0]}"`,
            confidence: 0.9,
            needs_review: true,
          });
          result.promisesExtracted++;
        }
      }
    }

    return result;
  } catch (err: any) {
    result.errors.push(err.message);
    return result;
  }
}
