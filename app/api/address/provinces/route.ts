import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim() || ""

    let query = supabase.from("address_provinces").select("code, name").order("name", { ascending: true }).limit(20)

    if (search) {
      // Use ilike for case-insensitive search
      query = query.ilike("name", `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Province query error:", error)
      return NextResponse.json({ error: "Failed to fetch provinces" }, { status: 500 })
    }

    return NextResponse.json(
      { provinces: data || [] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    )
  } catch (error) {
    console.error("[v0] Province API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
