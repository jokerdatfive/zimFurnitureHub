import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get('contactId');

    // If contactId is provided, fetch messages for this contact
    if (contactId) {
      const { data: messages, error: msgErr } = await supabaseAdmin
        .from('wa_messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: true });

      if (msgErr) {
        return NextResponse.json({ error: msgErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, messages: messages || [] });
    }

    // Otherwise, fetch all contacts and counts
    const { data: contacts, error: contactsErr } = await supabaseAdmin
      .from('wa_contacts')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (contactsErr) {
      return NextResponse.json({ error: contactsErr.message }, { status: 500 });
    }

    const { count, error: countErr } = await supabaseAdmin
      .from('wa_messages')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      contacts: contacts || [],
      totalMessagesCount: count || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin contacts' },
      { status: 500 }
    );
  }
}
