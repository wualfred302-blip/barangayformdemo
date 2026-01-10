/**
 * Lighting quality analyzer for selfie validation
 * Analyzes image brightness and contrast to ensure photos are ID-ready
 */

export interface LightingAnalysis {
  brightness: number // 0-255 average luminance
  contrast: number // Standard deviation of luminance
  isAcceptable: boolean
  feedback: string
}

// Thresholds for acceptable lighting
const MIN_BRIGHTNESS = 80 // Too dark below this
const MAX_BRIGHTNESS = 200 // Overexposed above this
const MIN_CONTRAST = 30 // Too flat/washed out below this

/**
 * Analyze lighting quality from a canvas element
 */
export function analyzeLighting(canvas: HTMLCanvasElement): LightingAnalysis {
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    return {
      brightness: 0,
      contrast: 0,
      isAcceptable: false,
      feedback: "Unable to analyze image",
    }
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data

  // Calculate luminance for each pixel
  const luminanceValues: number[] = []
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    // Standard luminance formula (ITU-R BT.601)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b
    luminanceValues.push(luminance)
  }

  // Calculate average brightness
  const brightness =
    luminanceValues.reduce((sum, val) => sum + val, 0) / luminanceValues.length

  // Calculate contrast (standard deviation)
  const variance =
    luminanceValues.reduce((sum, val) => sum + Math.pow(val - brightness, 2), 0) /
    luminanceValues.length
  const contrast = Math.sqrt(variance)

  // Determine if lighting is acceptable
  let isAcceptable = true
  let feedback = "Good lighting"

  if (brightness < MIN_BRIGHTNESS) {
    isAcceptable = false
    feedback = "Too dark - move to a brighter area"
  } else if (brightness > MAX_BRIGHTNESS) {
    isAcceptable = false
    feedback = "Too bright - avoid direct light"
  } else if (contrast < MIN_CONTRAST) {
    isAcceptable = false
    feedback = "Low contrast - adjust lighting"
  }

  return {
    brightness: Math.round(brightness),
    contrast: Math.round(contrast),
    isAcceptable,
    feedback,
  }
}

/**
 * Quick lighting check from video element
 * Returns feedback string for real-time display
 */
export function quickLightingCheck(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): string {
  const ctx = canvas.getContext("2d")
  if (!ctx) return "Checking..."

  // Draw current video frame to canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

  const analysis = analyzeLighting(canvas)
  return analysis.feedback
}
