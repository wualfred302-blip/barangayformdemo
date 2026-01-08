export async function POST(req: Request) {
  const startTime = Date.now()

  try {
    // Check for API key first
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          success: false,
          error: "OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.",
        },
        { status: 500 },
      )
    }

    const { imageBase64 } = await req.json()

    if (!imageBase64) {
      return Response.json(
        {
          success: false,
          error: "No image provided",
        },
        { status: 400 },
      )
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `You are an OCR assistant that extracts information from Philippine ID cards.
Extract the following fields and return ONLY a valid JSON object (no markdown, no extra text):
{
  "fullName": "complete name as shown on ID",
  "birthDate": "YYYY-MM-DD format",
  "address": "complete address",
  "mobileNumber": "phone number if visible, otherwise empty string",
  "age": "calculated age from birthdate as number string"
}
If a field is not clearly visible, use empty string. Be accurate and fast.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all information from this Philippine ID card:",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || "{}"

    // Parse JSON (handle markdown wrapping if present)
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const extractedData = JSON.parse(jsonMatch ? jsonMatch[0] : content)

    // Calculate age if birthDate is provided but age is not
    if (extractedData.birthDate && !extractedData.age) {
      const birthDate = new Date(extractedData.birthDate)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      extractedData.age = age.toString()
    }

    const processingTime = Date.now() - startTime

    return Response.json({
      success: true,
      data: extractedData,
      processingTime,
    })
  } catch (error: any) {
    const processingTime = Date.now() - startTime
    console.error("OCR Error:", error)

    return Response.json(
      {
        success: false,
        error: error.message || "Failed to process ID. Please try again.",
        processingTime,
      },
      { status: 500 },
    )
  }
}
