/**
 * ==============================================================================
 * Evolution API & Vercel Connection Diagnostics Script
 * Location: zimFurnitureHub/scripts/test-evolution-connection.ts
 * ==============================================================================
 * Run via:
 *   npx tsx scripts/test-evolution-connection.ts
 *
 * This diagnostic verifies every link in the chain:
 * 1. Supabase Database & Tables (wa_contacts, wa_messages)
 * 2. Hugging Face Space Connectivity & Latency
 * 3. Evolution API v2 Authentication & Instance Socket State
 * 4. Webhook registration pointing to your Vercel deployment
 * 5. AI Lead Scoring Engine (Google Gemini / OpenAI)
 * ==============================================================================
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load local environment variables (.env.local or .env)
config({ path: resolve(process.cwd(), '.env.local') });
config({ path: resolve(process.cwd(), '.env') });

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

async function runDiagnostics() {
  console.log(`
${colors.cyan}${colors.bold}=================================================================
  🔍 EVOLUTION API & VERCEL CONNECTION DIAGNOSTICS
     (KK Furnitures / ZimFurnitureHub Production Check)
=================================================================${colors.reset}
`);

  let allPassed = true;

  // --------------------------------------------------------------------------
  // Check 1: Environment Variables
  // --------------------------------------------------------------------------
  console.log(`${colors.bold}1. Checking Environment Variables...${colors.reset}`);
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'EVOLUTION_API_URL',
    'EVOLUTION_API_KEY',
    'EVOLUTION_INSTANCE_NAME',
    'WEBHOOK_SECRET',
  ];

  const missingVars = requiredVars.filter((v) => !process.env[v]);
  if (missingVars.length > 0) {
    console.error(
      `${colors.red}❌ Missing environment variables:${colors.reset} ${missingVars.join(', ')}`
    );
    console.log(`   👉 Set them in .env.local or Vercel Project Settings > Environment Variables.`);
    allPassed = false;
  } else {
    console.log(`${colors.green}✓ All required environment variables are set.${colors.reset}`);
  }

  // --------------------------------------------------------------------------
  // Check 2: Supabase Database Connectivity
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}2. Checking Supabase Database & Tables...${colors.reset}`);
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: contactsErr } = await supabase.from('wa_contacts').select('id').limit(1);
    const { error: messagesErr } = await supabase.from('wa_messages').select('id').limit(1);

    if (contactsErr || messagesErr) {
      console.error(
        `${colors.red}❌ Database tables not found or inaccessible.${colors.reset}`,
        contactsErr?.message || messagesErr?.message
      );
      console.log(
        `   👉 Action: Run the SQL migration in Supabase SQL Editor:
      supabase/migrations/20261018000002_evolution_whatsapp_analytics.sql`
      );
      allPassed = false;
    } else {
      console.log(`${colors.green}✓ Supabase connection verified! Tables 'wa_contacts' and 'wa_messages' are active.${colors.reset}`);
    }
  } catch (err: any) {
    console.error(`${colors.red}❌ Failed connecting to Supabase:${colors.reset}`, err.message);
    allPassed = false;
  }

  // --------------------------------------------------------------------------
  // Check 3: Hugging Face Space & Evolution API Reachability
  // --------------------------------------------------------------------------
  const hfUrl = (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '');
  const apiKey = process.env.EVOLUTION_API_KEY || '';
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'kkfurnitures-whatsapp';

  console.log(`\n${colors.bold}3. Checking Hugging Face Space Reachability...${colors.reset}`);
  console.log(`   URL: ${hfUrl || '[NOT SET]'}`);

  if (!hfUrl) {
    console.error(`${colors.red}❌ EVOLUTION_API_URL is missing.${colors.reset}`);
    allPassed = false;
  } else {
    const startTime = Date.now();
    try {
      const pingRes = await fetch(`${hfUrl}/`, {
        headers: { apikey: apiKey },
      });
      const latency = Date.now() - startTime;

      if (!pingRes.ok) {
        console.error(
          `${colors.red}❌ Hugging Face Space returned HTTP ${pingRes.status}.${colors.reset}`
        );
        console.log(`   👉 Make sure the Space is set to PUBLIC and the status is "Running".`);
        allPassed = false;
      } else {
        const pingData = await pingRes.json().catch(() => ({}));
        console.log(
          `${colors.green}✓ Hugging Face Space is online! Latency: ${latency}ms (Evolution API ${pingData.version || 'v2'})${colors.reset}`
        );
      }
    } catch (err: any) {
      console.error(
        `${colors.red}❌ Cannot connect to Hugging Face Space:${colors.reset}`,
        err.message
      );
      console.log(`   👉 If the Space was sleeping, it may take 20-40 seconds to cold boot.`);
      allPassed = false;
    }
  }

  // --------------------------------------------------------------------------
  // Check 4: WhatsApp Baileys Instance & Socket State
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}4. Checking WhatsApp Instance '${instanceName}'...${colors.reset}`);
  if (hfUrl && apiKey) {
    try {
      const stateRes = await fetch(
        `${hfUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`,
        { headers: { apikey: apiKey } }
      );

      if (!stateRes.ok) {
        console.warn(
          `${colors.yellow}⚠️ Instance '${instanceName}' does not exist yet.${colors.reset}`
        );
        console.log(
          `   👉 Action: Run 'npx tsx hf-evolution-space/setup-instance.ts' to create it automatically.`
        );
      } else {
        const stateData = await stateRes.json().catch(() => ({}));
        const state = stateData.instance?.state || stateData.state || 'close';

        if (state === 'open') {
          console.log(`${colors.green}✓ WhatsApp Instance is CONNECTED and active (state: open)!${colors.reset}`);
        } else {
          console.log(
            `${colors.yellow}⚠️ WhatsApp Instance status: '${state}'.${colors.reset}`
          );
          console.log(
            `   👉 Phone pairing is needed. Use the dashboard at /dashboard or run:
      npx tsx hf-evolution-space/setup-instance.ts`
          );
        }
      }
    } catch (err: any) {
      console.error(`${colors.red}❌ Error checking instance state:${colors.reset}`, err.message);
    }
  }

  // --------------------------------------------------------------------------
  // Check 5: Webhook Target Verification
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}5. Checking Webhook Configuration...${colors.reset}`);
  if (hfUrl && apiKey) {
    try {
      const webhookRes = await fetch(
        `${hfUrl}/webhook/find/${encodeURIComponent(instanceName)}`,
        { headers: { apikey: apiKey } }
      );

      if (webhookRes.ok) {
        const webhookData = await webhookRes.json().catch(() => ({}));
        const targetUrl = webhookData.url || webhookData.webhook?.url || 'Not set';
        const enabled = webhookData.enabled ?? webhookData.webhook?.enabled ?? false;

        console.log(`   Current Webhook Target: ${targetUrl}`);
        console.log(`   Webhook Enabled: ${enabled ? 'YES' : 'NO'}`);

        if (targetUrl.includes('localhost')) {
          console.warn(
            `${colors.yellow}⚠️ Webhook is pointing to localhost. Remember to update to your Vercel URL when deploying live!${colors.reset}`
          );
        } else if (targetUrl.endsWith('/api/webhooks/whatsapp')) {
          console.log(`${colors.green}✓ Webhook correctly targets Next.js endpoint (/api/webhooks/whatsapp)!${colors.reset}`);
        }
      }
    } catch (err: any) {
      console.warn(`${colors.yellow}⚠️ Could not inspect webhook configuration:${colors.reset}`, err.message);
    }
  }

  // --------------------------------------------------------------------------
  // Check 6: AI Lead Scoring Engine
  // --------------------------------------------------------------------------
  console.log(`\n${colors.bold}6. Checking AI Provider Credentials...${colors.reset}`);
  const hasGoogle = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);

  if (!hasGoogle && !hasOpenAI) {
    console.warn(
      `${colors.yellow}⚠️ No AI API key detected (GOOGLE_GENERATIVE_AI_API_KEY or OPENAI_API_KEY).${colors.reset}`
    );
    console.log(`   👉 Grab a free Google Gemini key from https://aistudio.google.com/`);
  } else {
    console.log(
      `${colors.green}✓ AI Provider configured: ${hasGoogle ? 'Google Gemini (Free)' : 'OpenAI'}${colors.reset}`
    );
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log(`\n${colors.cyan}${colors.bold}=================================================================${colors.reset}`);
  if (allPassed) {
    console.log(`${colors.green}${colors.bold}🎉 ALL CORE INFRASTRUCTURE CHECKS PASSED!${colors.reset}`);
    console.log(`Open your browser at: ${colors.cyan}http://localhost:3000/dashboard${colors.reset} (or your Vercel URL)`);
  } else {
    console.log(`${colors.yellow}${colors.bold}Follow the checklist steps above to complete any remaining items.${colors.reset}`);
  }
  console.log(`${colors.cyan}${colors.bold}=================================================================\n${colors.reset}`);
}

runDiagnostics();
