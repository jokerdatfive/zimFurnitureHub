/**
 * ==============================================================================
 * Module 4: AI Lead Qualification Engine (Vercel AI SDK + Zod)
 * KK Furnitures / ZimFurnitureHub
 * ==============================================================================
 * Analyzes WhatsApp inbound conversations with full context (last 10 messages),
 * scores lead potential (0-100), extracts BANT metadata, and updates Supabase.
 * ==============================================================================
 */

import { generateObject } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { supabaseAdmin } from '../db/supabase-admin';
import type { AILeadAnalysisResult, LeadStatus, UrgencyLevel } from '../db/types';

// Strictly typed Zod schema for structured output validation
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
    'booking_request',
    'customer_support',
    'general_greeting',
    'spam',
  ]).describe('Primary objective or intent of the user in this interaction'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH']).describe('Urgency level based on explicit timelines or tone'),
  summary: z.string().describe('Concise, 1-2 sentence executive summary of the lead, their furniture need, and background context'),
  extracted_data: z.object({
    budget: z.string().nullable().describe('Budget stated or inferred (e.g. "$500" or "$2,000 cash/layby"), or null'),
    product_or_service: z.string().nullable().describe('Specific furniture piece inquired about (e.g., L-shape sofa, dining table, wardrobe, bed), or null'),
    timeline: z.string().nullable().describe('Expected implementation/delivery timeline (e.g. "immediately", "this weekend"), or null'),
    action_required: z.string().describe('Exact immediate action required by KK Furnitures sales rep (e.g. "Send pictures of 6-seater oak dining set and quote delivery to Harare")'),
  }),
});

/**
 * Returns the configured AI model based on environment variables
 */
function getAIModel() {
  const provider = (process.env.AI_PROVIDER || 'google').toLowerCase();

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return openai('gpt-4o-mini');
  }

  // Default to Google Gemini 1.5 Flash (Generous free tier)
  return google('gemini-1.5-flash');
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
    console.error('[AI Engine] Error fetching conversation history:', error);
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
    // 1. Fetch recent conversation history for rich context
    const recentMessages = await getConversationContext(contactId);

    // Format conversation transcript
    const transcript = recentMessages
      .map((msg) => {
        const sender = msg.from_me ? 'KK FURNITURES REP' : (contactPushName || 'PROSPECT');
        return `[${sender}]: ${msg.content || `(${msg.message_type} attachment)`}`;
      })
      .join('\n');

    // 2. Formulate Prompt
    const systemPrompt = `You are an elite AI Sales Qualification Specialist and Lead Scoring Engine for KK Furnitures (ZimFurnitureHub).
Your job is to analyze WhatsApp conversations in real-time, determine the customer's intent, calculate a lead qualification score (0-100), extract BANT criteria (Budget, Authority, Need, Timeline), and recommend immediate next steps.

Evaluation Rubric:
- HOT_LEAD (Score 80-100): High intent to purchase, asking for banking details, showroom address, delivery quotes, ready for immediate layby or cash order.
- QUALIFIED_LEAD (Score 55-79): Expressed concrete interest in specific furniture items (sofas, beds, dining sets, kitchen units), asking about colors, materials, dimensions, or payment plans.
- SUPPORT (Score 40-70): Existing customer asking about order status, delivery date, assembly instructions, or warranty.
- NEW / GENERAL GREETING (Score 20-50): First contact, polite greeting, asking what furniture is available.
- SPAM / IRRELEVANT (Score 0-15): Solicitations, broadcast spam, wrong numbers.

Be objective, concise, and highlight action items for KK Furnitures human sales reps.`;

    const userPrompt = `Analyze the following WhatsApp conversation context and score this prospect:

CURRENT NEW MESSAGE:
"${currentMessageText}"

RECENT CONVERSATION HISTORY (chronological):
${transcript || '(No prior history - this is the first message)'}

Output the structured qualification analysis.`;

    // 3. Call Vercel AI SDK generateObject
    const model = getAIModel();
    const { object: analysis } = await generateObject({
      model,
      schema: LeadAnalysisSchema,
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.2,
    });

    console.log(`[AI Engine] Qualification completed for contact ${contactId}:`, {
      status: analysis.lead_status,
      score: analysis.lead_score,
      intent: analysis.intent,
      urgency: analysis.urgency,
    });

    // 4. Update wa_messages with AI processing details
    await supabaseAdmin
      .from('wa_messages')
      .update({
        ai_processed: true,
        intent: analysis.intent,
        urgency: analysis.urgency as UrgencyLevel,
      })
      .eq('id', messageId);

    // 5. Update wa_contacts with new lead score, status, summary, and extracted metadata
    const { data: currentContact } = await supabaseAdmin
      .from('wa_contacts')
      .select('extracted_metadata')
      .eq('id', contactId)
      .single();

    const previousMetadata = currentContact?.extracted_metadata || {};
    const mergedMetadata = {
      ...previousMetadata,
      budget: analysis.extracted_data.budget || previousMetadata.budget || null,
      product_interest: analysis.extracted_data.product_or_service || previousMetadata.product_interest || null,
      timeline: analysis.extracted_data.timeline || previousMetadata.timeline || null,
      action_required: analysis.extracted_data.action_required || previousMetadata.action_required || null,
      urgency: analysis.urgency,
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
