import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "edge"
export const revalidate = 3600

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")?.trim() || ""

    let query = supabase.from("address_provinces").select("code, name").order("name", { ascending: true }).limit(20)

    if (search) {
      // Fuzzy search with prefix match (higher priority) and contains match
      query = query.or(`name.ilike.${search}%,name.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Province query error:", error)
      return NextResponse.json({ error: "Failed to fetch provinces" }, { status: 500 })
    }

    return NextResponse.json({ provinces: data || [] })
  } catch (error) {
    console.error("Province API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
