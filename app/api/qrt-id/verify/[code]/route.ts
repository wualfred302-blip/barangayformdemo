import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code: verificationCode } = await params

    // NOTE: This is a localStorage-based demo system.
    // In production, this would query the database:
    // const qrtId = await db.query('SELECT * FROM qrt_ids WHERE verification_code = $1', [verificationCode])

    // Since this is a client-side demo, the server cannot access localStorage.
    // Client must call findQRTByVerificationCode() from context to look up the verification code
    // in the browser's localStorage.

    // Optional: Mock data for testing
    if (verificationCode === "VRF-2025-000001") {
      return NextResponse.json({
        valid: true,
        data: {
          qrtCode: "QRT-2025-000001",
          verificationCode: "VRF-2025-000001",
          fullName: "Juan Dela Cruz",
          address: "123 Sample St., Barangay Demo",
          birthDate: "1990-01-01",
          status: "issued",
          issuedDate: "2025-01-01",
          expiryDate: "2026-01-01",
        },
      })
    }

    // Default response for demo mode
    return NextResponse.json(
      {
        valid: false,
        error: "Verification code not found. Check localStorage on client.",
      },
      { status: 404 }
    )
  } catch (error) {
    console.error("QRT verification error:", error)
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : "Verification failed",
      },
      { status: 500 }
    )
  }
}
