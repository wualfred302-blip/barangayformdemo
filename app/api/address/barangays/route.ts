import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const revalidate = 3600

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim() || ""
    const cityCode = searchParams.get("city_code")?.trim() || ""
    const provinceCode = searchParams.get("province_code")?.trim() || ""

    // Either city_code OR province_code must be provided
    if (!cityCode && !provinceCode) {
      return NextResponse.json({ error: "Either city_code or province_code parameter is required" }, { status: 400 })
    }

    let query = supabase
      .from("address_barangays")
      .select("code, name")
      .order("name", { ascending: true })
      .limit(20)

    // Filter by city (most specific) or province (for reverse inference)
    if (cityCode) {
      query = query.eq("city_code", cityCode)
    } else if (provinceCode) {
      // NEW: Support province-level search for reverse inference
      // PSGC code format: RRPPPDDCCBBB (Region+Province+District+City+Barangay)
      // Province code: RRPPP00000 (5 digits)
      // We want all barangays where code starts with RRPPPDD (first 7 chars, minus district variance)
      const provincePrefix = provinceCode.substring(0, 5) // RRPPP
      query = query.like("code", `${provincePrefix}%`)
      console.log(`[Barangay API] Province-level search: code LIKE ${provincePrefix}%`)
    }

    if (search) {
      // Fuzzy search with prefix match (higher priority) and contains match
      query = query.or(`name.ilike.${search}%,name.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Barangay query error:", error)
      return NextResponse.json({ error: "Failed to fetch barangays" }, { status: 500 })
    }

    console.log(`[Barangay API] Found ${data?.length || 0} barangays`)
    return NextResponse.json({ barangays: data || [] })
  } catch (error) {
    console.error("Barangay API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
