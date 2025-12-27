import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// This is a mock API endpoint.
// In a real application, this would query a database.
// Since this demo uses localStorage, the server cannot access the client's data directly.
// We'll return a response that indicates the client should check its own storage,
// or return mock data for specific serial numbers.

export async function GET(
  request: Request,
  { params }: { params: Promise<{ serial: string }> }
) {
  const { serial } = await params
  const { searchParams } = new URL(request.url)
  const signatureHash = searchParams.get("signatureHash")

  // Simulate database lookup
  // In this demo, we can't access the user's localStorage from the server.
  // We will return a 404 so the client falls back to localStorage,
  // unless we want to mock a specific certificate.

  // Mock valid certificate for demonstration if needed
  if (serial === "MOCK-123") {
    return NextResponse.json({
      valid: true,
      certificate: {
        serialNumber: "MOCK-123",
        residentName: "JUAN DELA CRUZ",
        certificateType: "Residency",
        purpose: "Employment",
        issuedAt: new Date().toISOString(),
        staffSignature: "mock-signature",
        signedBy: "HON. JOHN DOE"
      },
      signatureValid: true,
      message: "Certificate is valid"
    })
  }

  return NextResponse.json({
    valid: false,
    message: "Certificate not found in central database"
  }, { status: 404 })
}
