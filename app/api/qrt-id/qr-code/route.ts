import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrtCode, fullName, birthDate, issuedDate } = body

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

    // Get base URL for verification
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin

    // Create QR data object
    const qrData = {
      qrtCode,
      fullName,
      birthDate,
      issuedDate,
      verifyUrl: `${baseUrl}/verify/qrt/${qrtCode}`,
    }

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: "H",
      width: 300,
      margin: 2,
    })

    return NextResponse.json({
      success: true,
      qrCodeDataUrl,
    })
  } catch (error) {
    console.error("QR code generation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate QR code",
      },
      { status: 500 }
    )
  }
}
