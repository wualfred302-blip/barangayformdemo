import html2canvas from "html2canvas"

export interface GenerateQRTIDParams {
  qrtCode: string
  fullName: string
  birthDate: string
  address: string
  gender: string
  civilStatus: string
  birthPlace: string
  photoUrl: string
  height: string
  weight: string
  yearsResident: number
  citizenship: string
  emergencyContactName: string
  emergencyContactAddress: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  qrCodeDataUrl: string
  issuedDate: string
  expiryDate: string
}

export interface GenerateQRTIDResult {
  success: boolean
  frontImageUrl?: string
  backImageUrl?: string
  error?: string
}

/**
 * Generates QRT ID card images from HTML elements using html2canvas
 * @param frontElement - The HTML element containing the front design
 * @param backElement - The HTML element containing the back design
 * @returns Promise with front and back image data URLs
 */
export async function generateQRTIDImages(
  frontElement: HTMLElement,
  backElement: HTMLElement
): Promise<GenerateQRTIDResult> {
  try {
    // Configure html2canvas options for high quality output
    const canvasOptions = {
      scale: 2, // 2x resolution for better quality
      useCORS: true, // Enable cross-origin images
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: 856,
      height: 540,
    }

    // Generate front side
    const frontCanvas = await html2canvas(frontElement, canvasOptions)
    const frontImageUrl = frontCanvas.toDataURL("image/png", 1.0)

    // Generate back side
    const backCanvas = await html2canvas(backElement, canvasOptions)
    const backImageUrl = backCanvas.toDataURL("image/png", 1.0)

    return {
      success: true,
      frontImageUrl,
      backImageUrl,
    }
  } catch (error) {
    console.error("QRT ID generation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate ID images",
    }
  }
}

/**
 * Converts a data URL to a Blob for potential upload/storage
 * @param dataUrl - The data URL to convert
 * @returns Blob object
 */
export function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(",")
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/png"
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

/**
 * Downloads an image data URL as a file
 * @param dataUrl - The image data URL
 * @param filename - The filename to save as
 */
export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Simulates server-side processing delay for demo purposes
 * @param ms - Milliseconds to delay
 */
export function simulateProcessingDelay(ms: number = 2000): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
