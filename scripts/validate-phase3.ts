/**
 * Phase 3 Validation Script
 * Comprehensive testing of data seed and UI fixes
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 1. Data Coverage Testing
 */
async function validateDataCoverage() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  1. DATA COVERAGE TESTING');
  console.log('═══════════════════════════════════════════════════════\n');

  // Query counts
  const { count: provincesCount } = await supabase
    .from('address_provinces')
    .select('*', { count: 'exact', head: true });

  const { count: citiesCount } = await supabase
    .from('address_cities')
    .select('*', { count: 'exact', head: true });

  const { count: barangaysCount } = await supabase
    .from('address_barangays')
    .select('*', { count: 'exact', head: true });

  console.log('📊 Database Record Counts:');
  console.log('  Provinces:', provincesCount, '/ 82 (100%)');
  console.log('  Cities:', citiesCount, '/ 1,634');
  console.log('  Barangays:', barangaysCount, '/ 42,000+\n');

  // Calculate coverage
  const cityPercentage = ((citiesCount || 0) / 1634 * 100).toFixed(1);
  const barangayPercentage = ((barangaysCount || 0) / 42000 * 100).toFixed(1);

  console.log('📈 Coverage Percentage:');
  console.log('  Cities:', cityPercentage + '%');
  console.log('  Barangays:', barangayPercentage + '%\n');

  const coveragePass = (citiesCount || 0) >= 1634 && (barangaysCount || 0) >= 42000;

  if (coveragePass) {
    console.log('✅ FULL NATIONAL COVERAGE ACHIEVED');
  } else {
    console.log('⚠️  INCOMPLETE COVERAGE - Expected: 1,634 cities, 42,000+ barangays');
  }

  return { coveragePass, provincesCount, citiesCount, barangaysCount };
}

/**
 * 2. Test Luzon Region Coverage
 */
async function testLuzonCoverage() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  2. LUZON REGION COVERAGE TESTING');
  console.log('═══════════════════════════════════════════════════════\n');

  const testCases = [
    { province: 'Metro Manila', city: 'Manila' },
    { province: 'Metro Manila', city: 'Quezon City' },
    { province: 'Benguet', city: 'Baguio' },
    { province: 'Zambales', city: 'Subic' }
  ];

  let allPassed = true;

  for (const test of testCases) {
    console.log(`Testing: ${test.province} → ${test.city}`);

    // Find province
    const { data: province } = await supabase
      .from('address_provinces')
      .select('code, name')
      .ilike('name', `%${test.province}%`)
      .single();

    if (!province) {
      console.log(`  ❌ Province not found: ${test.province}\n`);
      allPassed = false;
      continue;
    }

    // Find city
    const { data: city } = await supabase
      .from('address_cities')
      .select('code, name, zip_code')
      .eq('province_code', province.code)
      .ilike('name', `%${test.city}%`)
      .single();

    if (!city) {
      console.log(`  ❌ City not found: ${test.city}\n`);
      allPassed = false;
      continue;
    }

    // Count barangays
    const { count: barangayCount } = await supabase
      .from('address_barangays')
      .select('*', { count: 'exact', head: true })
      .eq('city_code', city.code);

    console.log(`  ✅ ${province.name} → ${city.name}`);
    console.log(`     ZIP: ${city.zip_code || 'N/A'}`);
    console.log(`     Barangays: ${barangayCount}\n`);
  }

  if (allPassed) {
    console.log('✅ All Luzon test cases passed');
  } else {
    console.log('❌ Some Luzon test cases failed');
  }

  return allPassed;
}

/**
 * 3. Test Visayas Region Coverage
 */
async function testVisayasCoverage() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  3. VISAYAS REGION COVERAGE TESTING');
  console.log('═══════════════════════════════════════════════════════\n');

  const testCases = [
    { province: 'Cebu', city: 'Cebu City' },
    { province: 'Iloilo', city: 'Iloilo City' }
  ];

  let allPassed = true;

  for (const test of testCases) {
    console.log(`Testing: ${test.province} → ${test.city}`);

    const { data: province } = await supabase
      .from('address_provinces')
      .select('code, name')
      .ilike('name', `%${test.province}%`)
      .single();

    if (!province) {
      console.log(`  ❌ Province not found: ${test.province}\n`);
      allPassed = false;
      continue;
    }

    const { data: city } = await supabase
      .from('address_cities')
      .select('code, name, zip_code')
      .eq('province_code', province.code)
      .ilike('name', `%${test.city}%`)
      .single();

    if (!city) {
      console.log(`  ❌ City not found: ${test.city}\n`);
      allPassed = false;
      continue;
    }

    const { count: barangayCount } = await supabase
      .from('address_barangays')
      .select('*', { count: 'exact', head: true })
      .eq('city_code', city.code);

    console.log(`  ✅ ${province.name} → ${city.name}`);
    console.log(`     ZIP: ${city.zip_code || 'N/A'}`);
    console.log(`     Barangays: ${barangayCount}\n`);
  }

  if (allPassed) {
    console.log('✅ All Visayas test cases passed');
  } else {
    console.log('❌ Some Visayas test cases failed');
  }

  return allPassed;
}

/**
 * 4. Test Mindanao Region Coverage
 */
async function testMindanaoCoverage() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  4. MINDANAO REGION COVERAGE TESTING');
  console.log('═══════════════════════════════════════════════════════\n');

  const testCases = [
    { province: 'Davao del Sur', city: 'Davao City' },
    { province: 'Misamis Oriental', city: 'Cagayan de Oro' }
  ];

  let allPassed = true;

  for (const test of testCases) {
    console.log(`Testing: ${test.province} → ${test.city}`);

    const { data: province } = await supabase
      .from('address_provinces')
      .select('code, name')
      .ilike('name', `%${test.province}%`)
      .single();

    if (!province) {
      console.log(`  ❌ Province not found: ${test.province}\n`);
      allPassed = false;
      continue;
    }

    const { data: city } = await supabase
      .from('address_cities')
      .select('code, name, zip_code')
      .eq('province_code', province.code)
      .ilike('name', `%${test.city}%`)
      .single();

    if (!city) {
      console.log(`  ❌ City not found: ${test.city}\n`);
      allPassed = false;
      continue;
    }

    const { count: barangayCount } = await supabase
      .from('address_barangays')
      .select('*', { count: 'exact', head: true })
      .eq('city_code', city.code);

    console.log(`  ✅ ${province.name} → ${city.name}`);
    console.log(`     ZIP: ${city.zip_code || 'N/A'}`);
    console.log(`     Barangays: ${barangayCount}\n`);
  }

  if (allPassed) {
    console.log('✅ All Mindanao test cases passed');
  } else {
    console.log('❌ Some Mindanao test cases failed');
  }

  return allPassed;
}

/**
 * 5. Test Edgar Garcia's ID (Zambales → Subic → Ilwas)
 */
async function testEdgarGarciaScenario() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  5. EDGAR GARCIA SCENARIO TEST');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('Testing: Zambales → Subic → Ilwas (from OCR test case)');

  // Find Zambales
  const { data: zambales } = await supabase
    .from('address_provinces')
    .select('code, name')
    .ilike('name', '%zambales%')
    .single();

  if (!zambales) {
    console.log('  ❌ Zambales province not found\n');
    return false;
  }

  console.log(`  Province: ${zambales.name} (${zambales.code})`);

  // Find Subic
  const { data: subic } = await supabase
    .from('address_cities')
    .select('code, name, zip_code')
    .eq('province_code', zambales.code)
    .ilike('name', '%subic%')
    .single();

  if (!subic) {
    console.log('  ❌ Subic city not found\n');
    return false;
  }

  console.log(`  City: ${subic.name} (${subic.code})`);
  console.log(`  ZIP: ${subic.zip_code}`);

  // Find Ilwas barangay
  const { data: ilwas } = await supabase
    .from('address_barangays')
    .select('code, name')
    .eq('city_code', subic.code)
    .ilike('name', '%ilwas%')
    .single();

  if (!ilwas) {
    console.log('  ⚠️  Ilwas barangay not found (might have different spelling)\n');

    // List all barangays in Subic to help debug
    const { data: allBarangays } = await supabase
      .from('address_barangays')
      .select('name')
      .eq('city_code', subic.code)
      .order('name');

    console.log('  Available barangays in Subic:');
    allBarangays?.forEach(b => console.log(`    - ${b.name}`));

    return false;
  }

  console.log(`  Barangay: ${ilwas.name} (${ilwas.code})\n`);
  console.log('✅ Edgar Garcia scenario fully functional');

  return true;
}

/**
 * 6. Verify ZIP codes
 */
async function validateZipCodes() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  6. ZIP CODE VALIDATION');
  console.log('═══════════════════════════════════════════════════════\n');

  // Count cities with ZIP codes
  const { count: citiesWithZip } = await supabase
    .from('address_cities')
    .select('*', { count: 'exact', head: true })
    .not('zip_code', 'is', null);

  const { count: totalCities } = await supabase
    .from('address_cities')
    .select('*', { count: 'exact', head: true });

  const zipPercentage = ((citiesWithZip || 0) / (totalCities || 1) * 100).toFixed(1);

  console.log(`Cities with ZIP codes: ${citiesWithZip} / ${totalCities} (${zipPercentage}%)`);

  // Check major cities
  const majorCities = ['Manila', 'Quezon City', 'Davao City', 'Cebu City'];

  for (const cityName of majorCities) {
    const { data: city } = await supabase
      .from('address_cities')
      .select('name, zip_code')
      .ilike('name', `%${cityName}%`)
      .single();

    if (city) {
      const hasZip = city.zip_code ? '✅' : '❌';
      console.log(`  ${hasZip} ${city.name}: ${city.zip_code || 'Missing'}`);
    }
  }

  console.log();
  const zipPass = (zipPercentage || 0) > 80; // At least 80% should have ZIP codes

  if (zipPass) {
    console.log('✅ ZIP code coverage is good');
  } else {
    console.log('⚠️  ZIP code coverage needs improvement');
  }

  return zipPass;
}

/**
 * Main validation runner
 */
async function runValidation() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  PHASE 3: COMPREHENSIVE TESTING & CODE REVIEW');
  console.log('  Address System Fixes - Validation Report');
  console.log('═══════════════════════════════════════════════════════');

  const results = {
    dataCoverage: false,
    luzonCoverage: false,
    visayasCoverage: false,
    mindanaoCoverage: false,
    edgarGarciaTest: false,
    zipCodeValidation: false
  };

  try {
    // Run all validations
    const dataResult = await validateDataCoverage();
    results.dataCoverage = dataResult.coveragePass;

    results.luzonCoverage = await testLuzonCoverage();
    results.visayasCoverage = await testVisayasCoverage();
    results.mindanaoCoverage = await testMindanaoCoverage();
    results.edgarGarciaTest = await testEdgarGarciaScenario();
    results.zipCodeValidation = await validateZipCodes();

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  VALIDATION SUMMARY');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('Data Coverage Tests:');
    console.log(`  ${results.dataCoverage ? '✅' : '❌'} Full national coverage (1,634 cities, 42,000+ barangays)`);
    console.log();

    console.log('Regional Coverage Tests:');
    console.log(`  ${results.luzonCoverage ? '✅' : '❌'} Luzon region (Manila, Quezon City, Baguio, Zambales/Subic)`);
    console.log(`  ${results.visayasCoverage ? '✅' : '❌'} Visayas region (Cebu, Iloilo)`);
    console.log(`  ${results.mindanaoCoverage ? '✅' : '❌'} Mindanao region (Davao, Cagayan de Oro)`);
    console.log();

    console.log('Scenario Tests:');
    console.log(`  ${results.edgarGarciaTest ? '✅' : '❌'} Edgar Garcia ID scan (Zambales → Subic → Ilwas)`);
    console.log();

    console.log('Data Quality Tests:');
    console.log(`  ${results.zipCodeValidation ? '✅' : '❌'} ZIP code coverage for major cities`);

    const allPassed = Object.values(results).every(r => r === true);

    console.log('\n═══════════════════════════════════════════════════════');

    if (allPassed) {
      console.log('  ✅ ALL VALIDATIONS PASSED');
      console.log('  Phase 1 (Data Seed) completed successfully');
      console.log('═══════════════════════════════════════════════════════\n');
      process.exit(0);
    } else {
      console.log('  ⚠️  SOME VALIDATIONS FAILED');
      console.log('  Phase 1 may be incomplete or errors occurred');
      console.log('═══════════════════════════════════════════════════════\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Fatal error during validation:', error);
    process.exit(1);
  }
}

// Run the validation
runValidation();
