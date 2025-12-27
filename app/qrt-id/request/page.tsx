"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Camera,
  Plus,
  Minus,
  Clock,
  Zap,
  User,
  Phone,
  IdCard,
  Check,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

// Helper Functions
const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export default function QrtIdRequestPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [showErrors, setShowErrors] = useState(false)

  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    fullName: user?.fullName || "",
    birthDate: "",
    age: 0,
    gender: "",
    civilStatus: "",
    birthPlace: "",
    address: user?.address || "",
    height: "",
    weight: "",
    yearsResident: 0,
    citizenship: "Filipino",
    photoBase64: "",
    // Step 2: Emergency Contact
    emergencyContactName: "",
    emergencyContactAddress: "",
    emergencyContactPhone: "",
    emergencyContactRelationship: "",
    // Step 3: Payment
    requestType: "regular" as "regular" | "rush",
  })

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || user.fullName || "",
        address: prev.address || user.address || "",
      }))
    }
  }, [user])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      if (field === "birthDate") {
        newData.age = calculateAge(value)
      }
      return newData
    })
  }

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoBase64: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const validateStep1 = (): boolean => {
    return !!(
      formData.fullName &&
      formData.birthDate &&
      formData.gender &&
      formData.civilStatus &&
      formData.address &&
      formData.photoBase64
    )
  }

  const validateStep2 = (): boolean => {
    return !!(
      formData.emergencyContactName &&
      formData.emergencyContactAddress &&
      formData.emergencyContactPhone &&
      formData.emergencyContactRelationship
    )
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2)
        setShowErrors(false)
        window.scrollTo(0, 0)
      } else {
        setShowErrors(true)
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3)
        setShowErrors(false)
        window.scrollTo(0, 0)
      } else {
        setShowErrors(true)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      window.scrollTo(0, 0)
    } else {
      router.back()
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-40">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center bg-white/80 backdrop-blur-md px-4 shadow-sm">
        <button onClick={handleBack} className="mr-3 outline-none p-1 -ml-1">
          <ArrowLeft className="h-5 w-5 text-[#111827]" />
        </button>
        <h1 className="text-[17px] font-bold text-[#111827]">Request QRT ID</h1>
      </header>

      {/* Progress Indicator */}
      <div className="mx-auto flex max-w-md items-center justify-center gap-0 px-8 py-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-bold transition-all duration-300",
                  currentStep === step
                    ? "bg-[#10B981] text-white ring-4 ring-[#10B981]/20"
                    : currentStep > step
                    ? "bg-[#10B981] text-white"
                    : "bg-[#E5E7EB] text-[#9CA3AF]"
                )}
              >
                {currentStep > step ? <Check className="h-5 w-5 stroke-[3]" /> : step}
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-widest",
                  currentStep >= step ? "text-[#10B981]" : "text-[#9CA3AF]"
                )}
              >
                {step === 1 ? "Info" : step === 2 ? "Contact" : "Review"}
              </span>
            </div>
            {step < 3 && (
              <div
                className={cn(
                  "mx-4 h-[2px] flex-1 transition-all duration-500",
                  currentStep > step ? "bg-[#10B981]" : "bg-[#E5E7EB]"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <main className="px-4">
        {currentStep === 1 && (
          <div className="space-y-4">
            {/* Personal Details Card */}
            <Card className="overflow-hidden border-none shadow-sm rounded-2xl">
              <CardContent className="p-5 space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-[#374151]">
                    Full Name <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <Input
                    placeholder="Juan Dela Cruz"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange("fullName", e.target.value)}
                    className="h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] focus:bg-white transition-colors"
                  />
                  {showErrors && !formData.fullName && (
                    <p className="text-[11px] font-medium text-red-500 pl-1">Full name is required</p>
                  )}
                </div>

                <div className="grid grid-cols-[1.2fr_0.8fr] gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-bold text-[#374151]">
                      Birth Date <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Input
                      type="date"
                      max={new Date().toISOString().split("T")[0]}
                      value={formData.birthDate}
                      onChange={(e) => handleInputChange("birthDate", e.target.value)}
                      className="h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] focus:bg-white transition-colors"
                    />
                    {showErrors && !formData.birthDate && (
                      <p className="text-[11px] font-medium text-red-500 pl-1">Required</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-bold text-[#374151]">Age</Label>
                    <div className="flex h-11 items-center justify-center bg-[#F3F4F6] rounded-xl border border-[#E5E7EB]">
                      <span className="text-lg font-bold text-[#111827]">{formData.age}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-bold text-[#374151]">
                      Gender <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange("gender", value)}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] transition-all focus:ring-[#10B981]/10">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {showErrors && !formData.gender && (
                      <p className="text-[11px] font-medium text-red-500 pl-1">Required</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-bold text-[#374151]">
                      Civil Status <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Select
                      value={formData.civilStatus}
                      onValueChange={(value) => handleInputChange("civilStatus", value)}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] transition-all focus:ring-[#10B981]/10">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                        <SelectItem value="Separated">Separated</SelectItem>
                      </SelectContent>
                    </Select>
                    {showErrors && !formData.civilStatus && (
                      <p className="text-[11px] font-medium text-red-500 pl-1">Required</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-[#374151]">Birth Place</Label>
                  <Input
                    placeholder="City/Municipality, Province"
                    value={formData.birthPlace}
                    onChange={(e) => handleInputChange("birthPlace", e.target.value)}
                    className="h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-[#374151]">
                    Address <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <Textarea
                    placeholder="Complete residential address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    className="min-h-[80px] rounded-xl border-[#E5E7EB] bg-[#F9FAFB] focus:bg-white transition-colors py-3"
                  />
                  {showErrors && !formData.address && (
                    <p className="text-[11px] font-medium text-red-500 pl-1">Address is required</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Physical Details Card */}
            <Card className="overflow-hidden border-none shadow-sm rounded-2xl">
              <CardContent className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-bold text-[#374151]">Height (cm)</Label>
                    <Input
                      type="number"
                      placeholder="170"
                      value={formData.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
                      className="h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[13px] font-bold text-[#374151]">Weight (kg)</Label>
                    <Input
                      type="number"
                      placeholder="65"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                      className="h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-[#374151]">Years Resident</Label>
                  <div className="flex items-center justify-between h-11 px-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB]">
                    <button
                      onClick={() => handleInputChange("yearsResident", Math.max(0, formData.yearsResident - 1))}
                      className="p-1 rounded-full bg-[#F3F4F6] text-[#4B5563]"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <span className="text-xl font-bold text-[#111827]">{formData.yearsResident}</span>
                    <button
                      onClick={() => handleInputChange("yearsResident", Math.min(100, formData.yearsResident + 1))}
                      className="p-1 rounded-full bg-[#F3F4F6] text-[#4B5563]"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-[#374151]">Citizenship</Label>
                  <Input
                    value={formData.citizenship}
                    onChange={(e) => handleInputChange("citizenship", e.target.value)}
                    className="h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Photo Upload Card */}
            <Card className="overflow-hidden border-none shadow-sm rounded-2xl mb-6">
              <CardContent className="p-5 space-y-4">
                <Label className="text-[13px] font-bold text-[#374151]">
                  Photo Upload <span className="text-red-500 ml-0.5">*</span>
                </Label>
                <div className="relative">
                  <input
                    type="file"
                    id="photo-upload"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  {formData.photoBase64 ? (
                    <div className="relative h-48 w-full overflow-hidden rounded-xl border-2 border-dashed border-[#10B981]">
                      <Image
                        src={formData.photoBase64}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        <span className="text-white font-medium">Change Photo</span>
                      </label>
                    </div>
                  ) : (
                    <label
                      htmlFor="photo-upload"
                      className="flex flex-col items-center justify-center h-48 w-full border-2 border-dashed border-[#E5E7EB] rounded-xl cursor-pointer hover:border-[#10B981] transition-colors"
                    >
                      <Camera className="h-10 w-10 text-[#9CA3AF] mb-2" />
                      <span className="text-sm text-[#6B7280]">Upload Photo</span>
                    </label>
                  )}
                </div>
                {showErrors && !formData.photoBase64 && (
                  <p className="text-xs text-red-500 text-center">Photo is required</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <Card className="overflow-hidden border-none shadow-sm rounded-2xl">
              <CardContent className="p-5 space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-[#374151]">
                    Emergency Contact Name <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <Input
                    placeholder="Full name of emergency contact"
                    value={formData.emergencyContactName}
                    onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                    className="h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] focus:bg-white transition-colors"
                  />
                  {showErrors && !formData.emergencyContactName && (
                    <p className="text-[11px] font-medium text-red-500 pl-1">Required</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-[#374151]">
                    Emergency Contact Address <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <Textarea
                    placeholder="Complete residential address"
                    value={formData.emergencyContactAddress}
                    onChange={(e) => handleInputChange("emergencyContactAddress", e.target.value)}
                    className="min-h-[80px] rounded-xl border-[#E5E7EB] bg-[#F9FAFB] focus:bg-white transition-colors py-3"
                  />
                  {showErrors && !formData.emergencyContactAddress && (
                    <p className="text-[11px] font-medium text-red-500 pl-1">Required</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-[#374151]">
                    Emergency Contact Phone <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <Input
                    type="tel"
                    placeholder="+63 912 345 6789"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                    className="h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] focus:bg-white transition-colors"
                  />
                  {showErrors && !formData.emergencyContactPhone && (
                    <p className="text-[11px] font-medium text-red-500 pl-1">Required</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-bold text-[#374151]">
                    Relationship <span className="text-red-500 ml-0.5">*</span>
                  </Label>
                  <Select
                    value={formData.emergencyContactRelationship}
                    onValueChange={(value) => handleInputChange("emergencyContactRelationship", value)}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-[#E5E7EB] bg-[#F9FAFB] transition-all">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Child">Child</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {showErrors && !formData.emergencyContactRelationship && (
                    <p className="text-[11px] font-medium text-red-500 pl-1">Required</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Personal Info Summary */}
            <Card className="overflow-hidden border-none shadow-sm rounded-2xl">
              <div className="flex items-center justify-between px-6 pt-6">
                <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Personal Information</h3>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-semibold text-[#10B981] hover:underline"
                >
                  Edit
                </button>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-[#F3F4F6]">
                  <div className="relative h-20 w-20 overflow-hidden rounded-xl bg-[#F3F4F6]">
                    {formData.photoBase64 ? (
                      <Image src={formData.photoBase64} alt="Avatar" fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-8 w-8 text-[#9CA3AF]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#111827]">{formData.fullName}</p>
                    <p className="text-sm text-[#6B7280]">{formData.citizenship}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-y-4 text-sm">
                  <div>
                    <p className="text-[#6B7280]">Birth Date</p>
                    <p className="font-semibold text-[#111827]">{formData.birthDate}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Age</p>
                    <p className="font-semibold text-[#111827]">{formData.age} yrs old</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Gender</p>
                    <p className="font-semibold text-[#111827]">{formData.gender}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Civil Status</p>
                    <p className="font-semibold text-[#111827]">{formData.civilStatus}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[#6B7280]">Address</p>
                    <p className="font-semibold text-[#111827]">{formData.address}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Height/Weight</p>
                    <p className="font-semibold text-[#111827]">
                      {formData.height}cm / {formData.weight}kg
                    </p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Residency</p>
                    <p className="font-semibold text-[#111827]">{formData.yearsResident} years</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact Summary */}
            <Card className="overflow-hidden border-none shadow-sm rounded-2xl">
              <div className="flex items-center justify-between px-6 pt-6">
                <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider">Emergency Contact</h3>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-semibold text-[#10B981] hover:underline"
                >
                  Edit
                </button>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-[#6B7280]">Contact Person</p>
                    <p className="font-semibold text-[#111827]">{formData.emergencyContactName}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Relationship</p>
                    <p className="font-semibold text-[#111827]">{formData.emergencyContactRelationship}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Phone Number</p>
                    <p className="font-semibold text-[#111827]">{formData.emergencyContactPhone}</p>
                  </div>
                  <div>
                    <p className="text-[#6B7280]">Address</p>
                    <p className="font-semibold text-[#111827]">{formData.emergencyContactAddress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Type Selection */}
            <div className="space-y-3 mb-8">
              <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider px-1">Request Type</h3>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => handleInputChange("requestType", "regular")}
                  className={cn(
                    "relative flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                    formData.requestType === "regular"
                      ? "border-[#10B981] bg-[#F0FDF4]"
                      : "border-transparent bg-white shadow-sm"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      formData.requestType === "regular" ? "bg-white text-[#10B981]" : "bg-[#F3F4F6] text-[#6B7280]"
                    )}>
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[#111827]">Regular</p>
                      <p className="text-xs text-[#6B7280]">Ready in 3 days</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-[#111827]">₱100</p>
                </button>

                <button
                  onClick={() => handleInputChange("requestType", "rush")}
                  className={cn(
                    "relative flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                    formData.requestType === "rush"
                      ? "border-[#10B981] bg-[#F0FDF4]"
                      : "border-transparent bg-white shadow-sm"
                  )}
                >
                  <div className="absolute -top-2 right-4 bg-[#F59E0B] text-white text-[10px] font-black px-2 py-0.5 rounded-full tracking-wider">
                    FAST
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      formData.requestType === "rush" ? "bg-white text-[#10B981]" : "bg-[#F3F4F6] text-[#6B7280]"
                    )}>
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-[#111827]">Rush</p>
                      <p className="text-xs text-[#6B7280]">Ready in 1 day</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-[#111827]">₱200</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#F3F4F6] p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-2xl flex gap-3">
          {currentStep === 1 ? (
            <Button
              onClick={handleNext}
              className="h-14 w-full rounded-xl bg-[#10B981] text-lg font-bold hover:bg-[#059669] transition-colors"
            >
              Next: Emergency Contact
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : currentStep === 2 ? (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                className="h-14 w-[40%] rounded-xl border-[#E5E7EB] text-lg font-bold text-[#4B5563]"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="h-14 w-[60%] rounded-xl bg-[#10B981] text-lg font-bold hover:bg-[#059669] transition-colors"
              >
                Next: Review
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => router.push("/payment")}
              className="h-14 w-full rounded-xl bg-[#10B981] text-lg font-bold hover:bg-[#059669] transition-colors"
            >
              Proceed to Payment • ₱{formData.requestType === "rush" ? "200" : "100"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
