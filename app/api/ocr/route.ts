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

  // Detect ID type
  let idType = "Government ID"
  if (text.includes("PHILIPPINE IDENTIFICATION") || text.includes("PHILSYS") || text.includes("PSN")) {
    idType = "Philippine National ID"
  } else if (text.includes("DRIVER") || text.includes("LICENSE") || text.includes("LTO")) {
    idType = "Driver's License"
  } else if (text.includes("UMID") || text.includes("UNIFIED MULTI-PURPOSE")) {
    idType = "UMID"
  } else if (text.includes("SSS") || text.includes("SOCIAL SECURITY")) {
    idType = "SSS ID"
  } else if (text.includes("PHILHEALTH") || text.includes("PHILIPPINE HEALTH")) {
    idType = "PhilHealth ID"
  } else if (text.includes("POSTAL") || text.includes("PHILPOST")) {
    idType = "Postal ID"
  } else if (text.includes("VOTER") || text.includes("COMELEC")) {
    idType = "Voter's ID"
  } else if (text.includes("PASSPORT") || text.includes("PASAPORTE")) {
    idType = "Philippine Passport"
  } else if (text.includes("PRC") || text.includes("PROFESSIONAL REGULATION")) {
    idType = "PRC ID"
  } else if (text.includes("BARANGAY")) {
    idType = "Barangay ID"
  } else if (text.includes("SENIOR CITIZEN") || text.includes("OSCA")) {
    idType = "Senior Citizen ID"
  } else if (text.includes("PWD") || text.includes("PERSON WITH DISABILITY")) {
    idType = "PWD ID"
  }

  // Extract name
  let fullName = ""
  for (const line of lines) {
    const cleanLine = line.trim()
    if (/^[A-Za-z\s,.'-]+$/.test(cleanLine) && cleanLine.length > 5 && cleanLine.length < 50) {
      const lower = cleanLine.toLowerCase()
      if (!lower.includes("republic") && !lower.includes("philippines") && !lower.includes("identification")) {
        fullName = cleanLine
        break
      }
    }
  }

  // Extract birth date
  let birthDate = ""
  const datePatterns = [/(\d{4}[-/]\d{2}[-/]\d{2})/, /(\d{2}[-/]\d{2}[-/]\d{4})/, /([A-Z]+\s+\d{1,2},?\s+\d{4})/i]
  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      birthDate = match[1]
      break
    }
  }

  let address = ""
  let houseLotNo = ""
  let street = ""
  let purok = ""
  let barangay = ""
  let cityMunicipality = ""
  let province = ""
  let zipCode = ""

  // Find address lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toUpperCase()
    if (
      line.includes("BRGY") ||
      line.includes("BARANGAY") ||
      line.includes("CITY") ||
      line.includes("PROVINCE") ||
      line.includes("STREET") ||
      line.includes("PUROK") ||
      line.includes("SAN") ||
      line.includes("STA") ||
      line.includes("STO")
    ) {
      address = lines[i]
      if (i + 1 < lines.length && !lines[i + 1].includes(":")) {
        address += ", " + lines[i + 1]
      }
      break
    }
  }

  // Parse address components
  if (address) {
    const upperAddress = address.toUpperCase()

    // Extract house/lot number (numbers at the start)
    const houseMatch = address.match(/^(\d+[-A-Z]?)\s/i)
    if (houseMatch) {
      houseLotNo = houseMatch[1]
    }

    // Extract street (look for St., Street, Ave, Avenue, Road, Rd)
    const streetMatch = address.match(
      /(\d*\s*[A-Za-z\s]+(?:ST\.?|STREET|AVE\.?|AVENUE|ROAD|RD\.?|BLVD\.?|DRIVE|DR\.?))/i,
    )
    if (streetMatch) {
      street = streetMatch[1].trim()
    }

    // Extract purok
    const purokMatch = upperAddress.match(/PUROK\s*(\d+|[A-Z]+)/i)
    if (purokMatch) {
      purok = purokMatch[1]
    }

    // Extract barangay
    const barangayMatch = upperAddress.match(/(?:BRGY\.?|BARANGAY)\s*([A-Za-z\s]+?)(?:,|CITY|MUNICIPALITY|PROVINCE|$)/i)
    if (barangayMatch) {
      barangay = barangayMatch[1].trim()
    }

    // Extract city/municipality
    const cityMatch = upperAddress.match(
      /(?:CITY\s+OF\s+|MUNICIPALITY\s+OF\s+)?([A-Z\s]+)(?:\s+CITY|\s+MUNICIPALITY)?(?:,|PROVINCE|$)/i,
    )
    if (cityMatch) {
      const potentialCity = cityMatch[1].trim()
      // Common Philippine cities
      const cities = [
        "MANILA",
        "QUEZON",
        "MAKATI",
        "PASIG",
        "TAGUIG",
        "CALOOCAN",
        "MABALACAT",
        "ANGELES",
        "SAN FERNANDO",
        "CABANATUAN",
        "MEYCAUAYAN",
        "MALOLOS",
      ]
      for (const city of cities) {
        if (upperAddress.includes(city)) {
          cityMunicipality = city.charAt(0) + city.slice(1).toLowerCase()
          break
        }
      }
      if (!cityMunicipality && potentialCity.length > 2) {
        cityMunicipality = potentialCity
      }
    }

    // Extract province
    const provinces = [
      "PAMPANGA",
      "BULACAN",
      "NUEVA ECIJA",
      "TARLAC",
      "ZAMBALES",
      "BATAAN",
      "CAVITE",
      "LAGUNA",
      "BATANGAS",
      "RIZAL",
      "METRO MANILA",
      "NCR",
    ]
    for (const prov of provinces) {
      if (upperAddress.includes(prov)) {
        province = prov
          .split(" ")
          .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
          .join(" ")
        break
      }
    }

    // Extract ZIP code
    const zipMatch = address.match(/\b(\d{4})\b/)
    if (zipMatch) {
      zipCode = zipMatch[1]
    }
  }

  // Extract ID number
  let idNumber = ""
  const idPatterns = [/(\d{4}-\d{4}-\d{4}-\d{4})/, /([A-Z]\d{2}-\d{2}-\d{6})/, /(\d{2}-\d{7}-\d)/, /(\d{10,12})/]
  for (const pattern of idPatterns) {
    const match = text.match(pattern)
    if (match) {
      idNumber = match[1]
      break
    }
  }

  // Calculate age
  let age = ""
  if (birthDate) {
    try {
      const parsed = new Date(birthDate)
      if (!isNaN(parsed.getTime())) {
        const today = new Date()
        let calcAge = today.getFullYear() - parsed.getFullYear()
        const monthDiff = today.getMonth() - parsed.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < parsed.getDate())) {
          calcAge--
        }
        age = calcAge.toString()
      }
    } catch {}
  }

  return {
    fullName,
    birthDate,
    address,
    idType,
    idNumber,
    mobileNumber: "",
    age,
    houseLotNo,
    street,
    purok,
    barangay,
    cityMunicipality,
    province,
    zipCode,
  }
}
