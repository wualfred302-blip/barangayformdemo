"use client"

import type React from "react"
import { useState } from "react"
import { Camera, Upload, Loader2, AlertCircle, Type } from "lucide-react"
import jsQR from "jsqr"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
  disabled?: boolean
}

export function QRScanner({ onScan, onError, disabled }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState("")

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsScanning(true)
    setError(null)
    setProcessingStatus("Processing image...")

    try {
      const imageData = await getImageData(file)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      if (code) {
        onScan(code.data)
      } else {
        throw new Error("No QR code found in image")
      }
    } catch (err: any) {
      console.error("QR Scan error:", err)
      const errorMessage = err.message || "Failed to scan QR code"
      setError(errorMessage)
      if (onError) onError(errorMessage)
    } finally {
      setIsScanning(false)
      setProcessingStatus("")
      // Reset file input
      e.target.value = ""
    }
  }

  const getImageData = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Could not get canvas context"))
            return
          }
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          resolve(ctx.getImageData(0, 0, canvas.width, canvas.height))
        }
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return

    // Simple validation for QRT format (QRT-YYYY-NNNNNN)
    // Adjust regex as needed based on specific requirements, here allowing some flexibility but checking basic structure if needed.
    // The plan mentioned "QRT-YYYY-NNNNNN", let's do a basic check or just pass it through if strict validation isn't enforced here.
    // Plan says "Validate format before calling onScan".
    const qrtRegex = /^QRT-\d{4}-\d{6}$/
    if (!qrtRegex.test(manualCode)) {
      const errorMsg = "Invalid format. Expected: QRT-YYYY-NNNNNN"
      setError(errorMsg)
      if (onError) onError(errorMsg)
      return
    }

    onScan(manualCode)
    setManualCode("")
    setError(null)
  }

  return (
    <Card className="border-emerald-100 bg-emerald-50/50 p-4">
      <div className="flex flex-col items-center gap-4">
        {!showManualEntry ? (
          <>
            <div className="flex flex-col items-center text-center">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <Camera className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-gray-900">Scan QRT Code</h3>
              <p className="text-xs text-gray-500">Take a photo or upload QR image</p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleScan}
                  className="hidden"
                  disabled={disabled || isScanning}
                />
                <div
                  className={`flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 active:scale-[0.98] ${disabled || isScanning ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  {isScanning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  {isScanning ? "Scanning..." : "Camera"}
                </div>
              </label>

              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleScan}
                  className="hidden"
                  disabled={disabled || isScanning}
                />
                <div
                  className={`flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-medium text-emerald-700 shadow-sm transition-colors hover:bg-emerald-50 active:scale-[0.98] ${disabled || isScanning ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </div>
              </label>
            </div>

            <div className="relative w-full py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-emerald-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-emerald-50/50 px-2 text-gray-500">Or</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowManualEntry(true)}
              className="text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
              disabled={disabled || isScanning}
            >
              <Type className="mr-2 h-4 w-4" />
              Enter Code Manually
            </Button>
          </>
        ) : (
          <form onSubmit={handleManualSubmit} className="w-full space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-code" className="text-sm font-medium text-gray-700">
                Enter QRT Code
              </Label>
              <Input
                id="manual-code"
                placeholder="QRT-YYYY-NNNNNN"
                value={manualCode}
                onChange={(e) => {
                  setManualCode(e.target.value.toUpperCase())
                  setError(null)
                }}
                className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                disabled={disabled}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowManualEntry(false)
                  setError(null)
                }}
                className="flex-1"
                disabled={disabled}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={disabled || !manualCode}
              >
                Verify Code
              </Button>
            </div>
          </form>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {isScanning && processingStatus && !showManualEntry && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
           <div className="rounded-xl bg-white p-6 text-center shadow-xl">
             <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-emerald-600" />
             <p className="font-medium text-gray-900">{processingStatus}</p>
           </div>
         </div>
      )}
    </Card>
  )
}
