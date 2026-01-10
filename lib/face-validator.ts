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

    // Check if face is centered (using nose tip as center point)
    const noseTip = keypoints.find((kp) => kp.name === "noseTip")
    let isCentered = false
    if (noseTip) {
      const centerX = width / 2
      const centerY = height / 2
      const tolerance = Math.min(width, height) * 0.2 // 20% tolerance
      isCentered =
        Math.abs(noseTip.x - centerX) < tolerance &&
        Math.abs(noseTip.y - centerY) < tolerance
    }

    // Check eyes visibility (using iris landmarks if available)
    const leftEye = keypoints.filter((kp) => kp.name?.includes("leftEye"))
    const rightEye = keypoints.filter((kp) => kp.name?.includes("rightEye"))
    const eyesVisible = leftEye.length > 0 && rightEye.length > 0

    // Detect glasses by checking for reflections/distortions around eyes
    // This is a simple heuristic - glasses often cause larger eye regions
    const hasGlasses = detectGlasses(keypoints, width, height)

    // Check for neutral expression (mouth should not be wide open)
    const isNeutral = checkNeutralExpression(keypoints)

    // Calculate overall confidence
    const confidence = (face.box?.width ?? 0) / width // Face size relative to frame

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
    } else if (confidence < 0.15) {
      feedback = "Move closer to the camera"
      isValid = false
    } else if (confidence > 0.7) {
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
 */
function detectGlasses(
  keypoints: Keypoint[],
  _width: number,
  _height: number
): boolean {
  // Check for silhouette around eyes that might indicate glasses frames
  // This is a basic heuristic - in production, you might use a dedicated model
  const leftEyeOuter = keypoints.find((kp) => kp.name === "leftEyeUpper0")
  const leftEyeInner = keypoints.find((kp) => kp.name === "leftEyeLower0")
  const rightEyeOuter = keypoints.find((kp) => kp.name === "rightEyeUpper0")
  const rightEyeInner = keypoints.find((kp) => kp.name === "rightEyeLower0")

  if (!leftEyeOuter || !leftEyeInner || !rightEyeOuter || !rightEyeInner) {
    return false // Can't detect - assume no glasses
  }

  // Calculate eye openness - glasses can affect this metric
  const leftEyeHeight = Math.abs(leftEyeOuter.y - leftEyeInner.y)
  const rightEyeHeight = Math.abs(rightEyeOuter.y - rightEyeInner.y)

  // Very large eye regions might indicate glasses (reflections, distortions)
  // This is imperfect but provides basic detection
  // In practice, a dedicated glasses classifier would be more accurate
  const avgEyeHeight = (leftEyeHeight + rightEyeHeight) / 2

  // Threshold is relative to face size - this is a heuristic
  return avgEyeHeight > 50 // Adjust based on testing
}

/**
 * Check for neutral expression by analyzing mouth openness
 */
function checkNeutralExpression(keypoints: Keypoint[]): boolean {
  const upperLip = keypoints.find((kp) => kp.name === "lipsUpperOuter")
  const lowerLip = keypoints.find((kp) => kp.name === "lipsLowerOuter")

  if (!upperLip || !lowerLip) {
    return true // Can't detect - assume neutral
  }

  // Mouth openness
  const mouthOpen = Math.abs(upperLip.y - lowerLip.y)

  // If mouth is very open (laughing, yelling), not neutral
  return mouthOpen < 30 // Adjust threshold based on testing
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
