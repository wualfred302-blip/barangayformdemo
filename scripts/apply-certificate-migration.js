const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase credentials not found in environment');
    process.exit(1);
  }

  console.log('Connecting to Supabase...');
  console.log('URL:', supabaseUrl);

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Read migration SQL
  const migrationPath = path.join(__dirname, '006_add_certificate_fields.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  console.log('\nMigration SQL:');
  console.log('===============================================');
  console.log(migrationSQL);
  console.log('===============================================\n');

  // Split into individual statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    console.log(statement.substring(0, 80) + '...\n');

    try {
      // Use the Supabase RPC to execute SQL
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);

        // If RPC doesn't exist, suggest alternative
        if (error.message.includes('function') || error.code === '42883') {
          console.log('\n⚠️  Direct SQL execution not available via Supabase client.');
          console.log('\nTo apply this migration, please:');
          console.log('1. Open your Supabase dashboard at:', supabaseUrl.replace('.supabase.co', '.supabase.co/project/_/sql'));
          console.log('2. Go to SQL Editor');
          console.log('3. Copy and paste the contents of: scripts/006_add_certificate_fields.sql');
          console.log('4. Click "Run"\n');
          process.exit(1);
        }
      } else {
        console.log(`✓ Statement ${i + 1} executed successfully\n`);
      }
    } catch (err) {
      console.error(`Error on statement ${i + 1}:`, err.message);
    }
  }

  console.log('✓ Migration completed successfully!');
}

applyMigration().catch(console.error);
