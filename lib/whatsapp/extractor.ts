import { getSupabaseAdmin } from "./parser";

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
 * - Payment promises & dates (e.g., "paying on Friday", "sending $100 via EcoCash")
 * - Showroom visit promises (e.g., "coming tomorrow at 2pm", "visiting showroom")
 * - Layby agreements & deposits
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

    // 2. Fetch catalog products for fuzzy matching
    const { data: products } = await supabase.from("products").select("id, name, base_price");
    const productList = products || [];

    for (const conv of convData as any[]) {
      const messages = (conv.messages || []).sort(
        (a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      if (messages.length === 0) continue;

      const customerText = messages
        .filter((m: any) => m.direction === "INBOUND")
        .map((m: any) => m.body)
        .join(" \n ");

      const allChatText = messages.map((m: any) => `${m.sender_type}: ${m.body}`).join("\n");
      const lowerText = customerText.toLowerCase();

      // Check if lead already exists
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id, interested_in, estimated_value, status")
        .eq("contact_id", conv.contact_id)
        .maybeSingle();

      // A. Match Furniture Products
      let matchedProduct = null;
      for (const prod of productList) {
        const prodWords = prod.name.toLowerCase().split(" ").filter((w: string) => w.length > 3);
        const matchCount = prodWords.filter((w: string) => lowerText.includes(w)).length;
        if (matchCount >= 2 || lowerText.includes(prod.name.toLowerCase())) {
          matchedProduct = prod;
          break;
        }
      }

      // Check generic furniture keywords if no exact product match
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
      const estimatedValue = matchedProduct ? matchedProduct.base_price : null;

      // Update or create lead with extracted product interest
      if (interestedIn) {
        const leadUpdate: any = {
          interested_in: interestedIn,
          updated_at: new Date().toISOString(),
        };
        if (estimatedValue) leadUpdate.estimated_value = estimatedValue;

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

      // B. Detect Payment Promises (e.g. "paying $...", "deposit on Friday", "transfer")
      const paymentPromiseRegex = /(?:pay|deposit|sending|transfer|send)\s*(?:\$|usd)?\s*(\d{2,4})/i;
      const paymentMatch = customerText.match(paymentPromiseRegex);

      if (paymentMatch) {
        const amount = parseFloat(paymentMatch[1]);
        // Dedupe check
        const { data: existingPromise } = await supabase
          .from("promises")
          .select("id")
          .eq("contact_id", conv.contact_id)
          .eq("promised_amount", amount)
          .maybeSingle();

        if (!existingPromise) {
          // Estimate promised date (e.g. 3 days from now)
          const targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + 3);

          await supabase.from("promises").insert({
            contact_id: conv.contact_id,
            promise_type: "PAYMENT",
            promised_amount: amount,
            promised_date: targetDate.toISOString().split("T")[0],
            notes: `Extracted from chat: "${paymentMatch[0]}"`,
            confidence: 0.9,
            needs_review: true, // Needs review flag so client verifies
            status: "PENDING",
          });
          result.promisesExtracted++;
        }
      }

      // C. Detect Showroom Visit Promises (e.g. "coming tomorrow", "visiting showroom", "coming at")
      if (lowerText.includes("coming tomorrow") || lowerText.includes("visiting") || lowerText.includes("come to the shop") || lowerText.includes("see you on")) {
        const visitDate = new Date();
        visitDate.setDate(visitDate.getDate() + 1);

        const { data: existingVisit } = await supabase
          .from("promises")
          .select("id")
          .eq("contact_id", conv.contact_id)
          .eq("promise_type", "VISIT")
          .eq("status", "PENDING")
          .maybeSingle();

        if (!existingVisit) {
          await supabase.from("promises").insert({
            contact_id: conv.contact_id,
            promise_type: "VISIT",
            promised_date: visitDate.toISOString().split("T")[0],
            notes: "Customer mentioned visiting the showroom in chat.",
            confidence: 0.85,
            needs_review: true,
            status: "PENDING",
          });
          result.promisesExtracted++;
        }
      }

      // D. Detect Layby Interest / Down payment
      if (lowerText.includes("layby") || lowerText.includes("lay-by") || lowerText.includes("installments")) {
        if (existingLead && existingLead.status !== "LAYBY") {
          await supabase.from("leads").update({ status: "LAYBY" }).eq("id", existingLead.id);
        }
      }
    }

    return result;
  } catch (err: any) {
    result.errors.push(`Extractor exception: ${err.message}`);
    return result;
  }
}
