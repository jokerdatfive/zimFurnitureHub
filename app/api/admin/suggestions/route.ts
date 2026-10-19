import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';
import { requireAdmin } from '@/lib/auth/require-admin';
import { getLaybys } from '@/lib/db/unified-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** Pending AI suggestions plus the active layby accounts payments can be applied to. */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { data, error } = await supabaseAdmin
    .from('ai_suggestions')
    .select('id, contact_id, kind, title, detail, payload, status, created_at, contact:wa_contacts(push_name, phone_number)')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    // Table missing = migration not applied yet; the UI shows a hint instead of failing
    return NextResponse.json({ success: false, error: error.message, suggestions: [], laybys: [] });
  }

  const hasPayments = (data || []).some((s) => s.kind === 'PAYMENT_CONFIRMED');
  const laybys = hasPayments
    ? (await getLaybys())
        .filter((l) => l.status === 'ACTIVE')
        .map((l) => ({
          id: l.id,
          contact_id: l.contact_id,
          customer_name: l.customer_name,
          product_name: l.product_name,
          balance_due: l.balance_due,
        }))
    : [];

  return NextResponse.json({ success: true, suggestions: data || [], laybys });
}
