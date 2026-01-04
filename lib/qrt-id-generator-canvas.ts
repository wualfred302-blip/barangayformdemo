// Canvas-based QRT ID generator that works in v0's environment
// This replaces the Konva-based generator which has React reconciler issues

export interface QRTIDData {
  qrtCode: string
  verificationCode: string
  fullName: string
  birthDate: string
  address: string
  gender: string
  civilStatus: string
  birthPlace: string
  photoUrl: string
  issuedDate: string
  expiryDate: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  emergencyContactAddress: string
  qrCodeData: string
  precinctNumber?: string
}

export interface GenerateQRTIDResult {
  success: boolean
  frontImageUrl?: string
  backImageUrl?: string
  error?: string
}

// Helper to load image
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

// Helper to draw rounded rect
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export async function generateQRTIDImages(data: QRTIDData): Promise<GenerateQRTIDResult> {
  console.log("[v0] Canvas Generator: Starting ID generation...")

  try {
    // Generate front image
    const frontCanvas = document.createElement("canvas")
    frontCanvas.width = 856
    frontCanvas.height = 540
    const frontCtx = frontCanvas.getContext("2d")!

    // Background gradient
    const bgGradient = frontCtx.createLinearGradient(0, 0, 0, 540)
    bgGradient.addColorStop(0, "#eff6ff")
    bgGradient.addColorStop(0.5, "#ffffff")
    bgGradient.addColorStop(1, "#fdf2f8")
    frontCtx.fillStyle = bgGradient
    frontCtx.fillRect(0, 0, 856, 540)

    // Header bar
    const headerGradient = frontCtx.createLinearGradient(0, 0, 856, 0)
    headerGradient.addColorStop(0, "#10b981")
    headerGradient.addColorStop(0.5, "#059669")
    headerGradient.addColorStop(1, "#10b981")
    frontCtx.fillStyle = headerGradient
    frontCtx.fillRect(0, 0, 856, 60)

    // Try to load and draw Mawaque logo in header (TOP LEFT)
    try {
      const mawaqueLogo = await loadImage("/images/mawaque-logo.png")
      frontCtx.drawImage(mawaqueLogo, 20, 10, 45, 40)
    } catch (e) {
      console.log("[v0] Could not load Mawaque logo, trying alternate path")
      try {
        const mawaqueLogo = await loadImage("/images/logo.png")
        frontCtx.drawImage(mawaqueLogo, 20, 10, 45, 40)
      } catch (e2) {
        console.log("[v0] Could not load any Mawaque logo")
      }
    }

    // Try to load and draw Bagong Pilipinas logo in header (TOP MIDDLE)
    try {
      const bpLogo = await loadImage("/images/bagongpilipinas-logo-main.png")
      frontCtx.drawImage(bpLogo, 405, 10, 45, 40) // Centered at 428 - 23 = 405
    } catch (e) {
      console.log("[v0] Could not load Bagong Pilipinas logo")
    }

    // Header text - left (after Mawaque logo)
    frontCtx.fillStyle = "#ffffff"
    frontCtx.font = "bold 16px Arial"
    frontCtx.fillText("REPUBLIKA NG PILIPINAS", 75, 22)
    frontCtx.font = "bold 18px Arial"
    frontCtx.fillText("BARANGAY MAWAQUE", 75, 44)

    // Header text - right
    frontCtx.font = "bold 18px Arial"
    frontCtx.fillText("QUICK RESPONSE TEAM", 640, 22)
    frontCtx.font = "bold 24px Arial"
    frontCtx.fillText("QRT ID", 640, 48)

    // Photo placeholder/frame
    frontCtx.strokeStyle = "#10b981"
    frontCtx.lineWidth = 3
    frontCtx.strokeRect(32, 60, 180, 220)
    frontCtx.fillStyle = "#f3f4f6"
    frontCtx.fillRect(35, 63, 174, 214)

    // Try to load and draw photo
    try {
      if (data.photoUrl && data.photoUrl.startsWith("data:")) {
        const photo = await loadImage(data.photoUrl)
        frontCtx.drawImage(photo, 35, 63, 174, 214)
      }
    } catch (e) {
      console.log("[v0] Could not load photo, using placeholder")
      frontCtx.fillStyle = "#9ca3af"
      frontCtx.font = "16px Arial"
      frontCtx.textAlign = "center"
      frontCtx.fillText("Photo", 122, 170)
      frontCtx.textAlign = "left"
    }

    // Sideways QRT (left edge, CCW)
    frontCtx.save()
    frontCtx.translate(25, 270)
    frontCtx.rotate(-Math.PI / 2)
    frontCtx.font = "bold 22px Arial"
    frontCtx.fillStyle = "#10b981"
    frontCtx.textAlign = "center"
    frontCtx.textBaseline = "middle"
    frontCtx.fillText(data.qrtCode, 0, 0)
    frontCtx.restore()

    // Verification code box
    const vcGradient = frontCtx.createLinearGradient(32, 295, 212, 295)
    vcGradient.addColorStop(0, "#10b981")
    vcGradient.addColorStop(1, "#059669")
    frontCtx.fillStyle = vcGradient
    roundRect(frontCtx, 32, 295, 180, 60, 4)
    frontCtx.fill()

    frontCtx.fillStyle = "#ffffff"
    frontCtx.font = "bold 14px Arial"
    frontCtx.textAlign = "center"
    frontCtx.fillText("VERIFICATION CODE", 122, 312)
    frontCtx.font = "bold 16px Arial"
    frontCtx.fillText(data.verificationCode, 122, 332)
    frontCtx.font = "12px Arial"
    frontCtx.fillStyle = "#d1d5db"
    frontCtx.fillText("Scan for secure verification", 122, 348)
    frontCtx.textAlign = "left"

    // Personal info section
    frontCtx.fillStyle = "#374151"
    frontCtx.font = "bold 16px Arial"
    frontCtx.fillText("FULL NAME", 240, 80)
    frontCtx.fillStyle = "#111827"
    frontCtx.font = "bold 38px Arial"
    frontCtx.fillText(data.fullName.toUpperCase(), 240, 120)

    frontCtx.fillStyle = "#6b7280"
    frontCtx.font = "bold 16px Arial"
    frontCtx.fillText("DATE OF BIRTH", 240, 155)
    frontCtx.fillStyle = "#111827"
    frontCtx.font = "bold 24px Arial"
    frontCtx.fillText(data.birthDate, 240, 182)

    frontCtx.fillStyle = "#6b7280"
    frontCtx.font = "bold 16px Arial"
    frontCtx.fillText("GENDER", 450, 155)
    frontCtx.fillStyle = "#111827"
    frontCtx.font = "bold 24px Arial"
    frontCtx.fillText(data.gender, 450, 182)

    frontCtx.fillStyle = "#6b7280"
    frontCtx.font = "bold 16px Arial"
    frontCtx.fillText("CIVIL STATUS", 240, 215)
    frontCtx.fillStyle = "#111827"
    frontCtx.font = "bold 24px Arial"
    frontCtx.fillText(data.civilStatus, 240, 242)

    frontCtx.fillStyle = "#6b7280"
    frontCtx.font = "bold 16px Arial"
    frontCtx.fillText("BIRTH PLACE", 450, 215)
    frontCtx.fillStyle = "#111827"
    frontCtx.font = "bold 24px Arial"
    frontCtx.fillText(data.birthPlace.substring(0, 35), 450, 242)

    frontCtx.fillStyle = "#6b7280"
    frontCtx.font = "bold 16px Arial"
    frontCtx.fillText("ADDRESS", 240, 275)
    frontCtx.fillStyle = "#111827"
    frontCtx.font = "bold 24px Arial"
    // Word wrap address
    const words = data.address.split(" ")
    let line = ""
    let y = 302
    for (const word of words) {
      const testLine = line + word + " "
      if (frontCtx.measureText(testLine).width > 560) {
        frontCtx.fillText(line, 240, y)
        line = word + " "
        y += 26
      } else {
        line = testLine
      }
    }
    frontCtx.fillText(line, 240, y)

    // Watermark
    frontCtx.save()
    frontCtx.globalAlpha = 0.05
    frontCtx.font = "bold 120px Arial"
    frontCtx.translate(428, 320)
    frontCtx.rotate(-0.26)
    frontCtx.fillStyle = "#000000"
    frontCtx.fillText("QRT", -80, 0)
    frontCtx.restore()

    // Footer bar
    frontCtx.fillStyle = "#374151"
    frontCtx.fillRect(0, 480, 856, 60)

    // Precinct number (BOTTOM LEFT)
    if (data.precinctNumber) {
      frontCtx.fillStyle = "#fbbf24"
      frontCtx.font = "bold 14px Arial"
      frontCtx.fillText(`PRECINCT: ${data.precinctNumber}`, 32, 500)
    }

    frontCtx.fillStyle = "#ffffff"
    frontCtx.font = "bold 14px Arial"
    frontCtx.fillText(`Issued: ${data.issuedDate}`, 32, data.precinctNumber ? 520 : 505)
    frontCtx.font = "12px Arial"
    frontCtx.fillStyle = "#d1d5db"
    frontCtx.fillText("BARANGAY MAWAQUE LINKOD", 32, data.precinctNumber ? 535 : 527)

    frontCtx.textAlign = "right"
    frontCtx.font = "bold 12px Arial"
    frontCtx.fillStyle = "#ffffff"
    frontCtx.fillText("This card is property of Barangay Mawaque", 824, 505)
    frontCtx.fillText("Return if found. Valid for one year from issue date.", 824, 522)
    frontCtx.textAlign = "left"

    // Generate back image
    const backCanvas = document.createElement("canvas")
    backCanvas.width = 856
    backCanvas.height = 540
    const backCtx = backCanvas.getContext("2d")!

    // Background
    const backBgGradient = backCtx.createLinearGradient(0, 0, 0, 540)
    backBgGradient.addColorStop(0, "#f8fafc")
    backBgGradient.addColorStop(1, "#f1f5f9")
    backCtx.fillStyle = backBgGradient
    backCtx.fillRect(0, 0, 856, 540)

    // Header
    const backHeaderGradient = backCtx.createLinearGradient(0, 0, 856, 0)
    backHeaderGradient.addColorStop(0, "#dc2626")
    backHeaderGradient.addColorStop(1, "#b91c1c")
    backCtx.fillStyle = backHeaderGradient
    backCtx.fillRect(0, 0, 856, 50)

    backCtx.fillStyle = "#ffffff"
    backCtx.font = "bold 26px Arial"
    backCtx.textAlign = "center"
    backCtx.fillText("EMERGENCY CONTACT INFORMATION", 428, 36)
    backCtx.textAlign = "left"

    // Sideways QRT (right edge, CW)
    backCtx.save()
    backCtx.translate(830, 270)
    backCtx.rotate(Math.PI / 2)
    backCtx.font = "bold 28px Arial"
    backCtx.fillStyle = "#374151"
    backCtx.textAlign = "center"
    backCtx.textBaseline = "middle"
    backCtx.fillText(data.qrtCode, 0, 0)
    backCtx.restore()

    // Emergency contact details
    backCtx.fillStyle = "#6b7280"
    backCtx.font = "bold 16px Arial"
    backCtx.fillText("CONTACT PERSON", 50, 85)
    backCtx.fillStyle = "#111827"
    backCtx.font = "bold 28px Arial"
    backCtx.fillText(data.emergencyContactName, 50, 118)

    backCtx.fillStyle = "#6b7280"
    backCtx.font = "bold 16px Arial"
    backCtx.fillText("RELATIONSHIP", 50, 155)
    backCtx.fillStyle = "#111827"
    backCtx.font = "bold 24px Arial"
    backCtx.fillText(data.emergencyContactRelationship, 50, 182)

    backCtx.fillStyle = "#6b7280"
    backCtx.font = "bold 16px Arial"
    backCtx.fillText("CONTACT NUMBER", 50, 220)
    backCtx.fillStyle = "#dc2626"
    backCtx.font = "bold 34px Arial"
    backCtx.fillText(data.emergencyContactPhone, 50, 258)

    backCtx.fillStyle = "#6b7280"
    backCtx.font = "bold 16px Arial"
    backCtx.fillText("ADDRESS", 50, 300)
    backCtx.fillStyle = "#111827"
    backCtx.font = "bold 24px Arial"
    backCtx.fillText(data.emergencyContactAddress.substring(0, 55), 50, 330)

    // QR Code section
    backCtx.fillStyle = "#ffffff"
    roundRect(backCtx, 540, 70, 260, 260, 12)
    backCtx.fill()
    backCtx.strokeStyle = "#e5e7eb"
    backCtx.lineWidth = 1
    backCtx.stroke()

    // Try to draw QR code if available
    if (data.qrCodeData) {
      try {
        const qrImg = await loadImage(data.qrCodeData)
        backCtx.drawImage(qrImg, 570, 100, 220, 220)
      } catch (e) {
        console.log("[v0] Could not load QR code image")
        backCtx.fillStyle = "#9ca3af"
        backCtx.font = "16px Arial"
        backCtx.textAlign = "center"
        backCtx.fillText("QR Code", 680, 210)
        backCtx.textAlign = "left"
      }
    }

    backCtx.fillStyle = "#6b7280"
    backCtx.font = "12px Arial"
    backCtx.textAlign = "center"
    backCtx.fillText("Scan to verify authenticity", 680, 355)
    backCtx.textAlign = "left"

    // Important notices
    backCtx.fillStyle = "#374151"
    backCtx.fillRect(0, 400, 856, 140)

    // Precinct number on back side (BOTTOM LEFT)
    if (data.precinctNumber) {
      backCtx.fillStyle = "#fbbf24"
      backCtx.font = "bold 14px Arial"
      backCtx.fillText(`PRECINCT: ${data.precinctNumber}`, 50, 420)
    }

    backCtx.fillStyle = "#fbbf24"
    backCtx.font = "bold 16px Arial"
    backCtx.fillText("IMPORTANT NOTICES:", 50, data.precinctNumber ? 445 : 428)

    backCtx.fillStyle = "#d1d5db"
    backCtx.font = "bold 14px Arial"
    const noticeY = data.precinctNumber ? 468 : 458
    backCtx.fillText("• This ID is valid for one (1) year from the date of issue.", 50, noticeY)
    backCtx.fillText("• Report lost or stolen IDs immediately to Barangay Hall.", 50, noticeY + 22)
    backCtx.fillText("• Tampering or unauthorized reproduction is punishable by law.", 50, noticeY + 44)

    backCtx.fillStyle = "#9ca3af"
    backCtx.font = "bold 14px Arial"
    backCtx.textAlign = "center"
    backCtx.fillText(`QRT Code: ${data.qrtCode} | Expires: ${data.expiryDate}`, 428, 530)
    backCtx.textAlign = "left"

    // Set smoothing to false for crisp text
    frontCtx.imageSmoothingEnabled = false
    backCtx.imageSmoothingEnabled = false

    // Export to data URLs
    const frontImageUrl = frontCanvas.toDataURL("image/png")
    const backImageUrl = backCanvas.toDataURL("image/png")

    console.log("[v0] Canvas Generator: SUCCESS - Both images generated")

    return {
      success: true,
      frontImageUrl,
      backImageUrl,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    console.error("[v0] Canvas Generator: EXCEPTION:", errorMessage)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Downloads an image data URL as a file
 */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
