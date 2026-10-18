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
  const headers: Record<string, string> = {
    apikey: EVOLUTION_API_KEY,
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

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
      error: err.message || 'Network error connecting to Evolution API server',
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
        qrcode: true,
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
 * Deletes an instance to purge stale or corrupt WhatsApp connection sessions
 */
export async function deleteInstance(
  instanceName: string = DEFAULT_INSTANCE
): Promise<boolean> {
  try {
    const res = await requestEvolution(
      `/instance/delete/${encodeURIComponent(instanceName)}`,
      { method: 'DELETE' }
    );
    return res.success;
  } catch {
    return false;
  }
}

/**
 * Completely resets the instance by deleting and recreating it with a fresh socket
 */
export async function resetInstance(
  instanceName: string = DEFAULT_INSTANCE
): Promise<boolean> {
  await deleteInstance(instanceName);
  await new Promise((resolve) => setTimeout(resolve, 800));
  return ensureInstanceExists(instanceName);
}

/**
 * Retrieves the live WhatsApp QR code (base64 image) for instant camera scanning.
 */
export async function getQrCode(
  instanceName: string = DEFAULT_INSTANCE
): Promise<{ success: boolean; qrBase64?: string; state?: string; error?: string }> {
  try {
    await ensureInstanceExists(instanceName);

    // If instance is in 'close' state, restart to open a fresh socket
    const stateCheck = await getInstanceConnectionState(instanceName);
    if (stateCheck.state === 'close') {
      await restartInstance(instanceName);
      await new Promise((r) => setTimeout(r, 1000));
    }

    const res = await requestEvolution<{ base64?: string; code?: string; count?: number }>(
      `/instance/connect/${encodeURIComponent(instanceName)}`
    );

    // If session has expired or exceeded QR regeneration count, reset the instance
    if (res.data?.count && res.data.count >= 25) {
      await resetInstance(instanceName);
      const retryRes = await requestEvolution<{ base64?: string; code?: string; count?: number }>(
        `/instance/connect/${encodeURIComponent(instanceName)}`
      );
      if (retryRes.success && retryRes.data?.base64) {
        return { success: true, qrBase64: retryRes.data.base64, state: 'connecting' };
      }
    }

    if (res.success && res.data?.base64) {
      return { success: true, qrBase64: res.data.base64, state: stateCheck.state };
    }

    return { success: false, error: res.error || 'Failed to retrieve WhatsApp QR code' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error generating QR code' };
  }
}

/**
 * Generates an 8-digit WhatsApp pairing code for linking via phone number
 */
export async function requestPairingCode(
  phoneNumber: string,
  instanceName: string = DEFAULT_INSTANCE
): Promise<{ success: boolean; code?: string; formattedCode?: string; qrBase64?: string; error?: string }> {
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

  // If instance is currently closed, restart it to establish a fresh Baileys WebSocket
  try {
    const stateCheck = await getInstanceConnectionState(instanceName);
    if (stateCheck.state === 'close') {
      await restartInstance(instanceName);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch {}

  let res = await requestEvolution<{ pairingCode?: string; code?: string; base64?: string }>(
    `/instance/connect/${encodeURIComponent(instanceName)}?number=${encodeURIComponent(cleanPhone)}`
  );

  // If pairingCode returned null or empty, recreate the instance configured specifically for this phone number
  if (!res.data?.pairingCode || String(res.data.pairingCode).trim() === 'null') {
    await deleteInstance(instanceName);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await requestEvolution('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
        token: process.env.WEBHOOK_SECRET || 'whsec_kk_furnitures_webhook_token',
        number: cleanPhone,
        qrcode: true,
      }),
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    res = await requestEvolution<{ pairingCode?: string; code?: string; base64?: string }>(
      `/instance/connect/${encodeURIComponent(instanceName)}?number=${encodeURIComponent(cleanPhone)}`
    );
  }

  if (!res.success) {
    return { success: false, error: res.error || 'Failed to request pairing code from Evolution API.' };
  }

  const qrBase64 = res.data?.base64;
  let rawCode: string | undefined;

  // Prioritize 8-digit alphanumeric pairingCode
  if (res.data?.pairingCode && String(res.data.pairingCode).trim() !== 'null') {
    rawCode = String(res.data.pairingCode).trim();
  } else if (res.data?.code && String(res.data.code).trim().length === 8) {
    rawCode = String(res.data.code).trim();
  }

  if (!rawCode) {
    return {
      success: false,
      qrBase64,
      error: 'WhatsApp did not return an 8-digit pairing code for this number. Please ensure the phone number is active on WhatsApp with country code (e.g. +263 77...), or scan the live QR code directly with your phone camera.',
    };
  }

  const codeStr = String(rawCode).trim().toUpperCase();
  const formattedCode =
    codeStr.length === 8 ? `${codeStr.slice(0, 4)}-${codeStr.slice(4)}` : codeStr;

  return {
    success: true,
    code: codeStr,
    formattedCode,
    qrBase64,
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
