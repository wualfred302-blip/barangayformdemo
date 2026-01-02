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

    // Try to load and draw Bagong Pilipinas logo in header
    try {
      const logo = await loadImage("/images/bagongpilipinas-logo-main.png")
      frontCtx.drawImage(logo, 20, 10, 45, 40)
    } catch (e) {
      console.log("[v0] Could not load Bagong Pilipinas logo")
    }

    // Header text - left
    frontCtx.fillStyle = "#ffffff"
    frontCtx.font = "bold 10px Arial"
    frontCtx.fillText("REPUBLIKA NG PILIPINAS", 80, 26)
    frontCtx.font = "bold 12px Arial"
    frontCtx.fillText("BARANGAY MAWAQUE", 80, 42)

    // Header text - right
    frontCtx.font = "bold 14px Arial"
    frontCtx.fillText("QUICK RESPONSE TEAM", 650, 22)
    frontCtx.font = "bold 20px Arial"
    frontCtx.fillText("QRT ID", 650, 46)

    // Photo placeholder/frame
    frontCtx.strokeStyle = "#10b981"
    frontCtx.lineWidth = 3
    frontCtx.strokeRect(32, 80, 180, 220)
    frontCtx.fillStyle = "#f3f4f6"
    frontCtx.fillRect(35, 83, 174, 214)

    // Try to load and draw photo
    try {
      if (data.photoUrl && data.photoUrl.startsWith("data:")) {
        const photo = await loadImage(data.photoUrl)
        frontCtx.drawImage(photo, 35, 83, 174, 214)
      }
    } catch (e) {
      console.log("[v0] Could not load photo, using placeholder")
      frontCtx.fillStyle = "#9ca3af"
      frontCtx.font = "14px Arial"
      frontCtx.textAlign = "center"
      frontCtx.fillText("Photo", 122, 190)
      frontCtx.textAlign = "left"
    }

    // Verification code box
    const vcGradient = frontCtx.createLinearGradient(32, 315, 212, 315)
    vcGradient.addColorStop(0, "#10b981")
    vcGradient.addColorStop(1, "#059669")
    frontCtx.fillStyle = vcGradient
    roundRect(frontCtx, 32, 315, 180, 60, 4)
    frontCtx.fill()

    frontCtx.fillStyle = "#ffffff"
    frontCtx.font = "bold 9px Arial"
    frontCtx.textAlign = "center"
    frontCtx.fillText("VERIFICATION CODE", 122, 332)
    frontCtx.font = "bold 11px Arial"
    frontCtx.fillText(data.verificationCode, 122, 350)
    frontCtx.font = "8px Arial"
    frontCtx.fillStyle = "#d1d5db"
    frontCtx.fillText("Scan for secure verification", 122, 365)
    frontCtx.textAlign = "left"

    // Personal info section
    frontCtx.fillStyle = "#374151"
    frontCtx.font = "bold 11px Arial"
    frontCtx.fillText("FULL NAME", 240, 100)
    frontCtx.fillStyle = "#111827"
    frontCtx.font = "bold 18px Arial"
    frontCtx.fillText(data.fullName.toUpperCase(), 240, 122)

    frontCtx.fillStyle = "#6b7280"
    frontCtx.font = "10px Arial"
    frontCtx.fillText("DATE OF BIRTH", 240, 155)
    frontCtx.fillStyle = "#111827"
    frontCtx.font = "bold 13px Arial"
    frontCtx.fillText(data.birthDate, 240, 172)

    frontCtx.fillStyle = "#6b7280"
    frontCtx.font = "10px Arial"
    frontCtx.fillText("GENDER", 450, 155)
    frontCtx.fillStyle = "#111827"
    frontCtx.font = "bold 13px Arial"
    frontCtx.fillText(data.gender, 450, 172)

    frontCtx.fillStyle = "#6b7280"
    frontCtx.font = "10px Arial"
    frontCtx.fillText("CIVIL STATUS", 240, 205)
    frontCtx.fillStyle = "#111827"
    frontCtx.font = "bold 13px Arial"
    frontCtx.fillText(data.civilStatus, 240, 222)

    frontCtx.fillStyle = "#6b7280"
    frontCtx.font = "10px Arial"
    frontCtx.fillText("BIRTH PLACE", 450, 205)
    frontCtx.fillStyle = "#111827"
    frontCtx.font = "bold 13px Arial"
    frontCtx.fillText(data.birthPlace.substring(0, 40), 450, 222)

    frontCtx.fillStyle = "#6b7280"
    frontCtx.font = "10px Arial"
    frontCtx.fillText("ADDRESS", 240, 255)
    frontCtx.fillStyle = "#111827"
    frontCtx.font = "bold 13px Arial"
    // Word wrap address
    const words = data.address.split(" ")
    let line = ""
    let y = 272
    for (const word of words) {
      const testLine = line + word + " "
      if (frontCtx.measureText(testLine).width > 580) {
        frontCtx.fillText(line, 240, y)
        line = word + " "
        y += 18
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
    frontCtx.fillRect(0, 490, 856, 50)

    frontCtx.fillStyle = "#ffffff"
    frontCtx.font = "bold 11px Arial"
    frontCtx.fillText(`Issued: ${data.issuedDate}`, 32, 508)
    frontCtx.font = "9px Arial"
    frontCtx.fillStyle = "#d1d5db"
    frontCtx.fillText("BARANGAY MAWAQUE LINKOD", 32, 525)

    frontCtx.textAlign = "right"
    frontCtx.fillText("This card is property of Barangay Mawaque", 824, 508)
    frontCtx.fillText("Return if found. Valid for one year from issue date.", 824, 523)
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
    backCtx.font = "bold 16px Arial"
    backCtx.textAlign = "center"
    backCtx.fillText("EMERGENCY CONTACT INFORMATION", 428, 32)
    backCtx.textAlign = "left"

    // Emergency contact details
    backCtx.fillStyle = "#6b7280"
    backCtx.font = "10px Arial"
    backCtx.fillText("CONTACT PERSON", 50, 90)
    backCtx.fillStyle = "#111827"
    backCtx.font = "bold 16px Arial"
    backCtx.fillText(data.emergencyContactName, 50, 115)

    backCtx.fillStyle = "#6b7280"
    backCtx.font = "10px Arial"
    backCtx.fillText("RELATIONSHIP", 50, 150)
    backCtx.fillStyle = "#111827"
    backCtx.font = "bold 14px Arial"
    backCtx.fillText(data.emergencyContactRelationship, 50, 172)

    backCtx.fillStyle = "#6b7280"
    backCtx.font = "10px Arial"
    backCtx.fillText("CONTACT NUMBER", 50, 210)
    backCtx.fillStyle = "#dc2626"
    backCtx.font = "bold 18px Arial"
    backCtx.fillText(data.emergencyContactPhone, 50, 235)

    backCtx.fillStyle = "#6b7280"
    backCtx.font = "10px Arial"
    backCtx.fillText("ADDRESS", 50, 275)
    backCtx.fillStyle = "#111827"
    backCtx.font = "bold 13px Arial"
    backCtx.fillText(data.emergencyContactAddress.substring(0, 60), 50, 297)

    // QR Code section
    backCtx.fillStyle = "#ffffff"
    roundRect(backCtx, 550, 80, 260, 260, 12)
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
        backCtx.font = "14px Arial"
        backCtx.textAlign = "center"
        backCtx.fillText("QR Code", 680, 210)
        backCtx.textAlign = "left"
      }
    }

    backCtx.fillStyle = "#6b7280"
    backCtx.font = "10px Arial"
    backCtx.textAlign = "center"
    backCtx.fillText("Scan to verify authenticity", 680, 355)
    backCtx.textAlign = "left"

    // Important notices
    backCtx.fillStyle = "#374151"
    backCtx.fillRect(0, 400, 856, 140)

    backCtx.fillStyle = "#fbbf24"
    backCtx.font = "bold 12px Arial"
    backCtx.fillText("IMPORTANT NOTICES:", 50, 430)

    backCtx.fillStyle = "#d1d5db"
    backCtx.font = "11px Arial"
    backCtx.fillText("• This ID is valid for one (1) year from the date of issue.", 50, 455)
    backCtx.fillText("• Report lost or stolen IDs immediately to Barangay Hall.", 50, 475)
    backCtx.fillText("• Tampering or unauthorized reproduction is punishable by law.", 50, 495)

    backCtx.fillStyle = "#9ca3af"
    backCtx.font = "9px Arial"
    backCtx.textAlign = "center"
    backCtx.fillText(`QRT Code: ${data.qrtCode} | Expires: ${data.expiryDate}`, 428, 525)
    backCtx.textAlign = "left"

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
