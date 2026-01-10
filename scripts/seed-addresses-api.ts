// PSGC Address Seeding Script
// Run this script once to populate the address tables with Philippine Standard Geographic Code data
// Source: https://psgc.cloud/api

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface PSGCProvince {
  code: string
  name: string
  regionCode: string
}

interface PSGCCity {
  code: string
  name: string
  provinceCode: string
  isCity?: boolean
  isMunicipality?: boolean
  type?: string
  zip_code?: string
  district?: string
}

interface PSGCBarangay {
  code: string
  name: string
  cityCode?: string
  municipalityCode?: string
}

// ZIP codes for major cities (manually curated - PSGC doesn't include ZIP codes)
const ZIP_CODES: Record<string, string> = {
  // Metro Manila
  "133900000": "1000", // Manila
  "137400000": "1100", // Quezon City
  "137600000": "1200", // Makati
  "137500000": "1300", // Pasig
  "137300000": "1400", // Caloocan
  "137200000": "1500", // Mandaluyong
  "137100000": "1550", // San Juan
  "136000000": "1600", // Pasay
  "138400000": "1700", // Parañaque
  "138500000": "1750", // Las Piñas
  "138600000": "1770", // Muntinlupa
  "138300000": "1800", // Marikina
  "136100000": "1850", // Pateros
  "138100000": "1900", // Taguig
  "138200000": "1920", // Valenzuela
  "136200000": "1950", // Malabon
  "136300000": "1960", // Navotas
  // Pampanga
  "035401000": "2009", // Angeles City
  "035402000": "2010", // Mabalacat
  "035403000": "2011", // Magalang
  "035404000": "2000", // San Fernando
  "035405000": "2003", // Apalit
  "035406000": "2006", // Arayat
  "035407000": "2001", // Bacolor
  "035408000": "2002", // Candaba
  "035409000": "2004", // Floridablanca
  "035410000": "2005", // Guagua
  "035411000": "2007", // Lubao
  "035412000": "2008", // Macabebe
  "035413000": "2012", // Masantol
  "035414000": "2013", // Mexico
  "035415000": "2014", // Minalin
  "035416000": "2015", // Porac
  "035417000": "2016", // San Luis
  "035418000": "2017", // San Simon
  "035419000": "2018", // Santa Ana
  "035420000": "2019", // Santa Rita
  "035421000": "2020", // Santo Tomas
  "035422000": "2021", // Sasmuan
  // Zambales
  "036000000": "2200", // Zambales Province
  "036001000": "2201", // Botolan
  "036002000": "2202", // Cabangan
  "036003000": "2203", // Candelaria
  "036004000": "2204", // Castillejos
  "036005000": "2200", // Iba
  "036006000": "2206", // Masinloc
  "036007000": "2207", // Olongapo
  "036008000": "2208", // Palauig
  "036009000": "2209", // San Antonio
  "036010000": "2210", // San Felipe
  "036011000": "2211", // San Marcelino
  "036012000": "2212", // San Narciso
  "036013000": "2209", // Subic
  "036014000": "2214", // Santa Cruz
}

async function fetchWithRetry(url: string, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 60000) // 60 second timeout

      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeout)

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.log(`Attempt ${i + 1} failed for ${url}: ${(error as Error).message}, retrying...`)
      if (i === retries - 1) throw error
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)))
    }
  }
}

async function seedProvinces() {
  console.log("Fetching provinces from PSGC API...")
  const provinces: PSGCProvince[] = await fetchWithRetry("https://psgc.cloud/api/provinces")
  const cities: PSGCCity[] = await fetchWithRetry("https://psgc.cloud/api/cities-municipalities")

  console.log(`Fetched ${provinces.length} provinces from PSGC API`)

  // PSGC structure: Region(2) + Province(2) + District(2) + City(1) + Barangay(3)
  // Districts are administrative codes only - Filipinos don't select by district
  // We only expose Province → City → Barangay to users
  // Districts are handled internally in the code structure

  // Create province entries WITHOUT district level (user-friendly)
  const provinceList = provinces.map((p) => {
    // Use main province code: Region(2) + Province(2) + "00000"
    // This ignores district variations (80, 81, 82, etc.)
    const region = p.code.substring(0, 2)
    const province = p.code.substring(2, 4)
    const mainProvinceCode = region + province + "00000"

    return {
      code: mainProvinceCode,
      name: p.name,
      region_code: p.regionCode,
    }
  })

  const { error } = await supabase.from("address_provinces").upsert(provinceList, {
    onConflict: "code",
  })

  if (error) throw error

  await supabase.from("address_sync_log").insert({
    entity_type: "provinces",
    records_synced: provinceList.length,
  })

  console.log(`✓ Inserted ${provinceList.length} province entries (district-agnostic)`)
  return provinceList.length
}

async function seedCities() {
  console.log("Fetching cities/municipalities from PSGC API...")
  const cities: PSGCCity[] = await fetchWithRetry("https://psgc.cloud/api/cities-municipalities")

  console.log(`Fetched ${cities.length} cities/municipalities from PSGC API`)

  // Insert in batches of 1000
  const batchSize = 1000
  for (let i = 0; i < cities.length; i += batchSize) {
    const batch = cities.slice(i, i + batchSize)
    const { error } = await supabase.from("address_cities").upsert(
      batch.map((c) => {
        // PSGC codes are 10 digits, database schema is VARCHAR(9)
        // Truncate to 9 digits for consistency
        const code9 = c.code.substring(0, 9)

        // Derive province code from city code (WITHOUT district)
        // PSGC 10-digit structure: Region(2) + Province(2) + District(2) + City(1) + Barangay(3)
        // E.g., 0102801000 = Region 01 + Province 02 + District 80 + City 1 + Barangay 000
        // Province code (district-agnostic): Region(2) + Province(2) + "00000"
        // E.g., 010280100 -> 010200000 (Ilocos Norte, no district)
        //       0102810000 -> 010200000 (same province, different district code)
        const region = code9.substring(0, 2)
        const province = code9.substring(2, 4)
        const provinceCode = region + province + "00000"

        return {
          code: code9,
          name: c.name,
          province_code: provinceCode,
          // Use ZIP code from API first, then fallback to manual mapping, then null
          zip_code: c.zip_code || ZIP_CODES[c.code] || null,
          type: c.type === "City" ? "City" : "Municipality",
        }
      }),
      { onConflict: "code" },
    )

    if (error) {
      console.error(`Error in batch ${Math.floor(i / batchSize) + 1}:`, error)
      throw error
    }
    console.log(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cities.length / batchSize)} done`)
  }

  await supabase.from("address_sync_log").insert({
    entity_type: "cities",
    records_synced: cities.length,
  })

  console.log(`✓ Inserted ${cities.length} cities/municipalities (codes truncated to 9 digits)`)
  return cities.length
}

async function seedBarangays() {
  console.log("Fetching barangays per city from PSGC API...")

  // First, get all city codes from our database
  const { data: cities, error: cityError } = await supabase
    .from("address_cities")
    .select("code, name")
    .order("code")

  if (cityError || !cities) {
    console.error("Failed to fetch cities:", cityError)
    return 0
  }

  console.log(`Found ${cities.length} cities to fetch barangays for...`)

  let totalBarangays = 0
  let successfulCities = 0
  let failedCities = 0
  const batchSize = 500 // Insert every 500 barangays

  let pendingBarangays: { code: string; name: string; city_code: string }[] = []

  // Fetch barangays for each city with rate limiting
  for (let i = 0; i < cities.length; i++) {
    const city = cities[i]
    // PSGC cloud uses 10-digit codes (pad with 0)
    const cityCode10 = city.code.padEnd(10, "0")

    // Rate limit: 250ms delay between requests to avoid 429
    await new Promise((r) => setTimeout(r, 250))

    try {
      const cityBarangays: PSGCBarangay[] = await fetchWithRetry(
        `https://psgc.cloud/api/cities-municipalities/${cityCode10}/barangays`,
        2 // Only 2 retries per city to speed up
      )

      if (cityBarangays && cityBarangays.length > 0) {
        // Add to pending batch
        cityBarangays.forEach((b) => {
          pendingBarangays.push({
            code: b.code,
            name: b.name,
            city_code: city.code,
          })
        })
        totalBarangays += cityBarangays.length
        successfulCities++

        // Insert when batch is large enough
        if (pendingBarangays.length >= batchSize) {
          const { error } = await supabase
            .from("address_barangays")
            .upsert(pendingBarangays, { onConflict: "code" })

          if (error) {
            console.error(`Batch insert error:`, error.message)
          } else {
            console.log(`  Batch inserted: ${pendingBarangays.length} barangays (total: ${totalBarangays})`)
          }
          pendingBarangays = []
        }
      }
    } catch {
      failedCities++
    }

    // Progress update every 100 cities
    if ((i + 1) % 100 === 0) {
      console.log(`  Progress: ${i + 1}/${cities.length} cities (${totalBarangays} barangays found)`)
    }
  }

  // Insert remaining barangays
  if (pendingBarangays.length > 0) {
    const { error } = await supabase
      .from("address_barangays")
      .upsert(pendingBarangays, { onConflict: "code" })

    if (error) {
      console.error(`Final batch insert error:`, error.message)
    } else {
      console.log(`  Final batch inserted: ${pendingBarangays.length} barangays`)
    }
  }

  console.log(`\n✓ Barangay seeding complete:`)
  console.log(`  Total barangays: ${totalBarangays}`)
  console.log(`  Successful cities: ${successfulCities}`)
  console.log(`  Failed cities: ${failedCities}`)

  if (totalBarangays > 0) {
    await supabase.from("address_sync_log").insert({
      entity_type: "barangays",
      records_synced: totalBarangays,
    })
  }

  return totalBarangays
}

async function main() {
  console.log("=== PSGC Address Seeding Script ===\n")

  try {
    const provinceCount = await seedProvinces()
    const cityCount = await seedCities()

    let barangayCount = 0
    try {
      barangayCount = await seedBarangays()
    } catch (error) {
      console.warn("\n⚠️  Barangay seeding failed (API issue):")
      console.warn("  Error:", (error as Error).message)
      console.warn("  This is non-critical - cities have been seeded successfully")
      console.warn("  You can retry barangay seeding later with: npx tsx scripts/seed-addresses.ts")
    }

    console.log("\n=== Seeding Complete ===")
    console.log(`Provinces: ${provinceCount}`)
    console.log(`Cities/Municipalities: ${cityCount}`)
    console.log(`Barangays: ${barangayCount}`)

    if (barangayCount === 0) {
      console.log("\n⚠️  Barangay seeding was skipped due to API unavailability")
      console.log("Partial seeding is complete - city selection is fully functional")
    }
  } catch (error) {
    console.error("Seeding failed:", error)
    process.exit(1)
  }
}

main()
