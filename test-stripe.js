const Stripe = require('stripe');
const fs = require('fs');
const path = require('path');

// Manually read .env file
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const fallbackPath = path.resolve(process.cwd(), '.env');
  
  const targetPath = fs.existsSync(envPath) ? envPath : fallbackPath;
  
  if (fs.existsSync(targetPath)) {
    const envContent = fs.readFileSync(targetPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  console.error("❌ Missing STRIPE_SECRET_KEY in .env file.");
  process.exit(1);
}

const stripe = new Stripe(stripeSecret);

async function testStripe() {
  console.log("Testing Stripe connection...");
  console.log("----------------------------------------");
  
  try {
    // Try to retrieve account details
    const account = await stripe.accounts.retrieve();
    console.log("✅ Stripe Connection Successful!");
    console.log(`💳 Account Name: ${account.business_profile?.name || 'N/A'}`);
    console.log(`🌍 Default Currency: ${account.default_currency.toUpperCase()}`);
    console.log(`🛠️ Live Mode: ${account.details_submitted ? 'YES (Live)' : 'NO (Test Mode)'}`);
    
    // Check for a sample product or balance
    const balance = await stripe.balance.retrieve();
    console.log("\n💰 Current Balance Status (Test Mode):");
    console.log(`   Pending: ${balance.pending[0].amount / 100} ${balance.pending[0].currency.toUpperCase()}`);
    
  } catch (err) {
    console.error("❌ Stripe Connection Failed!");
    console.error("Error Message:", err.message);
  }
}

testStripe();
