import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { qrtCode, verifiedBy, timestamp } = body

    // Validate required fields
    if (!qrtCode || !verifiedBy || !timestamp) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: qrtCode, verifiedBy, timestamp",
        },
        { status: 400 }
      )
    }

    // NOTE: This is a demo system.
    // In production, this would insert into the activity_logs table:
    // await db.query(
    //   'INSERT INTO activity_logs (qrt_code, verified_by, timestamp, action) VALUES ($1, $2, $3, $4)',
    //   [qrtCode, verifiedBy, timestamp, 'qrt_verification']
    // )

    // For demo purposes, just log to console
    console.log("QRT Verification logged:", {
      qrtCode,
      verifiedBy,
      timestamp,
      action: "qrt_verification",
    })

    return NextResponse.json({
      success: true,
      message: "Verification logged successfully",
      data: {
        qrtCode,
        verifiedBy,
        timestamp,
      },
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
