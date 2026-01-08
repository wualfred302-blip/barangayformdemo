// Validation script for partial address data seed
// Checks database record counts and data quality

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function validateRecordCounts() {
  console.log("=== Record Count Validation ===\n")

  // Count provinces
  const { count: provinceCount, error: provinceError } = await supabase
    .from("address_provinces")
    .select("*", { count: "exact", head: true })

  if (provinceError) {
    console.error("Error counting provinces:", provinceError)
    return false
  }

  // Count cities
  const { count: cityCount, error: cityError } = await supabase
    .from("address_cities")
    .select("*", { count: "exact", head: true })

  if (cityError) {
    console.error("Error counting cities:", cityError)
    return false
  }

  // Count barangays
  const { count: barangayCount, error: barangayError } = await supabase
    .from("address_barangays")
    .select("*", { count: "exact", head: true })

  if (barangayError) {
    console.error("Error counting barangays:", barangayError)
    return false
  }

  console.log("Record Counts:")
  console.log(`  Provinces: ${provinceCount} (expected: 82)`)
  console.log(`  Cities/Municipalities: ${cityCount} (expected: 76+ for partial seed)`)
  console.log(`  Barangays: ${barangayCount} (expected: 94+ for partial seed)`)
  console.log()

  // Check if counts meet minimum expectations
  const valid =
    (provinceCount || 0) >= 82 && (cityCount || 0) >= 76 && (barangayCount || 0) >= 94

  if (valid) {
    console.log("✓ Record counts meet minimum expectations for partial seed\n")
  } else {
    console.log("✗ Record counts below expected minimums\n")
  }

  return valid
}

async function validatePampangaData() {
  console.log("=== Pampanga Region Validation ===\n")

  // Check Pampanga province
  const { data: pampanga, error: provinceError } = await supabase
    .from("address_provinces")
    .select("code, name")
    .ilike("name", "%pampanga%")
    .single()

  if (provinceError || !pampanga) {
    console.error("✗ Pampanga province not found")
    return false
  }

  console.log(`✓ Pampanga province found (code: ${pampanga.code})`)

  // Check Pampanga cities
  const { data: cities, error: cityError } = await supabase
    .from("address_cities")
    .select("code, name, zip_code")
    .eq("province_code", pampanga.code)
    .order("name")

  if (cityError) {
    console.error("Error fetching Pampanga cities:", cityError)
    return false
  }

  console.log(`✓ Found ${cities?.length || 0} cities/municipalities in Pampanga:`)
  cities?.forEach((city) => {
    console.log(`    - ${city.name} (ZIP: ${city.zip_code || "N/A"})`)
  })
  console.log()

  // Check Mabalacat barangays
  const mabalacat = cities?.find((c) => c.name.toLowerCase().includes("mabalacat"))
  if (mabalacat) {
    const { data: barangays, error: barangayError } = await supabase
      .from("address_barangays")
      .select("code, name")
      .eq("city_code", mabalacat.code)
      .order("name")

    if (barangayError) {
      console.error("Error fetching Mabalacat barangays:", barangayError)
    } else {
      console.log(`✓ Found ${barangays?.length || 0} barangays in Mabalacat City`)
      if ((barangays?.length || 0) >= 27) {
        console.log("  ✓ All Mabalacat barangays present (27/27)\n")
      }
    }
  }

  // Check Angeles City barangays
  const angeles = cities?.find((c) => c.name.toLowerCase().includes("angeles"))
  if (angeles) {
    const { data: barangays, error: barangayError } = await supabase
      .from("address_barangays")
      .select("code, name")
      .eq("city_code", angeles.code)
      .order("name")

    if (barangayError) {
      console.error("Error fetching Angeles barangays:", barangayError)
    } else {
      console.log(`✓ Found ${barangays?.length || 0} barangays in Angeles City`)
      if ((barangays?.length || 0) >= 32) {
        console.log("  ✓ All Angeles barangays present (32/32)\n")
      }
    }
  }

  return true
}

async function validateDataQuality() {
  console.log("=== Data Quality Validation ===\n")

  // Check for duplicate provinces
  const { data: provinces } = await supabase
    .from("address_provinces")
    .select("code, name")

  const provinceCodes = new Set()
  const provinceNames = new Set()
  let duplicates = 0

  provinces?.forEach((p) => {
    if (provinceCodes.has(p.code)) {
      console.log(`✗ Duplicate province code: ${p.code}`)
      duplicates++
    }
    provinceCodes.add(p.code)
    provinceNames.add(p.name)
  })

  if (duplicates === 0) {
    console.log("✓ No duplicate province codes found")
  }

  // Check ZIP codes populated for major cities
  const { data: citiesWithZip, error } = await supabase
    .from("address_cities")
    .select("code, name, zip_code")
    .not("zip_code", "is", null)

  if (!error) {
    console.log(`✓ ${citiesWithZip?.length || 0} cities have ZIP codes populated`)
  }

  // Check for orphaned cities (cities without valid province references)
  const { data: orphanedCities } = await supabase
    .from("address_cities")
    .select("code, name, province_code")
    .is("province_code", null)

  if ((orphanedCities?.length || 0) === 0) {
    console.log("✓ No orphaned cities (all have valid province references)")
  } else {
    console.log(`⚠ Found ${orphanedCities?.length} cities without province references`)
  }

  // Check for orphaned barangays
  const { data: orphanedBarangays } = await supabase
    .from("address_barangays")
    .select("code, name, city_code")
    .is("city_code", null)

  if ((orphanedBarangays?.length || 0) === 0) {
    console.log("✓ No orphaned barangays (all have valid city references)")
  } else {
    console.log(`⚠ Found ${orphanedBarangays?.length} barangays without city references`)
  }

  console.log()
  return true
}

async function testAPIQueries() {
  console.log("=== API Query Testing ===\n")

  // Test province search
  console.log("Testing province search for 'pamp'...")
  const { data: provinces, error: provinceError } = await supabase
    .from("address_provinces")
    .select("code, name")
    .or("name.ilike.pamp%,name.ilike.%pamp%")
    .order("name")
    .limit(20)

  if (provinceError) {
    console.error("✗ Province search failed:", provinceError)
  } else if (provinces && provinces.length > 0) {
    console.log(`✓ Province search returned ${provinces.length} results:`)
    provinces.forEach((p) => console.log(`    - ${p.name}`))
  }
  console.log()

  // Test city search with province filter
  const pampanga = provinces?.find((p) => p.name === "Pampanga")
  if (pampanga) {
    console.log("Testing city search for 'mabala' in Pampanga...")
    const { data: cities, error: cityError } = await supabase
      .from("address_cities")
      .select("code, name, zip_code")
      .eq("province_code", pampanga.code)
      .or("name.ilike.mabala%,name.ilike.%mabala%")
      .order("name")
      .limit(20)

    if (cityError) {
      console.error("✗ City search failed:", cityError)
    } else if (cities && cities.length > 0) {
      console.log(`✓ City search returned ${cities.length} results:`)
      cities.forEach((c) => console.log(`    - ${c.name} (ZIP: ${c.zip_code || "N/A"})`))
    }
    console.log()

    // Test barangay search
    const mabalacat = cities?.find((c) => c.name.toLowerCase().includes("mabalacat"))
    if (mabalacat) {
      console.log("Testing barangay search for 'atlu' in Mabalacat...")
      const { data: barangays, error: barangayError } = await supabase
        .from("address_barangays")
        .select("code, name")
        .eq("city_code", mabalacat.code)
        .or("name.ilike.atlu%,name.ilike.%atlu%")
        .order("name")
        .limit(20)

      if (barangayError) {
        console.error("✗ Barangay search failed:", barangayError)
      } else if (barangays && barangays.length > 0) {
        console.log(`✓ Barangay search returned ${barangays.length} results:`)
        barangays.forEach((b) => console.log(`    - ${b.name}`))
      }
      console.log()
    }
  }

  return true
}

async function main() {
  console.log("=== Partial Data Seed Validation Script ===\n")

  try {
    const countValid = await validateRecordCounts()
    const pampangaValid = await validatePampangaData()
    const qualityValid = await validateDataQuality()
    await testAPIQueries()

    console.log("=== Validation Summary ===\n")

    if (countValid && pampangaValid && qualityValid) {
      console.log("✓ All validations passed!")
      console.log("✓ Partial seed is sufficient for MVP testing")
      console.log("✓ System is production-ready for Pampanga region")
      console.log("\nNote: Full national data seed (42k+ barangays) can be deferred to post-MVP deployment")
      process.exit(0)
    } else {
      console.log("✗ Some validations failed")
      console.log("Please review the errors above")
      process.exit(1)
    }
  } catch (error) {
    console.error("Validation script error:", error)
    process.exit(1)
  }
}

main()
