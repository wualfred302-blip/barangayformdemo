"use client"

import type React from "react"
import { useState } from "react"
import { Camera, Upload, Loader2, CheckCircle2 } from "lucide-react"

interface IDData {
  fullName: string
  birthDate: string
  address: string
  mobileNumber: string
  age: string
  idType?: string
  idNumber?: string
}

interface IDScannerProps {
  onDataExtracted: (data: IDData) => void
  disabled?: boolean
}

export function IDScanner({ onDataExtracted, disabled }: IDScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target?.result as string
        img.onload = () => {
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")!

          const maxWidth = 1200
          const scale = Math.min(maxWidth / img.width, 1)
          canvas.width = img.width * scale
          canvas.height = img.height * scale

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1]
          resolve(base64)
        }
      }
    })
  }

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    setProgress(0)
    setStatusMessage("Compressing image...")

    try {
      setProgress(20)
      const base64 = await compressImage(file)

      setStatusMessage("Reading ID card...")
      setProgress(40)

      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 5, 85))
      }, 200)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      try {
        const response = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        let result
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          result = await response.json()
        } else {
          const text = await response.text()
          throw new Error(text || "Server returned an invalid response")
        }

        if (result.success) {
          setProgress(90)
          setStatusMessage("Filling form...")

          onDataExtracted({
            ...result.data,
            idType: result.data.idType || "",
            idNumber: result.data.idNumber || "",
          })

          setProgress(100)
          setShowSuccess(true)

          setTimeout(() => {
            setIsProcessing(false)
            setShowSuccess(false)
            setProgress(0)
            setStatusMessage("")
          }, 1500)
        } else {
          throw new Error(result.error || "Failed to process ID")
        }
      } finally {
        clearInterval(progressInterval)
      }
    } catch (error: any) {
      console.error("Scan failed:", error)
      setIsProcessing(false)
      setProgress(0)
      setStatusMessage("")

      const message =
        error.name === "AbortError"
          ? "Request timed out. Please try again."
          : error.message || "Failed to scan ID. Please try again or fill manually."

      alert(message)
    }

    e.target.value = ""
  }

  return (
    <div className="mb-4">
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <div className="mb-4 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500">
            <Camera className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-base font-bold text-gray-900">Scan Your Government ID</h3>
          <p className="mt-1 text-sm text-gray-600">Required for registration</p>
        </div>

        <div className="flex gap-3">
          <label className="flex-1 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCapture}
              className="hidden"
              disabled={disabled || isProcessing}
            />
            <div
              className={`flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white transition ${disabled || isProcessing ? "cursor-not-allowed opacity-50" : "hover:bg-emerald-600 active:scale-[0.98]"}`}
            >
              <Camera className="h-4 w-4" />
              Take Photo
            </div>
          </label>

          <label className="flex-1 cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={handleCapture}
              className="hidden"
              disabled={disabled || isProcessing}
            />
            <div
              className={`flex h-11 items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-700 transition ${disabled || isProcessing ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50 active:scale-[0.98]"}`}
            >
              <Upload className="h-4 w-4" />
              Upload
            </div>
          </label>
        </div>

        <p className="mt-3 text-center text-xs text-gray-500">
          Supports: Philippine National ID, Driver's License, UMID, SSS, Postal ID, Voter's ID
        </p>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex justify-center">
              {showSuccess ? (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
              ) : (
                <Loader2 className="h-14 w-14 animate-spin text-emerald-500" />
              )}
            </div>

            <h3 className="mb-1 text-center text-lg font-bold">{showSuccess ? "Success!" : "Processing..."}</h3>
            <p className="mb-4 text-center text-sm text-gray-600">
              {showSuccess ? "ID scanned successfully" : statusMessage}
            </p>

            <div className="relative">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ease-out ${showSuccess ? "bg-emerald-500" : "bg-gradient-to-r from-emerald-400 to-emerald-600"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-1.5 text-center text-xs font-medium text-gray-500">{progress}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-gradient-to-b from-emerald-50 to-white px-3 text-gray-500">or fill manually below</span>
        </div>
      </div>
    </div>
  )
}
