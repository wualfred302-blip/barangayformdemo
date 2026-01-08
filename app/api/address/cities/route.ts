import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim() || ""
    const provinceCode = searchParams.get("province_code")?.trim() || ""

    let query = supabase
      .from("address_cities")
      .select("code, name, zip_code, type")
      .order("name", { ascending: true })
      .limit(20)

    if (provinceCode) {
      query = query.eq("province_code", provinceCode)
    }

    if (search) {
      query = query.ilike("name", `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] City query error:", error)
      return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 })
    }

    return NextResponse.json(
      { cities: data || [] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    )
  } catch (error) {
    console.error("[v0] City API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
