/**
 * ==============================================================================
 * Evolution API -> Supabase webhook (lean ingest)
 * Route: POST /api/webhooks/whatsapp
 * ==============================================================================
 * 1. Authenticates via `x-webhook-secret` (fails closed if WEBHOOK_SECRET unset).
 * 2. Drops everything that is not a real text-bearing 1:1 message.
 * 3. Stores ONLY the extracted text (no raw Baileys payload) to keep the DB small.
 * 4. Runs AI qualification after the response is sent (`after()`), so Evolution
 *    never times out and retries.
 * ==============================================================================
 */

import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';
import { analyzeLeadMessage } from '@/lib/ai/lead-analyzer';

export const maxDuration = 30;

const EXPECTED_SECRET = process.env.WEBHOOK_SECRET || '';
const IGNORE_GROUPS = process.env.IGNORE_GROUPS !== 'false';
const MAX_CONTENT_CHARS = 2000;

// Staff replies are only worth an AI call when they look like payment/layby talk
const STAFF_PAYMENT_HINT = /received|payment|paid|ecocash|innbucks|mukuru|deposit|confirm|layby|balance|\$\s?\d|usd\s?\d/i;
// Customer messages with no information (acks, emoji-only) are not worth an AI call
const LOW_SIGNAL = /^(?:hi+|hello+|hey+|ok(?:ay)?|k|thanks?|thank you|thx|sharp|mhoro|ndatenda|👍|🙏|[\s!.,?])*$/i;

type Extracted = { text: string; messageType: string } | null;

/**
 * Pulls plain text out of a Baileys message. Returns null for message kinds that
 * carry no useful information (stickers, reactions, protocol/system messages).
 */
function extractMessageContent(rawMessage: any): Extracted {
  if (!rawMessage) return null;

  // Unwrap disappearing-message / view-once wrappers
  const m =
    rawMessage.ephemeralMessage?.message ||
    rawMessage.viewOnceMessage?.message ||
    rawMessage.viewOnceMessageV2?.message ||
    rawMessage.documentWithCaptionMessage?.message ||
    rawMessage;

  const clip = (s: string) => s.trim().slice(0, MAX_CONTENT_CHARS);

  if (typeof m.conversation === 'string' && m.conversation.trim()) {
    return { text: clip(m.conversation), messageType: 'text' };
  }
  if (m.extendedTextMessage?.text) {
    return { text: clip(m.extendedTextMessage.text), messageType: 'text' };
  }
  if (m.buttonsResponseMessage?.selectedDisplayText) {
    return { text: clip(m.buttonsResponseMessage.selectedDisplayText), messageType: 'text' };
  }
  if (m.listResponseMessage?.title) {
    return { text: clip(m.listResponseMessage.title), messageType: 'text' };
  }
  if (m.imageMessage) {
    return { text: clip(m.imageMessage.caption || '[Image]'), messageType: 'image' };
  }
  if (m.videoMessage) {
    return { text: clip(m.videoMessage.caption || '[Video]'), messageType: 'video' };
  }
  if (m.documentMessage) {
    return {
      text: clip(m.documentMessage.caption || `[Document: ${m.documentMessage.fileName || 'file'}]`),
      messageType: 'document',
    };
  }
  if (m.audioMessage) {
    return { text: '[Voice note]', messageType: 'audio' };
  }

  // stickers, reactions, protocol messages, key distribution, polls, etc.
  return null;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate (fail closed)
    if (!EXPECTED_SECRET) {
      console.error('[Webhook Auth] WEBHOOK_SECRET is not configured; rejecting request.');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }
    const secretHeader =
      req.headers.get('x-webhook-secret') ||
      req.headers.get('apikey') ||
      req.nextUrl.searchParams.get('secret');

    if (secretHeader !== EXPECTED_SECRET) {
      console.warn('[Webhook Auth] Unauthorized webhook attempt rejected.');
      return NextResponse.json({ error: 'Unauthorized webhook signature' }, { status: 401 });
    }

    const payload = await req.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const event = String(payload.event || payload.type || '').toLowerCase().replace(/_/g, '.');

    // 2. Connection updates: acknowledge only (the admin UI polls live state)
    if (event === 'connection.update') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // 3. Only message upserts matter
    if (event !== 'messages.upsert') {
      return NextResponse.json({ received: true, ignored_event: event }, { status: 200 });
    }

    const rawData = payload.data;
    const messageItem = Array.isArray(rawData?.messages)
      ? rawData.messages[0]
      : Array.isArray(rawData)
      ? rawData[0]
      : rawData;

    if (!messageItem) {
      return NextResponse.json({ received: true, note: 'Empty message payload' }, { status: 200 });
    }

    const key = messageItem.key || {};
    const rawRemoteJid: string = key.remoteJid || '';
    const remoteJidAlt: string = key.remoteJidAlt || key.participantAlt || '';
    const fromMe: boolean = Boolean(key.fromMe);
    const pushName: string = fromMe ? '' : messageItem.pushName || '';

    if (!rawRemoteJid) {
      return NextResponse.json({ received: true, filtered: 'no_jid' }, { status: 200 });
    }

    // Ignore Group Chats (@g.us) and Status Broadcasts (status@broadcast)
    if (IGNORE_GROUPS && (rawRemoteJid.endsWith('@g.us') || rawRemoteJid.includes('@broadcast'))) {
      return NextResponse.json({ received: true, filtered: 'group_or_status_message' }, { status: 200 });
    }

    const extracted = extractMessageContent(messageItem.message);
    if (!extracted || !extracted.text) {
      return NextResponse.json({ received: true, filtered: 'no_content' }, { status: 200 });
    }
    const { text: contentText, messageType } = extracted;

    const evolutionMessageId: string =
      key.id || `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // In Baileys v6 / multi-device, an @lid remoteJid carries the real number in remoteJidAlt
    const effectiveJid =
      rawRemoteJid.endsWith('@lid') && remoteJidAlt.includes('@s.whatsapp.net')
        ? remoteJidAlt
        : rawRemoteJid;
    const phoneNumber = (remoteJidAlt ? remoteJidAlt.split('@')[0] : rawRemoteJid.split('@')[0]).replace(/\D/g, '');

    // 4. Upsert contact (returns what the AI step needs, so no re-read later)
    const { data: contact, error: contactError } = await supabaseAdmin
      .from('wa_contacts')
      .upsert(
        {
          remote_jid: effectiveJid,
          phone_number: phoneNumber || 'unknown',
          push_name: pushName || undefined,
          last_message_at: new Date().toISOString(),
        },
        { onConflict: 'remote_jid' }
      )
      .select('id, push_name, phone_number, lead_status, lead_score, extracted_metadata')
      .single();

    if (contactError || !contact) {
      console.error('[Database Error] Failed to upsert contact:', contactError);
      return NextResponse.json({ error: 'Failed to record contact' }, { status: 500 });
    }

    // 5. Insert message; duplicates (Evolution retries) are silently ignored
    const { data: messageRecord, error: messageError } = await supabaseAdmin
      .from('wa_messages')
      .upsert(
        {
          evolution_message_id: evolutionMessageId,
          contact_id: contact.id,
          from_me: fromMe,
          message_type: messageType,
          content: contentText,
          ai_processed: false,
        },
        { onConflict: 'evolution_message_id', ignoreDuplicates: true }
      )
      .select('id')
      .maybeSingle();

    if (messageError) {
      console.error('[Database Error] Failed to insert message:', messageError);
      return NextResponse.json({ error: 'Failed to record message' }, { status: 500 });
    }
    if (!messageRecord) {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    // 6. Decide whether this message deserves an AI call
    const isPlaceholder = contentText.startsWith('[');
    const shouldAnalyze = fromMe
      ? STAFF_PAYMENT_HINT.test(contentText)
      : !isPlaceholder && !LOW_SIGNAL.test(contentText);

    if (shouldAnalyze) {
      const messageId = messageRecord.id;
      after(async () => {
        try {
          await analyzeLeadMessage({
            contact,
            messageId,
            messageText: contentText,
            fromMe,
          });
        } catch (aiErr: any) {
          console.error('[AI Qualification Task Error]:', aiErr.message);
        }
      });
    }

    return NextResponse.json(
      { success: true, processingTimeMs: Date.now() - startTime, analyzing: shouldAnalyze },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[Webhook Fatal Exception]:', err);
    return NextResponse.json({ error: 'Internal server processing error' }, { status: 500 });
  }
}
