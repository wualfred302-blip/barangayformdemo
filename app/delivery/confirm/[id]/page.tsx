"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useDelivery } from "@/lib/delivery-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SignaturePad } from "@/components/signature-pad"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Camera,
  Pen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Package,
  Sparkles,
} from "lucide-react"
import confetti from "canvas-confetti"

export default function DeliveryConfirmationPage() {
  const router = useRouter()
  const params = useParams()
  const deliveryId = params.id as string

  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { getDeliveryRequestById, confirmDelivery, isLoaded } = useDelivery()

  // State
  const [photoProof, setPhotoProof] = useState<string>("")
  const [signature, setSignature] = useState<string>("")
  const [isCapturing, setIsCapturing] = useState(false)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>("")
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [cameraError, setCameraError] = useState<string>("")

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Get delivery request
  const deliveryRequest = getDeliveryRequestById(deliveryId)

  // Auth check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  // Start camera
  const startCamera = async () => {
    try {
      setCameraError("")
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera for photo proof
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setIsCapturing(true)
    } catch (err) {
      console.error("Camera error:", err)
      setCameraError("Could not access camera. Please ensure camera permissions are granted.")
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setIsCapturing(false)
  }

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current) return

    const canvas = document.createElement("canvas")
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
      setPhotoProof(dataUrl)
      stopCamera()
    }
  }

  // Handle signature save
  const handleSignatureSave = useCallback((signatureData: string) => {
    setSignature(signatureData)
    setShowSignaturePad(false)
  }, [])

  // Clear signature
  const clearSignature = () => {
    setSignature("")
  }

  // Trigger confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10b981", "#059669", "#34d399"],
    })
  }

  // Submit confirmation
  const handleSubmit = async () => {
    if (!photoProof || !signature || !deliveryRequest) return

    setIsSubmitting(true)
    setError("")

    try {
      const success = await confirmDelivery(deliveryId, photoProof, signature)

      if (success) {
        setShowSuccessDialog(true)
        setTimeout(triggerConfetti, 300)
      } else {
        setError("Failed to confirm delivery. Please try again.")
      }
    } catch (err) {
      console.error("Error confirming delivery:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Form validation
  const isFormValid = photoProof && signature

  // Loading state
  if (authLoading || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  // Not found
  if (!deliveryRequest) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <Card className="border-0 shadow-md max-w-sm w-full">
          <CardContent className="p-6 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Request Not Found</h2>
            <p className="text-sm text-gray-500 mb-4">
              This delivery request does not exist or you don't have access to it.
            </p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if already delivered
  if (deliveryRequest.status === "delivered") {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <Card className="border-0 shadow-md max-w-sm w-full">
          <CardContent className="p-6 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Already Confirmed</h2>
            <p className="text-sm text-gray-500 mb-4">
              This delivery has already been confirmed.
            </p>
            <Link href="/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if not out for delivery
  if (deliveryRequest.status !== "out_for_delivery") {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
        <Card className="border-0 shadow-md max-w-sm w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Not Ready for Confirmation</h2>
            <p className="text-sm text-gray-500 mb-4">
              This delivery is not yet out for delivery. You can only confirm once the ID is being
              delivered.
            </p>
            <Link href={`/delivery/${deliveryId}`}>
              <Button variant="outline">View Status</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href={`/delivery/${deliveryId}`}>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h1 className="text-base font-bold text-gray-900">Confirm Delivery</h1>
          </div>
        </div>
      </header>

      <main className="p-4 pb-24 max-w-lg mx-auto">
        <div className="space-y-4">
          {/* Instructions */}
          <Card className="border-0 shadow-sm bg-emerald-50">
            <CardContent className="p-4">
              <p className="text-sm text-emerald-700">
                To confirm you received your ID, please take a photo of the ID card and provide
                your digital signature below.
              </p>
            </CardContent>
          </Card>

          {/* Photo Proof */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Camera className="h-4 w-4 text-emerald-600" />
                Photo Proof
                <span className="text-red-500">*</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Take a photo of your received ID card
              </CardDescription>
            </CardHeader>
            <CardContent>
              {photoProof ? (
                <div className="relative">
                  <img
                    src={photoProof}
                    alt="Photo proof"
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  <div className="absolute bottom-3 inset-x-3 flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={startCamera}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retake
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setPhotoProof("")}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute top-3 right-3">
                    <div className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Captured
                    </div>
                  </div>
                </div>
              ) : isCapturing ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full aspect-video object-cover rounded-lg bg-black"
                  />
                  <div className="absolute bottom-3 inset-x-3 flex gap-2">
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={capturePhoto}>
                      <Camera className="h-4 w-4 mr-2" />
                      Capture
                    </Button>
                    <Button variant="outline" onClick={stopCamera}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {cameraError && (
                    <div className="mb-3 p-3 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-600">{cameraError}</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    className="w-full h-32 border-dashed"
                    onClick={startCamera}
                  >
                    <div className="text-center">
                      <Camera className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Take Photo of ID</span>
                    </div>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Signature */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Pen className="h-4 w-4 text-emerald-600" />
                Digital Signature
                <span className="text-red-500">*</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Sign to confirm you received the ID
              </CardDescription>
            </CardHeader>
            <CardContent>
              {signature ? (
                <div className="relative">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <img
                      src={signature}
                      alt="Signature"
                      className="w-full h-24 object-contain"
                    />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowSignaturePad(true)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-sign
                    </Button>
                    <Button variant="outline" size="icon" onClick={clearSignature}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-24 border-dashed"
                  onClick={() => setShowSignaturePad(true)}
                >
                  <div className="text-center">
                    <Pen className="h-6 w-6 mx-auto text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Tap to Sign</span>
                  </div>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-base font-semibold"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Confirm Delivery
              </>
            )}
          </Button>

          {/* Help text */}
          <p className="text-center text-xs text-gray-500">
            By confirming, you acknowledge that you have received your ID card in good condition.
          </p>
        </div>
      </main>

      {/* Signature Pad Dialog */}
      <Dialog open={showSignaturePad} onOpenChange={setShowSignaturePad}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sign Here</DialogTitle>
            <DialogDescription>
              Use your finger or stylus to sign in the box below.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SignaturePad onSave={handleSignatureSave} onClear={() => {}} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogTitle className="text-center text-xl">Delivery Confirmed!</DialogTitle>
            <DialogDescription className="text-center">
              Congratulations! Your Barangay ID has been delivered successfully. Thank you for using
              our digital services.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
