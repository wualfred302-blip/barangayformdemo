"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, RefreshCw, Upload, Check, X, Loader2, AlertCircle, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { validateFace, initFaceDetector, disposeFaceDetector, type FaceValidation } from "@/lib/face-validator"
import { analyzeLighting, type LightingAnalysis } from "@/lib/lighting-analyzer"

interface SelfieCaptureProps {
  onCapture: (imageBase64: string) => void
  onCancel?: () => void
  className?: string
  initialImage?: string | null
}

export function SelfieCapture({ onCapture, onCancel, className, initialImage }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage || null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [modelLoading, setModelLoading] = useState(false)
  const [modelLoaded, setModelLoaded] = useState(false)

  // Real-time validation state (only used in camera modal)
  const [faceValidation, setFaceValidation] = useState<FaceValidation | null>(null)
  const [lightingAnalysis, setLightingAnalysis] = useState<LightingAnalysis | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Pre-load face detector in background when component mounts (optimization)
  useEffect(() => {
    const loadModel = async () => {
      if (modelLoaded) return
      // Load silently in background without showing loading UI
      const success = await initFaceDetector()
      setModelLoaded(success)
    }
    loadModel()
  }, [modelLoaded])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disposeFaceDetector()
      stopCamera()
    }
  }, [])

  // Real-time validation loop (only when camera is open)
  useEffect(() => {
    if (!cameraOpen || !videoRef.current || !canvasRef.current || !modelLoaded) {
      return
    }

    let animationId: number
    let lastValidationTime = 0
    const VALIDATION_INTERVAL = 500

    const validateFrame = async () => {
      if (!videoRef.current || !canvasRef.current) return

      const now = Date.now()
      if (now - lastValidationTime >= VALIDATION_INTERVAL) {
        lastValidationTime = now

        const ctx = canvasRef.current.getContext("2d")
        if (ctx && videoRef.current.readyState >= 2) {
          canvasRef.current.width = videoRef.current.videoWidth
          canvasRef.current.height = videoRef.current.videoHeight
          ctx.drawImage(videoRef.current, 0, 0)

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
  }, [cameraOpen, modelLoaded])

  const openCamera = async () => {
    setCameraOpen(true)
    setCameraError(null)
    setFaceValidation(null)
    setLightingAnalysis(null)

    try {
      // High quality camera settings for ID photos
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280, min: 640 },
          height: { ideal: 960, min: 480 },
          aspectRatio: { ideal: 4 / 3 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      streamRef.current = stream
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
  }, [])

  const closeCamera = () => {
    stopCamera()
    setCameraOpen(false)
    setFaceValidation(null)
    setLightingAnalysis(null)
    setCountdown(null)
  }

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    setIsProcessing(true)

    // Countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i)
      await new Promise((r) => setTimeout(r, 1000))
    }
    setCountdown(null)

    // Capture at full resolution
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    ctx.save()
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

    // Convert to high quality JPEG
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.92)
    setCapturedImage(imageBase64)
    onCapture(imageBase64)
    closeCamera()
    setIsProcessing(false)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setCameraError(null)

    // Load model if needed
    if (!modelLoaded) {
      setModelLoading(true)
      const success = await initFaceDetector()
      setModelLoaded(success)
      setModelLoading(false)
      if (!success) {
        setCameraError("Face detection not available")
        setIsProcessing(false)
        return
      }
    }

    try {
      const reader = new FileReader()
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = imageBase64
      })

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
          canvasRef.current.width = img.width
          canvasRef.current.height = img.height
          ctx.drawImage(img, 0, 0)

          const [faceResult, lightingResult] = await Promise.all([
            validateFace(canvasRef.current),
            Promise.resolve(analyzeLighting(canvasRef.current)),
          ])

          if (!faceResult.isValid || !lightingResult.isAcceptable) {
            setCameraError(!faceResult.isValid ? faceResult.feedback : lightingResult.feedback)
            setIsProcessing(false)
            return
          }

          setCapturedImage(imageBase64)
          onCapture(imageBase64)
        }
      }
    } catch (error) {
      console.error("File upload error:", error)
      setCameraError("Failed to process image")
    }

    setIsProcessing(false)
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    openCamera()
  }

  const isValid = faceValidation?.isValid && lightingAnalysis?.isAcceptable

  return (
    <>
      {/* Main form view - image placeholder with button */}
      <div className={cn("flex flex-col items-center gap-5", className)}>
        {/* Image placeholder/preview */}
        <div className="relative w-36 h-44 rounded-2xl overflow-hidden shadow-sm flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Your selfie"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-gray-300">
              <div className="w-20 h-24 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                <User className="h-10 w-10" />
              </div>
            </div>
          )}

          {/* Processing overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          )}
        </div>

        {/* Error message */}
        {cameraError && !cameraOpen && (
          <div className="flex items-center gap-2 text-red-600 text-sm text-center max-w-xs px-3 py-2 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {capturedImage ? (
            <Button
              variant="outline"
              onClick={retakePhoto}
              disabled={isProcessing}
              className="h-11 px-5 rounded-xl border-gray-300"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retake
            </Button>
          ) : (
            <>
              <Button
                onClick={openCamera}
                disabled={isProcessing}
                className="h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-sm"
              >
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="h-11 px-4 rounded-xl border-gray-300"
                title="Upload photo"
              >
                <Upload className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        {/* Tips - redesigned as inline hints */}
        {!capturedImage && (
          <div className="flex flex-wrap justify-center gap-2 max-w-xs">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-600">Face forward</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-600">No glasses</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-600">Good lighting</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-600">Neutral face</span>
          </div>
        )}

        {/* Hidden elements */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Fullscreen Camera Modal */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Camera view */}
          <div className="flex-1 relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* Model loading overlay */}
            {modelLoading && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-white" />
                <p className="text-white text-lg">Loading face detection...</p>
              </div>
            )}

            {/* Countdown overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-9xl font-bold text-white drop-shadow-lg">{countdown}</span>
              </div>
            )}

            {/* Face guide oval */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={cn(
                  "w-56 h-72 rounded-full border-4",
                  isValid ? "border-green-500 border-solid" : "border-white/60 border-dashed"
                )}
              />
            </div>

            {/* Close button */}
            <button
              onClick={closeCamera}
              className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Validation feedback - bottom */}
            <div className="absolute bottom-24 left-4 right-4 flex flex-col gap-2">
              {faceValidation && (
                <div
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-medium text-center backdrop-blur-sm",
                    faceValidation.isValid
                      ? "bg-green-500/90 text-white"
                      : "bg-red-500/90 text-white"
                  )}
                >
                  {faceValidation.feedback}
                </div>
              )}
              {lightingAnalysis && !lightingAnalysis.isAcceptable && (
                <div className="px-4 py-2 rounded-xl text-sm font-medium text-center bg-yellow-500/90 text-white backdrop-blur-sm">
                  {lightingAnalysis.feedback}
                </div>
              )}
              {cameraError && (
                <div className="px-4 py-2 rounded-xl text-sm font-medium text-center bg-red-500/90 text-white backdrop-blur-sm">
                  {cameraError}
                </div>
              )}
            </div>
          </div>

          {/* Capture button bar */}
          <div className="bg-black px-6 py-6 flex items-center justify-center gap-4 safe-area-pb">
            <Button
              onClick={capturePhoto}
              disabled={!isValid || isProcessing || !modelLoaded || modelLoading}
              className={cn(
                "h-16 w-16 rounded-full p-0 transition-all",
                isValid
                  ? "bg-white hover:bg-gray-100 text-black ring-4 ring-green-500"
                  : "bg-gray-600 text-gray-400"
              )}
            >
              {isProcessing ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <Camera className="h-8 w-8" />
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
