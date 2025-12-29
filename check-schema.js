// Script to check the current qrt_ids table schema in Supabase
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkSchema() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('\n=== Checking qrt_ids Table Schema ===\n');

  // Query the information_schema to get column details
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'qrt_ids'
      ORDER BY ordinal_position;
    `
  });

  if (error) {
    console.error('Error querying schema:', error);
    console.log('\nTrying alternative method...\n');

    // Try to get schema by querying with limit 0
    const { data: sampleData, error: sampleError } = await supabase
      .from('qrt_ids')
      .select('*')
      .limit(0);

    if (sampleError) {
      console.error('Alternative method also failed:', sampleError);
      process.exit(1);
    }

    console.log('Table exists but cannot query schema directly.');
    console.log('Attempting to insert test record to see which columns are accepted...');
  } else {
    console.log('Current Columns in qrt_ids table:');
    console.log('=====================================');
    data.forEach(col => {
      console.log(`- ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
  }

  // Also try to fetch one record to see actual structure
  console.log('\n=== Fetching Sample Record ===\n');
  const { data: records, error: fetchError } = await supabase
    .from('qrt_ids')
    .select('*')
    .limit(1);

  if (fetchError) {
    console.error('Error fetching records:', fetchError);
  } else {
    if (records && records.length > 0) {
      console.log('Sample record structure:');
      console.log(Object.keys(records[0]));
    } else {
      console.log('No records found in table (table is empty)');
    }
  }

  process.exit(0);
}

checkSchema();
