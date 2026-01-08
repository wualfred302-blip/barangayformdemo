const AZURE_ENDPOINT = process.env.AZURE_CV_ENDPOINT || "https://barangaylinkod.cognitiveservices.azure.com"
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
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "")
      binaryData = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0))
    } catch (decodeError) {
      return Response.json(
        { success: false, error: "Invalid base64 image data" },
        { status: 400, headers: corsHeaders },
      )
    }

    const analyzeUrl = `${AZURE_ENDPOINT}/vision/v3.1/read/analyze`

    console.log("[v0] Calling Azure OCR at:", analyzeUrl)
    console.log("[v0] Image size (bytes):", binaryData.length)

    let response: Response
    try {
      response = await fetch(analyzeUrl, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_API_KEY,
          "Content-Type": "application/octet-stream",
        },
        body: binaryData,
      })
    } catch (fetchError: any) {
      console.error("[v0] Azure fetch network error:", fetchError.message)
      return Response.json(
        { success: false, error: `Network error connecting to Azure: ${fetchError.message}` },
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
          const errorJson = JSON.parse(errorBody)
          errorMessage = errorJson.error?.message || errorJson.message || errorMessage
        }
      } catch {}
      return Response.json({ success: false, error: errorMessage }, { status: 500, headers: corsHeaders })
    }

    let operationLocation: string | null = null
    try {
      operationLocation = response.headers.get("Operation-Location")
    } catch (headerError: any) {
      console.error("[v0] Error getting Operation-Location header:", headerError.message)
    }

    console.log("[v0] Operation-Location:", operationLocation)

    if (!operationLocation) {
      return Response.json(
        { success: false, error: "Azure did not return Operation-Location header" },
        { status: 500, headers: corsHeaders },
      )
    }

    let result: any = null
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
        console.log("[v0] Poll result status:", result.status)

        if (result.status === "succeeded") break
        if (result.status === "failed") {
          return Response.json(
            { success: false, error: "OCR processing failed" },
            { status: 500, headers: corsHeaders },
          )
        }
      } catch (pollError: any) {
        console.error("[v0] Poll error:", pollError.message)
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
  } catch (error: any) {
    console.error("[v0] OCR Error:", error.message, error.stack)
    return Response.json(
      { success: false, error: error.message || "Failed to process ID" },
      { status: 500, headers: corsHeaders },
    )
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
  } else if (text.includes("POSTAL") || text.includes("PHILPOST")) {
    idType = "Postal ID"
  } else if (text.includes("VOTER") || text.includes("COMELEC")) {
    idType = "Voter's ID"
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

  // Extract address
  let address = ""
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toUpperCase()
    if (
      line.includes("BRGY") ||
      line.includes("BARANGAY") ||
      line.includes("CITY") ||
      line.includes("PROVINCE") ||
      line.includes("STREET") ||
      line.includes("PUROK")
    ) {
      address = lines[i]
      if (i + 1 < lines.length && !lines[i + 1].includes(":")) {
        address += ", " + lines[i + 1]
      }
      break
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
  }
}
