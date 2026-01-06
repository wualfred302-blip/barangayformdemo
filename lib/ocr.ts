// Azure Computer Vision OCR API integration
const AZURE_ENDPOINT = "https://baaborern.cognitiveservices.azure.com"
const AZURE_API_KEY = "6w3QVf4FGXnh7kI5rowYpbNoDpFQ7itBQMMWcubTNeeuhRV95apgJQQJ99CAAC3pKaRXJ3w3AAAFACOGs2Jq"

export interface OCRResult {
  success: boolean
  data?: {
    fullName: string
    birthDate: string
    address: string
    idType: string
    idNumber: string
  }
  error?: string
  rawText?: string
}

export async function extractIDData(imageBase64: string): Promise<OCRResult> {
  try {
    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "")

    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))

    // Call Azure Computer Vision Read API
    const response = await fetch(`${AZURE_ENDPOINT}/vision/v3.2/read/analyze`, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": AZURE_API_KEY,
        "Content-Type": "application/octet-stream",
      },
      body: binaryData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Azure OCR error:", errorText)
      return { success: false, error: `OCR API error: ${response.status}` }
    }

    // Get operation location for polling
    const operationLocation = response.headers.get("Operation-Location")
    if (!operationLocation) {
      return { success: false, error: "No operation location returned" }
    }

    // Poll for results
    let result: any = null
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const pollResponse = await fetch(operationLocation, {
        headers: {
          "Ocp-Apim-Subscription-Key": AZURE_API_KEY,
        },
      })

      result = await pollResponse.json()

      if (result.status === "succeeded") {
        break
      } else if (result.status === "failed") {
        return { success: false, error: "OCR processing failed" }
      }
    }

    if (!result || result.status !== "succeeded") {
      return { success: false, error: "OCR timeout" }
    }

    // Extract all text from the result
    const allText: string[] = []
    for (const readResult of result.analyzeResult?.readResults || []) {
      for (const line of readResult.lines || []) {
        allText.push(line.text)
      }
    }

    const rawText = allText.join("\n")
    console.log("[v0] OCR raw text:", rawText)

    // Parse the extracted text to find ID data
    const extractedData = parseIDText(allText)

    return {
      success: true,
      data: extractedData,
      rawText,
    }
  } catch (error) {
    console.error("[v0] OCR extraction error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

function parseIDText(lines: string[]): OCRResult["data"] {
  const text = lines.join(" ").toUpperCase()
  const joinedLines = lines.join("\n")

  // Detect ID type
  let idType = "Unknown"
  if (text.includes("PHILIPPINE IDENTIFICATION") || (text.includes("PHIL") && text.includes("ID"))) {
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

  // Extract name - look for common patterns
  let fullName = ""
  const namePatterns = [
    /(?:NAME|PANGALAN|SURNAME|APELYIDO)[:\s]*([A-Z\s,]+)/i,
    /(?:LAST NAME|SURNAME)[:\s]*([A-Z]+)[,\s]+(?:FIRST NAME|GIVEN NAME)[:\s]*([A-Z\s]+)/i,
  ]

  for (const pattern of namePatterns) {
    const match = text.match(pattern)
    if (match) {
      fullName = match[1].trim()
      if (match[2]) {
        fullName = `${match[1].trim()}, ${match[2].trim()}`
      }
      break
    }
  }

  // If no pattern matched, try to find a line that looks like a name
  if (!fullName) {
    for (const line of lines) {
      // Look for lines with mostly letters and spaces, typical of names
      if (/^[A-Za-z\s,]+$/.test(line.trim()) && line.length > 5 && line.length < 50) {
        fullName = line.trim()
        break
      }
    }
  }

  // Extract birth date
  let birthDate = ""
  const datePatterns = [
    /(?:BIRTH|BORN|DOB|BIRTHDAY|KAPANGANAKAN)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    /(?:BIRTH|BORN|DOB|BIRTHDAY)[:\s]*([A-Z]+\s+\d{1,2},?\s+\d{4})/i,
    /(\d{1,2}[-/]\d{1,2}[-/]\d{4})/,
  ]

  for (const pattern of datePatterns) {
    const match = text.match(pattern)
    if (match) {
      birthDate = match[1].trim()
      break
    }
  }

  // Extract address
  let address = ""
  const addressPatterns = [
    /(?:ADDRESS|TIRAHAN|RESIDENCE)[:\s]*([A-Z0-9\s,.-]+(?:BRGY|BARANGAY|CITY|PROVINCE|MANILA|PAMPANGA)[A-Z0-9\s,.-]*)/i,
    /(?:ADDRESS|TIRAHAN)[:\s]*(.+)/i,
  ]

  for (const pattern of addressPatterns) {
    const match = text.match(pattern)
    if (match) {
      address = match[1].trim()
      break
    }
  }

  // Extract ID number
  let idNumber = ""
  const idPatterns = [
    /(?:ID\s*(?:NO|NUMBER|#)|CRN|PCN)[:\s]*([A-Z0-9-]+)/i,
    /(?:LICENSE\s*NO)[:\s]*([A-Z0-9-]+)/i,
    /([A-Z]\d{2}-\d{2}-\d{6})/i, // Driver's license format
    /(\d{4}-\d{7}-\d)/i, // SSS format
    /(\d{12})/i, // PhilID CRN
  ]

  for (const pattern of idPatterns) {
    const match = text.match(pattern)
    if (match) {
      idNumber = match[1].trim()
      break
    }
  }

  return {
    fullName: fullName || "",
    birthDate: birthDate || "",
    address: address || "",
    idType,
    idNumber: idNumber || "",
  }
}
