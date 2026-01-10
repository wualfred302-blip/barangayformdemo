import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCityCodes() {
  console.log("=== Checking City Codes in Database ===\n")

  // Get sample city codes
  const { data: cities, error } = await supabase
    .from("address_cities")
    .select("code, name")
    .order("code")
    .limit(20)

  if (error) {
    console.error("Error:", error)
    return
  }

  console.log("First 20 cities in database:")
  cities?.forEach((city) => {
    console.log(`  Code: "${city.code}" (${city.code.length} chars) - ${city.name}`)
  })

  // Check specifically for the codes that should match our barangays
  const targetCodes = ["012801000", "012802000", "001280100"]

  console.log("\n\nChecking specific city codes:")
  for (const code of targetCodes) {
    const { data, error } = await supabase
      .from("address_cities")
      .select("code, name")
      .eq("code", code)
      .single()

    if (error) {
      console.log(`  "${code}": NOT FOUND`)
    } else {
      console.log(`  "${code}": FOUND - ${data.name}`)
    }
  }

  // Check total count
  const { count } = await supabase
    .from("address_cities")
    .select("*", { count: "exact", head: true })

  console.log(`\n\nTotal cities in database: ${count}`)
}

checkCityCodes()
