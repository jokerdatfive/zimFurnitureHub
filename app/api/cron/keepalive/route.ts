/**
 * ==============================================================================
 * Module 3: Hugging Face Space & Evolution Keep-Alive Endpoint
 * Location: zimFurnitureHub/app/api/cron/keepalive/route.ts
 * ==============================================================================
 * Route: GET /api/cron/keepalive
 *
 * Pings Hugging Face Space root to keep container alive and checks Evolution API status.
 * ==============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { pingSpace, getInstanceConnectionState } from '@/lib/evolution/client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  const secretParam = req.nextUrl.searchParams.get('secret');

  if (cronSecret) {
    const bearer = authHeader?.replace('Bearer ', '');
    if (bearer !== cronSecret && secretParam !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized cron request' }, { status: 401 });
    }
  }

  const startTime = Date.now();

  try {
    const spacePing = await pingSpace();
    const instanceState = await getInstanceConnectionState();

    const isConnected = instanceState.state === 'open';
    const totalDurationMs = Date.now() - startTime;

    const report = {
      timestamp: new Date().toISOString(),
      huggingFaceSpace: {
        reachable: spacePing.ok,
        httpStatus: spacePing.status,
        pingLatencyMs: spacePing.latencyMs,
      },
      whatsappInstance: {
        state: instanceState.state,
        connected: isConnected,
        details: instanceState.raw,
      },
      overallHealth: spacePing.ok && isConnected ? 'HEALTHY' : 'DEGRADED',
      totalDurationMs,
    };

    if (!isConnected) {
      console.warn(`[KeepAlive Alert] WhatsApp Instance state is '${instanceState.state}' (not 'open'). Client may need to re-pair.`);
    } else {
      console.log(`[KeepAlive] Evolution Space OK (${spacePing.latencyMs}ms), WhatsApp socket: OPEN`);
    }

    return NextResponse.json(report, { status: 200 });
  } catch (error: any) {
    console.error('[KeepAlive Exception]:', error);
    return NextResponse.json(
      {
        error: 'Failed to complete keepalive check',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
