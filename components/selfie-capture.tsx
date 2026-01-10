"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, RefreshCw, Upload, Check, X, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { validateFace, initFaceDetector, disposeFaceDetector, type FaceValidation } from "@/lib/face-validator"
import { analyzeLighting, type LightingAnalysis } from "@/lib/lighting-analyzer"

interface SelfieCaptureProps {
  onCapture: (imageBase64: string) => void
  onCancel?: () => void
  className?: string
}

export function SelfieCapture({ onCapture, onCancel, className }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [modelLoading, setModelLoading] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)

  // Real-time validation state
  const [faceValidation, setFaceValidation] = useState<FaceValidation | null>(null)
  const [lightingAnalysis, setLightingAnalysis] = useState<LightingAnalysis | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Initialize face detector when component mounts
  useEffect(() => {
    const loadModel = async () => {
      setModelLoading(true)
      const success = await initFaceDetector()
      setModelLoaded(success)
      setModelLoading(false)
    }
    loadModel()

    return () => {
      disposeFaceDetector()
      stopCamera()
    }
  }, [])

  // Real-time validation loop
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !canvasRef.current || !modelLoaded) {
      return
    }

    let animationId: number
    let lastValidationTime = 0
    const VALIDATION_INTERVAL = 500 // Validate every 500ms

    const validateFrame = async () => {
      if (!videoRef.current || !canvasRef.current) return

      const now = Date.now()
      if (now - lastValidationTime >= VALIDATION_INTERVAL) {
        lastValidationTime = now

        // Draw current frame to canvas for analysis
        const ctx = canvasRef.current.getContext("2d")
        if (ctx && videoRef.current.readyState >= 2) {
          canvasRef.current.width = videoRef.current.videoWidth
          canvasRef.current.height = videoRef.current.videoHeight
          ctx.drawImage(videoRef.current, 0, 0)

          // Run validations in parallel
          const [faceResult, lightingResult] = await Promise.all([
            validateFace(canvasRef.current),
            Promise.resolve(analyzeLighting(canvasRef.current)),
          ])

          setFaceValidation(faceResult)
          setLightingAnalysis(lightingResult)
        }
      }

      animationId = requestAnimationFrame(validateFrame)
    }

    validateFrame()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [cameraActive, modelLoaded])

  const startCamera = async () => {
    try {
      setCameraError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Front camera
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      streamRef.current = stream
      setCameraActive(true)
    } catch (error) {
      console.error("Camera error:", error)
      setCameraError(
        error instanceof Error && error.name === "NotAllowedError"
          ? "Camera access denied. Please allow camera access."
          : "Failed to access camera. Try using file upload instead."
      )
    }
  }

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }, [])

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    // Final validation check
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsProcessing(true)

    // Start countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i)
      await new Promise((r) => setTimeout(r, 1000))
    }
    setCountdown(null)

    // Capture the photo
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    ctx.save()
    // Mirror the image horizontally (selfie mode)
    ctx.scale(-1, 1)
    ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height)
    ctx.restore()

    // Final validations
    const [finalFace, finalLighting] = await Promise.all([
      validateFace(canvas),
      Promise.resolve(analyzeLighting(canvas)),
    ])

    setFaceValidation(finalFace)
    setLightingAnalysis(finalLighting)

    if (!finalFace.isValid) {
      setIsProcessing(false)
      return
    }

    if (!finalLighting.isAcceptable) {
      setIsProcessing(false)
      return
    }

    // Convert to base64
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.9)
    setCapturedImage(imageBase64)
    stopCamera()
    setIsProcessing(false)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setCameraError(null)

    try {
      // Read file as data URL
      const reader = new FileReader()
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Create image element for validation
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = imageBase64
      })

      // Draw to canvas for validation
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
          canvasRef.current.width = img.width
          canvasRef.current.height = img.height
          ctx.drawImage(img, 0, 0)

          // Validate
          const [faceResult, lightingResult] = await Promise.all([
            validateFace(canvasRef.current),
            Promise.resolve(analyzeLighting(canvasRef.current)),
          ])

          setFaceValidation(faceResult)
          setLightingAnalysis(lightingResult)

          if (!faceResult.isValid || !lightingResult.isAcceptable) {
            setCameraError(
              !faceResult.isValid ? faceResult.feedback : lightingResult.feedback
            )
            setIsProcessing(false)
            return
          }

          setCapturedImage(imageBase64)
        }
      }
    } catch (error) {
      console.error("File upload error:", error)
      setCameraError("Failed to process image")
    }

    setIsProcessing(false)
  }

  const retake = () => {
    setCapturedImage(null)
    setFaceValidation(null)
    setLightingAnalysis(null)
    startCamera()
  }

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage)
    }
  }

  const isValid = faceValidation?.isValid && lightingAnalysis?.isAcceptable

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Model loading indicator */}
      {modelLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading face detection...
        </div>
      )}

      {/* Camera/Preview area */}
      <div className="relative w-full max-w-sm aspect-[3/4] bg-gray-100 rounded-2xl overflow-hidden">
        {/* Captured image preview */}
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured selfie"
            className="w-full h-full object-cover"
          />
        ) : cameraActive ? (
          <>
            {/* Live video feed (mirrored for selfie mode) */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* Countdown overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-8xl font-bold text-white">{countdown}</span>
              </div>
            )}

            {/* Face guide oval */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={cn(
                  "w-48 h-64 rounded-full border-4 border-dashed",
                  isValid ? "border-green-500" : "border-white/70"
                )}
              />
            </div>

            {/* Validation feedback */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-1">
              {faceValidation && (
                <div
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium text-center",
                    faceValidation.isValid
                      ? "bg-green-500/90 text-white"
                      : "bg-red-500/90 text-white"
                  )}
                >
                  {faceValidation.feedback}
                </div>
              )}
              {lightingAnalysis && !lightingAnalysis.isAcceptable && (
                <div className="px-3 py-1.5 rounded-lg text-sm font-medium text-center bg-yellow-500/90 text-white">
                  {lightingAnalysis.feedback}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Initial state - camera not started */
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6">
            <Camera className="h-16 w-16 text-gray-400" />
            <p className="text-gray-500 text-center text-sm">
              Take a selfie for your QRT ID
            </p>
            {cameraError && (
              <div className="flex items-center gap-2 text-red-500 text-sm text-center">
                <AlertCircle className="h-4 w-4" />
                {cameraError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Action buttons */}
      <div className="flex gap-3 w-full max-w-sm">
        {capturedImage ? (
          /* Review mode buttons */
          <>
            <Button
              variant="outline"
              onClick={retake}
              className="flex-1 h-12 rounded-xl"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Retake
            </Button>
            <Button
              onClick={confirmPhoto}
              className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              <Check className="h-5 w-5 mr-2" />
              Use Photo
            </Button>
          </>
        ) : cameraActive ? (
          /* Camera active buttons */
          <>
            <Button
              variant="outline"
              onClick={stopCamera}
              className="h-12 px-4 rounded-xl"
            >
              <X className="h-5 w-5" />
            </Button>
            <Button
              onClick={capturePhoto}
              disabled={!isValid || isProcessing || !modelLoaded}
              className={cn(
                "flex-1 h-12 rounded-xl",
                isValid
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-gray-400"
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Camera className="h-5 w-5 mr-2" />
                  Capture
                </>
              )}
            </Button>
          </>
        ) : (
          /* Initial state buttons */
          <>
            <Button
              onClick={startCamera}
              disabled={modelLoading}
              className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              <Camera className="h-5 w-5 mr-2" />
              Open Camera
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={modelLoading}
              className="h-12 px-4 rounded-xl"
            >
              <Upload className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Tips */}
      {!capturedImage && !cameraActive && (
        <div className="text-xs text-gray-500 text-center max-w-sm">
          <p className="font-medium mb-1">Tips for a good ID photo:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Face the camera directly</li>
            <li>Remove glasses</li>
            <li>Use good lighting (no shadows)</li>
            <li>Keep a neutral expression</li>
          </ul>
        </div>
      )}

      {/* Cancel button */}
      {onCancel && (
        <Button
          variant="ghost"
          onClick={onCancel}
          className="text-gray-500"
        >
          Skip for now
        </Button>
      )}
    </div>
  )
}
