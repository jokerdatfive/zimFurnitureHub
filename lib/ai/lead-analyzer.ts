/**
 * ==============================================================================
 * Module 4: Retail AI Lead & Order Qualification Engine (Vercel AI SDK + Zod)
 * KK Furnitures / ZimFurnitureHub
 * ==============================================================================
 * Analyzes WhatsApp inbound conversations with full context, scores lead potential (0-100),
 * accurately detects Laybys, Pending Orders, EcoCash payment promises, and delivery inquiries,
 * and seamlessly synchronizes records without inventing fake prices or fake budgets.
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
  is_lead: z.boolean().describe('True if the user is inquiring about furniture, purchasing, layby, or showroom catalog. False if casual chat, wrong number, or unrelated.'),
  lead_status: z.enum([
    'NEW',
    'QUALIFIED_LEAD',
    'HOT_LEAD',
    'SUPPORT',
    'SPAM',
    'IRRELEVANT',
  ]).describe(
    'HOT_LEAD: ready to purchase furniture or high urgency; QUALIFIED_LEAD: matches product with clear inquiry; SUPPORT: existing customer needing delivery/assembly assistance; SPAM: marketing/automated spam; IRRELEVANT: casual talk, greeting without inquiry, wrong number.'
  ),
  lead_score: z.number().min(0).max(100).describe('Qualification score from 0 (spam/irrelevant/casual) to 100 (ready to buy immediately)'),
  intent: z.enum([
    'pricing_inquiry',
    'ready_to_buy',
    'layby_request',
    'order_placement',
    'payment_promise',
    'booking_request',
    'customer_support',
    'general_greeting',
    'casual_conversation',
    'spam',
  ]).describe('Primary objective or intent of the user in this interaction'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).describe('Urgency level based on explicit timelines or tone'),
  summary: z.string().describe('Concise, 1-2 sentence executive summary of the lead, their furniture need, and background context'),
  
  // Specific retail intelligence
  is_layby: z.boolean().describe('True if customer explicitly inquired about or requested a layby / installment plan / down-payment'),
  is_pending_order: z.boolean().describe('True if customer placed an order or requested delivery for a specific product'),
  is_payment_promise: z.boolean().describe('True if customer promised to make a payment or visit showroom by a specific date'),
  
  extracted_data: z.object({
    budget: z.string().nullable().describe('STRICT: ONLY record if the customer explicitly stated a budget (e.g. "my budget is $200" or "I have $300 max"). If not explicitly mentioned by the customer, MUST BE NULL. Never guess or fabricate a budget.'),
    product_or_service: z.string().nullable().describe('Specific furniture piece inquired about (e.g. 3pc Washed Oak Modular Kitchen Suite, L-shape velvet sofa, 6-door wardrobe), or null if none mentioned'),
    timeline: z.string().nullable().describe('Expected delivery/collection timeline, or null'),
    payment_method: z.enum(['EcoCash', 'USD_Cash', 'Bank_Transfer', 'Layby', 'In_Store', 'Not_Specified']).describe('Payment method mentioned or preferred'),
    agreed_price: z.number().nullable().describe('STRICT: ONLY record if a specific price was quoted and agreed upon in the chat. Do not invent a price if not stated. Otherwise null.'),
    deposit_amount: z.number().nullable().describe('Deposit or down-payment offered in USD, or null'),
    promised_payment_date: z.string().nullable().describe('Date customer promised to pay or visit, or null'),
    delivery_location: z.string().nullable().describe('Delivery address or city (e.g. "Harare", "Avondale", "Chitungwiza", "Bulawayo"), or null'),
    action_required: z.string().describe('Exact immediate action required by KK Furnitures sales rep'),
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
 * Heuristic retail analyzer with strict checks against fake prices and casual chat
 */
function heuristicRetailAnalysis(text: string, previousHistory: string): z.infer<typeof LeadAnalysisSchema> {
  const lower = (text + ' ' + previousHistory).toLowerCase();

  // 1. Detect if this is just casual talk / greetings with no furniture buying intent
  const hasFurnitureKeyword = /kitchen|sofa|couch|wardrobe|bed|dining|furniture|table|chair|suite|dresser|mattress|headboard|oak|wood|catalog|price|cost|how\s*much|stock/i.test(lower);
  const isPureGreeting = /^(hi|hello|hey|mhoro|maswera|good\s*(morning|afternoon|evening)|how\s*are\s*you|ok|sharp)[!.,\s]*$/i.test(text.trim());

  if (!hasFurnitureKeyword && (isPureGreeting || lower.length < 30)) {
    return {
      is_lead: false,
      lead_status: 'IRRELEVANT',
      lead_score: 10,
      intent: 'general_greeting',
      urgency: 'LOW',
      summary: 'Casual greeting or non-commercial message with no furniture inquiry.',
      is_layby: false,
      is_pending_order: false,
      is_payment_promise: false,
      extracted_data: {
        budget: null,
        product_or_service: null,
        timeline: null,
        payment_method: 'Not_Specified',
        agreed_price: null,
        deposit_amount: null,
        promised_payment_date: null,
        delivery_location: null,
        action_required: 'Send standard showroom greeting and product catalog.',
      },
    };
  }

  const isLayby = /layby|lay-by|installment|deposit|down\s*payment|month.*pay|pay.*later/i.test(lower);
  const isOrder = /order|deliver|buy|take\s*it|purchase|send\s*to|bring\s*it/i.test(lower);
  const isPromise = /will\s*pay|promis|visit\s*on|coming\s*on|tomorrow|friday|monday|next\s*week|pay\s*by/i.test(lower);
  const isEcoCash = /ecocash|eco\s*cash/i.test(lower);
  const isCash = /cash|usd\s*cash|hard\s*currency/i.test(lower);

  // STRICT budget extraction: only if customer explicitly says "budget is $X" or "have $X"
  const budgetMatch = lower.match(/(?:budget\s*(?:is|of)?|have|got)\s*(?:\$|usd)?\s*(\d{2,4})/i);
  const explicitBudget = budgetMatch ? `$${budgetMatch[1]}` : null;

  // Deposit extraction for layby
  const depositMatch = lower.match(/(?:deposit|down\s*payment|initial)\s*(?:of)?\s*(?:\$|usd)?\s*(\d{2,4})/i);
  const explicitDeposit = depositMatch ? parseFloat(depositMatch[1]) : null;

  // Extract furniture type
  let product = null;
  if (/kitchen|washed\s*oak/i.test(lower)) product = 'Kombera 3pc Washed Oak Modular Kitchen Suite';
  else if (/sofa|couch|l-shape|sectional/i.test(lower)) product = 'Kombera L-Shape Sectional Couch';
  else if (/wardrobe|closet/i.test(lower)) product = 'Kombera Executive Wardrobe';
  else if (/bed|headboard/i.test(lower)) product = 'Kombera Designer Bed Suite';
  else if (/dining/i.test(lower)) product = 'Kombera Dining Table Suite';

  let status: 'NEW' | 'QUALIFIED_LEAD' | 'HOT_LEAD' | 'SUPPORT' | 'SPAM' | 'IRRELEVANT' = 'QUALIFIED_LEAD';
  let score = 65;

  if (isOrder || (isLayby && explicitDeposit)) {
    status = 'HOT_LEAD';
    score = 90;
  } else if (!hasFurnitureKeyword) {
    status = 'IRRELEVANT';
    score = 20;
  }

  let paymentMethod: 'EcoCash' | 'USD_Cash' | 'Bank_Transfer' | 'Layby' | 'In_Store' | 'Not_Specified' = 'Not_Specified';
  if (isEcoCash) paymentMethod = 'EcoCash';
  else if (isCash) paymentMethod = 'USD_Cash';
  else if (isLayby) paymentMethod = 'Layby';

  return {
    is_lead: hasFurnitureKeyword,
    lead_status: status,
    lead_score: score,
    intent: isLayby ? 'layby_request' : isOrder ? 'order_placement' : isPromise ? 'payment_promise' : 'pricing_inquiry',
    urgency: isOrder ? 'HIGH' : isLayby ? 'MEDIUM' : 'LOW',
    summary: hasFurnitureKeyword
      ? `Customer inquired about ${product || 'furniture piece'} (${paymentMethod !== 'Not_Specified' ? paymentMethod : 'inquiry'}).`
      : 'Casual conversation; no commercial furniture inquiry detected.',
    is_layby: isLayby,
    is_pending_order: isOrder,
    is_payment_promise: isPromise,
    extracted_data: {
      budget: explicitBudget,
      product_or_service: product,
      timeline: isOrder ? 'Immediate / Soon' : null,
      payment_method: paymentMethod,
      agreed_price: null, // DO NOT fabricate fake agreed prices
      deposit_amount: explicitDeposit,
      promised_payment_date: isPromise ? 'Customer promised follow-up' : null,
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

    // 2. Formulate Prompt
    const systemPrompt = `You are an elite AI Sales Qualification Specialist and Lead Scoring Engine for KK Furnitures (ZimFurnitureHub, Zimbabwe).
Your job is to analyze WhatsApp conversations in real-time, determine the customer's intent, calculate a lead qualification score (0-100), extract BANT criteria, detect Layby inquiries/orders, EcoCash/cash payment promises, and pending orders.

CRITICAL ACCURACY & NO-FAKE-DATA RULES:
1. DO NOT PUT FAKE BUDGETS OR FAKE PRICES:
   - Only set 'budget' if the customer EXPLICITLY stated how much they have or their budget limit (e.g., "I only have $200" or "my budget is $300").
   - If the customer just asks "how much is this?", budget MUST BE NULL. Never guess a budget.
   - 'agreed_price' must ONLY be set if a price was explicitly quoted and accepted by both sides. Otherwise MUST BE NULL.
2. DO NOT TREAT CASUAL CHAT AS LEADS:
   - If the message is just a friendly greeting ("hi", "morning", "how are you"), a wrong number, or casual talking that has NOTHING to do with buying or inquiring about furniture, set is_lead: false, lead_status: 'IRRELEVANT', intent: 'casual_conversation', lead_score: 10.
   - Only classify as QUALIFIED_LEAD or HOT_LEAD if the person is actually inquiring about furniture or looking to buy.`;

    const userPrompt = `Analyze the following WhatsApp conversation context:

CURRENT NEW MESSAGE:
"${currentMessageText}"

RECENT CONVERSATION HISTORY (chronological):
${transcript || '(No prior history - this is the first message)'}

Output the structured qualification analysis.`;

    if (model) {
      try {
        const result = await generateObject({
          model,
          schema: LeadAnalysisSchema,
          system: systemPrompt,
          prompt: userPrompt,
          temperature: 0.1,
        });

        analysis = result.object;
      } catch (genErr: any) {
        console.warn('[AI Engine] Model generation failed (' + genErr.message + '). Falling back to built-in retail heuristic classifier.');
        analysis = heuristicRetailAnalysis(currentMessageText, transcript);
      }
    } else {
      console.warn('[AI Engine] GOOGLE_GENERATIVE_AI_API_KEY not set. Using built-in retail heuristic classifier.');
      analysis = heuristicRetailAnalysis(currentMessageText, transcript);
    }

    console.log(`[AI Engine] Qualification completed for contact ${contactId}:`, {
      is_lead: analysis.is_lead,
      status: analysis.lead_status,
      score: analysis.lead_score,
      intent: analysis.intent,
      budget: analysis.extracted_data.budget,
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
      budget: analysis.extracted_data.budget || null, // Never fall back to fake budgets
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

    // 5. Automatic Retail Bridge to Layby Agreements:
    // Only if it's a Layby Request with an actual product and agreed amount:
    if (analysis.is_layby && analysis.extracted_data.product_or_service && analysis.extracted_data.agreed_price) {
      try {
        const productName = analysis.extracted_data.product_or_service;
        const totalPrice = analysis.extracted_data.agreed_price;
        const depositPaid = analysis.extracted_data.deposit_amount || 0.0;
        const balanceDue = Math.max(0, totalPrice - depositPaid);

        await supabaseAdmin.from('layby_agreements').insert({
          contact_id: contactId,
          product_name: productName,
          total_price: totalPrice,
          deposit_paid: depositPaid,
          balance_due: balanceDue,
          status: 'ACTIVE',
          notes: `Captured via WhatsApp AI: ${analysis.summary}`,
        });
      } catch (laybyErr) {
        console.warn('[AI Engine] Note: Could not auto-insert layby agreement:', laybyErr);
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
