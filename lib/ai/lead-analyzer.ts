/**
 * ==============================================================================
 * Module 4: Retail AI Lead & Order Qualification Engine (Vercel AI SDK + Zod)
 * KK Furnitures / ZimFurnitureHub
 * ==============================================================================
 * Analyzes WhatsApp inbound conversations with full context, scores lead potential (0-100),
 * detects Laybys, Pending Orders, EcoCash payment promises, and delivery inquiries,
 * and seamlessly synchronizes records in Supabase (leads, layby_agreements, promises).
 * ==============================================================================
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { supabaseAdmin } from '../db/supabase-admin';
import type { AILeadAnalysisResult, LeadStatus, UrgencyLevel } from '../db/types';

// Enhanced Zod schema capturing deep retail context (Layby, Pending Orders, Promises)
export const LeadAnalysisSchema = z.object({
  is_lead: z.boolean().describe('Whether the user is an active prospect, customer, or lead (false if spam or irrelevant)'),
  lead_status: z.enum([
    'NEW',
    'QUALIFIED_LEAD',
    'HOT_LEAD',
    'SUPPORT',
    'SPAM',
    'IRRELEVANT',
  ]).describe(
    'HOT_LEAD: ready to purchase furniture or high urgency; QUALIFIED_LEAD: matches product with budget/interest; SUPPORT: existing customer needing delivery/assembly assistance; SPAM: marketing/automated spam; IRRELEVANT: wrong number or unrelated.'
  ),
  lead_score: z.number().min(0).max(100).describe('Qualification score from 0 (spam/irrelevant) to 100 (ready to buy immediately)'),
  intent: z.enum([
    'pricing_inquiry',
    'ready_to_buy',
    'layby_request',
    'order_placement',
    'payment_promise',
    'booking_request',
    'customer_support',
    'general_greeting',
    'spam',
  ]).describe('Primary objective or intent of the user in this interaction'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).describe('Urgency level based on explicit timelines or tone'),
  summary: z.string().describe('Concise, 1-2 sentence executive summary of the lead, their furniture need, and background context'),
  
  // Specific retail intelligence
  is_layby: z.boolean().describe('True if customer inquired about or requested a layby / installment plan / down-payment'),
  is_pending_order: z.boolean().describe('True if customer placed an order or requested delivery for a specific product'),
  is_payment_promise: z.boolean().describe('True if customer promised to make a payment or visit showroom by a specific date'),
  
  extracted_data: z.object({
    budget: z.string().nullable().describe('Budget stated or inferred (e.g. "$500" or "$250 cash/layby"), or null'),
    product_or_service: z.string().nullable().describe('Specific furniture piece inquired about (e.g. 3pc Washed Oak Modular Kitchen Suite, L-shape velvet sofa, 6-door wardrobe), or null'),
    timeline: z.string().nullable().describe('Expected delivery/collection timeline (e.g. "immediately", "this weekend", "end of month"), or null'),
    payment_method: z.enum(['EcoCash', 'USD_Cash', 'Bank_Transfer', 'Layby', 'In_Store', 'Not_Specified']).describe('Payment method mentioned or preferred'),
    agreed_price: z.number().nullable().describe('Quoted or agreed total price in USD, or null'),
    deposit_amount: z.number().nullable().describe('Deposit or down-payment offered in USD, or null'),
    promised_payment_date: z.string().nullable().describe('Date customer promised to pay or visit (e.g. "2026-10-20" or "Friday"), or null'),
    delivery_location: z.string().nullable().describe('Delivery address or city (e.g. "Harare", "Avondale", "Chitungwiza", "Bulawayo"), or null'),
    action_required: z.string().describe('Exact immediate action required by KK Furnitures sales rep (e.g. "Send EcoCash merchant code for $100 layby deposit for 3pc Washed Oak Kitchen Suite")'),
  }),
});

/**
 * Returns the configured AI model based on environment variables
 */
function getAIModel() {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    'AIzaSyCSIXG9Xb629IhVW_SA7fxFkhMYalQietQ';
  const provider = (process.env.AI_PROVIDER || 'google').toLowerCase();

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return openai('gpt-4o-mini');
  }

  if (apiKey) {
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
    return google(modelName);
  }

  return null;
}

/**
 * Fallback heuristic retail analyzer for offline / testing mode when Google API key is not yet set
 */
function heuristicRetailAnalysis(text: string, previousHistory: string): z.infer<typeof LeadAnalysisSchema> {
  const lower = (text + ' ' + previousHistory).toLowerCase();

  const isLayby = /layby|lay-by|installment|deposit|down\s*payment|month.*pay|pay.*later/i.test(lower);
  const isOrder = /order|deliver|buy|take\s*it|purchase|send\s*to|bring\s*it/i.test(lower);
  const isPromise = /will\s*pay|promis|visit\s*on|coming\s*on|tomorrow|friday|monday|next\s*week|pay\s*by/i.test(lower);
  const isEcoCash = /ecocash|eco\s*cash/i.test(lower);
  const isCash = /cash|usd\s*cash|hard\s*currency/i.test(lower);

  // Extract price/deposit match
  const dollarMatch = lower.match(/\$?\s*(\d+(\.\d{1,2})?)\s*(usd|\$)?/i);
  const extractedNumber = dollarMatch ? parseFloat(dollarMatch[1]) : null;

  // Extract furniture type
  let product = null;
  if (/kitchen|washed\s*oak/i.test(lower)) product = 'Kombera 3pc Washed Oak Modular Kitchen Suite';
  else if (/sofa|couch|l-shape|sectional/i.test(lower)) product = 'Kombera L-Shape Sectional Couch';
  else if (/wardrobe|closet/i.test(lower)) product = 'Kombera Executive Wardrobe';
  else if (/bed|headboard/i.test(lower)) product = 'Kombera Designer Bed Suite';
  else if (/dining/i.test(lower)) product = 'Kombera Dining Table Suite';

  let status: 'NEW' | 'QUALIFIED_LEAD' | 'HOT_LEAD' | 'SUPPORT' | 'SPAM' | 'IRRELEVANT' = 'QUALIFIED_LEAD';
  let score = 65;

  if (isOrder || (isLayby && extractedNumber)) {
    status = 'HOT_LEAD';
    score = 90;
  } else if (/hello|hi|good\s*morning|mhoro/i.test(lower) && lower.length < 25) {
    status = 'NEW';
    score = 35;
  }

  let paymentMethod: 'EcoCash' | 'USD_Cash' | 'Bank_Transfer' | 'Layby' | 'In_Store' | 'Not_Specified' = 'Not_Specified';
  if (isEcoCash) paymentMethod = 'EcoCash';
  else if (isCash) paymentMethod = 'USD_Cash';
  else if (isLayby) paymentMethod = 'Layby';

  return {
    is_lead: true,
    lead_status: status,
    lead_score: score,
    intent: isLayby ? 'layby_request' : isOrder ? 'order_placement' : isPromise ? 'payment_promise' : 'pricing_inquiry',
    urgency: isOrder ? 'HIGH' : isLayby ? 'MEDIUM' : 'LOW',
    summary: `Customer inquired about ${product || 'furniture'} with ${paymentMethod} interest.`,
    is_layby: isLayby,
    is_pending_order: isOrder,
    is_payment_promise: isPromise,
    extracted_data: {
      budget: extractedNumber ? `$${extractedNumber}` : null,
      product_or_service: product,
      timeline: isOrder ? 'Immediate / Soon' : 'Within 30 days',
      payment_method: paymentMethod,
      agreed_price: extractedNumber && !isLayby ? extractedNumber : null,
      deposit_amount: isLayby && extractedNumber ? extractedNumber : null,
      promised_payment_date: isPromise ? 'End of week' : null,
      delivery_location: /harare|avondale|borrowdale|chitungwiza|bulawayo/i.exec(lower)?.[0] || null,
      action_required: isLayby
        ? `Send layby agreement terms and EcoCash details for ${product || 'furniture'}.`
        : `Confirm stock availability and pricing for ${product || 'inquired item'}.`,
    },
  };
}

/**
 * Fetches the recent 10 messages from Supabase to provide conversational context
 */
async function getConversationContext(contactId: string) {
  const { data: messages, error } = await supabaseAdmin
    .from('wa_messages')
    .select('from_me, content, created_at, message_type')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !messages) {
    return [];
  }

  return messages.reverse();
}

/**
 * Executes AI qualification on an incoming WhatsApp message and updates the database
 */
export async function analyzeLeadMessage(
  contactId: string,
  messageId: string,
  currentMessageText: string,
  contactPushName?: string | null
): Promise<AILeadAnalysisResult | null> {
  try {
    // 1. Fetch recent conversation history
    const recentMessages = await getConversationContext(contactId);

    const transcript = recentMessages
      .map((msg) => {
        const sender = msg.from_me ? 'KK FURNITURES REP' : (contactPushName || 'PROSPECT');
        return `[${sender}]: ${msg.content || `(${msg.message_type} attachment)`}`;
      })
      .join('\n');

    let analysis: z.infer<typeof LeadAnalysisSchema>;
    const model = getAIModel();

    if (model) {
      // 2. Formulate Prompt for Gemini 1.5 Flash
      const systemPrompt = `You are an elite AI Sales Qualification Specialist and Lead Scoring Engine for KK Furnitures (ZimFurnitureHub, Zimbabwe).
Your job is to analyze WhatsApp conversations in real-time, determine the customer's intent, calculate a lead qualification score (0-100), extract BANT criteria (Budget, Authority, Need, Timeline), detect Layby inquiries/orders, EcoCash/cash payment promises, and pending orders.

Zimbabwean Retail Rules:
- Layby: Customer pays a deposit (e.g. $50, $100) and pays the remaining balance over 1-3 months before collection/delivery.
- Payment Methods: EcoCash (mobile money), Cash USD (in-person or cash-on-delivery), Bank Transfer.
- HOT_LEAD (Score 80-100): Customer explicitly wants to order, asked for layby deposit instructions, requested delivery to a specific Harare/Zimbabwe suburb, or agreed on a price.
- QUALIFIED_LEAD (Score 55-79): Concrete furniture inquiry (kitchen suite, sectional sofa, wardrobe, bed), asking about colors, wood finishes, or dimensions.
- SUPPORT (Score 40-70): Post-purchase delivery tracking, assembly help.
- NEW (Score 20-50): General greeting ("hi", "how much"), broad questions.
- SPAM (Score 0-15): Solicitations, broadcast spam, wrong number.`;

      const userPrompt = `Analyze the following WhatsApp conversation context:

CURRENT NEW MESSAGE:
"${currentMessageText}"

RECENT CONVERSATION HISTORY (chronological):
${transcript || '(No prior history - this is the first message)'}

Output the structured qualification analysis.`;

      const result = await generateObject({
        model,
        schema: LeadAnalysisSchema,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.1,
      });

      analysis = result.object;
    } else {
      console.warn('[AI Engine] GOOGLE_GENERATIVE_AI_API_KEY not set. Using built-in retail heuristic classifier.');
      analysis = heuristicRetailAnalysis(currentMessageText, transcript);
    }

    console.log(`[AI Engine] Qualification completed for contact ${contactId}:`, {
      status: analysis.lead_status,
      score: analysis.lead_score,
      intent: analysis.intent,
      is_layby: analysis.is_layby,
      is_pending_order: analysis.is_pending_order,
    });

    // 3. Update wa_messages with AI processing details
    await supabaseAdmin
      .from('wa_messages')
      .update({
        ai_processed: true,
        intent: analysis.intent,
        urgency: analysis.urgency as UrgencyLevel,
      })
      .eq('id', messageId);

    // 4. Update wa_contacts with new lead score, status, summary, and rich extracted metadata
    const { data: currentContact } = await supabaseAdmin
      .from('wa_contacts')
      .select('extracted_metadata, phone_number, push_name')
      .eq('id', contactId)
      .single();

    const previousMetadata = currentContact?.extracted_metadata || {};
    const mergedMetadata = {
      ...previousMetadata,
      budget: analysis.extracted_data.budget || previousMetadata.budget || null,
      product_interest: analysis.extracted_data.product_or_service || previousMetadata.product_interest || null,
      timeline: analysis.extracted_data.timeline || previousMetadata.timeline || null,
      payment_method: analysis.extracted_data.payment_method || previousMetadata.payment_method || null,
      action_required: analysis.extracted_data.action_required || previousMetadata.action_required || null,
      urgency: analysis.urgency,
      is_layby: analysis.is_layby,
      is_pending_order: analysis.is_pending_order,
      is_payment_promise: analysis.is_payment_promise,
      agreed_price: analysis.extracted_data.agreed_price || null,
      deposit_amount: analysis.extracted_data.deposit_amount || null,
      delivery_location: analysis.extracted_data.delivery_location || null,
    };

    await supabaseAdmin
      .from('wa_contacts')
      .update({
        lead_status: analysis.lead_status as LeadStatus,
        lead_score: analysis.lead_score,
        ai_summary: analysis.summary,
        extracted_metadata: mergedMetadata,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', contactId);

    // 5. Automatic Retail Bridge to Supabase Core CRM:
    // If it's a Layby Request with a product:
    if (analysis.is_layby && (analysis.extracted_data.product_or_service || analysis.extracted_data.deposit_amount)) {
      try {
        const productName = analysis.extracted_data.product_or_service || 'Custom Furniture Order';
        const totalPrice = analysis.extracted_data.agreed_price || 350.0;
        const depositPaid = analysis.extracted_data.deposit_amount || 0.0;
        const balanceDue = Math.max(0, totalPrice - depositPaid);

        await supabaseAdmin.from('layby_agreements').insert({
          contact_id: contactId,
          product_name: productName,
          total_price: totalPrice,
          deposit_paid: depositPaid,
          balance_due: balanceDue,
          status: 'ACTIVE',
          notes: `Auto-captured via WhatsApp AI: ${analysis.summary}`,
        });
      } catch (laybyErr) {
        console.warn('[AI Engine] Note: Could not auto-insert layby agreement (may already exist or schema unmigrated):', laybyErr);
      }
    }

    // If it's a Payment Promise:
    if (analysis.is_payment_promise && analysis.extracted_data.promised_payment_date) {
      try {
        await supabaseAdmin.from('promises').insert({
          contact_id: contactId,
          promise_type: 'PAYMENT',
          promised_amount: analysis.extracted_data.deposit_amount || analysis.extracted_data.agreed_price || null,
          status: 'PENDING',
          notes: `Promise captured via WhatsApp: ${analysis.extracted_data.action_required}`,
        });
      } catch (promiseErr) {
        console.warn('[AI Engine] Note: Could not auto-insert promise:', promiseErr);
      }
    }

    return analysis as AILeadAnalysisResult;
  } catch (error: any) {
    console.error('[AI Engine] Failed to qualify lead message:', error);
    await supabaseAdmin
      .from('wa_messages')
      .update({ ai_processed: true })
      .eq('id', messageId);

    return null;
  }
}
