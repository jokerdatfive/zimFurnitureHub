/**
 * GET /api/cron/prune - daily retention job (see prune_whatsapp_data() in the
 * 20261019000004 migration). Keeps the Supabase database small.
 * Fails closed: CRON_SECRET must be set and sent as `Authorization: Bearer ...`
 * (Vercel Cron does this automatically).
 */
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
  }

  const keepDays = Number(process.env.WA_NOISE_RETENTION_DAYS) || 14;
  const { data, error } = await supabaseAdmin.rpc('prune_whatsapp_data', { keep_days: keepDays });

  if (error) {
    console.error('[Prune] Failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('[Prune] Done:', data);
  return NextResponse.json({ success: true, ...data });
}
