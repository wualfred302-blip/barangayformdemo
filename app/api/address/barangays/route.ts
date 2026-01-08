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

    if (!cityCode) {
      return NextResponse.json({ error: "city_code parameter is required" }, { status: 400 })
    }

    let query = supabase
      .from("address_barangays")
      .select("code, name")
      .eq("city_code", cityCode)
      .order("name", { ascending: true })
      .limit(20)

    if (search) {
      // Fuzzy search with prefix match (higher priority) and contains match
      query = query.or(`name.ilike.${search}%,name.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Barangay query error:", error)
      return NextResponse.json({ error: "Failed to fetch barangays" }, { status: 500 })
    }

    return NextResponse.json({ barangays: data || [] })
  } catch (error) {
    console.error("Barangay API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
