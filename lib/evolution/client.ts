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
 * Ensures that the WhatsApp instance exists on Evolution API, creating it if missing.
 */
export async function ensureInstanceExists(
  instanceName: string = DEFAULT_INSTANCE
): Promise<boolean> {
  try {
    const listRes = await requestEvolution<any[]>('/instance/fetchInstances');
    const existing = Array.isArray(listRes.data) ? listRes.data : [];
    const exists = existing.some(
      (inst: any) => (inst.name || inst.instanceName) === instanceName
    );

    if (exists) return true;

    // Create the instance with Baileys integration
    const createRes = await requestEvolution('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName,
        token: process.env.WEBHOOK_SECRET || 'whsec_kk_furnitures_webhook_token',
        qrcode: false,
        integration: 'WHATSAPP-BAILEYS',
        reject_call: false,
        groups_ignore: true,
        always_online: true,
        read_messages: true,
        read_status: false,
      }),
    });

    return createRes.success;
  } catch {
    return false;
  }
}

/**
 * Restarts the WhatsApp instance socket
 */
export async function restartInstance(
  instanceName: string = DEFAULT_INSTANCE
): Promise<boolean> {
  try {
    const res = await requestEvolution(
      `/instance/restart/${encodeURIComponent(instanceName)}`,
      { method: 'POST' }
    );
    return res.success;
  } catch {
    return false;
  }
}

/**
 * Generates an 8-digit WhatsApp pairing code for linking via phone number
 */
export async function requestPairingCode(
  phoneNumber: string,
  instanceName: string = DEFAULT_INSTANCE
): Promise<{ success: boolean; code?: string; formattedCode?: string; error?: string }> {
  let cleanPhone = phoneNumber.replace(/\D/g, '');

  // Automatically normalize Zimbabwean local numbers (e.g. 077..., 071..., 078..., 073...) to international 263...
  if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
    cleanPhone = '263' + cleanPhone.slice(1);
  }

  if (!cleanPhone || cleanPhone.length < 8) {
    return { success: false, error: 'Invalid phone number format. Please provide country code + number (e.g. +263 77...).' };
  }

  // Ensure instance is registered on Evolution API before attempting to pair
  await ensureInstanceExists(instanceName);

  let rawCode: string | undefined;

  // Retry up to 3 times with a short pause as Baileys initializes the pairing session
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await requestEvolution<{ pairingCode?: string; code?: string }>(
      `/instance/connect/${encodeURIComponent(instanceName)}?number=${encodeURIComponent(cleanPhone)}`
    );

    if (!res.success) {
      if (res.status === 404) {
        await ensureInstanceExists(instanceName);
        continue;
      }
      return { success: false, error: res.error || 'Failed to request pairing code from Evolution API.' };
    }

    // Prioritize 8-digit alphanumeric pairingCode
    if (res.data?.pairingCode && String(res.data.pairingCode).trim() !== 'null') {
      rawCode = String(res.data.pairingCode).trim();
      break;
    }

    // Only fallback to `code` if it is an exact 8-character string (not a 200+ char QR string)
    if (res.data?.code && String(res.data.code).trim().length === 8) {
      rawCode = String(res.data.code).trim();
      break;
    }

    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  if (!rawCode) {
    return {
      success: false,
      error: 'Evolution API did not return an 8-digit pairing code. Please ensure the phone number includes your full international country code without leading zeros (e.g. +263 77... for Zimbabwe).',
    };
  }

  const codeStr = String(rawCode).trim().toUpperCase();
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
