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
import { ArrowLeft, Clock, Zap } from "lucide-react"
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

const civilStatusOptions = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "widowed", label: "Widowed" },
  { value: "separated", label: "Separated" },
]

const sexOrientationOptions = [
  { value: "heterosexual", label: "Heterosexual" },
  { value: "homosexual", label: "Homosexual" },
  { value: "bisexual", label: "Bisexual" },
  { value: "asexual", label: "Asexual" },
  { value: "other", label: "Other" },
]

const occupationOptions = [
  { value: "teacher", label: "Teacher" },
  { value: "engineer", label: "Engineer" },
  { value: "driver", label: "Driver" },
  { value: "housewife", label: "Housewife" },
  { value: "student", label: "Student" },
  { value: "self-employed", label: "Self-employed" },
  { value: "unemployed", label: "Unemployed" },
  { value: "business-owner", label: "Business Owner" },
  { value: "government-employee", label: "Government Employee" },
  { value: "farmer-fisherman", label: "Farmer/Fisherman" },
]

const validIdTypes = [
  { value: "drivers-license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "umid", label: "UMID" },
  { value: "sss", label: "SSS ID" },
  { value: "philhealth", label: "PhilHealth ID" },
  { value: "postal", label: "Postal ID" },
  { value: "voters", label: "Voter's ID" },
  { value: "prc", label: "PRC ID" },
]

export default function RequestPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { setCurrentRequest } = useCertificates()
  const [purpose, setPurpose] = useState("")
  const [customPurpose, setCustomPurpose] = useState("")
  const [requestType, setRequestType] = useState<"regular" | "rush">("regular")
  const [sex, setSex] = useState<"Male" | "Female">("Male")
  const [sexOrientation, setSexOrientation] = useState("")
  const [civilStatus, setCivilStatus] = useState("")
  const [birthplace, setBirthplace] = useState("")
  const [purok, setPurok] = useState("")
  const [residencySince, setResidencySince] = useState("")
  const [occupation, setOccupation] = useState("")
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0)
  const [validIdType, setValidIdType] = useState("")
  const [validIdNumber, setValidIdNumber] = useState("")

  const amount = requestType === "rush" ? 100 : 50

  const handleProceed = () => {
    setCurrentRequest({
      certificateType: "Certificate of Residency",
      purpose:
        purpose === "others"
          ? customPurpose || "Personal"
          : purposes.find((p) => p.value === purpose)?.label || "Employment",
      customPurpose: purpose === "others" ? customPurpose : undefined,
      requestType,
      amount,
      purok: purok || "Purok 1",
      residencySince,
      residentName: user?.fullName || "Guest User",
      sex,
      sexOrientation: sexOrientationOptions.find((s) => s.value === sexOrientation)?.label || "",
      civilStatus: civilStatusOptions.find((c) => c.value === civilStatus)?.label || "",
      birthplace,
      occupation: occupationOptions.find((o) => o.value === occupation)?.label || "",
      monthlyIncome,
      validIdType: validIdTypes.find((v) => v.value === validIdType)?.label || "",
      validIdNumber,
    })
    router.push("/payment?type=certificate")
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
        <Card className="mb-3 rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#111827]">Personal Information</h3>

            {/* Sex */}
            <div className="mb-3">
              <Label className="text-sm font-medium text-[#374151]">Sex</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSex("Male")}
                  className={cn(
                    "flex h-12 items-center justify-center rounded-lg border-2 transition-all",
                    sex === "Male" ? "border-[#10B981] bg-[#F0FDF4] text-[#10B981]" : "border-[#E5E7EB] bg-white text-[#374151]",
                  )}
                >
                  <span className="font-semibold">Male</span>
                </button>
                <button
                  onClick={() => setSex("Female")}
                  className={cn(
                    "flex h-12 items-center justify-center rounded-lg border-2 transition-all",
                    sex === "Female" ? "border-[#10B981] bg-[#F0FDF4] text-[#10B981]" : "border-[#E5E7EB] bg-white text-[#374151]",
                  )}
                >
                  <span className="font-semibold">Female</span>
                </button>
              </div>
            </div>

            {/* Sex Orientation */}
            <div className="mb-3">
              <Label className="text-sm font-medium text-[#374151]">Sex Orientation</Label>
              <Select value={sexOrientation} onValueChange={setSexOrientation}>
                <SelectTrigger className="mt-1.5 h-12 rounded-lg border-[#E5E7EB] bg-white focus:border-[#10B981] focus:ring-[#10B981]">
                  <SelectValue placeholder="Select sex orientation" />
                </SelectTrigger>
                <SelectContent>
                  {sexOrientationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Civil Status */}
            <div className="mb-3">
              <Label className="text-sm font-medium text-[#374151]">Civil Status</Label>
              <Select value={civilStatus} onValueChange={setCivilStatus}>
                <SelectTrigger className="mt-1.5 h-12 rounded-lg border-[#E5E7EB] bg-white focus:border-[#10B981] focus:ring-[#10B981]">
                  <SelectValue placeholder="Select civil status" />
                </SelectTrigger>
                <SelectContent>
                  {civilStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>


            {/* Birthplace */}
            <div className="mb-3">
              <Label htmlFor="birthplace" className="text-sm font-medium text-[#374151]">
                Birthplace
              </Label>
              <Input
                id="birthplace"
                value={birthplace}
                onChange={(e) => setBirthplace(e.target.value)}
                placeholder="e.g., Manila, Philippines"
                className="mt-1.5 h-12 rounded-lg border-[#E5E7EB] bg-white placeholder:text-[#9CA3AF] focus:border-[#10B981] focus:ring-[#10B981]"
              />
            </div>

            <div className="my-4 border-b border-[#F3F4F6]"></div>

            {/* Purok */}
            <div className="mb-3">
              <Label htmlFor="purok" className="text-sm font-medium text-[#374151]">
                Purok / Street Address
              </Label>
              <Input
                id="purok"
                value={purok}
                onChange={(e) => setPurok(e.target.value)}
                placeholder="e.g., Purok 1, Street Name"
                className="mt-1.5 h-12 rounded-lg border-[#E5E7EB] bg-white placeholder:text-[#9CA3AF] focus:border-[#10B981] focus:ring-[#10B981]"
              />
            </div>

            {/* Residency Since */}
            <div>
              <Label htmlFor="residencySince" className="text-sm font-medium text-[#374151]">
                Resident Since
              </Label>
              <Input
                id="residencySince"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={residencySince}
                onChange={(e) => setResidencySince(e.target.value)}
                placeholder="Select date you became a resident"
                className="mt-1.5 h-12 rounded-lg border-[#E5E7EB] bg-white focus:border-[#10B981] focus:ring-[#10B981]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Employment & Income */}
        <Card className="mb-3 rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#111827]">Employment & Income</h3>

            {/* Occupation */}
            <div className="mb-3">
              <Label className="text-sm font-medium text-[#374151]">Occupation</Label>
              <Select value={occupation} onValueChange={setOccupation}>
                <SelectTrigger className="mt-1.5 h-12 rounded-lg border-[#E5E7EB] bg-white focus:border-[#10B981] focus:ring-[#10B981]">
                  <SelectValue placeholder="Select occupation" />
                </SelectTrigger>
                <SelectContent>
                  {occupationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Monthly Income */}
            <div>
              <Label htmlFor="monthlyIncome" className="text-sm font-medium text-[#374151]">
                Monthly Income (₱)
              </Label>
              <Input
                id="monthlyIncome"
                type="number"
                min="0"
                step="1000"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                placeholder="0"
                className="mt-1.5 h-12 rounded-lg border-[#E5E7EB] bg-white focus:border-[#10B981] focus:ring-[#10B981]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Identification Details */}
        <Card className="mb-3 rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#111827]">Identification Details</h3>

            {/* Valid ID Type */}
            <div className="mb-3">
              <Label className="text-sm font-medium text-[#374151]">Valid ID Type</Label>
              <Select value={validIdType} onValueChange={setValidIdType}>
                <SelectTrigger className="mt-1.5 h-12 rounded-lg border-[#E5E7EB] bg-white focus:border-[#10B981] focus:ring-[#10B981]">
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  {validIdTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Valid ID Number */}
            <div>
              <Label htmlFor="validIdNumber" className="text-sm font-medium text-[#374151]">
                Valid ID Number
              </Label>
              <Input
                id="validIdNumber"
                value={validIdNumber}
                onChange={(e) => setValidIdNumber(e.target.value.toUpperCase())}
                placeholder="Enter ID number"
                className="mt-1.5 h-12 rounded-lg border-[#E5E7EB] bg-white placeholder:text-[#9CA3AF] focus:border-[#10B981] focus:ring-[#10B981]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Certificate Details */}
        <Card className="mb-3 rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#111827]">Certificate Details</h3>

            {/* Purpose */}
            <div className="mb-3">
              <Label className="text-sm font-medium text-[#374151]">Purpose</Label>
              <Select value={purpose} onValueChange={setPurpose}>
                <SelectTrigger className="mt-1.5 h-12 rounded-lg border-[#E5E7EB] bg-white focus:border-[#10B981] focus:ring-[#10B981]">
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
                  className="mt-1.5 min-h-[96px] rounded-lg border-[#E5E7EB] bg-white placeholder:text-[#9CA3AF] focus:border-[#10B981] focus:ring-[#10B981]"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request Type */}
        <Card className="rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-[#111827]">Request Type</h3>

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
