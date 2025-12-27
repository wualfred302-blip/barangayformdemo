import { NextRequest, NextResponse } from "next/server"

/**
 * NOTE: This API route is for QR code generation only.
 * The actual ID card images (front/back) are generated CLIENT-SIDE using html2canvas.
 *
 * The client will:
 * 1. Call this endpoint to get the QR code
 * 2. Render the ID templates in the browser with the QR code
 * 3. Use html2canvas to convert templates to images
 * 4. Store the resulting image data URLs in the QRT context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      qrtCode,
      fullName,
      birthDate,
      issuedDate,
    } = body

    // Validate required fields
    if (!qrtCode || !fullName || !birthDate || !issuedDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: qrtCode, fullName, birthDate, issuedDate",
        },
        { status: 400 }
      )
    }

    // Generate QR code
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin
    const qrResponse = await fetch(`${baseUrl}/api/qrt-id/qr-code`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        qrtCode,
        fullName,
        birthDate,
        issuedDate,
      }),
    })

    if (!qrResponse.ok) {
      throw new Error("Failed to generate QR code")
    }

    const qrData = await qrResponse.json()

    // Return only the QR code data URL
    // The client will handle ID card image generation
    return NextResponse.json({
      success: true,
      qrCodeDataUrl: qrData.qrCodeDataUrl,
      message: "QR code generated. Client should generate ID images using html2canvas.",
    })
  } catch (error) {
    console.error("QRT ID generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate QRT ID",
      },
      { status: 500 }
    )
  }
}
