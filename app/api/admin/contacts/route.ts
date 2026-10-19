import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';
import { requireAdmin } from '@/lib/auth/require-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CONTACT_COLUMNS =
  'id, remote_jid, phone_number, push_name, lead_status, lead_score, ai_summary, extracted_metadata, last_message_at, created_at, updated_at';
const MESSAGE_COLUMNS = 'id, evolution_message_id, contact_id, from_me, message_type, content, ai_processed, intent, urgency, created_at';
const MAX_CONTACTS = 300;
const MAX_THREAD_MESSAGES = 200;

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const contactId = new URL(req.url).searchParams.get('contactId');

    // One conversation thread: newest N messages, returned oldest-first
    if (contactId) {
      const { data: messages, error: msgErr } = await supabaseAdmin
        .from('wa_messages')
        .select(MESSAGE_COLUMNS)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(MAX_THREAD_MESSAGES);

      if (msgErr) {
        return NextResponse.json({ error: msgErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, messages: (messages || []).reverse() });
    }

    const [contactsRes, countRes] = await Promise.all([
      supabaseAdmin
        .from('wa_contacts')
        .select(CONTACT_COLUMNS)
        .order('last_message_at', { ascending: false })
        .limit(MAX_CONTACTS),
      supabaseAdmin.from('wa_messages').select('id', { count: 'exact', head: true }),
    ]);

    if (contactsRes.error) {
      return NextResponse.json({ error: contactsRes.error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      contacts: contactsRes.data || [],
      totalMessagesCount: countRes.count || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch admin contacts' }, { status: 500 });
  }
}
