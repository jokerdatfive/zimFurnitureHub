import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { sendWhatsAppMessage } from '@/lib/evolution/client';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { contactId, phoneNumber, message } = await req.json().catch(() => ({}));

    if (!phoneNumber || !message || !message.trim()) {
      return NextResponse.json({ error: 'Phone number and message text are required.' }, { status: 400 });
    }

    const sendRes = await sendWhatsAppMessage(phoneNumber, message.trim());
    if (!sendRes.success) {
      return NextResponse.json({ error: sendRes.error || 'Failed to send WhatsApp message' }, { status: 500 });
    }

    const messageId = sendRes.data?.key?.id || `out_${Date.now()}`;

    // If contactId was provided, insert message into wa_messages table
    if (contactId) {
      await supabaseAdmin.from('wa_messages').insert({
        evolution_message_id: messageId,
        contact_id: contactId,
        from_me: true,
        message_type: 'text',
        content: message.trim(),
        ai_processed: true,
      });

      await supabaseAdmin
        .from('wa_contacts')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', contactId);
    }

    return NextResponse.json({ success: true, messageId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
