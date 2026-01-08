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
    console.log("[v0] === RAW AZURE OCR OUTPUT ===")
    allText.forEach((line, idx) => {
      console.log(`[v0] Line ${idx}: "${line}"`)
    })
    console.log("[v0] === END RAW OUTPUT ===")

    // Parse the extracted text
    const extractedData = parseIDText(allText)
    const processingTime = Date.now() - startTime

    console.log("[v0] Final extracted data:", JSON.stringify(extractedData, null, 2))

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

  console.log("[OCR Parser] Raw lines:", lines)

  // ========== ID TYPE DETECTION (First Priority) ==========
  let idType = "Government ID"
  const idTypePatterns: [RegExp, string][] = [
    [/PAMBANSANG\s*PAGKAKAKILANLAN|PHILIPPINE\s*IDENTIFICATION|PHILSYS|PSN|PHILIPPINE\s*STATISTICS\s*AUTHORITY/i, "Philippine National ID"],
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

  console.log("[OCR Parser] Detected ID type:", idType)

  // ========== PHILIPPINE NATIONAL ID SPECIFIC PARSING ==========
  // PhilSys ID has a specific format with bilingual labels
  if (idType === "Philippine National ID") {
    console.log("[OCR Parser] ✓ Using specialized Philippine National ID parser")
    return parsePhilippineNationalID(lines, text)
  }

  // ========== DRIVER'S LICENSE SPECIFIC PARSING ==========
  // Driver's License has a specific format from LTO
  if (idType === "Driver's License") {
    console.log("[OCR Parser] ✓ Using specialized Driver's License parser")
    return parseDriversLicense(lines, text)
  }

  // ========== GENERIC PARSING FOR OTHER IDs ==========
  console.log("[OCR Parser] → Using generic ID parser")
  return parseGenericID(lines, text, joinedText, idType)
}

// Specialized parser for Philippine National ID (PhilSys)
function parsePhilippineNationalID(lines: string[], text: string): {
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
  let lastName = ""
  let givenNames = ""
  let middleName = ""
  let birthDate = ""
  let address = ""
  let idNumber = ""

  // PhilSys labels to look for (bilingual format)
  const labelPatterns = {
    lastName: /APELYIDO\s*\/?\s*LAST\s*NAME/i,
    givenNames: /MGA\s*PANGALAN\s*\/?\s*GIVEN\s*NAMES?/i,
    middleName: /GITNANG\s*APELYIDO\s*\/?\s*MIDDLE\s*NAME/i,
    birthDate: /PETSA\s*NG\s*KAPANGANAKAN\s*\/?\s*DATE\s*OF\s*BIRTH/i,
    address: /TIRAHAN\s*\/?\s*ADDRESS/i,
  }

  // Find values that come AFTER each label
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    const upperLine = line.toUpperCase()

    // Check for Last Name label
    if (labelPatterns.lastName.test(upperLine)) {
      // The actual last name is on the next line(s)
      for (let j = i + 1; j < lines.length && j <= i + 2; j++) {
        const nextLine = lines[j].trim()
        if (nextLine && !isLabelLine(nextLine) && /^[A-Z\s\-']+$/i.test(nextLine)) {
          lastName = nextLine.toUpperCase()
          console.log("[PhilSys] Found lastName:", lastName)
          break
        }
      }
    }

    // Check for Given Names label
    if (labelPatterns.givenNames.test(upperLine)) {
      for (let j = i + 1; j < lines.length && j <= i + 2; j++) {
        const nextLine = lines[j].trim()
        if (nextLine && !isLabelLine(nextLine) && /^[A-Z\s\-']+$/i.test(nextLine)) {
          givenNames = nextLine.toUpperCase()
          console.log("[PhilSys] Found givenNames:", givenNames)
          break
        }
      }
    }

    // Check for Middle Name label
    if (labelPatterns.middleName.test(upperLine)) {
      for (let j = i + 1; j < lines.length && j <= i + 2; j++) {
        const nextLine = lines[j].trim()
        if (nextLine && !isLabelLine(nextLine) && /^[A-Z\s\-']+$/i.test(nextLine)) {
          middleName = nextLine.toUpperCase()
          console.log("[PhilSys] Found middleName:", middleName)
          break
        }
      }
    }

    // Check for Birth Date label
    if (labelPatterns.birthDate.test(upperLine)) {
      for (let j = i + 1; j < lines.length && j <= i + 2; j++) {
        const nextLine = lines[j].trim()
        // Match date patterns: "MARCH 15, 1971" or "03/15/1971" etc.
        if (nextLine && /^[A-Z]+\s+\d{1,2},?\s+\d{4}$/i.test(nextLine)) {
          birthDate = nextLine
          console.log("[PhilSys] Found birthDate:", birthDate)
          break
        }
        if (nextLine && /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(nextLine)) {
          birthDate = nextLine
          console.log("[PhilSys] Found birthDate:", birthDate)
          break
        }
      }
    }

    // Check for Address label
    if (labelPatterns.address.test(upperLine)) {
      for (let j = i + 1; j < lines.length && j <= i + 2; j++) {
        const nextLine = lines[j].trim()
        if (nextLine && !isLabelLine(nextLine) && nextLine.length > 5) {
          address = nextLine
          console.log("[PhilSys] Found address:", address)
          break
        }
      }
    }
  }

  // Extract ID number (16-digit format: XXXX-XXXX-XXXX-XXXX)
  const idNumberMatch = text.match(/\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4})\b/)
  if (idNumberMatch) {
    idNumber = idNumberMatch[1].replace(/\s/g, "")
    console.log("[PhilSys] Found idNumber:", idNumber)
  }

  // If labels didn't work, try positional extraction based on PhilSys card layout
  if (!lastName || !givenNames) {
    console.log("[PhilSys] Label extraction failed, trying positional extraction")
    const nameResult = extractNamesPositionally(lines)
    if (nameResult.lastName) lastName = nameResult.lastName
    if (nameResult.givenNames) givenNames = nameResult.givenNames
    if (nameResult.middleName) middleName = nameResult.middleName
  }

  // Try standalone date pattern if not found
  if (!birthDate) {
    const dateMatch = text.match(/\b((?:JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)\s+\d{1,2},?\s+\d{4})\b/i)
    if (dateMatch) {
      birthDate = dateMatch[1]
      console.log("[PhilSys] Found birthDate via standalone pattern:", birthDate)
    }
  }

  // Try standalone address pattern if not found
  if (!address) {
    // Look for address-like patterns with numbers and location words
    for (const line of lines) {
      const trimmed = line.trim()
      if (/^\d+\s+.*(HIGHWAY|STREET|ST\.|AVE|ROAD|BLVD)/i.test(trimmed)) {
        address = trimmed
        console.log("[PhilSys] Found address via pattern:", address)
        break
      }
    }
  }

  // Construct full name: GIVEN MIDDLE LAST
  const fullName = [givenNames, middleName, lastName].filter(Boolean).join(" ").trim()
  console.log("[PhilSys] Constructed fullName:", fullName)

  // Parse address components
  const addressComponents = parseAddressComponents(address)

  // Calculate age
  const age = calculateAge(birthDate)

  return {
    fullName,
    birthDate,
    address,
    idType: "Philippine National ID",
    idNumber,
    mobileNumber: "",
    age,
    ...addressComponents,
  }
}

// Check if a line is a label (not actual data)
function isLabelLine(line: string): boolean {
  const upper = line.toUpperCase().trim()
  const labelKeywords = [
    "REPUBLIKA", "REPUBLIC", "PILIPINAS", "PHILIPPINES",
    "PAMBANSANG", "PAGKAKAKILANLAN", "IDENTIFICATION",
    "APELYIDO", "LAST NAME", "SURNAME",
    "PANGALAN", "GIVEN NAME", "FIRST NAME",
    "GITNANG", "MIDDLE NAME",
    "PETSA", "KAPANGANAKAN", "DATE OF BIRTH", "BIRTHDAY",
    "TIRAHAN", "ADDRESS",
    "KASARIAN", "SEX", "GENDER",
    "LUGAR", "PLACE OF BIRTH",
    "PHILIPPINE STATISTICS", "AUTHORITY", "PSA",
    "CARD", "PHL",
  ]

  // Check if the line is mostly composed of label keywords
  for (const keyword of labelKeywords) {
    if (upper === keyword || upper.includes("/" + keyword) || upper.includes(keyword + "/")) {
      return true
    }
  }

  // Check for bilingual label patterns
  if (/^[A-Z\s]+\/[A-Z\s]+$/i.test(upper)) {
    return true
  }

  return false
}

// Positional extraction for PhilSys when labels fail
function extractNamesPositionally(lines: string[]): { lastName: string; givenNames: string; middleName: string } {
  let lastName = ""
  let givenNames = ""
  let middleName = ""

  // Filter out obvious non-name lines
  const potentialNames: string[] = []

  for (const line of lines) {
    const trimmed = line.trim().toUpperCase()

    // Skip if it's a label, header, or contains numbers/special chars
    if (isLabelLine(trimmed)) continue
    if (/\d/.test(trimmed)) continue
    if (trimmed.length < 2 || trimmed.length > 30) continue
    if (!/^[A-Z\s\-']+$/.test(trimmed)) continue

    // Skip common non-name words
    const skipWords = ["PHL", "MALE", "FEMALE", "FILIPINO", "FILIPINA"]
    if (skipWords.includes(trimmed)) continue

    potentialNames.push(trimmed)
  }

  console.log("[PhilSys] Potential name lines:", potentialNames)

  // PhilSys typically shows names in order: LAST NAME, GIVEN NAMES, MIDDLE NAME
  // after their respective labels, so the first 3 standalone name-like entries are likely the names
  if (potentialNames.length >= 1) lastName = potentialNames[0]
  if (potentialNames.length >= 2) givenNames = potentialNames[1]
  if (potentialNames.length >= 3) middleName = potentialNames[2]

  return { lastName, givenNames, middleName }
}

// Specialized parser for Driver's License (LTO format)
function parseDriversLicense(lines: string[], text: string): {
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
  let fullName = ""
  let birthDate = ""
  let address = ""
  let idNumber = ""

  console.log("[Driver's License] Parsing lines:", lines)

  // ========== NAME EXTRACTION ==========
  // Format: "LAST NAME, FIRST NAME, MIDDLE NAME" appears after the header
  // Look for line with comma-separated name format
  for (const line of lines) {
    const trimmed = line.trim()

    // Match pattern: "LASTNAME, FIRSTNAME MIDDLENAME" or "LASTNAME, FIRSTNAME"
    // Must have at least one comma and be mostly letters
    if (/^[A-Z][A-Za-z\s\-']+,\s*[A-Z][A-Za-z\s\-']+$/.test(trimmed)) {
      // Make sure it's not a label line
      const upper = trimmed.toUpperCase()
      if (!upper.includes("ADDRESS") &&
          !upper.includes("BIRTH") &&
          !upper.includes("LICENSE") &&
          !upper.includes("PROVINCE") &&
          trimmed.length >= 10 &&
          trimmed.length <= 50) {
        fullName = trimmed
        console.log("[Driver's License] Found name:", fullName)
        break
      }
    }
  }

  // ========== BIRTH DATE EXTRACTION ==========
  // Format: "BIRTH DATE" label followed by date in various formats
  // Common formats: 1971-03-15, 03/15/1971, 15/03/1971

  // First try: Look for labeled birth date
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (/BIRTH\s*DATE/i.test(line)) {
      // Check same line for date
      const sameLine = line.replace(/BIRTH\s*DATE/i, "").trim()
      if (sameLine && /\d/.test(sameLine)) {
        // Extract date from same line
        const dateMatch = sameLine.match(/(\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2}|\d{1,2}[\-\/]\d{1,2}[\-\/]\d{2,4})/)
        if (dateMatch) {
          birthDate = dateMatch[1]
          console.log("[Driver's License] Found birthDate on same line:", birthDate)
          break
        }
      }

      // Check next line for date
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim()
        const dateMatch = nextLine.match(/^(\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2}|\d{1,2}[\-\/]\d{1,2}[\-\/]\d{2,4})/)
        if (dateMatch) {
          birthDate = dateMatch[1]
          console.log("[Driver's License] Found birthDate on next line:", birthDate)
          break
        }
      }
    }
  }

  // Second try: Look for any date in YYYY-MM-DD or similar format
  if (!birthDate) {
    const datePattern = /\b(\d{4}[\-\/]\d{1,2}[\-\/]\d{1,2})\b/
    const match = text.match(datePattern)
    if (match) {
      const year = parseInt(match[1].substring(0, 4))
      // Sanity check: birth year should be between 1900 and current year
      if (year >= 1900 && year <= new Date().getFullYear()) {
        birthDate = match[1]
        console.log("[Driver's License] Found birthDate via pattern:", birthDate)
      }
    }
  }

  // ========== ADDRESS EXTRACTION ==========
  // Format: "ADDRESS (NO. STREET, CITY MUN., PROVINCE)" followed by actual address
  // Example: "18 -, SUBIC, ZAMBALES"

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase()
    if (line.includes("ADDRESS") && (line.includes("STREET") || line.includes("PROVINCE"))) {
      // This is the label line, address is on next line(s)
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim()
        // Check if next line looks like an address (has numbers or location names)
        if (nextLine && (
          /^\d+/.test(nextLine) ||  // Starts with house number
          /,/.test(nextLine) ||      // Has commas (typical for Philippine addresses)
          nextLine.length > 10       // Long enough to be an address
        )) {
          address = nextLine
          console.log("[Driver's License] Found address:", address)
          break
        }
      }
    }
  }

  // If label-based extraction failed, look for comma-separated address pattern
  if (!address) {
    for (const line of lines) {
      const trimmed = line.trim()
      // Philippine address typically has commas and location names
      if (/^\d+.*,.*[A-Z]+.*,.*[A-Z]+/.test(trimmed) || // "18 -, SUBIC, ZAMBALES"
          /^[A-Z][A-Za-z\s]+,\s*[A-Z][A-Za-z\s]+,\s*[A-Z][A-Za-z\s]+/.test(trimmed)) {
        // Make sure it's not the name line
        if (trimmed !== fullName && trimmed.toUpperCase() !== fullName.toUpperCase()) {
          address = trimmed
          console.log("[Driver's License] Found address via pattern:", address)
          break
        }
      }
    }
  }

  // ========== LICENSE NUMBER EXTRACTION ==========
  // Format: C09-89-032775 (letter + 2 digits + dash + 2 digits + dash + 6 digits)
  const licenseMatch = text.match(/\b([A-Z]\d{2}[\s\-]?\d{2}[\s\-]?\d{5,7})\b/i)
  if (licenseMatch) {
    idNumber = licenseMatch[1].replace(/\s/g, "")
    console.log("[Driver's License] Found license number:", idNumber)
  }

  // Parse address components
  const addressComponents = parseAddressComponents(address)

  // Calculate age
  const age = calculateAge(birthDate)

  console.log("[Driver's License] === EXTRACTION SUMMARY ===")
  console.log(`[Driver's License] Full Name: "${fullName}"`)
  console.log(`[Driver's License] Birth Date: "${birthDate}"`)
  console.log(`[Driver's License] Address: "${address}"`)
  console.log(`[Driver's License] ID Number: "${idNumber}"`)
  console.log(`[Driver's License] Age: "${age}"`)
  console.log(`[Driver's License] Address Components:`, addressComponents)

  return {
    fullName,
    birthDate,
    address,
    idType: "Driver's License",
    idNumber,
    mobileNumber: "", // Driver's License doesn't usually show mobile number
    age,
    ...addressComponents,
  }
}

// Parse address into components
function parseAddressComponents(address: string): {
  houseLotNo: string
  street: string
  purok: string
  barangay: string
  cityMunicipality: string
  province: string
  zipCode: string
} {
  let houseLotNo = ""
  let street = ""
  let purok = ""
  let barangay = ""
  let cityMunicipality = ""
  let province = ""
  let zipCode = ""

  if (!address) {
    return { houseLotNo, street, purok, barangay, cityMunicipality, province, zipCode }
  }

  const upperAddr = address.toUpperCase()
  console.log("[Address Parser] Parsing:", upperAddr)

  // Split by comma for structured addresses like "18 NATIONAL HIGHWAY, ILWAS, SUBIC, ZAMBALES"
  const parts = address.split(",").map(p => p.trim())
  console.log("[Address Parser] Parts:", parts)

  if (parts.length >= 2) {
    // First part usually has house number and street
    const firstPart = parts[0]

    // Extract house number (leading digits)
    const houseMatch = firstPart.match(/^(\d+[-A-Z]?)\s+/i)
    if (houseMatch) {
      houseLotNo = houseMatch[1]
    }

    // Extract street (everything after house number, or entire first part if no house number)
    const streetPart = houseMatch ? firstPart.substring(houseMatch[0].length).trim() : firstPart
    if (streetPart && /HIGHWAY|STREET|ST\.?|AVENUE|AVE\.?|ROAD|RD\.?|BOULEVARD|BLVD\.?|DRIVE|DR\.?|LANE|LN\.?/i.test(streetPart)) {
      street = streetPart
    } else if (streetPart && !houseMatch) {
      // Might be street without type indicator
      street = streetPart
    }

    // For comma-separated Philippine addresses, typical format is:
    // [House# Street], [Barangay], [City/Municipality], [Province]
    if (parts.length === 4) {
      barangay = parts[1]
      cityMunicipality = parts[2]
      province = parts[3]
    } else if (parts.length === 3) {
      // Could be [Street], [City], [Province] or [Street], [Barangay], [City]
      const lastPart = parts[2].toUpperCase()
      if (isProvince(lastPart)) {
        province = parts[2]
        cityMunicipality = parts[1]
      } else {
        cityMunicipality = parts[2]
        barangay = parts[1]
      }
    } else if (parts.length === 2) {
      const secondPart = parts[1].toUpperCase()
      if (isProvince(secondPart)) {
        province = parts[1]
      } else {
        cityMunicipality = parts[1]
      }
    }
  } else {
    // Single string address - use pattern matching
    // House number
    const houseMatch = upperAddr.match(/^(\d+[-A-Z]?)\s/i)
    if (houseMatch) houseLotNo = houseMatch[1]

    // Street with type
    const streetMatch = upperAddr.match(/(\d*\s*[A-Z\s]+(?:NATIONAL\s+)?(?:HIGHWAY|STREET|ST\.?|AVENUE|AVE\.?|ROAD|RD\.?|BOULEVARD|BLVD\.?|DRIVE|DR\.?|LANE|LN\.?))/i)
    if (streetMatch) street = streetMatch[1].trim()

    // Purok
    const purokMatch = upperAddr.match(/PUROK\s*#?\s*(\d+|[A-Z]+)/i)
    if (purokMatch) purok = purokMatch[1]

    // Barangay
    const brgyMatch = upperAddr.match(/(?:BRGY\.?|BARANGAY)\s+([A-Z0-9\s\-]+?)(?:,|\s+CITY|\s+MUNICIPALITY|$)/i)
    if (brgyMatch) barangay = brgyMatch[1].trim()
  }

  // Province detection from full address
  if (!province) {
    const detectedProvince = detectProvince(upperAddr)
    if (detectedProvince) province = detectedProvince
  }

  // City/Municipality detection
  if (!cityMunicipality) {
    const detectedCity = detectCity(upperAddr)
    if (detectedCity) cityMunicipality = detectedCity
  }

  // ZIP code
  const zipMatch = upperAddr.match(/\b(\d{4})\b(?![\d\-])/)
  if (zipMatch) {
    const potentialZip = parseInt(zipMatch[1])
    if (potentialZip >= 400 && potentialZip <= 9811) {
      zipCode = zipMatch[1]
    }
  }

  // Title case the results
  const titleCase = (str: string) => str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ")

  return {
    houseLotNo,
    street: street ? titleCase(street) : "",
    purok,
    barangay: barangay ? titleCase(barangay) : "",
    cityMunicipality: cityMunicipality ? titleCase(cityMunicipality) : "",
    province: province ? titleCase(province) : "",
    zipCode,
  }
}

// Check if a string is a Philippine province
function isProvince(str: string): boolean {
  const provinces = [
    "ABRA", "AGUSAN DEL NORTE", "AGUSAN DEL SUR", "AKLAN", "ALBAY", "ANTIQUE", "APAYAO", "AURORA",
    "BASILAN", "BATAAN", "BATANES", "BATANGAS", "BENGUET", "BILIRAN", "BOHOL", "BUKIDNON", "BULACAN",
    "CAGAYAN", "CAMARINES NORTE", "CAMARINES SUR", "CAMIGUIN", "CAPIZ", "CATANDUANES", "CAVITE", "CEBU",
    "COTABATO", "DAVAO DE ORO", "DAVAO DEL NORTE", "DAVAO DEL SUR", "DAVAO OCCIDENTAL", "DAVAO ORIENTAL",
    "DINAGAT ISLANDS", "EASTERN SAMAR", "GUIMARAS", "IFUGAO", "ILOCOS NORTE", "ILOCOS SUR", "ILOILO",
    "ISABELA", "KALINGA", "LA UNION", "LAGUNA", "LANAO DEL NORTE", "LANAO DEL SUR", "LEYTE",
    "MAGUINDANAO", "MARINDUQUE", "MASBATE", "MISAMIS OCCIDENTAL", "MISAMIS ORIENTAL", "MOUNTAIN PROVINCE",
    "NEGROS OCCIDENTAL", "NEGROS ORIENTAL", "NORTHERN SAMAR", "NUEVA ECIJA", "NUEVA VIZCAYA",
    "OCCIDENTAL MINDORO", "ORIENTAL MINDORO", "PALAWAN", "PAMPANGA", "PANGASINAN", "QUEZON", "QUIRINO",
    "RIZAL", "ROMBLON", "SAMAR", "SARANGANI", "SIQUIJOR", "SORSOGON", "SOUTH COTABATO", "SOUTHERN LEYTE",
    "SULTAN KUDARAT", "SULU", "SURIGAO DEL NORTE", "SURIGAO DEL SUR", "TARLAC", "TAWI-TAWI",
    "ZAMBALES", "ZAMBOANGA DEL NORTE", "ZAMBOANGA DEL SUR", "ZAMBOANGA SIBUGAY",
    "METRO MANILA", "NCR",
  ]
  return provinces.includes(str.toUpperCase().trim())
}

// Detect province from text
function detectProvince(text: string): string {
  const provinces = [
    "ZAMBALES", "PAMPANGA", "BULACAN", "NUEVA ECIJA", "TARLAC", "BATAAN", "AURORA",
    "CAVITE", "LAGUNA", "BATANGAS", "RIZAL", "QUEZON", "PANGASINAN", "LA UNION",
    "ILOCOS NORTE", "ILOCOS SUR", "BENGUET", "CEBU", "BOHOL", "NEGROS ORIENTAL",
    "NEGROS OCCIDENTAL", "ILOILO", "CAPIZ", "DAVAO DEL SUR", "DAVAO DEL NORTE",
    "DAVAO ORIENTAL", "METRO MANILA", "NCR",
  ]

  for (const prov of provinces) {
    if (text.includes(prov)) {
      return prov
    }
  }
  return ""
}

// Detect city/municipality from text
function detectCity(text: string): string {
  const cities = [
    // NCR
    "MANILA", "QUEZON CITY", "MAKATI", "PASIG", "TAGUIG", "CALOOCAN", "PARAÑAQUE", "PARANAQUE",
    "LAS PIÑAS", "LAS PINAS", "MUNTINLUPA", "MARIKINA", "PASAY", "VALENZUELA", "MALABON",
    "NAVOTAS", "SAN JUAN", "MANDALUYONG", "PATEROS",
    // Central Luzon
    "ANGELES", "MABALACAT", "SAN FERNANDO", "CITY OF SAN FERNANDO", "MEYCAUAYAN", "MALOLOS",
    "CABANATUAN", "TARLAC CITY", "OLONGAPO", "BALANGA", "SAN JOSE DEL MONTE", "SUBIC",
    // Other major cities
    "CEBU CITY", "CEBU", "DAVAO", "ZAMBOANGA", "CAGAYAN DE ORO", "BACOLOD", "ILOILO CITY", "BAGUIO",
  ]

  for (const city of cities) {
    if (text.includes(city)) {
      return city
    }
  }
  return ""
}

// Calculate age from birth date
function calculateAge(birthDate: string): string {
  if (!birthDate) return ""

  try {
    let parsed: Date | null = null

    // Try different date formats
    if (/\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/.test(birthDate)) {
      parsed = new Date(birthDate)
    } else if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(birthDate)) {
      const parts = birthDate.split(/[\/\-]/)
      parsed = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]))
    } else if (/[A-Z]+\s+\d{1,2},?\s+\d{4}/i.test(birthDate)) {
      parsed = new Date(birthDate)
    }

    if (parsed && !isNaN(parsed.getTime())) {
      const today = new Date()
      let age = today.getFullYear() - parsed.getFullYear()
      const monthDiff = today.getMonth() - parsed.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
        age--
      }
      if (age > 0 && age < 150) {
        return age.toString()
      }
    }
  } catch {}

  return ""
}

// Generic parser for other ID types
function parseGenericID(lines: string[], text: string, joinedText: string, idType: string): {
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
  const LABELS_TO_FILTER = [
    "MGA PANGALAN", "PANGALAN", "APELYIDO", "UNANG PANGALAN", "GITNANG PANGALAN",
    "TIRAHAN", "KASARIAN", "PETSA NG KAPANGANAKAN", "LUGAR NG KAPANGANAKAN",
    "NASYONALIDAD", "KATAYUANG SIBIL", "TRABAHO", "LAGDA", "PIRMA",
    "FULL NAME", "FIRST NAME", "MIDDLE NAME", "LAST NAME", "SURNAME", "GIVEN NAME",
    "ADDRESS", "PERMANENT ADDRESS", "PRESENT ADDRESS", "DATE OF BIRTH", "PLACE OF BIRTH",
    "NATIONALITY", "CITIZENSHIP", "CIVIL STATUS", "SEX", "GENDER",
    "REPUBLIKA NG PILIPINAS", "REPUBLIC OF THE PHILIPPINES", "PHILIPPINE IDENTIFICATION",
    "PHILIPPINE STATISTICS AUTHORITY", "PHILSYS", "PAMBANSANG PAGKAKAKILANLAN",
  ]

  const isJustLabel = (text: string): boolean => {
    const upper = text.toUpperCase().trim()
    return LABELS_TO_FILTER.some(label =>
      upper === label || upper === label + ":" || upper.includes("/" + label) || upper.includes(label + "/")
    )
  }

  // ========== NAME EXTRACTION ==========
  let fullName = ""

  // Method 1: Look for labeled name fields
  const nameLabels = [
    /(?:FULL\s*NAME|NAME)[:\s]+([A-Za-z\s,.\-']+)/i,
    /(?:LAST\s*NAME|SURNAME|APELYIDO)[:\s]+([A-Za-z\s.\-']+)/i,
  ]

  for (const pattern of nameLabels) {
    const match = joinedText.match(pattern)
    if (match && match[1].trim().length > 2) {
      const extracted = match[1].trim()
      if (!isJustLabel(extracted)) {
        fullName = extracted.replace(/\s+/g, " ")
        break
      }
    }
  }

  // Method 2: Find name-like patterns
  if (!fullName) {
    for (const line of lines) {
      const cleanLine = line.trim()
      if (isJustLabel(cleanLine)) continue

      if (/^[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){1,3}$/.test(cleanLine) &&
          cleanLine.length >= 5 && cleanLine.length <= 50) {
        const lower = cleanLine.toLowerCase()
        if (!lower.includes("republic") && !lower.includes("philippines") &&
            !lower.includes("identification") && !lower.includes("pambansang") &&
            !lower.includes("pagkakakilanlan")) {
          fullName = cleanLine
          break
        }
      }
    }
  }

  // ========== BIRTH DATE EXTRACTION ==========
  let birthDate = ""
  const dobPatterns = [
    /(?:DATE\s*OF\s*BIRTH|DOB|BIRTHDAY|PETSA\s*NG\s*KAPANGANAKAN)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
    /(?:DATE\s*OF\s*BIRTH|DOB|BIRTHDAY)[:\s]+([A-Z]+\s+\d{1,2},?\s+\d{4})/i,
  ]

  for (const pattern of dobPatterns) {
    const match = joinedText.match(pattern)
    if (match) {
      birthDate = match[1].trim()
      break
    }
  }

  if (!birthDate) {
    const dateMatch = text.match(/\b((?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)[A-Z]*\.?\s+\d{1,2},?\s+\d{4})\b/i)
    if (dateMatch) birthDate = dateMatch[1]
  }

  // ========== ID NUMBER EXTRACTION ==========
  let idNumber = ""
  const idNumberPatterns: Record<string, RegExp[]> = {
    "Driver's License": [/\b([A-Z]\d{2}[\s\-]?\d{2}[\s\-]?\d{6})\b/i],
    "UMID": [/\b(\d{4}[\s\-]?\d{7}[\s\-]?\d)\b/],
    "SSS ID": [/\b(\d{2}[\s\-]?\d{7}[\s\-]?\d)\b/],
    "PhilHealth ID": [/\b(\d{2}[\s\-]?\d{9}[\s\-]?\d)\b/],
    "Postal ID": [/\b([A-Z]{3}[\s\-]?\d{4}[\s\-]?\d{7})\b/i],
    "Voter's ID": [/\b(\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{2})\b/],
  }

  const patterns = idNumberPatterns[idType] || [/\b(\d{10,16})\b/]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      idNumber = match[1].replace(/\s/g, "")
      break
    }
  }

  // ========== ADDRESS ==========
  let address = ""
  const addressMatch = joinedText.match(/(?:ADDRESS|TIRAHAN)[:\s]+(.+?)(?=(?:DATE|BIRTH|SEX|$))/i)
  if (addressMatch) {
    address = addressMatch[1].replace(/\n/g, ", ").replace(/\s+/g, " ").trim()
  }

  const addressComponents = parseAddressComponents(address)

  // ========== MOBILE NUMBER ==========
  let mobileNumber = ""
  const mobileMatch = text.match(/\b(09\d{9})\b/)
  if (mobileMatch) mobileNumber = mobileMatch[1]

  // ========== AGE ==========
  const age = calculateAge(birthDate)

  return {
    fullName,
    birthDate,
    address,
    idType,
    idNumber,
    mobileNumber,
    age,
    ...addressComponents,
  }
}
