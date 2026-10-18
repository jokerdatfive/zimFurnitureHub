/**
 * Evolution API v2 Client Helper
 * Handles communication between Next.js and the Hugging Face Docker Space.
 */

const EVOLUTION_API_URL = (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '');
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const DEFAULT_INSTANCE = process.env.EVOLUTION_INSTANCE_NAME || 'kkfurnitures-whatsapp';

interface EvolutionResponse<T = any> {
  success: boolean;
  status: number;
  data: T | null;
  error?: string;
}

async function requestEvolution<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<EvolutionResponse<T>> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return {
      success: false,
      status: 500,
      data: null,
      error: 'Evolution API credentials missing in environment variables.',
    };
  }

  const url = `${EVOLUTION_API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = {
    'Content-Type': 'application/json',
    apikey: EVOLUTION_API_KEY,
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        data,
        error: data?.message || data?.error || `Evolution API error (${res.status})`,
      };
    }

    return {
      success: true,
      status: res.status,
      data,
    };
  } catch (err: any) {
    return {
      success: false,
      status: 500,
      data: null,
      error: err.message || 'Network error connecting to Hugging Face Evolution Space',
    };
  }
}

/**
 * Pings the root Hugging Face Space URL to wake up from cold boot
 */
export async function pingSpace(): Promise<{ ok: boolean; status: number; latencyMs: number }> {
  const start = Date.now();
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/`, {
      method: 'GET',
      headers: { apikey: EVOLUTION_API_KEY },
      cache: 'no-store',
    });
    return {
      ok: res.ok,
      status: res.status,
      latencyMs: Date.now() - start,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - start,
    };
  }
}

/**
 * Retrieves the connection state of the WhatsApp instance
 * returns 'open' (connected), 'connecting', 'close' (disconnected)
 */
export async function getInstanceConnectionState(
  instanceName: string = DEFAULT_INSTANCE
): Promise<{ state: string; raw: any }> {
  const res = await requestEvolution<{ instance?: { state: string }; state?: string }>(
    `/instance/connectionState/${encodeURIComponent(instanceName)}`
  );

  if (!res.success || !res.data) {
    return { state: 'close', raw: res.error };
  }

  const state = res.data.instance?.state || res.data.state || 'close';
  return { state, raw: res.data };
}

/**
 * Generates an 8-digit WhatsApp pairing code for linking via phone number
 */
export async function requestPairingCode(
  phoneNumber: string,
  instanceName: string = DEFAULT_INSTANCE
): Promise<{ success: boolean; code?: string; formattedCode?: string; error?: string }> {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  if (!cleanPhone || cleanPhone.length < 8) {
    return { success: false, error: 'Invalid phone number format. Provide country code + number.' };
  }

  const res = await requestEvolution<{ pairingCode?: string; code?: string }>(
    `/instance/connect/${encodeURIComponent(instanceName)}?number=${encodeURIComponent(cleanPhone)}`
  );

  if (!res.success) {
    return { success: false, error: res.error || 'Failed to request pairing code' };
  }

  const rawCode = res.data?.code || res.data?.pairingCode;
  if (!rawCode) {
    return { success: false, error: 'Evolution API did not return a pairing code. Ensure instance is created.' };
  }

  const codeStr = String(rawCode).trim();
  const formattedCode =
    codeStr.length === 8 ? `${codeStr.slice(0, 4)}-${codeStr.slice(4)}` : codeStr;

  return {
    success: true,
    code: codeStr,
    formattedCode,
  };
}

/**
 * Sends an outbound WhatsApp text message
 */
export async function sendWhatsAppMessage(
  recipientPhone: string,
  messageText: string,
  instanceName: string = DEFAULT_INSTANCE
): Promise<EvolutionResponse> {
  const cleanPhone = recipientPhone.replace(/\D/g, '');
  return requestEvolution(
    `/message/sendText/${encodeURIComponent(instanceName)}`,
    {
      method: 'POST',
      body: JSON.stringify({
        number: cleanPhone,
        text: messageText,
        options: {
          delay: 1200,
          presence: 'composing',
        },
      }),
    }
  );
}
