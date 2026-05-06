const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read .env file since dotenv is not a dependency
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value;
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials. Checked .env file.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Testing connection to:", supabaseUrl);
  console.log("----------------------------------------");
  
  try {
    // Try to fetch categories as a test
    const { data, error } = await supabase.from('categories').select('*');
    
    if (error) {
      console.error("❌ Connection failed! Error:", error.message);
    } else {
      console.log("✅ Connection successful!");
      console.log(`📦 Found ${data.length} categories.`);
      
      if (data.length === 0) {
        console.log("\n⚠️ Warning: The 'categories' table is empty!");
      } else {
        console.log("\nSample Data (Categories):");
        console.table(data.map(cat => ({ id: cat.id, name: cat.name, slug: cat.slug })));
      }
      
      // Also check products with JOIN
      console.log("\nTesting products with categories JOIN...");
      const { data: pJoin, error: pjError } = await supabase
        .from('products')
        .select('id, name, categories(name)')
        .limit(1);
        
      if (pjError) {
        console.error("❌ Category JOIN failed! Error:", pjError.message);
        console.log("Trying with 'category' (singular)...");
        const { data: pJoin2, error: pjError2 } = await supabase
          .from('products')
          .select('id, name, category(name)')
          .limit(1);
          if (pjError2) {
             console.error("❌ Both singular and plural failed!");
          } else {
             console.log("✅ Singular 'category' worked!");
          }
      } else {
        console.log("✅ Plural 'categories' worked!");
      }
    }
  } catch (err) {
    console.error("❌ An unexpected error occurred:", err.message);
  }
}

testConnection();
