/**
 * Philippine Address Fuzzy Matching Utility
 *
 * Performs cascading fuzzy search on OCR-extracted addresses to match
 * against the Philippine Standard Geographic Code (PSGC) database.
 *
 * Algorithm:
 * 1. Search provinces API with OCR province text → Take first match
 * 2. Search cities API with OCR city text (filtered by province if found) → Take first match
 * 3. Search barangays API with OCR barangay text (filtered by city if found) → Take first match
 * 4. Return matched results or null for unmatched fields
 */

export interface FuzzyMatchResult {
  province: { code: string; name: string } | null
  city: { code: string; name: string; zip_code: string } | null
  barangay: { code: string; name: string } | null
  extractedZipCode?: string // ZIP code extracted from raw OCR text via regex
}

/**
 * Extract Philippine ZIP code from raw OCR text using regex
 * Philippine ZIP codes are 4 digits (e.g., 2010, 1234)
 */
function extractZipFromText(text?: string): string | undefined {
  if (!text) return undefined

  // Pattern: Look for 4-digit numbers that are likely ZIP codes
  // ZIP codes in PH are typically at the end of an address or standalone
  const zipPatterns = [
    /\b(\d{4})\s*(?:philippines?|ph)?$/i, // End of address
    /\bzip\s*:?\s*(\d{4})\b/i, // ZIP: 1234
    /\bpostal\s*(?:code)?:?\s*(\d{4})\b/i, // Postal code: 1234
    /\b(\d{4})\s*(?:city|municipality|brgy|barangay)/i, // Before city name
    /(?:city|municipality|brgy|barangay)[^0-9]*(\d{4})\b/i, // After city name
  ]

  for (const pattern of zipPatterns) {
    const match = text.match(pattern)
    if (match && match[1]) {
      const zip = match[1]
      // Validate it's a reasonable Philippine ZIP (1000-9999)
      const zipNum = parseInt(zip, 10)
      if (zipNum >= 1000 && zipNum <= 9999) {
        return zip
      }
    }
  }

  return undefined
}

interface ProvinceResult {
  code: string
  name: string
}

interface CityResult {
  code: string
  name: string
  zip_code: string
}

interface BarangayResult {
  code: string
  name: string
}

// Address candidate with confidence level (from server)
interface AddressCandidate {
  value: string
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Enhanced fuzzy match with reverse inference for maximum autocomplete accuracy
 *
 * Strategies:
 * 1. Candidate prioritization (high > medium > low confidence)
 * 2. Multi-word combinations (try "Mabayuan Subic" before individuals)
 * 3. Reverse inference (if barangay found but no city, infer city from barangay parent)
 * 4. Cascading hierarchy (province → city within province → barangay within city)
 *
 * @param input - Raw address string and optional server-extracted candidates
 * @returns Promise resolving to matched address components (null for unmatched)
 *
 * @example
 * ```typescript
 * const result = await fuzzyMatchAddresses({
 *   rawAddress: "79 Otero Avenue, Mabayuan, Rhoxanne, Ebalon",
 *   candidates: {
 *     barangay: [{ value: "Mabayuan", confidence: "low" }],
 *     city: [{ value: "Rhoxanne", confidence: "low" }],
 *     province: [{ value: "Ebalon", confidence: "medium" }]
 *   }
 * })
 * // Returns (with reverse inference):
 * //   province: { code: "030710000", name: "Zambales" },
 * //   city: { code: "037109000", name: "Subic", zip_code: "2209" } ← INFERRED from barangay
 * //   barangay: { code: "037109008", name: "Mabayuan" }
 * ```
 */
export async function fuzzyMatchAddresses(input: {
  rawAddress: string
  candidates?: {
    barangay: AddressCandidate[]
    city: AddressCandidate[]
    province: AddressCandidate[]
  }
}): Promise<FuzzyMatchResult> {
  const result: FuzzyMatchResult = {
    province: null,
    city: null,
    barangay: null,
    extractedZipCode: extractZipFromText(input.rawAddress),
  }

  console.log("[Fuzzy Matcher] Starting with raw address:", input.rawAddress)

  // Split raw address into parts
  const parts = input.rawAddress.split(',').map(p => p.trim()).filter(p => p.length > 2)

  // Prepare search candidates (prioritize server hints by confidence, then try all parts)
  const getCandidates = (type: 'province' | 'city' | 'barangay'): string[] => {
    const serverCandidates = input.candidates?.[type] || []

    // Sort by confidence: high > medium > low
    const sorted = serverCandidates.sort((a, b) => {
      const confidenceOrder = { high: 3, medium: 2, low: 1 }
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence]
    })

    const candidateValues = sorted.map(c => c.value)

    // Add all raw parts that aren't already in candidates
    const uniqueParts = parts.filter(p => !candidateValues.some(c =>
      c.toLowerCase().includes(p.toLowerCase()) || p.toLowerCase().includes(c.toLowerCase())
    ))

    return [...candidateValues, ...uniqueParts]
  }

  // PASS 1: Find province
  let provinceCode: string | null = null
  const provinceCandidates = getCandidates('province')
  console.log("[Fuzzy Matcher] Province candidates:", provinceCandidates)

  for (const candidate of provinceCandidates) {
    try {
      const response = await fetch(`/api/address/provinces?search=${encodeURIComponent(candidate)}`)
      const data = await response.json()

      if (data.provinces && data.provinces.length > 0) {
        const province: ProvinceResult = data.provinces[0]
        result.province = { code: province.code, name: province.name }
        provinceCode = province.code
        console.log(`[Fuzzy Matcher] ✓ Province matched: "${candidate}" → ${province.name} (${province.code})`)
        break
      }
    } catch (error) {
      console.error(`[Fuzzy Matcher] Error matching province "${candidate}":`, error)
    }
  }

  // PASS 2: Find city WITHIN province
  let cityCode: string | null = null
  if (provinceCode) {
    const cityCandidates = getCandidates('city')
    console.log("[Fuzzy Matcher] City candidates:", cityCandidates)

    // Strategy 1: Try individual candidates
    for (const candidate of cityCandidates) {
      try {
        const cityUrl = `/api/address/cities?search=${encodeURIComponent(candidate)}&province_code=${provinceCode}`
        const response = await fetch(cityUrl)
        const data = await response.json()

        if (data.cities && data.cities.length > 0) {
          const city: CityResult = data.cities[0]
          result.city = {
            code: city.code,
            name: city.name,
            zip_code: city.zip_code || ""
          }
          cityCode = city.code
          console.log(`[Fuzzy Matcher] ✓ City matched: "${candidate}" → ${city.name} (${city.code})`)
          break
        }
      } catch (error) {
        console.error(`[Fuzzy Matcher] Error matching city "${candidate}":`, error)
      }
    }

    // Strategy 2: Try multi-word combinations (e.g., "Mabayuan Subic")
    if (!cityCode && cityCandidates.length >= 2) {
      console.log("[Fuzzy Matcher] Trying multi-word city combinations...")
      for (let i = 0; i < cityCandidates.length - 1; i++) {
        const combined = `${cityCandidates[i]} ${cityCandidates[i + 1]}`
        try {
          const response = await fetch(
            `/api/address/cities?search=${encodeURIComponent(combined)}&province_code=${provinceCode}`
          )
          const data = await response.json()

          if (data.cities && data.cities.length > 0) {
            const city: CityResult = data.cities[0]
            result.city = {
              code: city.code,
              name: city.name,
              zip_code: city.zip_code || ""
            }
            cityCode = city.code
            console.log(`[Fuzzy Matcher] ✓ City matched (multi-word): "${combined}" → ${city.name}`)
            break
          }
        } catch (error) {
          console.error(`[Fuzzy Matcher] Error matching combined city "${combined}":`, error)
        }
      }
    }
  }

  // PASS 3: Find barangay WITHIN city
  if (cityCode) {
    const barangayCandidates = getCandidates('barangay')
    console.log("[Fuzzy Matcher] Barangay candidates (within city):", barangayCandidates)

    for (const candidate of barangayCandidates) {
      try {
        const barangayUrl = `/api/address/barangays?city_code=${cityCode}&search=${encodeURIComponent(candidate)}`
        const response = await fetch(barangayUrl)
        const data = await response.json()

        if (data.barangays && data.barangays.length > 0) {
          const barangay: BarangayResult = data.barangays[0]
          result.barangay = {
            code: barangay.code,
            name: barangay.name
          }
          console.log(`[Fuzzy Matcher] ✓ Barangay matched: "${candidate}" → ${barangay.name}`)
          break
        }
      } catch (error) {
        console.error(`[Fuzzy Matcher] Error matching barangay "${candidate}":`, error)
      }
    }
  }

  // FALLBACK STRATEGY: Reverse inference (city from barangay) 🔥
  // If province found but NO city, try searching barangay candidates across ALL cities in province
  if (provinceCode && !cityCode) {
    console.log("[Fuzzy Matcher] 🔥 Activating reverse inference (city from barangay)...")
    const barangayCandidates = getCandidates('barangay')

    for (const candidate of barangayCandidates) {
      try {
        // Search barangays globally within province (no city filter)
        const barangayUrl = `/api/address/barangays?province_code=${provinceCode}&search=${encodeURIComponent(candidate)}`
        const response = await fetch(barangayUrl)
        const data = await response.json()

        if (data.barangays && data.barangays.length > 0) {
          const matchedBarangay: BarangayResult = data.barangays[0]
          result.barangay = {
            code: matchedBarangay.code,
            name: matchedBarangay.name
          }
          console.log(`[Fuzzy Matcher] ✓ Barangay found (province-level): "${candidate}" → ${matchedBarangay.name}`)

          // REVERSE INFERENCE: Extract city code from barangay code
          // Barangay code format: RRPPPDDCCBBB (Region+Province+District+City+Barangay)
          // City code: RRPPPDDCC000 (first 7 digits + "000")
          const cityCodeFromBarangay = matchedBarangay.code.substring(0, 7) + "000"
          console.log(`[Fuzzy Matcher] 🔄 Inferring city from barangay code: ${matchedBarangay.code} → ${cityCodeFromBarangay}`)

          // Fetch city details
          try {
            const cityResponse = await fetch(`/api/address/cities?code=${cityCodeFromBarangay}`)
            const cityData = await cityResponse.json()

            if (cityData.cities && cityData.cities.length > 0) {
              const city: CityResult = cityData.cities[0]
              result.city = {
                code: city.code,
                name: city.name,
                zip_code: city.zip_code || ""
              }
              console.log(`[Fuzzy Matcher] ✅ CITY INFERRED: ${city.name} (from barangay ${matchedBarangay.name})`)
            }
          } catch (error) {
            console.error("[Fuzzy Matcher] Error fetching inferred city:", error)
          }

          break  // Found barangay and inferred city - success!
        }
      } catch (error) {
        console.error(`[Fuzzy Matcher] Error in reverse inference for "${candidate}":`, error)
      }
    }
  }

  console.log("[Fuzzy Matcher] Final result:", {
    province: result.province?.name || "null",
    city: result.city?.name || "null",
    barangay: result.barangay?.name || "null"
  })

  return result
}
