import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/require-admin';
import { getInstanceConnectionState, pingSpace } from '@/lib/evolution/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const spaceHealth = await pingSpace();
    const connectionState = await getInstanceConnectionState();

    return NextResponse.json({
      spaceReachable: spaceHealth.ok,
      latencyMs: spaceHealth.latencyMs,
      state: connectionState.state,
      connected: connectionState.state === 'open',
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        spaceReachable: false,
        state: 'close',
        connected: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}
