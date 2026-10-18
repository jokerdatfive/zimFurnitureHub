import { NextResponse } from 'next/server';
import { getInstanceConnectionState, pingSpace } from '@/lib/evolution/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
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
