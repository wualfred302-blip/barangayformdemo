const AZURE_ENDPOINT = "https://baaborern.cognitiveservices.azure.com"
const AZURE_API_KEY = "6w3QVf4FGXnh7kI5rowYpbNoDpFQ7itBQMMWcubTNeeuhRV95apgJQQJ99CAAC3pKaRXJ3w3AAAFACOGs2Jq"

export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    const { imageBase64 } = await req.json()

    if (!imageBase64) {
      return Response.json({ success: false, error: "No image provided" }, { status: 400 })
    }

    // Convert base64 to binary
    const binaryData = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0))

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
      console.error("Azure OCR error:", errorText)
      return Response.json({ success: false, error: `OCR API error: ${response.status}` }, { status: 500 })
    }

    // Get operation location for polling
    const operationLocation = response.headers.get("Operation-Location")
    if (!operationLocation) {
      return Response.json({ success: false, error: "No operation location returned" }, { status: 500 })
    }

    // Poll for results (max 10 attempts)
    let result: any = null
    for (let i = 0; i < 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const pollResponse = await fetch(operationLocation, {
        headers: { "Ocp-Apim-Subscription-Key": AZURE_API_KEY },
      })

      result = await pollResponse.json()

      if (result.status === "succeeded") break
      if (result.status === "failed") {
        return Response.json({ success: false, error: "OCR processing failed" }, { status: 500 })
      }
    }

    if (!result || result.status !== "succeeded") {
      return Response.json({ success: false, error: "OCR timeout" }, { status: 500 })
    }

    // Extract all text from the result
    const allText: string[] = []
    for (const readResult of result.analyzeResult?.readResults || []) {
      for (const line of readResult.lines || []) {
        allText.push(line.text)
      }
    }

    // Parse the extracted text
    const extractedData = parseIDText(allText)
    const processingTime = Date.now() - startTime

    return Response.json({
      success: true,
      data: extractedData,
      rawText: allText.join("\n"),
      processingTime,
    })
  } catch (error: any) {
    console.error("OCR Error:", error)
    return Response.json({ success: false, error: error.message || "Failed to process ID" }, { status: 500 })
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
    // Look for lines with mostly letters and spaces (typical names)
    if (/^[A-Za-z\s,.'-]+$/.test(cleanLine) && cleanLine.length > 5 && cleanLine.length < 50) {
      // Skip common non-name lines
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

  // Extract address - look for common address indicators
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
      // Include next line if it looks like continuation
      if (i + 1 < lines.length && !lines[i + 1].includes(":")) {
        address += ", " + lines[i + 1]
      }
      break
    }
  }

  // Extract ID number
  let idNumber = ""
  const idPatterns = [
    /(\d{4}-\d{4}-\d{4}-\d{4})/, // PhilID CRN format
    /([A-Z]\d{2}-\d{2}-\d{6})/, // Driver's license
    /(\d{2}-\d{7}-\d)/, // SSS format
    /(\d{10,12})/, // Generic long number
  ]
  for (const pattern of idPatterns) {
    const match = text.match(pattern)
    if (match) {
      idNumber = match[1]
      break
    }
  }

  // Calculate age if birthDate found
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
