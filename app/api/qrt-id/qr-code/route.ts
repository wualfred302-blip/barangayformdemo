import { NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { verificationCode } = body

    // Validate required fields
    if (!verificationCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required field: verificationCode",
        },
        { status: 400 }
      )
    }

    // Get base URL for verification
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin

    // Create QR data object (security-first: only verification code, no personal data)
    const qrData = {
      verificationCode,
      verifyUrl: `${baseUrl}/api/qrt-id/verify/${verificationCode}`,
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
