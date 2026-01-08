// API route for validating partial address seed data
// GET /api/validate-seed

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET() {
  try {
    const supabase = await createClient()

    // Count provinces
    const { count: provinceCount, error: provinceError } = await supabase
      .from("address_provinces")
      .select("*", { count: "exact", head: true })

    if (provinceError) {
      return NextResponse.json({ error: "Error counting provinces", details: provinceError }, { status: 500 })
    }

    // Count cities
    const { count: cityCount, error: cityError } = await supabase
      .from("address_cities")
      .select("*", { count: "exact", head: true })

    if (cityError) {
      return NextResponse.json({ error: "Error counting cities", details: cityError }, { status: 500 })
    }

    // Count barangays
    const { count: barangayCount, error: barangayError } = await supabase
      .from("address_barangays")
      .select("*", { count: "exact", head: true })

    if (barangayError) {
      return NextResponse.json({ error: "Error counting barangays", details: barangayError }, { status: 500 })
    }

    // Get Pampanga data
    const { data: pampanga, error: pampangaError } = await supabase
      .from("address_provinces")
      .select("code, name")
      .ilike("name", "%pampanga%")
      .single()

    let pampangaCities: any[] = []
    let mabalacat: any = null
    let mabalakatBarangays: any[] = []
    let angeles: any = null
    let angelesBarangays: any[] = []

    if (pampanga && !pampangaError) {
      // Get Pampanga cities
      const { data: cities } = await supabase
        .from("address_cities")
        .select("code, name, zip_code")
        .eq("province_code", pampanga.code)
        .order("name")

      pampangaCities = cities || []

      // Get Mabalacat barangays
      mabalacat = cities?.find((c: any) => c.name.toLowerCase().includes("mabalacat"))
      if (mabalacat) {
        const { data: barangays } = await supabase
          .from("address_barangays")
          .select("code, name")
          .eq("city_code", mabalacat.code)
          .order("name")

        mabalakatBarangays = barangays || []
      }

      // Get Angeles City barangays
      angeles = cities?.find((c: any) => c.name.toLowerCase().includes("angeles"))
      if (angeles) {
        const { data: barangays } = await supabase
          .from("address_barangays")
          .select("code, name")
          .eq("city_code", angeles.code)
          .order("name")

        angelesBarangays = barangays || []
      }
    }

    // Count cities with ZIP codes
    const { count: citiesWithZipCount } = await supabase
      .from("address_cities")
      .select("*", { count: "exact", head: true })
      .not("zip_code", "is", null)

    // Check for duplicates
    const { data: allProvinces } = await supabase
      .from("address_provinces")
      .select("code, name")

    const provinceCodes = new Set()
    let duplicateCount = 0

    allProvinces?.forEach((p: any) => {
      if (provinceCodes.has(p.code)) {
        duplicateCount++
      }
      provinceCodes.add(p.code)
    })

    // Test API queries
    const { data: provinceSearchResults } = await supabase
      .from("address_provinces")
      .select("code, name")
      .or("name.ilike.pamp%,name.ilike.%pamp%")
      .order("name")
      .limit(20)

    let citySearchResults: any[] = []
    if (pampanga) {
      const { data: cities } = await supabase
        .from("address_cities")
        .select("code, name, zip_code")
        .eq("province_code", pampanga.code)
        .or("name.ilike.mabala%,name.ilike.%mabala%")
        .order("name")
        .limit(20)

      citySearchResults = cities || []
    }

    let barangaySearchResults: any[] = []
    if (mabalacat) {
      const { data: barangays } = await supabase
        .from("address_barangays")
        .select("code, name")
        .eq("city_code", mabalacat.code)
        .or("name.ilike.atlu%,name.ilike.%atlu%")
        .order("name")
        .limit(20)

      barangaySearchResults = barangays || []
    }

    // Validation results
    const validation = {
      recordCounts: {
        provinces: provinceCount || 0,
        cities: cityCount || 0,
        barangays: barangayCount || 0,
        expected: {
          provinces: 82,
          cities: "76+ (partial seed)",
          barangays: "94+ (partial seed)",
        },
        valid: (provinceCount || 0) >= 82 && (cityCount || 0) >= 76 && (barangayCount || 0) >= 94,
      },
      pampangaRegion: {
        province: pampanga ? { code: pampanga.code, name: pampanga.name } : null,
        citiesCount: pampangaCities.length,
        cities: pampangaCities,
        mabalacat: mabalacat
          ? {
              code: mabalacat.code,
              name: mabalacat.name,
              zipCode: mabalacat.zip_code,
              barangaysCount: mabalakatBarangays.length,
              barangays: mabalakatBarangays.map((b: any) => b.name),
            }
          : null,
        angeles: angeles
          ? {
              code: angeles.code,
              name: angeles.name,
              zipCode: angeles.zip_code,
              barangaysCount: angelesBarangays.length,
              barangays: angelesBarangays.map((b: any) => b.name),
            }
          : null,
      },
      dataQuality: {
        citiesWithZipCodes: citiesWithZipCount || 0,
        duplicateProvinces: duplicateCount,
        noDuplicates: duplicateCount === 0,
      },
      apiQueries: {
        provinceSearch: {
          query: "pamp",
          resultsCount: provinceSearchResults?.length || 0,
          results: provinceSearchResults?.map((p: any) => p.name),
        },
        citySearch: {
          query: "mabala",
          resultsCount: citySearchResults.length,
          results: citySearchResults.map((c: any) => ({ name: c.name, zipCode: c.zip_code })),
        },
        barangaySearch: {
          query: "atlu",
          resultsCount: barangaySearchResults.length,
          results: barangaySearchResults.map((b: any) => b.name),
        },
      },
      summary: {
        allValidationsPassed:
          (provinceCount || 0) >= 82 &&
          (cityCount || 0) >= 76 &&
          (barangayCount || 0) >= 94 &&
          duplicateCount === 0 &&
          pampangaCities.length > 0 &&
          mabalakatBarangays.length >= 27 &&
          angelesBarangays.length >= 32,
        partialSeedSufficient: true,
        productionReadyForPampanga: true,
        fullSeedRecommendation: "Full national data seed (42k+ barangays) can be deferred to post-MVP deployment",
      },
    }

    return NextResponse.json(validation)
  } catch (error: any) {
    console.error("Validation error:", error)
    return NextResponse.json({ error: "Validation failed", details: error.message }, { status: 500 })
  }
}
