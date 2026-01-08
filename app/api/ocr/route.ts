const AZURE_ENDPOINT = (process.env.AZURE_CV_ENDPOINT || "https://barangaylinkod.cognitiveservices.azure.com").replace(
  /\/+$/,
  "",
)
const AZURE_API_KEY =
  process.env.AZURE_CV_API_KEY || "6w3QVf4FGXnh7kI5rowYpbNoDpFQ7itBQMMWcubTNeeuhRV95apgJQQJ99CAAC3pKaRXJ3w3AAAFACOGs2Jq"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
}

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders })
}

export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    const body = await req.json()
    const { imageBase64 } = body

    if (!imageBase64) {
      return Response.json({ success: false, error: "No image provided" }, { status: 400, headers: corsHeaders })
    }

    let binaryData: Uint8Array
    try {
      // Remove data URL prefix if present
      let cleanBase64 = imageBase64
      if (cleanBase64.includes(",")) {
        cleanBase64 = cleanBase64.split(",")[1]
      }
      cleanBase64 = cleanBase64.replace(/\s/g, "")

      // Decode base64 to binary
      const binaryString = atob(cleanBase64)
      binaryData = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        binaryData[i] = binaryString.charCodeAt(i)
      }
    } catch (decodeError) {
      console.error("[v0] Base64 decode error:", decodeError)
      return Response.json(
        { success: false, error: "Invalid base64 image data" },
        { status: 400, headers: corsHeaders },
      )
    }

    const analyzeUrl = `${AZURE_ENDPOINT}/vision/v3.1/read/analyze`

    console.log("[v0] Calling Azure OCR at:", analyzeUrl)
    console.log("[v0] Image size (bytes):", binaryData.length)
    console.log("[v0] API Key present:", !!AZURE_API_KEY)

    let response: Response
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      response = await fetch(analyzeUrl, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_API_KEY,
          "Content-Type": "application/octet-stream",
        },
        body: binaryData,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
    } catch (fetchError: unknown) {
      const errorMessage = fetchError instanceof Error ? fetchError.message : "Unknown network error"
      console.error("[v0] Azure fetch error:", errorMessage)

      // Check for abort
      if (errorMessage.includes("abort")) {
        return Response.json(
          { success: false, error: "Request timed out. Please try again." },
          { status: 500, headers: corsHeaders },
        )
      }

      return Response.json(
        { success: false, error: `Network error: ${errorMessage}` },
        { status: 500, headers: corsHeaders },
      )
    }

    console.log("[v0] Azure response status:", response.status)

    if (response.status !== 202) {
      let errorMessage = `Azure OCR returned status ${response.status}`
      try {
        const errorBody = await response.text()
        console.error("[v0] Azure error body:", errorBody)
        if (errorBody) {
          try {
            const errorJson = JSON.parse(errorBody)
            errorMessage = errorJson.error?.message || errorJson.message || errorMessage
          } catch {
            errorMessage = errorBody.slice(0, 200)
          }
        }
      } catch {}
      return Response.json({ success: false, error: errorMessage }, { status: 500, headers: corsHeaders })
    }

    const operationLocation = response.headers.get("Operation-Location") || response.headers.get("operation-location")

    console.log("[v0] Operation-Location:", operationLocation)

    if (!operationLocation) {
      // Log all headers for debugging
      const headerNames: string[] = []
      response.headers.forEach((value, key) => {
        headerNames.push(`${key}: ${value}`)
      })
      console.log("[v0] All response headers:", headerNames.join(", "))

      return Response.json(
        { success: false, error: "Azure did not return Operation-Location header" },
        { status: 500, headers: corsHeaders },
      )
    }

    let result: {
      status?: string
      analyzeResult?: { readResults?: Array<{ lines?: Array<{ text: string }> }> }
    } | null = null
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      console.log("[v0] Polling attempt", i + 1)

      try {
        const pollResponse = await fetch(operationLocation, {
          headers: { "Ocp-Apim-Subscription-Key": AZURE_API_KEY },
        })

        if (!pollResponse.ok) {
          console.error("[v0] Poll response not ok:", pollResponse.status)
          continue
        }

        result = await pollResponse.json()
        console.log("[v0] Poll result status:", result?.status)

        if (result?.status === "succeeded") break
        if (result?.status === "failed") {
          return Response.json(
            { success: false, error: "OCR processing failed" },
            { status: 500, headers: corsHeaders },
          )
        }
      } catch (pollError: unknown) {
        const pollErrorMsg = pollError instanceof Error ? pollError.message : "Unknown poll error"
        console.error("[v0] Poll error:", pollErrorMsg)
      }
    }

    if (!result || result.status !== "succeeded") {
      return Response.json(
        { success: false, error: "OCR timeout - please try again with a clearer image" },
        { status: 500, headers: corsHeaders },
      )
    }

    // Extract all text from the result
    const allText: string[] = []
    for (const readResult of result.analyzeResult?.readResults || []) {
      for (const line of readResult.lines || []) {
        allText.push(line.text)
      }
    }

    console.log("[v0] Extracted lines:", allText.length)

    // Parse the extracted text
    const extractedData = parseIDText(allText)
    const processingTime = Date.now() - startTime

    return Response.json(
      {
        success: true,
        data: extractedData,
        rawText: allText.join("\n"),
        processingTime,
      },
      { headers: corsHeaders },
    )
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Failed to process ID"
    const errorStack = error instanceof Error ? error.stack : ""
    console.error("[v0] OCR Error:", errorMsg, errorStack)
    return Response.json({ success: false, error: errorMsg }, { status: 500, headers: corsHeaders })
  }
}

function parseIDText(lines: string[]): {
  fullName: string
  birthDate: string
  address: string
  idType: string
  idNumber: string
  mobileNumber: string
  age: string
  houseLotNo: string
  street: string
  purok: string
  barangay: string
  cityMunicipality: string
  province: string
  zipCode: string
} {
  const text = lines.join(" ").toUpperCase()
  const joinedText = lines.join("\n")

  // ========== ID TYPE DETECTION ==========
  let idType = "Government ID"
  const idTypePatterns: [RegExp, string][] = [
    [/PHILIPPINE\s*IDENTIFICATION|PHILSYS|PSN|NATIONAL\s*ID/i, "Philippine National ID"],
    [/DRIVER['']?S?\s*LICENSE|LTO|LAND\s*TRANSPORTATION/i, "Driver's License"],
    [/UMID|UNIFIED\s*MULTI[\s-]*PURPOSE/i, "UMID"],
    [/\bSSS\b|SOCIAL\s*SECURITY\s*SYSTEM/i, "SSS ID"],
    [/PHILHEALTH|PHILIPPINE\s*HEALTH/i, "PhilHealth ID"],
    [/POSTAL\s*ID|PHILPOST|PHLPost/i, "Postal ID"],
    [/VOTER['']?S?\s*ID|COMELEC/i, "Voter's ID"],
    [/PASSPORT|PASAPORTE|DFA/i, "Philippine Passport"],
    [/\bPRC\b|PROFESSIONAL\s*REGULATION/i, "PRC ID"],
    [/BARANGAY\s*(ID|CLEARANCE|CERTIFICATE)/i, "Barangay ID"],
    [/SENIOR\s*CITIZEN|OSCA|\bSC\s*ID\b/i, "Senior Citizen ID"],
    [/\bPWD\b|PERSON\s*WITH\s*DISABILITY|DISABILITY\s*ID/i, "PWD ID"],
  ]

  for (const [pattern, type] of idTypePatterns) {
    if (pattern.test(text)) {
      idType = type
      break
    }
  }

  // ========== NAME EXTRACTION ==========
  let fullName = ""

  // Method 1: Look for labeled name fields
  const nameLabels = [
    /(?:FULL\s*NAME|PANGALAN|NAME|LAST\s*NAME|SURNAME)[:\s]+([A-Za-z\s,.\-']+)/i,
    /(?:GIVEN\s*NAME|FIRST\s*NAME)[:\s]+([A-Za-z\s.\-']+)/i,
  ]

  for (const pattern of nameLabels) {
    const match = joinedText.match(pattern)
    if (match && match[1].trim().length > 2) {
      fullName = match[1].trim().replace(/\s+/g, " ")
      break
    }
  }

  // Method 2: Find name-like patterns (all caps, proper length)
  if (!fullName) {
    for (const line of lines) {
      const cleanLine = line.trim()
      // Name pattern: 2-4 words, proper characters, reasonable length
      if (
        /^[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3}$/.test(cleanLine) &&
        cleanLine.length >= 5 &&
        cleanLine.length <= 50
      ) {
        const lower = cleanLine.toLowerCase()
        // Skip header text
        if (
          !lower.includes("republic") &&
          !lower.includes("philippines") &&
          !lower.includes("identification") &&
          !lower.includes("department") &&
          !lower.includes("office") &&
          !lower.includes("barangay") &&
          !lower.includes("city")
        ) {
          fullName = cleanLine
          break
        }
      }
    }
  }

  // Method 3: Look for LASTNAME, FIRSTNAME MIDDLENAME format
  if (!fullName) {
    const lastFirstMatch = joinedText.match(/([A-Z]+),\s*([A-Z]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z]+)?)/i)
    if (lastFirstMatch) {
      fullName = `${lastFirstMatch[2]} ${lastFirstMatch[1]}`
    }
  }

  // ========== BIRTH DATE EXTRACTION ==========
  let birthDate = ""

  // Pattern 1: Labeled date of birth
  const dobPatterns = [
    /(?:DATE\s*OF\s*BIRTH|DOB|BIRTHDAY|PETSA\s*NG\s*KAPANGANAKAN|BIRTH\s*DATE)[:\s]+(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i,
    /(?:DATE\s*OF\s*BIRTH|DOB|BIRTHDAY)[:\s]+([A-Z]+\s+\d{1,2},?\s+\d{4})/i,
    /(?:DATE\s*OF\s*BIRTH|DOB|BIRTHDAY)[:\s]+(\d{4}[/-]\d{1,2}[/-]\d{1,2})/i,
  ]

  for (const pattern of dobPatterns) {
    const match = joinedText.match(pattern)
    if (match) {
      birthDate = match[1].trim()
      break
    }
  }

  // Pattern 2: Unlabeled date formats
  if (!birthDate) {
    const dateFormats = [
      /\b(\d{2}[/-]\d{2}[/-]\d{4})\b/, // MM/DD/YYYY or DD/MM/YYYY
      /\b(\d{4}[/-]\d{2}[/-]\d{2})\b/, // YYYY-MM-DD
      /\b((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s+\d{1,2},?\s+\d{4})\b/i,
    ]
    for (const pattern of dateFormats) {
      const match = text.match(pattern)
      if (match) {
        birthDate = match[1]
        break
      }
    }
  }

  // ========== ID NUMBER EXTRACTION ==========
  let idNumber = ""

  // ID-specific patterns
  const idNumberPatterns: Record<string, RegExp[]> = {
    "Philippine National ID": [/\b(PSN[:\s]*)?(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/i],
    "Driver's License": [/\b([A-Z]\d{2}[\s-]?\d{2}[\s-]?\d{6})\b/i, /\b([A-Z]\d{10})\b/i],
    UMID: [/\b(\d{4}[\s-]?\d{7}[\s-]?\d)\b/, /\b(CRN[:\s]*\d{4}[\s-]?\d{7}[\s-]?\d)\b/i],
    "SSS ID": [/\b(\d{2}[\s-]?\d{7}[\s-]?\d)\b/, /\b(SS[\s#:]*\d{2}[\s-]?\d{7}[\s-]?\d)\b/i],
    "PhilHealth ID": [/\b(\d{2}[\s-]?\d{9}[\s-]?\d)\b/, /\b(\d{12})\b/],
    "Postal ID": [/\b([A-Z]{3}[\s-]?\d{4}[\s-]?\d{7})\b/i, /\b(\d{4}[\s-]?\d{4}[\s-]?\d{4})\b/],
    "Voter's ID": [/\b(VIN[:\s]*)?(\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{2})\b/i],
    "Philippine Passport": [/\b([A-Z]{1,2}\d{7,8}[A-Z]?)\b/i],
    "PRC ID": [/\b(\d{7})\b/],
    "Barangay ID": [/\b(BRGY[\s-]?\d{4,})\b/i, /\b(\d{4,10})\b/],
    "Senior Citizen ID": [/\b(OSCA[\s-]?\d+)\b/i, /\b(\d{4,12})\b/],
    "PWD ID": [/\b(PWD[\s-]?\d+)\b/i, /\b(\d{4,12})\b/],
  }

  // Try ID-specific patterns first
  const patterns = idNumberPatterns[idType] || []
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      idNumber = match[match.length - 1].replace(/\s/g, "")
      break
    }
  }

  // Fallback: Generic ID number patterns
  if (!idNumber) {
    const genericPatterns = [
      /(?:ID\s*(?:NO\.?|NUMBER|#)|NO\.?)[:\s]*([A-Z0-9-]+)/i,
      /\b(\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4})\b/, // 16-digit
      /\b(\d{2}[\s-]\d{7}[\s-]\d)\b/, // SSS format
      /\b([A-Z]\d{2}[\s-]\d{2}[\s-]\d{6})\b/i, // License format
      /\b(\d{10,16})\b/, // 10-16 digit numbers
    ]
    for (const pattern of genericPatterns) {
      const match = text.match(pattern)
      if (match) {
        idNumber = match[1].replace(/\s/g, "")
        break
      }
    }
  }

  // ========== ADDRESS EXTRACTION & PARSING ==========
  let address = ""
  let houseLotNo = ""
  let street = ""
  let purok = ""
  let barangay = ""
  let cityMunicipality = ""
  let province = ""
  let zipCode = ""

  // Find address section
  const addressPatterns = [
    /(?:ADDRESS|TIRAHAN|RESIDENCE)[:\s]+(.+?)(?=(?:DATE|BIRTH|SEX|NATIONALITY|$))/is,
    /(?:PERMANENT\s*ADDRESS|HOME\s*ADDRESS)[:\s]+(.+?)(?=(?:DATE|BIRTH|SEX|$))/is,
  ]

  for (const pattern of addressPatterns) {
    const match = joinedText.match(pattern)
    if (match) {
      address = match[1].replace(/\n/g, ", ").replace(/\s+/g, " ").trim()
      break
    }
  }

  // Fallback: Find lines that look like addresses
  if (!address) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toUpperCase()
      if (
        line.includes("BRGY") ||
        line.includes("BARANGAY") ||
        line.includes("PUROK") ||
        line.includes("STREET") ||
        line.includes("ST.") ||
        line.includes("AVE") ||
        /\b\d+\s+[A-Z]+\s+(ST|AVE|ROAD|DRIVE)/i.test(line)
      ) {
        address = lines[i]
        // Include next line if it continues the address
        if (i + 1 < lines.length && !lines[i + 1].includes(":") && /^[A-Za-z0-9\s,.-]+$/.test(lines[i + 1])) {
          address += ", " + lines[i + 1]
        }
        break
      }
    }
  }

  // Parse address components
  if (address) {
    const upperAddr = address.toUpperCase()

    // House/Lot/Block number
    const housePatterns = [
      /^(\d+[-A-Z]?)\s/i,
      /(?:LOT|LT\.?|BLK\.?|BLOCK|HOUSE|HSE)\s*#?\s*(\d+[-A-Z0-9]*)/i,
      /\b#\s*(\d+[-A-Z]*)\b/i,
    ]
    for (const pattern of housePatterns) {
      const match = address.match(pattern)
      if (match) {
        houseLotNo = match[1]
        break
      }
    }

    // Street
    const streetPatterns = [
      /(\d*\s*[A-Za-z\s]+(?:STREET|ST\.?|AVENUE|AVE\.?|ROAD|RD\.?|BOULEVARD|BLVD\.?|DRIVE|DR\.?|LANE|LN\.?))/i,
      /(?:SITIO|ZONE)\s+([A-Za-z0-9\s]+)/i,
    ]
    for (const pattern of streetPatterns) {
      const match = address.match(pattern)
      if (match) {
        street = match[1].trim()
        break
      }
    }

    // Purok
    const purokMatch = upperAddr.match(/PUROK\s*#?\s*(\d+|[A-Z]+[-\s]?\d*)/i)
    if (purokMatch) {
      purok = purokMatch[1]
    }

    // Barangay - comprehensive patterns
    const barangayPatterns = [
      /(?:BRGY\.?|BARANGAY)\s+([A-Za-z0-9\s.-]+?)(?:,|\s+CITY|\s+MUNICIPALITY|\s+PROVINCE|\s+\d{4}|$)/i,
      /(?:BRGY\.?|BARANGAY)\s+([A-Za-z0-9\s.-]+)/i,
    ]
    for (const pattern of barangayPatterns) {
      const match = address.match(pattern)
      if (match) {
        barangay = match[1].trim().replace(/,+$/, "")
        break
      }
    }

    // City/Municipality - comprehensive list
    const cities = [
      // Metro Manila
      "MANILA",
      "QUEZON CITY",
      "MAKATI",
      "PASIG",
      "TAGUIG",
      "CALOOCAN",
      "PARAÑAQUE",
      "PARANAQUE",
      "LAS PIÑAS",
      "LAS PINAS",
      "MUNTINLUPA",
      "MARIKINA",
      "PASAY",
      "VALENZUELA",
      "MALABON",
      "NAVOTAS",
      "SAN JUAN",
      "MANDALUYONG",
      "PATEROS",
      // Central Luzon
      "ANGELES",
      "MABALACAT",
      "SAN FERNANDO",
      "CITY OF SAN FERNANDO",
      "MEYCAUAYAN",
      "MALOLOS",
      "CABANATUAN",
      "TARLAC",
      "OLONGAPO",
      "BALANGA",
      "SAN JOSE DEL MONTE",
      // Other major cities
      "CEBU",
      "DAVAO",
      "ZAMBOANGA",
      "CAGAYAN DE ORO",
      "BACOLOD",
      "ILOILO",
      "BAGUIO",
    ]

    for (const city of cities) {
      if (upperAddr.includes(city)) {
        cityMunicipality = city
          .split(" ")
          .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
          .join(" ")
        break
      }
    }

    // Fallback: Look for "CITY OF" or "MUNICIPALITY OF" pattern
    if (!cityMunicipality) {
      const cityMatch = address.match(/(?:CITY\s+OF|MUNICIPALITY\s+OF)\s+([A-Za-z\s]+?)(?:,|$)/i)
      if (cityMatch) {
        cityMunicipality = cityMatch[1].trim()
      }
    }

    // Province
    const provinces = [
      "PAMPANGA",
      "BULACAN",
      "NUEVA ECIJA",
      "TARLAC",
      "ZAMBALES",
      "BATAAN",
      "AURORA",
      "CAVITE",
      "LAGUNA",
      "BATANGAS",
      "RIZAL",
      "QUEZON",
      "PANGASINAN",
      "LA UNION",
      "ILOCOS NORTE",
      "ILOCOS SUR",
      "BENGUET",
      "CEBU",
      "BOHOL",
      "NEGROS ORIENTAL",
      "NEGROS OCCIDENTAL",
      "ILOILO",
      "CAPIZ",
      "DAVAO DEL SUR",
      "DAVAO DEL NORTE",
      "DAVAO ORIENTAL",
      "METRO MANILA",
      "NCR",
    ]

    for (const prov of provinces) {
      if (upperAddr.includes(prov)) {
        province = prov
          .split(" ")
          .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
          .join(" ")
        break
      }
    }

    // ZIP code (Philippine ZIP codes are 4 digits)
    const zipMatch = address.match(/\b(\d{4})\b(?![\d-])/)
    if (zipMatch) {
      const potentialZip = Number.parseInt(zipMatch[1])
      // Philippine ZIP codes range from 0400 to 9811
      if (potentialZip >= 400 && potentialZip <= 9811) {
        zipCode = zipMatch[1]
      }
    }
  }

  // ========== MOBILE NUMBER EXTRACTION ==========
  let mobileNumber = ""
  const mobilePatterns = [
    /(?:MOBILE|CELL|CONTACT|TEL|PHONE)[:\s#]*(?:\+63|0)?(9\d{9})/i,
    /(?:\+63|0)(9\d{9})/,
    /\b(09\d{9})\b/,
  ]
  for (const pattern of mobilePatterns) {
    const match = text.match(pattern)
    if (match) {
      mobileNumber = match[1].startsWith("9") ? "0" + match[1] : match[1]
      break
    }
  }

  // ========== AGE CALCULATION ==========
  let age = ""
  if (birthDate) {
    try {
      let parsed: Date | null = null

      // Try different date formats
      if (/\d{4}[/-]\d{1,2}[/-]\d{1,2}/.test(birthDate)) {
        parsed = new Date(birthDate)
      } else if (/\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(birthDate)) {
        const parts = birthDate.split(/[/-]/)
        // Assume MM/DD/YYYY (US format common in PH)
        parsed = new Date(Number.parseInt(parts[2]), Number.parseInt(parts[0]) - 1, Number.parseInt(parts[1]))
      } else if (/[A-Z]+\s+\d{1,2},?\s+\d{4}/i.test(birthDate)) {
        parsed = new Date(birthDate)
      }

      if (parsed && !isNaN(parsed.getTime())) {
        const today = new Date()
        let calcAge = today.getFullYear() - parsed.getFullYear()
        const monthDiff = today.getMonth() - parsed.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
          calcAge--
        }
        if (calcAge > 0 && calcAge < 150) {
          age = calcAge.toString()
        }
      }
    } catch {}
  }

  return {
    fullName: fullName.trim(),
    birthDate,
    address,
    idType,
    idNumber: idNumber.trim(),
    mobileNumber,
    age,
    houseLotNo,
    street,
    purok,
    barangay: barangay.trim(),
    cityMunicipality: cityMunicipality.trim(),
    province: province.trim(),
    zipCode,
  }
}
