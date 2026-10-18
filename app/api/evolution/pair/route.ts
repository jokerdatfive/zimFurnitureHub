import { NextRequest, NextResponse } from 'next/server';
import { requestPairingCode } from '@/lib/evolution/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phoneNumber } = body;

    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return NextResponse.json(
        { error: 'Valid phone number with country code is required.' },
        { status: 400 }
      );
    }

    let cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      cleanPhone = '263' + cleanPhone.slice(1);
    }

    if (cleanPhone.length < 8 || cleanPhone.length > 16) {
      return NextResponse.json(
        { error: 'Invalid phone number length. Please include international country code (e.g. +263... for Zimbabwe or +1...).' },
        { status: 400 }
      );
    }

    const result = await requestPairingCode(cleanPhone);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate WhatsApp pairing code.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      code: result.code,
      formattedCode: result.formattedCode,
      phoneNumber: cleanPhone,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error while requesting pairing code', details: error.message },
      { status: 500 }
    );
  }
}
