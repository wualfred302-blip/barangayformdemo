import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
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
      query = query.ilike("name", `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Barangay query error:", error)
      return NextResponse.json({ error: "Failed to fetch barangays" }, { status: 500 })
    }

    return NextResponse.json(
      { barangays: data || [] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Barangay API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
