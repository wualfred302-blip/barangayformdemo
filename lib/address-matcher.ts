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

/**
 * Fuzzy match OCR-extracted addresses against the database
 *
 * @param input - Object containing optional province, city, and barangay text
 * @returns Promise resolving to matched address components (null for unmatched)
 *
 * @example
 * ```typescript
 * const result = await fuzzyMatchAddresses({
 *   province: "PAMPANGA",
 *   city: "MABALACAT",
 *   barangay: "ATLU-BOLA"
 * })
 * // Returns: {
 * //   province: { code: "035400000", name: "Pampanga" },
 * //   city: { code: "035409000", name: "Mabalacat City", zip_code: "2010" },
 * //   barangay: { code: "035409001", name: "Atlu-Bola" }
 * // }
 * ```
 */
export async function fuzzyMatchAddresses(input: {
  province?: string
  city?: string
  barangay?: string
  rawAddress?: string // Full OCR address text for ZIP extraction
}): Promise<FuzzyMatchResult> {
  const result: FuzzyMatchResult = {
    province: null,
    city: null,
    barangay: null,
    extractedZipCode: extractZipFromText(input.rawAddress),
  }

  // Step 1: Match province if provided
  let provinceCode: string | null = null
  if (input.province?.trim()) {
    try {
      const provinceResponse = await fetch(
        `/api/address/provinces?search=${encodeURIComponent(input.province.trim())}`
      )

      if (provinceResponse.ok) {
        const data = await provinceResponse.json()
        if (data.provinces && data.provinces.length > 0) {
          // Take first (best) match
          const province: ProvinceResult = data.provinces[0]
          result.province = {
            code: province.code,
            name: province.name,
          }
          provinceCode = province.code
        }
      }
    } catch (error) {
      console.error("Error matching province:", error)
      // Gracefully handle error - leave province as null
    }
  }

  // Step 2: Match city if provided (filtered by province if found)
  let cityCode: string | null = null
  if (input.city?.trim()) {
    try {
      const cityUrl = provinceCode
        ? `/api/address/cities?search=${encodeURIComponent(input.city.trim())}&province_code=${provinceCode}`
        : `/api/address/cities?search=${encodeURIComponent(input.city.trim())}`

      const cityResponse = await fetch(cityUrl)

      if (cityResponse.ok) {
        const data = await cityResponse.json()
        if (data.cities && data.cities.length > 0) {
          // Take first (best) match
          const city: CityResult = data.cities[0]
          result.city = {
            code: city.code,
            name: city.name,
            zip_code: city.zip_code || "",
          }
          cityCode = city.code
        }
      }
    } catch (error) {
      console.error("Error matching city:", error)
      // Gracefully handle error - leave city as null
    }
  }

  // Step 3: Match barangay if provided (requires city code)
  if (input.barangay?.trim() && cityCode) {
    try {
      const barangayResponse = await fetch(
        `/api/address/barangays?city_code=${cityCode}&search=${encodeURIComponent(input.barangay.trim())}`
      )

      if (barangayResponse.ok) {
        const data = await barangayResponse.json()
        if (data.barangays && data.barangays.length > 0) {
          // Take first (best) match
          const barangay: BarangayResult = data.barangays[0]
          result.barangay = {
            code: barangay.code,
            name: barangay.name,
          }
        }
      }
    } catch (error) {
      console.error("Error matching barangay:", error)
      // Gracefully handle error - leave barangay as null
    }
  }

  return result
}
