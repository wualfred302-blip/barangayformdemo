"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useQRT, generateVerificationCode } from "@/lib/qrt-context"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  MapPin,
  User,
  Phone,
  Mail,
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
        <Card className="overflow-hidden border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] bg-white">
          <CardContent className="p-6 space-y-4">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Your Information</h2>

            {/* Full Name */}
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Full Name</p>
                <p className="text-sm font-bold text-gray-900">{user?.fullName || "Not provided"}</p>
              </div>
            </div>

            {/* Mobile Number */}
            {user?.mobileNumber && (
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Mobile Number</p>
                  <p className="text-sm font-bold text-gray-900">{user.mobileNumber}</p>
                </div>
              </div>
            )}

            {/* Email */}
            {user?.email && (
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-sm font-bold text-gray-900">{user.email}</p>
                </div>
              </div>
            )}

            {/* Current Address */}
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-1">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Current Address</p>
                <p className="text-sm font-bold text-gray-900 leading-relaxed">
                  {user?.address || "Address not provided"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Address Confirmation Card */}
        <Card className="overflow-hidden border-2 rounded-[24px] bg-white transition-all"
              style={{
                borderColor: addressConfirmed ? "#10B981" : "#E5E7EB",
                backgroundColor: addressConfirmed ? "#F0FDF4" : "#FFFFFF"
              }}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <Checkbox
                  id="address-confirm"
                  checked={addressConfirmed}
                  onCheckedChange={(checked) => setAddressConfirmed(checked as boolean)}
                  className={cn(
                    "h-6 w-6 rounded-lg transition-all",
                    addressConfirmed && "bg-emerald-500 border-emerald-500"
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor="address-confirm"
                  className="text-sm font-bold text-gray-900 cursor-pointer"
                >
                  I confirm that the address shown above is my current residence
                </Label>
                <p className="text-xs text-gray-600 mt-2">
                  This information from your registration will be used for your QRT ID.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
          <p className="text-xs text-blue-900 font-medium">
            Your QRT ID will be generated immediately at no cost.
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
