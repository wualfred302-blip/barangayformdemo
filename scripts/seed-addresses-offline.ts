// PSGC Address Seeding Script (Offline version using psgc npm package)
// Run this script to populate address tables with complete Philippine PSGC data
// No API calls - all data is loaded from the psgc package
// Source: npm package 'psgc' v2.2.0

import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"
import { provinces as psgcProvinces, municipalities as psgcMunicipalities, barangays as psgcBarangays } from "psgc"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

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

// Region codes mapping
const REGION_CODES: Record<string, string> = {
  "01": "01", "02": "02", "03": "03", "04": "04", "05": "05",
  "06": "06", "07": "07", "08": "08", "09": "09", "10": "10",
  "11": "11", "12": "12", "13": "13", "14": "14", "15": "15", "16": "16", "17": "17"
}

async function seedProvinces() {
  console.log("Building province list from PSGC package...")

  const allBarangays = psgcBarangays.all()
  const allPsgcProvinces = psgcProvinces.all()
  const allMunicipalities = psgcMunicipalities.all()

  // Build a quick lookup map: municipality name -> province name
  const muniToProvince = new Map<string, string>()
  allMunicipalities.forEach(m => muniToProvince.set(m.name, m.province))

  // Build province map from barangay codes
  const provinceMap = new Map<string, { code: string; name: string; region_code: string }>()

  console.log("Processing barangays to extract province codes...")

  // Extract unique province/district codes from barangays
  allBarangays.forEach((barangay, index) => {
    if (index % 10000 === 0 && index > 0) {
      console.log(`  Processed ${index}/${allBarangays.length} barangays...`)
    }

    const code = barangay.code.toString().padStart(9, "0")
    const regionCode = code.substring(0, 2)
    const provinceCode = code.substring(2, 4)
    const districtCode = code.substring(4, 6)

    // District-level code (most granular province representation)
    const fullProvinceCode = regionCode + provinceCode + districtCode + "000"

    if (!provinceMap.has(fullProvinceCode)) {
      // Get province name from municipality
      const provinceName = muniToProvince.get(barangay.citymun) || `District ${fullProvinceCode}`

      provinceMap.set(fullProvinceCode, {
        code: fullProvinceCode,
        name: districtCode === "00" ? provinceName : `${provinceName} (District ${districtCode})`,
        region_code: regionCode,
      })
    }
  })

  const provinceList = Array.from(provinceMap.values())

  console.log(`Found ${provinceList.length} province/district entries`)

  const { error } = await supabase.from("address_provinces").upsert(provinceList, {
    onConflict: "code",
  })

  if (error) throw error

  await supabase.from("address_sync_log").insert({
    entity_type: "provinces",
    records_synced: provinceList.length,
  })

  console.log(`✓ Inserted ${provinceList.length} province/district entries`)
  return provinceList.length
}

async function seedCities() {
  console.log("Building city list from PSGC package...")

  const allBarangays = psgcBarangays.all()
  const allMunicipalities = psgcMunicipalities.all()

  // Build lookup maps for efficiency
  const muniInfo = new Map<string, { name: string; isCity: boolean }>()
  allMunicipalities.forEach(m => muniInfo.set(m.name, { name: m.name, isCity: m.city }))

  // Build city map from barangay codes
  const cityMap = new Map<string, {
    code: string;
    name: string;
    province_code: string;
    zip_code: string | null;
    type: string
  }>()

  console.log("Processing barangays to extract city codes...")

  // Extract unique city codes from barangays
  allBarangays.forEach((barangay, index) => {
    if (index % 10000 === 0 && index > 0) {
      console.log(`  Processed ${index}/${allBarangays.length} barangays...`)
    }

    const code = barangay.code.toString().padStart(9, "0")
    const regionCode = code.substring(0, 2)
    const provinceCode = code.substring(2, 4)
    const districtCode = code.substring(4, 6)
    const cityCode = code.substring(6, 7)

    const fullCityCode = regionCode + provinceCode + districtCode + cityCode + "00"
    const fullProvinceCode = regionCode + provinceCode + districtCode + "000"

    if (!cityMap.has(fullCityCode)) {
      // Get municipality info from lookup
      const muni = muniInfo.get(barangay.citymun)

      const cityName = muni ? muni.name : barangay.citymun
      const isCity = muni ? muni.isCity : false

      cityMap.set(fullCityCode, {
        code: fullCityCode,
        name: cityName,
        province_code: fullProvinceCode,
        zip_code: ZIP_CODES[fullCityCode] || null,
        type: isCity ? "City" : "Municipality",
      })
    }
  })

  const cityList = Array.from(cityMap.values())

  console.log(`Found ${cityList.length} cities/municipalities`)

  // Insert in batches of 1000
  const batchSize = 1000
  for (let i = 0; i < cityList.length; i += batchSize) {
    const batch = cityList.slice(i, i + batchSize)
    const { error } = await supabase.from("address_cities").upsert(batch, {
      onConflict: "code",
    })

    if (error) {
      console.error(`Error in batch ${Math.floor(i / batchSize) + 1}:`, error)
      throw error
    }
    console.log(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(cityList.length / batchSize)} done`)
  }

  await supabase.from("address_sync_log").insert({
    entity_type: "cities",
    records_synced: cityList.length,
  })

  console.log(`✓ Inserted ${cityList.length} cities/municipalities`)
  return cityList.length
}

async function seedBarangays() {
  console.log("Loading barangays from PSGC package...")

  const allBarangays = psgcBarangays.all()

  console.log(`Found ${allBarangays.length} barangays`)

  // Transform to database format
  const barangayList = allBarangays.map((barangay) => {
    // Barangay codes are already 9 digits in the psgc package
    const code = barangay.code.toString().padStart(10, "0") // Pad to 10 digits for database

    // Extract city code using the original 9-digit code (before padding)
    // e.g., 012801001 -> 0128010 + "00" = 012801000
    const originalCode = barangay.code.toString() // Keep original 9 digits
    const cityCode = originalCode.substring(0, 7) + "00" // 9-digit city code

    return {
      code: code,
      name: barangay.name,
      city_code: cityCode,
    }
  })

  // Insert in batches of 1000
  const batchSize = 1000
  for (let i = 0; i < barangayList.length; i += batchSize) {
    const batch = barangayList.slice(i, i + batchSize)
    const { error } = await supabase.from("address_barangays").upsert(batch, {
      onConflict: "code",
    })

    if (error) {
      console.error(`Error in batch ${Math.floor(i / batchSize) + 1}:`, error)
      throw error
    }
    console.log(`  Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(barangayList.length / batchSize)} done (${i + batch.length}/${barangayList.length})`)
  }

  await supabase.from("address_sync_log").insert({
    entity_type: "barangays",
    records_synced: barangayList.length,
  })

  console.log(`✓ Inserted ${barangayList.length} barangays`)
  return barangayList.length
}

async function main() {
  console.log("=== PSGC Address Seeding Script (Offline) ===\n")

  try {
    const provinceCount = await seedProvinces()
    const cityCount = await seedCities()
    const barangayCount = await seedBarangays()

    console.log("\n=== Seeding Complete ===")
    console.log(`Provinces/Districts: ${provinceCount}`)
    console.log(`Cities/Municipalities: ${cityCount}`)
    console.log(`Barangays: ${barangayCount}`)
    console.log("\n✓ All Philippine addresses seeded successfully!")
  } catch (error) {
    console.error("Seeding failed:", error)
    process.exit(1)
  }
}

main()
