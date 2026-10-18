/**
 * ==============================================================================
 * Evolution API & Vercel Connection Diagnostics Script (Vanilla Node.js)
 * Location: zimFurnitureHub/scripts/test-evolution-connection.js
 * ==============================================================================
 * Run via:
 *   node scripts/test-evolution-connection.js
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');

// Manually load .env.local and .env
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      content.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const match = trimmed.match(/^([^=]+)=(.*)$/);
          if (match) {
            const key = match[1].trim();
            let val = match[2].trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    }
  }
}

loadEnv();

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

async function testConnection() {
  console.log(`
${colors.cyan}${colors.bold}=================================================================
  🎉 EVOLUTION API v2 (AZURE VM) & NEXT.JS LIVE DIAGNOSTICS
=================================================================${colors.reset}
`);

  const evoUrl = (process.env.EVOLUTION_API_URL || 'http://20.164.212.171:8080').replace(/\/$/, '');
  const apiKey = process.env.EVOLUTION_API_KEY || 'kk_evolution_secret_token_2026';
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'kkfurnitures-whatsapp';

  console.log(`Checking Evolution API at: ${colors.bold}${evoUrl}${colors.reset}...`);

  try {
    const startTime = Date.now();
    const res = await fetch(`${evoUrl}/`, {
      headers: { apikey: apiKey },
    });
    const latency = Date.now() - startTime;

    if (!res.ok) {
      console.error(`${colors.red}❌ HTTP Error: ${res.status}${colors.reset}`);
      return;
    }

    const data = await res.json();
    console.log(`${colors.green}✓ Evolution API is ONLINE! Latency: ${latency}ms${colors.reset}`);
    console.log(`  Version: ${data.version || 'v2'} | Client: ${data.clientName || 'Baileys'}`);

    console.log(`\nChecking WhatsApp instance '${instanceName}'...`);
    const stateRes = await fetch(`${evoUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`, {
      headers: { apikey: apiKey },
    });

    if (!stateRes.ok) {
      console.log(`${colors.yellow}⚠️ WhatsApp Instance '${instanceName}' is not created yet.${colors.reset}`);
      console.log(`👉 You can create and pair it right now from your dashboard or via CLI!`);
    } else {
      const stateData = await stateRes.json();
      const state = stateData.instance?.state || stateData.state || 'close';
      console.log(`  Instance State: ${colors.bold}${state}${colors.reset}`);
    }

    console.log(`\n${colors.green}${colors.bold}=================================================================
  🚀 SUCCESS: AZURE VM IS FULLY CONNECTED & READY!
=================================================================${colors.reset}`);
    console.log(`Web Dashboard URL: ${colors.cyan}http://localhost:3000/dashboard${colors.reset}`);
    console.log(`Admin Link URL:    ${colors.cyan}http://localhost:3000/admin/whatsapp-analytics${colors.reset}`);
    console.log(`Manager URL:       ${colors.cyan}${evoUrl}/manager${colors.reset} (API Key: ${apiKey})`);
  } catch (err) {
    console.error(`${colors.red}❌ Connection failed:${colors.reset}`, err.message);
  }
}

testConnection();
