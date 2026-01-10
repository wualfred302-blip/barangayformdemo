/**
 * Face validation using TensorFlow.js Face Landmarks Detection
 * Validates: face presence, centering, no glasses, eyes visible, neutral expression
 *
 * IMPORTANT: This module uses dynamic imports to avoid SSR issues with TensorFlow.js
 */

export interface FaceValidation {
  isValid: boolean
  hasFace: boolean
  isCentered: boolean
  hasGlasses: boolean
  eyesVisible: boolean
  isNeutral: boolean
  feedback: string
  confidence: number
}

// Dynamic imports - only loaded on client side
let tf: typeof import("@tensorflow/tfjs") | null = null
let faceLandmarksDetection: typeof import("@tensorflow-models/face-landmarks-detection") | null = null
let detector: Awaited<ReturnType<typeof import("@tensorflow-models/face-landmarks-detection")["createDetector"]>> | null = null
let isLoading = false

/**
 * Initialize the face detector model (lazy loading)
 */
export async function initFaceDetector(): Promise<boolean> {
  // Only run on client side
  if (typeof window === "undefined") {
    return false
  }

  if (detector) return true
  if (isLoading) {
    // Wait for ongoing loading
    while (isLoading) {
      await new Promise((r) => setTimeout(r, 100))
    }
    return detector !== null
  }

  isLoading = true
  try {
    // Dynamic imports - only executed on client
    tf = await import("@tensorflow/tfjs")
    faceLandmarksDetection = await import("@tensorflow-models/face-landmarks-detection")

    // Set backend
    await tf.setBackend("webgl")
    await tf.ready()

    // Load the MediaPipe FaceMesh model
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh
    detector = await faceLandmarksDetection.createDetector(model, {
      runtime: "tfjs",
      refineLandmarks: true,
      maxFaces: 1,
    })

    isLoading = false
    return true
  } catch (error) {
    console.error("Failed to initialize face detector:", error)
    isLoading = false
    return false
  }
}

interface Keypoint {
  x: number
  y: number
  z?: number
  name?: string
}

/**
 * Validate a face from video or image element
 */
export async function validateFace(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<FaceValidation> {
  // Only run on client side
  if (typeof window === "undefined") {
    return {
      isValid: false,
      hasFace: false,
      isCentered: false,
      hasGlasses: false,
      eyesVisible: false,
      isNeutral: true,
      feedback: "Face detection not available on server",
      confidence: 0,
    }
  }

  if (!detector) {
    const initialized = await initFaceDetector()
    if (!initialized) {
      return {
        isValid: false,
        hasFace: false,
        isCentered: false,
        hasGlasses: false,
        eyesVisible: false,
        isNeutral: true,
        feedback: "Face detection not available",
        confidence: 0,
      }
    }
  }

  try {
    const faces = await detector!.estimateFaces(input, {
      flipHorizontal: false,
    })

    if (faces.length === 0) {
      return {
        isValid: false,
        hasFace: false,
        isCentered: false,
        hasGlasses: false,
        eyesVisible: false,
        isNeutral: true,
        feedback: "No face detected - position your face in frame",
        confidence: 0,
      }
    }

    const face = faces[0]
    const keypoints = face.keypoints as Keypoint[]

    // Get input dimensions
    const width = "videoWidth" in input ? input.videoWidth : input.width
    const height = "videoHeight" in input ? input.videoHeight : input.height

    // Get face bounding box dimensions for relative calculations
    const faceBox = face.box
    const faceWidth = faceBox?.width ?? 0
    const faceHeight = faceBox?.height ?? 0
    const faceX = faceBox?.xMin ?? 0
    const faceY = faceBox?.yMin ?? 0

    // Calculate face center from bounding box (more reliable than nose tip alone)
    const faceCenterX = faceX + faceWidth / 2
    const faceCenterY = faceY + faceHeight / 2

    // Check if face is centered using both bounding box and nose tip
    const noseTip = keypoints.find((kp) => kp.name === "noseTip")
    const frameCenterX = width / 2
    const frameCenterY = height / 2
    // Increased tolerance to 28% for better user experience
    const tolerance = Math.min(width, height) * 0.28

    let isCentered = false
    if (faceWidth > 0 && faceHeight > 0) {
      // Use face bounding box center as primary reference
      isCentered =
        Math.abs(faceCenterX - frameCenterX) < tolerance &&
        Math.abs(faceCenterY - frameCenterY) < tolerance
    } else if (noseTip) {
      // Fallback to nose tip if bounding box is not available
      isCentered =
        Math.abs(noseTip.x - frameCenterX) < tolerance &&
        Math.abs(noseTip.y - frameCenterY) < tolerance
    }

    // Check eyes visibility - require multiple landmarks for each eye
    const leftEyePoints = keypoints.filter((kp) => kp.name?.includes("leftEye") || kp.name?.includes("leftIris"))
    const rightEyePoints = keypoints.filter((kp) => kp.name?.includes("rightEye") || kp.name?.includes("rightIris"))
    // Require at least 3 landmarks per eye for reliable visibility
    const eyesVisible = leftEyePoints.length >= 3 && rightEyePoints.length >= 3

    // Detect glasses using face-relative threshold
    const hasGlasses = detectGlasses(keypoints, width, height, faceHeight)

    // Check for neutral expression using face-relative threshold
    const isNeutral = checkNeutralExpression(keypoints, faceHeight)

    // Calculate confidence using both dimensions for more accurate sizing
    const widthRatio = faceWidth / width
    const heightRatio = faceHeight / height
    const confidence = (widthRatio + heightRatio) / 2

    // Generate feedback
    let feedback = "Looking good!"
    let isValid = true

    if (!isCentered) {
      feedback = "Center your face in the frame"
      isValid = false
    } else if (hasGlasses) {
      feedback = "Please remove glasses for the photo"
      isValid = false
    } else if (!eyesVisible) {
      feedback = "Eyes not clearly visible"
      isValid = false
    } else if (!isNeutral) {
      feedback = "Please maintain a neutral expression"
      isValid = false
    } else if (confidence < 0.12) {
      feedback = "Move closer to the camera"
      isValid = false
    } else if (confidence > 0.6) {
      feedback = "Move back a bit"
      isValid = false
    }

    return {
      isValid,
      hasFace: true,
      isCentered,
      hasGlasses,
      eyesVisible,
      isNeutral,
      feedback,
      confidence,
    }
  } catch (error) {
    console.error("Face validation error:", error)
    return {
      isValid: false,
      hasFace: false,
      isCentered: false,
      hasGlasses: false,
      eyesVisible: false,
      isNeutral: true,
      feedback: "Face detection error - try again",
      confidence: 0,
    }
  }
}

/**
 * Simple glasses detection heuristic based on eye region characteristics
 * Now uses face-relative thresholds for resolution independence
 */
function detectGlasses(
  keypoints: Keypoint[],
  _width: number,
  _height: number,
  faceHeight: number
): boolean {
  // Skip glasses detection if face height is too small to be reliable
  if (faceHeight < 50) {
    return false // Can't detect reliably - assume no glasses
  }

  const leftEyeOuter = keypoints.find((kp) => kp.name === "leftEyeUpper0")
  const leftEyeInner = keypoints.find((kp) => kp.name === "leftEyeLower0")
  const rightEyeOuter = keypoints.find((kp) => kp.name === "rightEyeUpper0")
  const rightEyeInner = keypoints.find((kp) => kp.name === "rightEyeLower0")

  if (!leftEyeOuter || !leftEyeInner || !rightEyeOuter || !rightEyeInner) {
    return false // Can't detect - assume no glasses
  }

  const leftEyeHeight = Math.abs(leftEyeOuter.y - leftEyeInner.y)
  const rightEyeHeight = Math.abs(rightEyeOuter.y - rightEyeInner.y)
  const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2

  // Use face-relative threshold: eye height should not exceed ~15% of face height
  // Glasses reflections/distortions often make the detected eye region larger
  const threshold = faceHeight * 0.15
  return avgEyeHeight > threshold
}

/**
 * Check for neutral expression by analyzing mouth openness
 * Now uses face-relative thresholds for resolution independence
 */
function checkNeutralExpression(keypoints: Keypoint[], faceHeight: number): boolean {
  const upperLip = keypoints.find((kp) => kp.name === "lipsUpperOuter")
  const lowerLip = keypoints.find((kp) => kp.name === "lipsLowerOuter")

  if (!upperLip || !lowerLip || faceHeight < 50) {
    return true // Can't detect reliably - assume neutral
  }

  const mouthOpen = Math.abs(upperLip.y - lowerLip.y)

  // Use face-relative threshold: mouth opening should be less than ~8% of face height
  // Wide open mouth (laughing, yelling) would exceed this
  const threshold = faceHeight * 0.08
  return mouthOpen < threshold
}

/**
 * Cleanup detector resources
 */
export function disposeFaceDetector(): void {
  if (detector) {
    detector.dispose()
    detector = null
  }
}
