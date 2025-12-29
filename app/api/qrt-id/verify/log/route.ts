import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrtCode, verificationCode, verifiedBy, timestamp, action } = body

    // Validate required fields
    if (!qrtCode || !verificationCode || !verifiedBy || !timestamp) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: qrtCode, verificationCode, verifiedBy, timestamp",
        },
        { status: 400 }
      )
    }

    // NOTE: This is a demo system.
    // In production, this would insert into the activity_logs table:
    // await db.query(
    //   'INSERT INTO activity_logs (qrt_code, verification_code, verified_by, timestamp, action) VALUES ($1, $2, $3, $4, $5)',
    //   [qrtCode, verificationCode, verifiedBy, timestamp, action || 'qrt_verification']
    // )

    const logData = {
      qrtCode,
      verificationCode,
      verifiedBy,
      timestamp,
      action: action || "qrt_verification",
    }

    // For demo purposes, just log to console
    console.log("QRT Verification logged:", logData)

    return NextResponse.json({
      success: true,
      message: "Verification logged successfully",
      data: logData,
    })
  } catch (error) {
    console.error("Verification logging error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to log verification",
      },
      { status: 500 }
    )
  }
}
