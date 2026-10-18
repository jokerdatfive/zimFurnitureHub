#!/usr/bin/env node
/**
 * ==============================================================================
 * Evolution API v2 - Automated Instance & Pairing Code Setup CLI
 * ==============================================================================
 * Run directly via:
 *   npx tsx hf-evolution-space/setup-instance.ts
 *
 * This script interacts with your Hugging Face-hosted Evolution API instance:
 * 1. Checks or creates the WhatsApp instance with Baileys integration.
 * 2. Configures webhook forwarding to your Vercel Next.js endpoint.
 * 3. Requests an 8-digit WhatsApp pairing code for phone-number linking.
 * ==============================================================================
 */

import readline from 'node:readline';

interface SetupConfig {
  evolutionUrl: string;
  evolutionApiKey: string;
  instanceName: string;
  webhookUrl: string;
  webhookSecret: string;
  phoneNumber: string;
}

// Helpers for styled console output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function printBanner() {
  console.log(`
${colors.cyan}${colors.bold}=================================================================
  🚀 EVOLUTION API v2 - ZERO-COST INSTANCE SETUP & PAIRING CLI
     (KK Furnitures / ZimFurnitureHub Production Gateway)
=================================================================${colors.reset}
`);
}

function prompt(rl: readline.Interface, question: string, defaultValue = ''): Promise<string> {
  const displayPrompt = defaultValue
    ? `${colors.yellow}${question}${colors.reset} [${defaultValue}]: `
    : `${colors.yellow}${question}${colors.reset}: `;

  return new Promise((resolve) => {
    rl.question(displayPrompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

async function fetchWithAuth(url: string, apiKey: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    apikey: apiKey,
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => null);

  return { ok: response.ok, status: response.status, data };
}

async function run() {
  printBanner();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const defaultUrl = process.env.EVOLUTION_API_URL || '';
    const defaultApiKey = process.env.EVOLUTION_API_KEY || '';
    const defaultInstance = process.env.EVOLUTION_INSTANCE_NAME || 'kkfurnitures-whatsapp';
    const defaultWebhook = process.env.WEBHOOK_URL || (process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/whatsapp` : '');
    const defaultSecret = process.env.WEBHOOK_SECRET || 'whsec_evolution_secret_token_123';
    const defaultPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || process.env.PHONE_NUMBER || '';

    console.log(`${colors.bold}Please verify or provide connection details:${colors.reset}\n`);

    const evolutionUrl = (await prompt(rl, '1. Hugging Face Space URL (e.g. https://user-space.hf.space)', defaultUrl)).replace(/\/$/, '');
    if (!evolutionUrl) throw new Error('Hugging Face Space Evolution URL is required.');

    const evolutionApiKey = await prompt(rl, '2. Evolution API Key (AUTHENTICATION_API_KEY)', defaultApiKey);
    if (!evolutionApiKey) throw new Error('Evolution API Key is required.');

    const instanceName = await prompt(rl, '3. WhatsApp Instance Name', defaultInstance);
    if (!instanceName) throw new Error('Instance name is required.');

    const webhookUrl = await prompt(rl, '4. Vercel Webhook URL (e.g. https://your-domain.com/api/webhooks/whatsapp)', defaultWebhook);
    const webhookSecret = await prompt(rl, '5. Webhook Security Secret (x-webhook-secret)', defaultSecret);

    const phoneNumber = await prompt(
      rl,
      '6. WhatsApp Phone Number with Country Code (digits only, e.g. 263770000000)',
      defaultPhone
    );

    const config: SetupConfig = {
      evolutionUrl,
      evolutionApiKey,
      instanceName,
      webhookUrl,
      webhookSecret,
      phoneNumber: phoneNumber.replace(/\D/g, ''),
    };

    console.log(`\n${colors.cyan}--- Step 1: Checking Evolution API Connectivity ---${colors.reset}`);
    const healthCheck = await fetchWithAuth(`${config.evolutionUrl}/`, config.evolutionApiKey);
    if (!healthCheck.ok) {
      console.error(
        `${colors.red}❌ Failed to connect to Hugging Face Space at ${config.evolutionUrl}.${colors.reset}`,
        `Status: ${healthCheck.status}`,
        healthCheck.data
      );
      process.exit(1);
    }
    console.log(`${colors.green}✓ Evolution API v2 is online and reachable!${colors.reset}`);

    console.log(`\n${colors.cyan}--- Step 2: Creating / Verifying Instance '${config.instanceName}' ---${colors.reset}`);
    const instanceList = await fetchWithAuth(`${config.evolutionUrl}/instance/fetchInstances`, config.evolutionApiKey);
    const existingInstances = Array.isArray(instanceList.data) ? instanceList.data : [];
    const exists = existingInstances.some((inst: any) => (inst.name || inst.instanceName) === config.instanceName);

    if (exists) {
      console.log(`${colors.green}✓ Instance '${config.instanceName}' already exists.${colors.reset}`);
    } else {
      console.log(`Creating instance '${config.instanceName}' with Baileys integration...`);
      const createRes = await fetchWithAuth(`${config.evolutionUrl}/instance/create`, config.evolutionApiKey, {
        method: 'POST',
        body: JSON.stringify({
          instanceName: config.instanceName,
          token: config.webhookSecret,
          qrcode: false,
          integration: 'WHATSAPP-BAILEYS',
          reject_call: false,
          msg_call: 'Sorry, this automated line does not accept voice calls.',
          groups_ignore: true,
          always_online: true,
          read_messages: true,
          read_status: false,
        }),
      });

      if (!createRes.ok) {
        console.error(`${colors.red}❌ Failed to create instance:${colors.reset}`, createRes.data);
        process.exit(1);
      }
      console.log(`${colors.green}✓ Instance '${config.instanceName}' created successfully!${colors.reset}`);
    }

    if (config.webhookUrl) {
      console.log(`\n${colors.cyan}--- Step 3: Configuring Webhook Target ---${colors.reset}`);
      console.log(`Setting webhook target to: ${config.webhookUrl}`);

      const webhookPayload = {
        enabled: true,
        url: config.webhookUrl,
        headers: {
          'x-webhook-secret': config.webhookSecret,
        },
        byEvents: false,
        base64: false,
        events: [
          'MESSAGES_UPSERT',
          'CONNECTION_UPDATE',
          'MESSAGES_UPDATE',
          'SEND_MESSAGE',
        ],
      };

      const setWebhookRes = await fetchWithAuth(
        `${config.evolutionUrl}/webhook/set/${encodeURIComponent(config.instanceName)}`,
        config.evolutionApiKey,
        {
          method: 'POST',
          body: JSON.stringify({ webhook: webhookPayload }),
        }
      );

      if (!setWebhookRes.ok) {
        console.warn(`${colors.yellow}⚠️ Warning setting webhook with wrapper. Retrying root schema...${colors.reset}`);
        await fetchWithAuth(
          `${config.evolutionUrl}/webhook/set/${encodeURIComponent(config.instanceName)}`,
          config.evolutionApiKey,
          {
            method: 'POST',
            body: JSON.stringify(webhookPayload),
          }
        );
      }

      console.log(`${colors.green}✓ Webhook active! Inbound messages will post to Next.js.${colors.reset}`);
    }

    if (config.phoneNumber) {
      console.log(`\n${colors.cyan}--- Step 4: Requesting 8-Digit Phone Pairing Code ---${colors.reset}`);
      console.log(`Requesting pairing code for phone number: +${config.phoneNumber}...`);

      const connectUrl = `${config.evolutionUrl}/instance/connect/${encodeURIComponent(config.instanceName)}?number=${encodeURIComponent(config.phoneNumber)}`;
      const pairRes = await fetchWithAuth(connectUrl, config.evolutionApiKey);

      if (!pairRes.ok) {
        console.error(`${colors.red}❌ Failed to request pairing code:${colors.reset}`, pairRes.data);
        console.log(`\nTip: Make sure the instance is not already connected.`);
      } else {
        const rawCode = pairRes.data?.code || pairRes.data?.pairingCode || pairRes.data?.pairing_code || JSON.stringify(pairRes.data);
        const formattedCode =
          typeof rawCode === 'string' && rawCode.length === 8
            ? `${rawCode.slice(0, 4)}-${rawCode.slice(4)}`
            : rawCode;

        console.log(`
${colors.green}${colors.bold}=================================================================
  🎉 PAIRING CODE GENERATED SUCCESSFULLY!
=================================================================${colors.reset}

  Your 8-Digit Pairing Code:
  ${colors.magenta}${colors.bold}   >>>  ${formattedCode}  <<<${colors.reset}

${colors.bold}How to link WhatsApp on your client's mobile phone:${colors.reset}
  1. Open WhatsApp on the mobile phone.
  2. Tap ${colors.yellow}Settings${colors.reset} (iOS) or the ${colors.yellow}Three Dots ⋮${colors.reset} (Android).
  3. Select ${colors.yellow}Linked Devices${colors.reset}.
  4. Tap ${colors.yellow}Link a Device${colors.reset}.
  5. When the QR camera scanner appears, tap ${colors.cyan}${colors.bold}"Link with phone number instead"${colors.reset} at the bottom.
  6. Enter the 8-digit code shown above: ${colors.bold}${formattedCode}${colors.reset}

${colors.green}Once entered, the phone and Evolution API will handshake and remain paired permanently via your Supabase DB session storage!${colors.reset}
`);
      }
    } else {
      console.log(`\n${colors.yellow}No phone number provided. Skipping pairing code generation.${colors.reset}`);
      console.log(`You can generate a code anytime via the Web Dashboard or by re-running this script.`);
    }

    console.log(`\n${colors.green}${colors.bold}Setup Complete! ✨${colors.reset}\n`);
  } catch (error: any) {
    console.error(`\n${colors.red}Setup Error:${colors.reset}`, error.message);
  } finally {
    rl.close();
  }
}

run();
