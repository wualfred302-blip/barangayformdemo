#!/usr/bin/env node

/**
 * Direct Supabase Schema Inspector
 * Bypasses MCP authentication issues by using direct client access
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function inspectSchema() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Supabase credentials not found in .env.local');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('🔍 Inspecting Supabase Schema...\n');
  console.log('📍 Supabase URL:', supabaseUrl);
  console.log('');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Inspect QRT IDs table structure
    console.log('📊 QRT_IDS TABLE SCHEMA:\n');

    const { data: qrtSample, error: qrtError } = await supabase
      .from('qrt_ids')
      .select('*')
      .limit(1);

    if (qrtError) {
      console.error('❌ Error querying qrt_ids:', qrtError.message);
      console.error('Details:', qrtError);
    } else {
      if (qrtSample && qrtSample.length > 0) {
        const columns = Object.keys(qrtSample[0]);
        console.log('✅ Columns found:', columns.length);
        console.log('\nColumn Names:');
        columns.forEach((col, idx) => {
          const value = qrtSample[0][col];
          const type = value === null ? 'null' : typeof value;
          console.log(`  ${idx + 1}. ${col} (${type})`);
        });
      } else {
        console.log('ℹ️  Table exists but no data found');
        console.log('Attempting to describe table structure...');
      }
    }

    // Count total QRT IDs
    console.log('\n📈 DATA STATISTICS:\n');

    const { count: totalCount, error: countError } = await supabase
      .from('qrt_ids')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting records:', countError.message);
    } else {
      console.log(`Total QRT IDs: ${totalCount || 0}`);
    }

    // Count by status
    const { data: statusData, error: statusError } = await supabase
      .from('qrt_ids')
      .select('status');

    if (statusError) {
      console.error('❌ Error fetching status data:', statusError.message);
    } else {
      const statusCounts = {};
      statusData?.forEach(item => {
        statusCounts[item.status] = (statusCounts[item.status] || 0) + 1;
      });

      console.log('\nStatus Breakdown:');
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
    }

    // Recent records
    console.log('\n📋 RECENT QRT IDS (Last 5):\n');

    const { data: recentData, error: recentError } = await supabase
      .from('qrt_ids')
      .select('id, qrt_code, full_name, status, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ Error fetching recent records:', recentError.message);
    } else {
      if (recentData && recentData.length > 0) {
        recentData.forEach((record, idx) => {
          console.log(`${idx + 1}. ${record.qrt_code}`);
          console.log(`   Name: ${record.full_name}`);
          console.log(`   Status: ${record.status}`);
          console.log(`   User ID: ${record.user_id || 'NULL'}`);
          console.log(`   Created: ${record.created_at}`);
          console.log('');
        });
      } else {
        console.log('No records found');
      }
    }

    // Check for certificates table
    console.log('\n📊 CERTIFICATES TABLE:\n');

    const { count: certCount, error: certError } = await supabase
      .from('certificates')
      .select('*', { count: 'exact', head: true });

    if (certError) {
      console.error('❌ Error accessing certificates:', certError.message);
    } else {
      console.log(`Total Certificates: ${certCount || 0}`);
    }

    // Check for payments table
    console.log('\n📊 PAYMENTS TABLE:\n');

    const { count: paymentCount, error: paymentError } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true });

    if (paymentError) {
      console.error('❌ Error accessing payments:', paymentError.message);
    } else {
      console.log(`Total Payments: ${paymentCount || 0}`);
    }

    console.log('\n✅ Schema inspection complete!\n');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run inspection
inspectSchema().catch(console.error);
