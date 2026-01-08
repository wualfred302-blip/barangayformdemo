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
  isCity: boolean
  isMunicipality: boolean
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
      const response = await fetch(url)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return await response.json()
    } catch (error) {
      console.log(`Attempt ${i + 1} failed for ${url}, retrying...`)
      if (i === retries - 1) throw error
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
}

async function seedProvinces() {
  console.log("Fetching provinces from PSGC API...")
  const provinces: PSGCProvince[] = await fetchWithRetry("https://psgc.cloud/api/provinces")

  console.log(`Inserting ${provinces.length} provinces...`)

  const { error } = await supabase.from("address_provinces").upsert(
    provinces.map((p) => ({
      code: p.code,
      name: p.name,
      region_code: p.regionCode,
    })),
    { onConflict: "code" },
  )

  if (error) throw error

  await supabase.from("address_sync_log").insert({
    entity_type: "provinces",
    records_synced: provinces.length,
  })

  console.log(`✓ Inserted ${provinces.length} provinces`)
  return provinces.length
}

async function seedCities() {
  console.log("Fetching cities/municipalities from PSGC API...")
  const cities: PSGCCity[] = await fetchWithRetry("https://psgc.cloud/api/cities-municipalities")

  console.log(`Inserting ${cities.length} cities/municipalities...`)

  // Insert in batches of 500
  const batchSize = 500
  for (let i = 0; i < cities.length; i += batchSize) {
    const batch = cities.slice(i, i + batchSize)
    const { error } = await supabase.from("address_cities").upsert(
      batch.map((c) => ({
        code: c.code,
        name: c.name,
        province_code: c.provinceCode,
        zip_code: ZIP_CODES[c.code] || null,
        type: c.isCity ? "City" : "Municipality",
      })),
      { onConflict: "code" },
    )

    if (error) throw error
    console.log(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cities.length / batchSize)} done`)
  }

  await supabase.from("address_sync_log").insert({
    entity_type: "cities",
    records_synced: cities.length,
  })

  console.log(`✓ Inserted ${cities.length} cities/municipalities`)
  return cities.length
}

async function seedBarangays() {
  console.log("Fetching barangays from PSGC API...")
  const barangays: PSGCBarangay[] = await fetchWithRetry("https://psgc.cloud/api/barangays")

  console.log(`Inserting ${barangays.length} barangays...`)

  // Insert in batches of 1000
  const batchSize = 1000
  for (let i = 0; i < barangays.length; i += batchSize) {
    const batch = barangays.slice(i, i + batchSize)
    const { error } = await supabase.from("address_barangays").upsert(
      batch.map((b) => ({
        code: b.code,
        name: b.name,
        city_code: b.cityCode || b.municipalityCode,
      })),
      { onConflict: "code" },
    )

    if (error) {
      console.error(`Error in batch ${Math.floor(i / batchSize) + 1}:`, error)
      // Continue with next batch
    } else {
      console.log(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(barangays.length / batchSize)} done`)
    }
  }

  await supabase.from("address_sync_log").insert({
    entity_type: "barangays",
    records_synced: barangays.length,
  })

  console.log(`✓ Inserted ${barangays.length} barangays`)
  return barangays.length
}

async function main() {
  console.log("=== PSGC Address Seeding Script ===\n")

  try {
    const provinceCount = await seedProvinces()
    const cityCount = await seedCities()
    const barangayCount = await seedBarangays()

    console.log("\n=== Seeding Complete ===")
    console.log(`Provinces: ${provinceCount}`)
    console.log(`Cities/Municipalities: ${cityCount}`)
    console.log(`Barangays: ${barangayCount}`)
  } catch (error) {
    console.error("Seeding failed:", error)
    process.exit(1)
  }
}

main()
