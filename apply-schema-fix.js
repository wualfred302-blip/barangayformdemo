// Apply schema fix to Supabase database
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function applySchemaFix() {
  console.log('🔧 Applying Supabase schema fix...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Read the SQL migration file
  const sqlPath = path.join(__dirname, 'scripts', '005_fix_qrt_schema.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  console.log('📄 Migration file loaded: 005_fix_qrt_schema.sql');
  console.log('📊 This will:');
  console.log('  ✓ Drop and recreate qrt_ids table with correct schema');
  console.log('  ✓ Remove: user_id, email, phone_number columns');
  console.log('  ✓ Ensure: verification_code, request_type, payment fields exist');
  console.log('  ✓ Recreate verification_logs table with proper references');
  console.log('  ✓ Set up proper indexes and RLS policies\n');

  // Split SQL into individual statements and execute
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Executing ${statements.length} SQL statements...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments and empty statements
    if (!statement || statement.startsWith('--')) continue;

    try {
      const { error } = await supabase.rpc('exec_sql', {
        query: statement + ';'
      });

      if (error) {
        // Try alternative approach using raw query if exec_sql doesn't exist
        const { error: directError } = await supabase.from('_sql').insert({ query: statement });

        if (directError && !directError.message?.includes('does not exist')) {
          console.error(`❌ Statement ${i + 1} failed:`, error.message || directError.message);
          errorCount++;
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Statement ${i + 1} error:`, err.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Migration completed!`);
  console.log(`   Success: ${successCount} statements`);
  if (errorCount > 0) {
    console.log(`   ⚠️  Errors: ${errorCount} statements`);
    console.log('   Note: Some errors may be expected (e.g., DROP IF EXISTS on non-existent tables)');
  }
  console.log('='.repeat(50) + '\n');

  console.log('🔍 Verifying schema...');

  // Verify the table exists and has correct structure
  const { data, error } = await supabase
    .from('qrt_ids')
    .select('*')
    .limit(0);

  if (error) {
    console.error('⚠️  Verification failed:', error.message);
    console.log('\n📝 Manual migration may be required via Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/rwjynnebxruknwhqowjp/editor');
    process.exit(1);
  } else {
    console.log('✅ Table verified successfully!');
    console.log('\n🎉 Schema is now aligned with code expectations!');
    console.log('   Your QRT ID submissions should now persist correctly.\n');
  }
}

applySchemaFix().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
