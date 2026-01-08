/**
 * Data Seed Validation Script
 *
 * Validates the current state of the address autocomplete database
 * by checking record counts, data quality, and API functionality.
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

interface ValidationResult {
  passed: boolean;
  message: string;
  data?: any;
}

/**
 * Query and display record counts
 */
async function validateRecordCounts(): Promise<ValidationResult> {
  console.log('\n🔍 Checking record counts...');

  try {
    // Query provinces count
    const { count: provincesCount, error: provincesError } = await supabase
      .from('address_provinces')
      .select('*', { count: 'exact', head: true });

    // Query cities count
    const { count: citiesCount, error: citiesError } = await supabase
      .from('address_cities')
      .select('*', { count: 'exact', head: true });

    // Query barangays count
    const { count: barangaysCount, error: barangaysError } = await supabase
      .from('address_barangays')
      .select('*', { count: 'exact', head: true });

    if (provincesError || citiesError || barangaysError) {
      return {
        passed: false,
        message: 'Database query errors',
        data: { provincesError, citiesError, barangaysError }
      };
    }

    console.log(`  Provinces: ${provincesCount}`);
    console.log(`  Cities: ${citiesCount}`);
    console.log(`  Barangays: ${barangaysCount}`);

    // Expected values from spec
    const expectedProvinces = 82;
    const expectedCitiesMin = 76;
    const expectedBarangaysMin = 94;

    const passes =
      provincesCount === expectedProvinces &&
      (citiesCount || 0) >= expectedCitiesMin &&
      (barangaysCount || 0) >= expectedBarangaysMin;

    return {
      passed: passes,
      message: passes
        ? '✅ Record counts meet MVP requirements'
        : '⚠️  Record counts below expected minimum',
      data: { provincesCount, citiesCount, barangaysCount }
    };
  } catch (error) {
    return {
      passed: false,
      message: `❌ Error querying database: ${error}`,
    };
  }
}

/**
 * Verify Pampanga region is fully seeded
 */
async function validatePampangaRegion(): Promise<ValidationResult> {
  console.log('\n🔍 Verifying Pampanga region...');

  try {
    // Find Pampanga province
    const { data: pampanga, error: provError } = await supabase
      .from('address_provinces')
      .select('code, name')
      .ilike('name', '%pampanga%')
      .single();

    if (provError || !pampanga) {
      return {
        passed: false,
        message: '❌ Pampanga province not found'
      };
    }

    console.log(`  Province: ${pampanga.name} (${pampanga.code})`);

    // Count cities in Pampanga
    const { data: cities, error: cityError } = await supabase
      .from('address_cities')
      .select('code, name')
      .eq('province_code', pampanga.code);

    if (cityError) {
      return {
        passed: false,
        message: '❌ Error querying Pampanga cities'
      };
    }

    console.log(`  Cities in Pampanga: ${cities?.length || 0}`);

    // Find Mabalacat
    const mabalacat = cities?.find(c => c.name.toLowerCase().includes('mabalacat'));

    if (!mabalacat) {
      return {
        passed: false,
        message: '⚠️  Mabalacat City not found in seeded data'
      };
    }

    console.log(`  Mabalacat: ${mabalacat.name} (${mabalacat.code})`);

    // Count barangays in Mabalacat
    const { count: mabalakatBrgys, error: brgyError } = await supabase
      .from('address_barangays')
      .select('*', { count: 'exact', head: true })
      .eq('city_code', mabalacat.code);

    if (brgyError) {
      return {
        passed: false,
        message: '❌ Error querying Mabalacat barangays'
      };
    }

    console.log(`  Barangays in Mabalacat: ${mabalakatBrgys}`);

    return {
      passed: true,
      message: '✅ Pampanga region fully seeded',
      data: {
        province: pampanga,
        citiesCount: cities?.length,
        mabalakatBarangays: mabalakatBrgys
      }
    };
  } catch (error) {
    return {
      passed: false,
      message: `❌ Error validating Pampanga: ${error}`
    };
  }
}

/**
 * Check for data quality issues
 */
async function validateDataQuality(): Promise<ValidationResult> {
  console.log('\n🔍 Checking data quality...');

  try {
    // Check for duplicate province codes
    const { data: provinces, error: provError } = await supabase
      .from('address_provinces')
      .select('code');

    if (provError) {
      return {
        passed: false,
        message: '❌ Error checking provinces'
      };
    }

    const provinceCodes = provinces?.map(p => p.code) || [];
    const uniqueProvinceCodes = new Set(provinceCodes);

    if (provinceCodes.length !== uniqueProvinceCodes.size) {
      console.log('  ⚠️  Duplicate province codes found');
      return {
        passed: false,
        message: '⚠️  Data quality issue: Duplicate province codes'
      };
    }

    console.log(`  ✅ No duplicate province codes (${provinceCodes.length} unique)`);

    // Check for cities with ZIP codes
    const { count: citiesWithZip, error: zipError } = await supabase
      .from('address_cities')
      .select('*', { count: 'exact', head: true })
      .not('zip_code', 'is', null);

    if (zipError) {
      return {
        passed: false,
        message: '❌ Error checking ZIP codes'
      };
    }

    console.log(`  ✅ Cities with ZIP codes: ${citiesWithZip}`);

    // Check Mabalacat ZIP code specifically
    const { data: mabalacat, error: mabError } = await supabase
      .from('address_cities')
      .select('name, zip_code')
      .ilike('name', '%mabalacat%')
      .single();

    if (mabError || !mabalacat) {
      console.log('  ⚠️  Could not verify Mabalacat ZIP code');
    } else {
      console.log(`  ✅ Mabalacat ZIP code: ${mabalacat.zip_code}`);
    }

    return {
      passed: true,
      message: '✅ Data quality checks passed',
      data: {
        uniqueProvinces: provinceCodes.length,
        citiesWithZip
      }
    };
  } catch (error) {
    return {
      passed: false,
      message: `❌ Error checking data quality: ${error}`
    };
  }
}

/**
 * Test API queries with seeded data
 */
async function validateAPIQueries(): Promise<ValidationResult> {
  console.log('\n🔍 Testing API queries...');

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  try {
    // Test 1: Search provinces
    console.log('\n  Test 1: Province search');
    const provResponse = await fetch(`${baseUrl}/api/address/provinces?search=pamp`);
    const provData = await provResponse.json();

    if (!provResponse.ok || !provData.provinces || provData.provinces.length === 0) {
      console.log('    ❌ Province search failed');
      return {
        passed: false,
        message: '❌ Province API query failed'
      };
    }

    console.log(`    ✅ Found province: ${provData.provinces[0].name}`);
    const pampangaCode = provData.provinces[0].code;

    // Test 2: Search cities in Pampanga
    console.log('\n  Test 2: City search with province filter');
    const cityResponse = await fetch(`${baseUrl}/api/address/cities?search=mabala&province_code=${pampangaCode}`);
    const cityData = await cityResponse.json();

    if (!cityResponse.ok || !cityData.cities || cityData.cities.length === 0) {
      console.log('    ❌ City search failed');
      return {
        passed: false,
        message: '❌ City API query failed'
      };
    }

    console.log(`    ✅ Found city: ${cityData.cities[0].name}`);
    console.log(`    ✅ ZIP code: ${cityData.cities[0].zip_code}`);
    const cityCode = cityData.cities[0].code;

    // Test 3: Search barangays in Mabalacat
    console.log('\n  Test 3: Barangay search with city filter');
    const brgyResponse = await fetch(`${baseUrl}/api/address/barangays?city_code=${cityCode}&search=atlu`);
    const brgyData = await brgyResponse.json();

    if (!brgyResponse.ok || !brgyData.barangays) {
      console.log('    ❌ Barangay search failed');
      return {
        passed: false,
        message: '❌ Barangay API query failed'
      };
    }

    console.log(`    ✅ Found ${brgyData.barangays.length} barangay(s)`);
    if (brgyData.barangays.length > 0) {
      console.log(`    ✅ Example: ${brgyData.barangays[0].name}`);
    }

    return {
      passed: true,
      message: '✅ All API queries successful',
      data: {
        provinceFound: provData.provinces[0],
        cityFound: cityData.cities[0],
        barangaysFound: brgyData.barangays.length
      }
    };
  } catch (error) {
    return {
      passed: false,
      message: `❌ Error testing API: ${error}`
    };
  }
}

/**
 * Main validation function
 */
async function runValidation() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Philippine Address Autocomplete - Data Seed Validation');
  console.log('═══════════════════════════════════════════════════════');

  const results: ValidationResult[] = [];

  // Run all validation checks
  results.push(await validateRecordCounts());
  results.push(await validatePampangaRegion());
  results.push(await validateDataQuality());
  results.push(await validateAPIQueries());

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  VALIDATION SUMMARY');
  console.log('═══════════════════════════════════════════════════════');

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;

  results.forEach(result => {
    console.log(`  ${result.message}`);
  });

  console.log('\n═══════════════════════════════════════════════════════');

  if (passedCount === totalCount) {
    console.log('  ✅ ALL VALIDATIONS PASSED');
    console.log('  📦 Partial data seed is sufficient for MVP');
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(0);
  } else {
    console.log(`  ⚠️  ${totalCount - passedCount} VALIDATION(S) FAILED`);
    console.log('  ❌ Data seed requires attention');
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

// Run validation
runValidation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
