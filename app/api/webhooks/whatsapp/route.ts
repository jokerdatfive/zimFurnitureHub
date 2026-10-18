/**
 * ==============================================================================
 * Module 3: Non-Blocking WhatsApp Webhook Endpoint
 * Location: zimFurnitureHub/app/api/webhooks/whatsapp/route.ts
 * ==============================================================================
 * Route: POST /api/webhooks/whatsapp
 *
 * Designed for Vercel Free Tier's 10s execution limit:
 * 1. Authenticates webhook signature via `x-webhook-secret` header.
 * 2. Parses and filters WhatsApp events (ignores groups & status broadcasts).
 * 3. Immediately upserts the contact and persists the raw message to Supabase.
 * 4. Dispatches the AI Lead Qualification asynchronously via `after()` or detached promise.
 * 5. Returns 200 OK within < 150ms to prevent Evolution API timeout retries.
 * ==============================================================================
 */

import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';
import { analyzeLeadMessage } from '@/lib/ai/lead-analyzer';

const EXPECTED_SECRET = process.env.WEBHOOK_SECRET || '';
const IGNORE_GROUPS = process.env.IGNORE_GROUPS !== 'false';

/**
 * Extracts clean text content from various WhatsApp message payload formats
 */
function extractMessageContent(messageObj: any): { text: string; messageType: string } {
  if (!messageObj) return { text: '', messageType: 'empty' };

  if (typeof messageObj.conversation === 'string' && messageObj.conversation.trim()) {
    return { text: messageObj.conversation.trim(), messageType: 'text' };
  }

  if (messageObj.extendedTextMessage?.text) {
    return { text: messageObj.extendedTextMessage.text.trim(), messageType: 'text' };
  }

  if (messageObj.imageMessage) {
    return {
      text: messageObj.imageMessage.caption?.trim() || '[Image message with no caption]',
      messageType: 'image',
    };
  }

  if (messageObj.videoMessage) {
    return {
      text: messageObj.videoMessage.caption?.trim() || '[Video message with no caption]',
      messageType: 'video',
    };
  }

  if (messageObj.documentMessage) {
    return {
      text: messageObj.documentMessage.caption?.trim() || `[Document: ${messageObj.documentMessage.fileName || 'file'}]`,
      messageType: 'document',
    };
  }

  if (messageObj.audioMessage) {
    return { text: '[Audio voice note]', messageType: 'audio' };
  }

  if (messageObj.stickerMessage) {
    return { text: '[Sticker]', messageType: 'sticker' };
  }

  return { text: '[Unsupported message format]', messageType: 'unknown' };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate Request
    const secretHeader =
      req.headers.get('x-webhook-secret') ||
      req.headers.get('apikey') ||
      req.nextUrl.searchParams.get('secret');

    if (EXPECTED_SECRET && secretHeader !== EXPECTED_SECRET) {
      console.warn('[Webhook Auth] Unauthorized webhook attempt rejected.');
      return NextResponse.json({ error: 'Unauthorized webhook signature' }, { status: 401 });
    }

    const payload = await req.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const event = (payload.event || payload.type || '').toLowerCase();

    // 2. Handle Connection Update Event
    if (event === 'connection.update' || event === 'connection_update') {
      const state = payload.data?.state || payload.data?.status || 'unknown';
      console.log(`[Evolution Connection Update] Instance state: ${state}`);
      return NextResponse.json({ received: true, event: 'connection.update', state }, { status: 200 });
    }

    // 3. Filter for Message Upsert Events
    if (event !== 'messages.upsert' && event !== 'messages_upsert') {
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
    const evolutionMessageId: string = key.id || `gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const pushName: string = messageItem.pushName || '';

    // Ignore Group Chats (@g.us) and Status Broadcasts (status@broadcast)
    if (IGNORE_GROUPS) {
      if (rawRemoteJid.endsWith('@g.us') || rawRemoteJid.includes('@broadcast') || rawRemoteJid === 'status@broadcast') {
        return NextResponse.json({ received: true, filtered: 'group_or_status_message' }, { status: 200 });
      }
    }

    // In Baileys v6 / WhatsApp Multi-Device, if remoteJid ends with @lid, the actual phone number is in remoteJidAlt
    const effectiveJid = (rawRemoteJid.endsWith('@lid') && remoteJidAlt.includes('@s.whatsapp.net'))
      ? remoteJidAlt
      : rawRemoteJid;

    const phoneNumber = (remoteJidAlt ? remoteJidAlt.split('@')[0] : rawRemoteJid.split('@')[0]).replace(/\D/g, '');
    const { text: contentText, messageType } = extractMessageContent(messageItem.message);

    // 4. Atomic Upsert of Contact into Supabase
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
      .select('id, push_name, lead_status, lead_score')
      .single();

    if (contactError || !contact) {
      console.error('[Database Error] Failed to upsert contact:', contactError);
      return NextResponse.json({ error: 'Failed to record contact' }, { status: 500 });
    }

    // 5. Insert Message into Supabase
    const { data: messageRecord, error: messageError } = await supabaseAdmin
      .from('wa_messages')
      .upsert(
        {
          evolution_message_id: evolutionMessageId,
          contact_id: contact.id,
          from_me: fromMe,
          message_type: messageType,
          content: contentText,
          raw_payload: messageItem,
          ai_processed: false,
        },
        { onConflict: 'evolution_message_id' }
      )
      .select('id')
      .single();

    if (messageError || !messageRecord) {
      console.error('[Database Error] Failed to insert message:', messageError);
      return NextResponse.json({ error: 'Failed to record message' }, { status: 500 });
    }

    // 6. Schedule Asynchronous AI Qualification
    // Qualify if it's incoming (!fromMe), OR if it's a test inquiry from the user
    const isTestInquiry = Boolean(
      fromMe &&
      contentText &&
      (contentText.toLowerCase().includes('sofa') ||
       contentText.toLowerCase().includes('table') ||
       contentText.toLowerCase().includes('bed') ||
       contentText.toLowerCase().includes('chair') ||
       contentText.toLowerCase().includes('price') ||
       contentText.toLowerCase().includes('cost') ||
       contentText.toLowerCase().includes('furniture') ||
       contentText.toLowerCase().includes('hi') ||
       contentText.toLowerCase().includes('hello'))
    );

    if ((!fromMe || isTestInquiry) && contentText && !contentText.startsWith('[')) {
      const runAiQualification = async () => {
        try {
          await analyzeLeadMessage(contact.id, messageRecord.id, contentText, contact.push_name);
        } catch (aiErr) {
          console.error('[Async AI Task Error]:', aiErr);
        }
      };

      if (typeof after === 'function') {
        after(runAiQualification);
      } else {
        runAiQualification().catch(console.error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Webhook 200 OK] Message logged in ${duration}ms (Contact ID: ${contact.id})`);

    // 7. Return 200 OK immediately within < 500ms
    return NextResponse.json(
      {
        success: true,
        messageId: messageRecord.id,
        contactId: contact.id,
        processingTimeMs: duration,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('[Webhook Fatal Exception]:', err);
    return NextResponse.json(
      { error: 'Internal server processing error', details: err.message },
      { status: 500 }
    );
  }
}
