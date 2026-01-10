"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useQRT, generateVerificationCode } from "@/lib/qrt-context"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  MapPin,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function QrtIdRequestPage() {
  const { user } = useAuth()
  const { setCurrentRequestImmediate, qrtIds } = useQRT()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [addressConfirmed, setAddressConfirmed] = useState(false)

  const handleGenerateQrtId = async () => {
    if (!addressConfirmed || !user) return

    setIsLoading(true)
    try {
      // Generate unique identifiers
      const year = new Date().getFullYear()
      const qrtSequence = (qrtIds.length + 1).toString().padStart(6, '0')
      const qrtCode = `QRT-${year}-${qrtSequence}`

      // Generate verification code using existing codes
      const existingVerificationCodes = qrtIds.map(q => q.verificationCode)
      const verificationCode = generateVerificationCode(existingVerificationCodes)

      // Generate FREE payment reference
      const paymentReference = `FREE-${Date.now()}`
      const now = new Date().toISOString()

      // Build QR code data JSON matching scanner format
      const qrCodeData = JSON.stringify({
        qrtCode: qrtCode,
        verificationCode: verificationCode,
        fullName: user.fullName || "Resident",
        birthDate: user.birthDate || "1990-01-01",
        issueDate: now.split('T')[0],
        verifyUrl: `${window.location.origin}/verify/qrt/${qrtCode}`
      })

      // Create QRT ID data with FREE status
      const qrtRequestData = {
        id: `temp_qrt_${Date.now()}`,
        qrtCode: qrtCode,
        verificationCode: verificationCode,
        userId: user.id || "demo_user",
        fullName: user.fullName || "Resident",
        birthDate: user.birthDate || "1990-01-01",
        address: user.address || "Address not available",
        mobileNumber: user.mobileNumber || "",
        email: user.email || "",
        qrCodeData: qrCodeData,
        paymentReference: paymentReference,
        amount: 0, // FREE
        status: "ready" as const, // Immediately available
        createdAt: now,
      }

      // Save to context and redirect
      setCurrentRequestImmediate(qrtRequestData)
      router.push(`/qrt-id/${qrtCode}`)
    } catch (error) {
      console.error("Error generating QRT ID:", error)
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center bg-white/80 backdrop-blur-md px-4 shadow-sm">
        <button onClick={handleCancel} className="mr-3 outline-none p-1 -ml-1">
          <ArrowLeft className="h-5 w-5 text-[#111827]" />
        </button>
        <h1 className="text-[17px] font-bold text-[#111827]">Request QRT ID</h1>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* User Info Display Card */}
        <Card className="overflow-hidden border border-gray-100 shadow-sm rounded-2xl bg-white">
          <CardContent className="p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Your Information</h2>

            <div className="space-y-3">
              {/* Full Name */}
              <div className="flex justify-between items-start py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">Full Name</span>
                <span className="text-sm font-medium text-gray-900 text-right max-w-[60%]">
                  {user?.fullName || "Not provided"}
                </span>
              </div>

              {/* Mobile Number */}
              {user?.mobileNumber && (
                <div className="flex justify-between items-start py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Mobile</span>
                  <span className="text-sm font-medium text-gray-900">{user.mobileNumber}</span>
                </div>
              )}

              {/* Email */}
              {user?.email && (
                <div className="flex justify-between items-start py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Email</span>
                  <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] break-all">
                    {user.email}
                  </span>
                </div>
              )}

              {/* Current Address */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Address</span>
                </div>
                <p className="text-sm font-medium text-gray-900 leading-relaxed pl-6">
                  {user?.address || "Address not provided"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Confirmation */}
        <div className={cn(
          "rounded-xl border p-4 transition-all cursor-pointer",
          addressConfirmed
            ? "border-emerald-200 bg-emerald-50/60"
            : "border-gray-200 bg-white hover:border-gray-300"
        )}
        onClick={() => setAddressConfirmed(!addressConfirmed)}
        >
          <div className="flex items-start gap-3">
            <Checkbox
              id="address-confirm"
              checked={addressConfirmed}
              onCheckedChange={(checked) => setAddressConfirmed(checked as boolean)}
              className="mt-0.5 h-5 w-5"
            />
            <div className="flex-1">
              <Label
                htmlFor="address-confirm"
                className="text-sm font-medium text-gray-900 cursor-pointer"
              >
                I confirm this is my current address
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                This will appear on your QRT ID card.
              </p>
            </div>
          </div>
        </div>

        {/* Info notice */}
        <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
          <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="h-3 w-3 text-emerald-600" />
          </div>
          <p className="text-sm text-gray-600">
            Your QRT ID will be ready instantly. No fees required.
          </p>
        </div>
      </main>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#F3F4F6] p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-2xl flex gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="h-14 w-[40%] rounded-2xl border-[#E5E7EB] text-lg font-bold text-[#4B5563]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerateQrtId}
            disabled={!addressConfirmed || isLoading}
            className={cn(
              "h-14 w-[60%] rounded-2xl text-lg font-bold transition-all",
              addressConfirmed && !isLoading
                ? "bg-[#10B981] hover:bg-[#059669] text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            )}
          >
            {isLoading ? "Generating..." : (
              <>
                <Check className="mr-2 h-5 w-5" />
                Generate QRT ID
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
