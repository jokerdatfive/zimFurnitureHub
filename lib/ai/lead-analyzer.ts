/**
 * ==============================================================================
 * AI Lead & Order Qualification Engine (Vercel AI SDK + Zod, Gemini by default)
 * KK Furnitures / ZimFurnitureHub
 * ==============================================================================
 * Analyzes a WhatsApp conversation, scores the lead (0-100), and PROPOSES
 * database actions (confirmed payment, layby, promise, order) as rows in
 * `ai_suggestions`. Money/stock records are never changed without admin approval.
 * ==============================================================================
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { supabaseAdmin } from '../db/supabase-admin';
import type { AILeadAnalysisResult, ExtractedMetadata, LeadStatus, UrgencyLevel } from '../db/types';

const HISTORY_MESSAGES = 8;
const HISTORY_CHARS_PER_MESSAGE = 300;

export const LeadAnalysisSchema = z.object({
  is_lead: z.boolean().describe('True if the user is inquiring about furniture, purchasing, layby, or showroom catalog. False if casual chat, wrong number, or unrelated.'),
  lead_status: z.enum(['NEW', 'QUALIFIED_LEAD', 'HOT_LEAD', 'SUPPORT', 'SPAM', 'IRRELEVANT']).describe(
    'HOT_LEAD: ready to purchase furniture or high urgency; QUALIFIED_LEAD: matches product with clear inquiry; SUPPORT: existing customer needing delivery/assembly assistance; SPAM: marketing/automated spam; IRRELEVANT: casual talk, greeting without inquiry, wrong number.'
  ),
  lead_score: z.number().min(0).max(100).describe('Qualification score from 0 (spam/irrelevant/casual) to 100 (ready to buy immediately)'),
  intent: z.enum([
    'pricing_inquiry',
    'ready_to_buy',
    'layby_request',
    'order_placement',
    'payment_promise',
    'payment_confirmation',
    'booking_request',
    'customer_support',
    'general_greeting',
    'casual_conversation',
    'spam',
  ]).describe('Primary objective or intent of the user in this interaction'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).describe('Urgency level based on explicit timelines or tone'),
  summary: z.string().describe('Concise, 1-2 sentence executive summary of the lead, their furniture need, and background context'),

  is_layby: z.boolean().describe('True if customer explicitly inquired about or requested a layby / installment plan / down-payment'),
  is_pending_order: z.boolean().describe('True if customer placed an order or requested delivery for a specific product'),
  is_payment_promise: z.boolean().describe('True if customer promised to make a payment or visit showroom by a specific date'),

  payment_confirmation: z.object({
    confirmed: z.boolean().describe('True ONLY if the conversation shows a payment actually made/received: the customer states they have already paid/sent money with an amount or reference, or the KK rep says payment was received. A promise to pay later is NOT a confirmation.'),
    amount: z.number().nullable().describe('USD amount actually paid, only if explicitly stated; otherwise null'),
    method: z.enum(['EcoCash', 'InnBucks', 'Mukuru', 'USD_Cash', 'Bank_Transfer', 'Other', 'Unknown']).describe('How the payment was made'),
    reference: z.string().nullable().describe('Transaction/reference number if quoted in the chat, else null'),
  }),

  extracted_data: z.object({
    budget: z.string().nullable().describe('STRICT: ONLY if the customer explicitly stated a budget (e.g. "my budget is $200"). Otherwise MUST BE NULL. Never guess.'),
    product_or_service: z.string().nullable().describe('Specific furniture piece inquired about, or null if none mentioned'),
    timeline: z.string().nullable().describe('Expected delivery/collection timeline, or null'),
    payment_method: z.enum(['EcoCash', 'USD_Cash', 'Bank_Transfer', 'Layby', 'In_Store', 'Not_Specified']).describe('Payment method mentioned or preferred'),
    agreed_price: z.number().nullable().describe('STRICT: ONLY if a specific price was quoted and agreed in the chat. Otherwise null.'),
    deposit_amount: z.number().nullable().describe('Deposit or down-payment offered in USD, or null'),
    promised_payment_date: z.string().nullable().describe('ISO date YYYY-MM-DD the customer promised to pay or visit (resolve words like "Friday" using today\'s date given in the prompt), or null'),
    delivery_location: z.string().nullable().describe('Delivery address or city, or null'),
    action_required: z.string().describe('Exact immediate action required by KK Furnitures sales rep'),
  }),
});

type Analysis = z.infer<typeof LeadAnalysisSchema>;

export interface AnalyzeInput {
  contact: {
    id: string;
    push_name: string | null;
    phone_number: string;
    lead_status: LeadStatus;
    lead_score: number;
    extracted_metadata: ExtractedMetadata | null;
  };
  messageId: string;
  messageText: string;
  fromMe: boolean;
}

/**
 * Returns the configured AI model, or null when no key is configured.
 */
function getAIModel() {
  const provider = (process.env.AI_PROVIDER || 'google').toLowerCase();

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return openai('gpt-4o-mini');
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (apiKey) {
    return google(process.env.GEMINI_MODEL || 'gemini-2.5-flash');
  }

  return null;
}

/**
 * Keyword fallback used when the model is unavailable. Deliberately conservative:
 * it never fabricates prices, budgets, or payment confirmations.
 */
function heuristicRetailAnalysis(text: string, previousHistory: string): Analysis {
  const lower = (text + ' ' + previousHistory).toLowerCase();

  const hasFurnitureKeyword = /kitchen|sofa|couch|wardrobe|bed|dining|furniture|table|chair|suite|dresser|mattress|headboard|oak|wood|catalog|price|cost|how\s*much|stock/i.test(lower);
  const isPureGreeting = /^(hi|hello|hey|mhoro|maswera|good\s*(morning|afternoon|evening)|how\s*are\s*you|ok|sharp)[!.,\s]*$/i.test(text.trim());

  const noPayment = { confirmed: false, amount: null, method: 'Unknown' as const, reference: null };

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
      payment_confirmation: noPayment,
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

  const budgetMatch = lower.match(/(?:budget\s*(?:is|of)?|have|got)\s*(?:\$|usd)?\s*(\d{2,4})/i);
  const explicitBudget = budgetMatch ? `$${budgetMatch[1]}` : null;

  const depositMatch = lower.match(/(?:deposit|down\s*payment|initial)\s*(?:of)?\s*(?:\$|usd)?\s*(\d{2,4})/i);
  const explicitDeposit = depositMatch ? parseFloat(depositMatch[1]) : null;

  let product: string | null = null;
  if (/kitchen|washed\s*oak/i.test(lower)) product = 'Kombera 3pc Washed Oak Modular Kitchen Suite';
  else if (/sofa|couch|l-shape|sectional/i.test(lower)) product = 'Kombera L-Shape Sectional Couch';
  else if (/wardrobe|closet/i.test(lower)) product = 'Kombera Executive Wardrobe';
  else if (/bed|headboard/i.test(lower)) product = 'Kombera Designer Bed Suite';
  else if (/dining/i.test(lower)) product = 'Kombera Dining Table Suite';

  let status: LeadStatus = 'QUALIFIED_LEAD';
  let score = 65;

  if (isOrder || (isLayby && explicitDeposit)) {
    status = 'HOT_LEAD';
    score = 90;
  } else if (!hasFurnitureKeyword) {
    status = 'IRRELEVANT';
    score = 20;
  }

  let paymentMethod: Analysis['extracted_data']['payment_method'] = 'Not_Specified';
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
    is_payment_promise: false, // dates cannot be resolved reliably without the model
    payment_confirmation: noPayment,
    extracted_data: {
      budget: explicitBudget,
      product_or_service: product,
      timeline: isOrder ? 'Immediate / Soon' : null,
      payment_method: paymentMethod,
      agreed_price: null,
      deposit_amount: explicitDeposit,
      promised_payment_date: null,
      delivery_location: /harare|avondale|borrowdale|chitungwiza|bulawayo/i.exec(lower)?.[0] || null,
      action_required: isLayby
        ? `Send layby agreement terms and payment details for ${product || 'furniture'}.`
        : `Confirm stock availability and pricing for ${product || 'inquired item'}.`,
    },
  };
}

async function getConversationContext(contactId: string, contactName: string | null) {
  const { data: messages } = await supabaseAdmin
    .from('wa_messages')
    .select('from_me, content, message_type')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_MESSAGES);

  return (messages || [])
    .reverse()
    .map((msg) => {
      const sender = msg.from_me ? 'KK FURNITURES REP' : contactName || 'CUSTOMER';
      const body = (msg.content || `(${msg.message_type} attachment)`).slice(0, HISTORY_CHARS_PER_MESSAGE);
      return `[${sender}]: ${body}`;
    })
    .join('\n');
}

const SYSTEM_PROMPT = `You are the AI Sales Assistant for KK Furnitures (ZimFurnitureHub, Zimbabwe). You read WhatsApp conversations between customers and the KK rep, score the lead (0-100), and flag business events the admin should record.

CRITICAL ACCURACY RULES:
1. NEVER invent budgets, prices, or amounts.
   - 'budget' only if the customer explicitly states what they have/can spend. "How much is this?" is NOT a budget.
   - 'agreed_price' only if a price was quoted AND accepted.
2. Casual chat, greetings, wrong numbers: is_lead=false, lead_status IRRELEVANT, intent casual_conversation, score 10.
3. PAYMENT CONFIRMATION: set payment_confirmation.confirmed=true ONLY when money has actually moved, e.g. the customer says "I have sent $50 on EcoCash, ref MP123" or the KK rep says "Payment of $50 received". "I will pay tomorrow" is a promise (is_payment_promise), not a confirmation. If the amount is not stated, confirmed may be true but amount must be null.
4. Messages from the KK REP are context: use them to confirm prices, receipts and agreements.
5. Dates: output ISO YYYY-MM-DD, resolved against today's date.`;

/**
 * Runs AI qualification for one WhatsApp message, updates the contact, and
 * records any proposed actions in `ai_suggestions`.
 */
export async function analyzeLeadMessage(input: AnalyzeInput): Promise<AILeadAnalysisResult | null> {
  const { contact, messageId, messageText, fromMe } = input;

  try {
    const transcript = await getConversationContext(contact.id, contact.push_name);
    const model = getAIModel();
    let analysis: Analysis;

    if (model) {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const result = await generateObject({
          model,
          schema: LeadAnalysisSchema,
          system: SYSTEM_PROMPT,
          prompt: `Today's date: ${today}

NEWEST MESSAGE (from ${fromMe ? 'the KK rep' : 'the customer'}):
"${messageText.slice(0, 1000)}"

RECENT CONVERSATION (chronological, newest last):
${transcript || '(no prior history)'}

Output the structured analysis.`,
          temperature: 0.1,
        });
        analysis = result.object;
      } catch (genErr: any) {
        console.warn('[AI Engine] Model failed (' + genErr.message + '). Using heuristic classifier.');
        analysis = heuristicRetailAnalysis(messageText, transcript);
      }
    } else {
      console.warn('[AI Engine] No AI key configured. Using heuristic classifier.');
      analysis = heuristicRetailAnalysis(messageText, transcript);
    }

    // 1. Mark the message processed
    await supabaseAdmin
      .from('wa_messages')
      .update({ ai_processed: true, intent: analysis.intent, urgency: analysis.urgency as UrgencyLevel })
      .eq('id', messageId);

    // 2. Update the contact. A harmless later message ("ok thanks") must not wipe
    //    out an established lead, so only keep the old classification in that case.
    const previous = contact.extracted_metadata || ({} as ExtractedMetadata);
    const keepEstablished = !analysis.is_lead && contact.lead_score >= 40;
    const ed = analysis.extracted_data;

    const mergedMetadata: ExtractedMetadata = {
      ...previous,
      budget: ed.budget || previous.budget || null,
      product_interest: ed.product_or_service || previous.product_interest || null,
      timeline: ed.timeline || previous.timeline || null,
      payment_method: ed.payment_method !== 'Not_Specified' ? ed.payment_method : previous.payment_method || null,
      action_required: keepEstablished ? previous.action_required || null : ed.action_required || previous.action_required || null,
      urgency: keepEstablished ? previous.urgency || null : analysis.urgency,
      is_layby: analysis.is_layby || Boolean(previous.is_layby),
      is_pending_order: analysis.is_pending_order || Boolean(previous.is_pending_order),
      is_payment_promise: analysis.is_payment_promise || Boolean(previous.is_payment_promise),
      agreed_price: ed.agreed_price ?? previous.agreed_price ?? null,
      deposit_amount: ed.deposit_amount ?? previous.deposit_amount ?? null,
      delivery_location: ed.delivery_location || previous.delivery_location || null,
    };

    await supabaseAdmin
      .from('wa_contacts')
      .update({
        ...(keepEstablished
          ? {}
          : { lead_status: analysis.lead_status as LeadStatus, lead_score: analysis.lead_score, ai_summary: analysis.summary }),
        extracted_metadata: mergedMetadata,
      })
      .eq('id', contact.id);

    // 3. Propose actions for the admin to approve
    await recordSuggestions(contact.id, messageId, analysis, mergedMetadata);

    console.log(`[AI Engine] ${contact.id}: ${analysis.lead_status} ${analysis.lead_score} ${analysis.intent}`);
    return analysis as unknown as AILeadAnalysisResult;
  } catch (error: any) {
    console.error('[AI Engine] Failed to qualify lead message:', error);
    await supabaseAdmin.from('wa_messages').update({ ai_processed: true }).eq('id', messageId);
    return null;
  }
}

interface SuggestionDraft {
  kind: 'PAYMENT_CONFIRMED' | 'LAYBY_REQUEST' | 'PROMISE' | 'ORDER';
  title: string;
  detail: string;
  payload: Record<string, unknown>;
}

async function recordSuggestions(
  contactId: string,
  messageId: string,
  analysis: Analysis,
  metadata: ExtractedMetadata
) {
  const ed = analysis.extracted_data;
  const pay = analysis.payment_confirmation;
  const product = ed.product_or_service || metadata.product_interest || null;
  const drafts: SuggestionDraft[] = [];

  if (pay.confirmed) {
    drafts.push({
      kind: 'PAYMENT_CONFIRMED',
      title: pay.amount ? `Payment of $${pay.amount} confirmed in chat` : 'Payment confirmed in chat (amount not stated)',
      detail: analysis.summary,
      payload: { amount: pay.amount, method: pay.method, reference: pay.reference, product },
    });
  }

  if (analysis.is_layby && product && (ed.agreed_price || ed.deposit_amount)) {
    drafts.push({
      kind: 'LAYBY_REQUEST',
      title: `Layby request: ${product}`,
      detail: analysis.summary,
      payload: { product, total_price: ed.agreed_price, deposit: ed.deposit_amount, method: ed.payment_method },
    });
  }

  if (analysis.is_payment_promise && ed.promised_payment_date) {
    drafts.push({
      kind: 'PROMISE',
      title: `Customer promised to pay / visit on ${ed.promised_payment_date}`,
      detail: analysis.summary,
      payload: { date: ed.promised_payment_date, amount: ed.deposit_amount ?? ed.agreed_price, product },
    });
  }

  if (analysis.is_pending_order && product && !pay.confirmed) {
    drafts.push({
      kind: 'ORDER',
      title: `Order / delivery request: ${product}`,
      detail: ed.action_required,
      payload: { product, delivery_location: ed.delivery_location },
    });
  }

  for (const d of drafts) {
    // One open suggestion per contact+kind; newer info replaces the older proposal
    const { data: open } = await supabaseAdmin
      .from('ai_suggestions')
      .select('id, payload')
      .eq('contact_id', contactId)
      .eq('kind', d.kind)
      .eq('status', 'PENDING');

    // Payments are separate events: only merge when it is clearly the same one
    const existing = (open || []).find((o) => {
      if (d.kind !== 'PAYMENT_CONFIRMED') return true;
      const p = (o.payload || {}) as { amount?: number | null; reference?: string | null };
      const d2 = d.payload as { amount?: number | null; reference?: string | null };
      return (p.reference && p.reference === d2.reference) || (p.amount != null && p.amount === d2.amount);
    });

    if (existing) {
      await supabaseAdmin
        .from('ai_suggestions')
        .update({ title: d.title, detail: d.detail, payload: d.payload, source_message_id: messageId })
        .eq('id', existing.id);
    } else {
      await supabaseAdmin.from('ai_suggestions').insert({
        contact_id: contactId,
        source_message_id: messageId,
        ...d,
      });
    }
  }
}
