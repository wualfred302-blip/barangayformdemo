"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Minus, Plus, Clock, Zap } from "lucide-react"
import { useCertificates } from "@/lib/certificate-context"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

const certificateTypes = [
  { value: "barangay-clearance", label: "Barangay Clearance" },
  { value: "residency", label: "Certificate of Residency" },
  { value: "indigency", label: "Certificate of Indigency" },
]

const purposes = [
  { value: "employment", label: "Employment" },
  { value: "travel", label: "Travel" },
  { value: "business", label: "Business" },
  { value: "legal", label: "Legal" },
  { value: "others", label: "Others" },
]

export default function RequestPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { setCurrentRequest } = useCertificates()
  const [certificateType, setCertificateType] = useState("")
  const [purpose, setPurpose] = useState("")
  const [customPurpose, setCustomPurpose] = useState("")
  const [requestType, setRequestType] = useState<"regular" | "rush">("regular")
  const [age, setAge] = useState(25)
  const [purok, setPurok] = useState("")
  const [yearsOfResidency, setYearsOfResidency] = useState(5)

  const amount = requestType === "rush" ? 100 : 50

  const handleProceed = () => {
    setCurrentRequest({
      certificateType: certificateTypes.find((c) => c.value === certificateType)?.label || "Barangay Clearance",
      purpose:
        purpose === "others"
          ? customPurpose || "Personal"
          : purposes.find((p) => p.value === purpose)?.label || "Employment",
      customPurpose: purpose === "others" ? customPurpose : undefined,
      requestType,
      amount,
      age,
      purok: purok || "Purok 1",
      yearsOfResidency,
      residentName: user?.fullName || "Guest User",
    })
    router.push("/payment")
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-[#E5E7EB] bg-white px-5">
        <Link href="/dashboard" className="rounded-lg p-1 transition-colors hover:bg-[#F9FAFB]">
          <ArrowLeft className="h-5 w-5 text-[#374151]" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8">
            <Image src="/images/logo.png" alt="Barangay Seal" fill className="object-contain" />
          </div>
          <h1 className="text-lg font-semibold text-[#111827]">Request Certificate</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pb-32 pt-5">
        {/* Personal Information */}
        <Card className="mb-4 rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <CardContent className="p-6">
            <h3 className="mb-5 text-lg font-semibold text-[#111827]">Personal Information</h3>

            {/* Age */}
            <div className="mb-5">
              <Label className="text-sm font-medium text-[#374151]">Age</Label>
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => setAge(Math.max(1, age - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white transition-colors hover:bg-[#F9FAFB]"
                >
                  <Minus className="h-4 w-4 text-[#374151]" />
                </button>
                <span className="w-12 text-center text-xl font-bold text-[#111827]">{age}</span>
                <button
                  onClick={() => setAge(Math.min(120, age + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white transition-colors hover:bg-[#F9FAFB]"
                >
                  <Plus className="h-4 w-4 text-[#374151]" />
                </button>
              </div>
            </div>

            {/* Purok */}
            <div className="mb-5">
              <Label htmlFor="purok" className="text-sm font-medium text-[#374151]">
                Purok / Street Address
              </Label>
              <Input
                id="purok"
                value={purok}
                onChange={(e) => setPurok(e.target.value)}
                placeholder="e.g., Purok 1, Street Name"
                className="mt-2 h-12 rounded-lg border-[#E5E7EB] bg-white placeholder:text-[#9CA3AF] focus:border-[#10B981] focus:ring-[#10B981]"
              />
            </div>

            {/* Years of Residency */}
            <div>
              <Label className="text-sm font-medium text-[#374151]">Years of Residency</Label>
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => setYearsOfResidency(Math.max(0, yearsOfResidency - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white transition-colors hover:bg-[#F9FAFB]"
                >
                  <Minus className="h-4 w-4 text-[#374151]" />
                </button>
                <span className="w-12 text-center text-xl font-bold text-[#111827]">{yearsOfResidency}</span>
                <button
                  onClick={() => setYearsOfResidency(Math.min(100, yearsOfResidency + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white transition-colors hover:bg-[#F9FAFB]"
                >
                  <Plus className="h-4 w-4 text-[#374151]" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Certificate Details */}
        <Card className="mb-4 rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <CardContent className="p-6">
            <h3 className="mb-5 text-lg font-semibold text-[#111827]">Certificate Details</h3>

            {/* Certificate Type */}
            <div className="mb-5">
              <Label className="text-sm font-medium text-[#374151]">Certificate Type</Label>
              <Select value={certificateType} onValueChange={setCertificateType}>
                <SelectTrigger className="mt-2 h-12 rounded-lg border-[#E5E7EB] bg-white focus:border-[#10B981] focus:ring-[#10B981]">
                  <SelectValue placeholder="Select certificate type" />
                </SelectTrigger>
                <SelectContent>
                  {certificateTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Purpose */}
            <div className="mb-5">
              <Label className="text-sm font-medium text-[#374151]">Purpose</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger className="mt-2 h-12 rounded-lg border-[#E5E7EB] bg-white focus:border-[#10B981] focus:ring-[#10B981]">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {purposes.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Purpose */}
            {purpose === "others" && (
              <div>
                <Label className="text-sm font-medium text-[#374151]">Please specify purpose</Label>
                <Textarea
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  placeholder="Enter your purpose"
                  className="mt-2 min-h-[96px] rounded-lg border-[#E5E7EB] bg-white placeholder:text-[#9CA3AF] focus:border-[#10B981] focus:ring-[#10B981]"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Type */}
        <Card className="rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <CardContent className="p-6">
            <h3 className="mb-5 text-lg font-semibold text-[#111827]">Request Type</h3>

            <div className="space-y-3">
              {/* Regular */}
              <button
                onClick={() => setRequestType("regular")}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-all",
                  requestType === "regular"
                    ? "border-[#10B981] bg-[#F0FDF4]"
                    : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]",
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      requestType === "regular" ? "bg-[#10B981]/10" : "bg-[#F9FAFB]",
                    )}
                  >
                    <Clock className={cn("h-5 w-5", requestType === "regular" ? "text-[#10B981]" : "text-[#6B7280]")} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[#111827]">Regular</p>
                    <p className="text-sm text-[#6B7280]">Ready in 24 hours</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-[#10B981]">₱50</p>
              </button>

              {/* Rush */}
              <button
                onClick={() => setRequestType("rush")}
                className={cn(
                  "relative flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-all",
                  requestType === "rush"
                    ? "border-[#10B981] bg-[#F0FDF4]"
                    : "border-[#E5E7EB] bg-white hover:border-[#D1D5DB]",
                )}
              >
                {/* Fast Badge */}
                <span className="absolute right-4 top-2 rounded-full bg-[#F97316] px-2 py-0.5 text-[10px] font-bold text-white">
                  FAST
                </span>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg",
                      requestType === "rush" ? "bg-[#10B981]/10" : "bg-[#F9FAFB]",
                    )}
                  >
                    <Zap className={cn("h-5 w-5", requestType === "rush" ? "text-[#10B981]" : "text-[#6B7280]")} />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[#111827]">Rush</p>
                    <p className="text-sm text-[#6B7280]">Ready in 2 hours</p>
                  </div>
                </div>
                <p className="text-xl font-bold text-[#10B981]">₱100</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[#E5E7EB] bg-white p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <Button
          onClick={handleProceed}
          className="flex h-14 w-full items-center justify-between rounded-xl bg-[#10B981] px-6 text-base font-semibold text-white hover:bg-[#059669]"
        >
          <span>Proceed to Payment</span>
          <span>₱{amount}</span>
        </Button>
      </div>
    </div>
  )
}
