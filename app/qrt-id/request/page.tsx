"use client"

import { useState, useEffect, useCallback, ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useQRT, generateVerificationCode } from "@/lib/qrt-context"
import { useCertificates } from "@/lib/certificate-context"
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
  Check,
  ChevronRight,
  Info,
  Calendar,
  MapPin,
  TrendingUp,
  Weight,
  HelpCircle,
  CheckCircle2,
  Trash2,
  Shield,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { slideUp } from "@/lib/animations"
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

const getDaysInMonth = (month: number, year: number): number => {
  if (!month || !year) return 31
  const lastDay = new Date(year, month, 0)
  return lastDay.getDate()
}

// Province and City data for Pampanga region
const PROVINCES = [
  "Pampanga",
  "Bataan",
  "Bulacan",
  "Nueva Ecija",
  "Tarlac",
  "Zambales",
]

const CITIES_BY_PROVINCE: Record<string, string[]> = {
  "Pampanga": [
    "Mabalacat City",
    "Angeles City",
    "San Fernando City",
    "Apalit",
    "Arayat",
    "Bacolor",
    "Candaba",
    "Floridablanca",
    "Guagua",
    "Lubao",
    "Macabebe",
    "Magalang",
    "Masantol",
    "Mexico",
    "Minalin",
    "Porac",
    "San Luis",
    "San Simon",
    "Santa Ana",
    "Santa Rita",
    "Santo Tomas",
    "Sasmuan",
  ],
  "Bataan": ["Balanga City", "Dinalupihan", "Hermosa", "Orani", "Samal"],
  "Bulacan": ["Malolos City", "Meycauayan City", "San Jose del Monte City"],
  "Nueva Ecija": ["Cabanatuan City", "Gapan City", "San Jose City"],
  "Tarlac": ["Tarlac City", "Concepcion", "Paniqui"],
  "Zambales": ["Olongapo City", "Iba", "Subic"],
}

interface DateDropdownProps {
  value: string
  onChange: (isoDate: string) => void
  hasError?: boolean
}

function DateDropdown({ value, onChange, hasError }: DateDropdownProps) {
  const parsedDate = value ? new Date(value) : null
  const [selectedMonth, setSelectedMonth] = useState<number>(parsedDate?.getMonth() + 1 || 0)
  const [selectedDay, setSelectedDay] = useState<number>(parsedDate?.getDate() || 0)
  const [selectedYear, setSelectedYear] = useState<number>(parsedDate?.getFullYear() || 0)
  const [lastCalledIsoDate, setLastCalledIsoDate] = useState<string>("")

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i)

  const maxDays = getDaysInMonth(selectedMonth, selectedYear)
  const days = Array.from({ length: maxDays }, (_, i) => i + 1)

  useEffect(() => {
    if (selectedMonth && selectedDay && selectedYear) {
      const validDay = Math.min(selectedDay, maxDays)
      const isoDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(validDay).padStart(2, '0')}`
      
      // Only call onChange if the ISO date has actually changed
      if (isoDate !== lastCalledIsoDate) {
        onChange(isoDate)
        setLastCalledIsoDate(isoDate)
      }

      if (validDay !== selectedDay) {
        setSelectedDay(validDay)
      }
    }
  }, [selectedMonth, selectedDay, selectedYear, maxDays, onChange, lastCalledIsoDate])

  return (
    <div className="grid grid-cols-[2fr_1fr_1.5fr] gap-3">
      {/* Month */}
      <Select
        value={selectedMonth ? String(selectedMonth) : ""}
        onValueChange={(val) => setSelectedMonth(parseInt(val))}
      >
        <SelectTrigger className={cn(
          "h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-medium",
          hasError && !selectedMonth && "border-red-200 bg-red-50"
        )}>
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl max-h-[300px]">
          {months.map((month, index) => (
            <SelectItem key={month} value={String(index + 1)} className="font-medium">
              {month}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Day */}
      <Select
        value={selectedDay ? String(selectedDay) : ""}
        onValueChange={(val) => setSelectedDay(parseInt(val))}
        disabled={!selectedMonth || !selectedYear}
      >
        <SelectTrigger className={cn(
          "h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold text-center",
          hasError && !selectedDay && "border-red-200 bg-red-50",
          (!selectedMonth || !selectedYear) && "opacity-50 cursor-not-allowed"
        )}>
          <SelectValue placeholder="Day" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl max-h-[300px]">
          {days.map((day) => (
            <SelectItem key={day} value={String(day)} className="font-bold text-center">
              {day}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Year */}
      <Select
        value={selectedYear ? String(selectedYear) : ""}
        onValueChange={(val) => setSelectedYear(parseInt(val))}
      >
        <SelectTrigger className={cn(
          "h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-bold text-center",
          hasError && !selectedYear && "border-red-200 bg-red-50"
        )}>
          <SelectValue placeholder="Year" />
        </SelectTrigger>
        <SelectContent className="rounded-2xl max-h-[300px]">
          {years.map((year) => (
            <SelectItem key={year} value={String(year)} className="font-bold">
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function QrtIdRequestPage() {
  const { user } = useAuth()
  const { setCurrentRequestImmediate, qrtIds } = useQRT()
  const { setCurrentRequest: setCertificateRequest } = useCertificates()
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
    birthPlace: "Mawaque, Mabalacat",
    // Structured address fields
    addressLine: "",
    streetBarangay: "Barangay Mawaque",
    city: "Mabalacat City",
    province: "Pampanga",
    postalCode: "",
    address: user?.address || "", // Combined for backward compatibility
    height: "",
    weight: "",
    yearsResident: 0,
    citizenship: "Filipino",
    photoBase64: "",
    // Step 2: Emergency Contact
    emergencyContactName: "",
    emergencyContactAddressLine: "",
    emergencyContactStreetBarangay: "",
    emergencyContactCity: "Mabalacat City",
    emergencyContactProvince: "Pampanga",
    emergencyContactPostalCode: "",
    emergencyContactAddress: "", // Combined for backward compatibility
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
      // Auto-combine address fields
      if (["addressLine", "streetBarangay", "city", "province", "postalCode"].includes(field)) {
        const parts = [
          field === "addressLine" ? value : newData.addressLine,
          field === "streetBarangay" ? value : newData.streetBarangay,
          field === "city" ? value : newData.city,
          field === "province" ? value : newData.province,
          field === "postalCode" ? value : newData.postalCode,
        ].filter(Boolean)
        newData.address = parts.join(", ")
      }
      // Auto-combine emergency contact address fields
      if (["emergencyContactAddressLine", "emergencyContactStreetBarangay", "emergencyContactCity", "emergencyContactProvince", "emergencyContactPostalCode"].includes(field)) {
        const parts = [
          field === "emergencyContactAddressLine" ? value : newData.emergencyContactAddressLine,
          field === "emergencyContactStreetBarangay" ? value : newData.emergencyContactStreetBarangay,
          field === "emergencyContactCity" ? value : newData.emergencyContactCity,
          field === "emergencyContactProvince" ? value : newData.emergencyContactProvince,
          field === "emergencyContactPostalCode" ? value : newData.emergencyContactPostalCode,
        ].filter(Boolean)
        newData.emergencyContactAddress = parts.join(", ")
      }
      // Reset city when province changes
      if (field === "province") {
        const cities = CITIES_BY_PROVINCE[value] || []
        newData.city = cities[0] || ""
      }
      if (field === "emergencyContactProvince") {
        const cities = CITIES_BY_PROVINCE[value] || []
        newData.emergencyContactCity = cities[0] || ""
      }
      return newData
    })
  }

  // Memoize the birth-date handler to provide stable reference to DateDropdown
  const handleBirthDateChange = useCallback((isoDate: string) => {
    handleInputChange("birthDate", isoDate)
  }, [handleInputChange])

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
      if (!validateStep1()) {
        setShowErrors(true)
        return
      }
      setShowErrors(false)
      setCurrentStep(2)
      window.scrollTo(0, 0)
    } else if (currentStep === 2) {
      if (!validateStep2()) {
        setShowErrors(true)
        return
      }
      setShowErrors(false)
      setCurrentStep(3)
      window.scrollTo(0, 0)
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

      {/* Progress Indicator - Simplified */}
      <div className="mx-auto max-w-md px-6 py-4">
        <div className="flex justify-between px-1 gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                currentStep >= step ? "bg-emerald-500" : "bg-gray-200"
              )}
            />
          ))}
        </div>
      </div>

      <main className="px-4">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              variants={slideUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Personal Details Card */}
              <Card className="overflow-hidden border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] bg-white">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-500" />
                      Full Name
                    </Label>
                    <div className="relative group">
                      <Input
                        placeholder="Juan Dela Cruz"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange("fullName", e.target.value)}
                        className={cn(
                          "h-14 px-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300 font-medium",
                          showErrors && !formData.fullName && "border-red-200 bg-red-50"
                        )}
                      />
                      {formData.fullName && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-in zoom-in" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.2fr_0.8fr] gap-4">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-emerald-500" />
                        Birth Date
                      </Label>
                      <DateDropdown
                        value={formData.birthDate}
                        onChange={handleBirthDateChange}
                        hasError={showErrors && !formData.birthDate}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-gray-700">Age</Label>
                      <div className="flex h-14 items-center justify-center bg-gray-50 rounded-2xl border border-gray-100">
                        <span className="text-xl font-black text-gray-900">{formData.age}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-gray-700">Gender</Label>
                      <Select
                        value={formData.gender}
                        onValueChange={(value) => handleInputChange("gender", value)}
                      >
                        <SelectTrigger className={cn(
                          "h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-emerald-500/10 transition-all",
                          showErrors && !formData.gender && "border-red-200 bg-red-50"
                        )}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100">
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-gray-700">Civil Status</Label>
                      <Select
                        value={formData.civilStatus}
                        onValueChange={(value) => handleInputChange("civilStatus", value)}
                      >
                        <SelectTrigger className={cn(
                          "h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-emerald-500/10 transition-all",
                          showErrors && !formData.civilStatus && "border-red-200 bg-red-50"
                        )}>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100">
                          <SelectItem value="Single">Single</SelectItem>
                          <SelectItem value="Married">Married</SelectItem>
                          <SelectItem value="Widowed">Widowed</SelectItem>
                          <SelectItem value="Separated">Separated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Structured Address Fields */}
                  <div className="space-y-3">
                    <Label className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      Current Address
                    </Label>

                    {/* Address Line */}
                    <Input
                      placeholder="House/Lot/Block No., Street Name"
                      value={formData.addressLine}
                      onChange={(e) => handleInputChange("addressLine", e.target.value)}
                      className="h-12 px-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all"
                    />

                    {/* Street/Barangay */}
                    <Input
                      placeholder="Barangay"
                      value={formData.streetBarangay}
                      onChange={(e) => handleInputChange("streetBarangay", e.target.value)}
                      className="h-12 px-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all"
                    />

                    {/* City and Province Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        value={formData.city}
                        onValueChange={(value) => handleInputChange("city", value)}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-emerald-500/10 transition-all">
                          <SelectValue placeholder="City/Municipality" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100 max-h-[300px]">
                          {(CITIES_BY_PROVINCE[formData.province] || []).map((city) => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={formData.province}
                        onValueChange={(value) => handleInputChange("province", value)}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-emerald-500/10 transition-all">
                          <SelectValue placeholder="Province" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100">
                          {PROVINCES.map((prov) => (
                            <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Postal Code */}
                    <Input
                      placeholder="Postal Code"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      className="h-12 px-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all w-1/2"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Physical Details Card */}
              <Card className="overflow-hidden border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] bg-white">
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                        Height (cm)
                      </Label>
                      <Input
                        type="number"
                        placeholder="170"
                        value={formData.height}
                        onChange={(e) => handleInputChange("height", e.target.value)}
                        className="h-14 px-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
                        <Weight className="h-4 w-4 text-emerald-500" />
                        Weight (kg)
                      </Label>
                      <Input
                        type="number"
                        placeholder="65"
                        value={formData.weight}
                        onChange={(e) => handleInputChange("weight", e.target.value)}
                        className="h-14 px-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[13px] font-bold text-gray-700">Years in Barangay</Label>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Residency
                      </span>
                    </div>
                    <div className="flex items-center justify-between h-16 px-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                      <button
                        onClick={() => handleInputChange("yearsResident", Math.max(0, formData.yearsResident - 1))}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white text-gray-600 shadow-sm border border-gray-100 active:scale-95 transition-transform"
                      >
                        <Minus className="h-5 w-5" />
                      </button>
                      <span className="text-2xl font-black text-gray-900">{formData.yearsResident}</span>
                      <button
                        onClick={() => handleInputChange("yearsResident", Math.min(100, formData.yearsResident + 1))}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 active:scale-95 transition-transform"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Photo Upload Card */}
              <Card className="overflow-hidden border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] bg-white mb-6">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
                      <Camera className="h-4 w-4 text-emerald-500" />
                      ID Photo
                    </Label>
                    <div className="group relative">
                      <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                      <div className="absolute bottom-full right-0 mb-2 w-48 scale-0 rounded-xl bg-gray-900 p-3 text-[10px] text-white transition-all group-hover:scale-100 origin-bottom-right">
                        Center your face, look forward, and ensure good lighting.
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <input
                      type="file"
                      id="photo-upload"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    {formData.photoBase64 ? (
                      <div className="relative h-60 w-full overflow-hidden rounded-[20px] ring-2 ring-emerald-500 ring-offset-4 ring-offset-white group">
                        <Image
                          src={formData.photoBase64}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4">
                          <label
                            htmlFor="photo-upload"
                            className="h-12 w-12 flex items-center justify-center rounded-full bg-white text-gray-900 cursor-pointer hover:scale-110 transition-transform"
                          >
                            <Plus className="h-5 w-5" />
                          </label>
                          <button
                            onClick={() => setFormData(p => ({ ...p, photoBase64: "" }))}
                            className="h-12 w-12 flex items-center justify-center rounded-full bg-red-500 text-white cursor-pointer hover:scale-110 transition-transform"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="photo-upload"
                        className={cn(
                          "flex flex-col items-center justify-center h-60 w-full border-2 border-dashed border-gray-200 rounded-[20px] cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all duration-300 group",
                          showErrors && !formData.photoBase64 && "border-red-200 bg-red-50"
                        )}
                      >
                        <div className="h-16 w-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-emerald-100 group-hover:text-emerald-500 transition-colors">
                          <Camera className="h-8 w-8" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">Upload Resident Photo</span>
                        <span className="text-[11px] text-gray-500 mt-1">PNG, JPG up to 5MB</span>
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              variants={slideUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card className="overflow-hidden border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] bg-white">
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4 text-emerald-500" />
                      Contact Person
                    </Label>
                    <Input
                      placeholder="Full name of emergency contact"
                      value={formData.emergencyContactName}
                      onChange={(e) => handleInputChange("emergencyContactName", e.target.value)}
                      className={cn(
                        "h-14 px-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all",
                        showErrors && !formData.emergencyContactName && "border-red-200 bg-red-50"
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-500" />
                      Phone Number
                    </Label>
                    <Input
                      type="tel"
                      placeholder="+63 912 345 6789"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => handleInputChange("emergencyContactPhone", e.target.value)}
                      className={cn(
                        "h-14 px-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all font-medium",
                        showErrors && !formData.emergencyContactPhone && "border-red-200 bg-red-50"
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[13px] font-bold text-gray-700">Relationship</Label>
                    <Select
                      value={formData.emergencyContactRelationship}
                      onValueChange={(value) => handleInputChange("emergencyContactRelationship", value)}
                    >
                      <SelectTrigger className={cn(
                        "h-14 rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-emerald-500/10",
                        showErrors && !formData.emergencyContactRelationship && "border-red-200 bg-red-50"
                      )}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-gray-100">
                        <SelectItem value="Spouse">Spouse</SelectItem>
                        <SelectItem value="Parent">Parent</SelectItem>
                        <SelectItem value="Sibling">Sibling</SelectItem>
                        <SelectItem value="Child">Child</SelectItem>
                        <SelectItem value="Friend">Friend</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Structured Emergency Contact Address Fields */}
                  <div className="space-y-3">
                    <Label className="text-[13px] font-bold text-gray-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      Contact Address
                    </Label>

                    {/* Address Line */}
                    <Input
                      placeholder="House/Lot/Block No., Street Name"
                      value={formData.emergencyContactAddressLine}
                      onChange={(e) => handleInputChange("emergencyContactAddressLine", e.target.value)}
                      className="h-12 px-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all"
                    />

                    {/* Street/Barangay */}
                    <Input
                      placeholder="Barangay"
                      value={formData.emergencyContactStreetBarangay}
                      onChange={(e) => handleInputChange("emergencyContactStreetBarangay", e.target.value)}
                      className="h-12 px-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all"
                    />

                    {/* City and Province Row */}
                    <div className="grid grid-cols-2 gap-3">
                      <Select
                        value={formData.emergencyContactCity}
                        onValueChange={(value) => handleInputChange("emergencyContactCity", value)}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-emerald-500/10 transition-all">
                          <SelectValue placeholder="City/Municipality" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100 max-h-[300px]">
                          {(CITIES_BY_PROVINCE[formData.emergencyContactProvince] || []).map((city) => (
                            <SelectItem key={city} value={city}>{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={formData.emergencyContactProvince}
                        onValueChange={(value) => handleInputChange("emergencyContactProvince", value)}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-gray-100 bg-gray-50/50 focus:ring-emerald-500/10 transition-all">
                          <SelectValue placeholder="Province" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-gray-100">
                          {PROVINCES.map((prov) => (
                            <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Postal Code */}
                    <Input
                      placeholder="Postal Code"
                      value={formData.emergencyContactPostalCode}
                      onChange={(e) => handleInputChange("emergencyContactPostalCode", e.target.value)}
                      className="h-12 px-4 rounded-2xl border-gray-100 bg-gray-50/50 focus:bg-white transition-all w-1/2"
                    />
                  </div>
                </CardContent>
              </Card>
              
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3">
                <Info className="h-5 w-5 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  This person will be contacted in case of emergencies related to your health or safety.
                </p>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              variants={slideUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              {/* Summary Header */}
              <div className="px-1 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Application Review</h3>
                <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                  <Check className="h-4 w-4" />
                </div>
              </div>

              {/* Personal Info Summary */}
              <Card className="overflow-hidden border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] bg-white">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-center gap-5">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-gray-50 ring-2 ring-gray-100">
                      {formData.photoBase64 ? (
                        <Image src={formData.photoBase64} alt="Avatar" fill className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xl font-black text-gray-900">{formData.fullName}</p>
                      <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                        {formData.citizenship}
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:text-emerald-500 transition-colors"
                    >
                      <Plus className="h-5 w-5 rotate-45" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Birth Date</p>
                      <p className="text-sm font-bold text-gray-900">{formData.birthDate}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Age / Gender</p>
                      <p className="text-sm font-bold text-gray-900">{formData.age} yrs • {formData.gender}</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Residential Address</p>
                      <p className="text-sm font-bold text-gray-900 leading-relaxed">{formData.address}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stats</p>
                      <p className="text-sm font-bold text-gray-900">
                        {formData.height}cm / {formData.weight}kg
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Years Resident</p>
                      <p className="text-sm font-bold text-gray-900">{formData.yearsResident} years</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact Summary */}
              <Card className="overflow-hidden border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] bg-white">
                <CardContent className="p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Emergency Contact</h4>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="text-xs font-bold text-emerald-600"
                    >
                      Modify
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900">{formData.emergencyContactName}</p>
                        <p className="text-[11px] font-bold text-gray-500 uppercase">{formData.emergencyContactRelationship}</p>
                      </div>
                    </div>
                    <div className="pl-14">
                      <p className="text-sm font-bold text-gray-900">{formData.emergencyContactPhone}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formData.emergencyContactAddress}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Request Type Selection */}
              <div className="space-y-4 mb-8">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest px-1">Processing Priority</h3>
                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => handleInputChange("requestType", "regular")}
                    className={cn(
                      "group relative flex items-center justify-between p-6 rounded-[24px] border-2 transition-all duration-300 text-left",
                      formData.requestType === "regular"
                        ? "border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/10"
                        : "border-gray-100 bg-white hover:border-emerald-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                        formData.requestType === "regular" ? "bg-white text-emerald-600 shadow-sm" : "bg-gray-50 text-gray-400"
                      )}>
                        <Clock className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-gray-900">Standard</p>
                        <p className="text-xs font-bold text-gray-500 mt-0.5">Ready in 3 business days</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-gray-900">₱100</p>
                      <div className={cn(
                        "h-6 w-6 rounded-full border-2 border-emerald-500 mt-2 ml-auto flex items-center justify-center transition-all",
                        formData.requestType === "regular" ? "bg-emerald-500" : "bg-transparent border-gray-200"
                      )}>
                        {formData.requestType === "regular" && <Check className="h-3 w-3 text-white stroke-[4]" />}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleInputChange("requestType", "rush")}
                    className={cn(
                      "group relative flex items-center justify-between p-6 rounded-[24px] border-2 transition-all duration-300 text-left",
                      formData.requestType === "rush"
                        ? "border-amber-500 bg-amber-50 shadow-lg shadow-amber-500/10"
                        : "border-gray-100 bg-white hover:border-amber-200"
                    )}
                  >
                    {formData.requestType === "rush" && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full tracking-widest shadow-lg">
                        POPULAR CHOICE
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center transition-all duration-300",
                        formData.requestType === "rush" ? "bg-white text-amber-600 shadow-sm" : "bg-gray-50 text-gray-400"
                      )}>
                        <Zap className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-lg font-black text-gray-900">Express</p>
                        <p className="text-xs font-bold text-gray-500 mt-0.5">Ready in 24 hours</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-gray-900">₱200</p>
                      <div className={cn(
                        "h-6 w-6 rounded-full border-2 border-amber-500 mt-2 ml-auto flex items-center justify-center transition-all",
                        formData.requestType === "rush" ? "bg-amber-500" : "bg-transparent border-gray-200"
                      )}>
                        {formData.requestType === "rush" && <Check className="h-3 w-3 text-white stroke-[4]" />}
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Confidence Indicator */}
              <div className="p-6 rounded-[24px] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xl shadow-emerald-200 mb-8">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h4 className="font-black text-lg">Application ready!</h4>
                </div>
                <p className="text-emerald-50 text-xs leading-relaxed font-medium">
                  Your information looks complete and verified. You're ready to proceed with the QRT ID issuance.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#F3F4F6] p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-2xl flex gap-3">
          {currentStep === 1 ? (
            <Button
              onClick={handleNext}
              className="h-14 w-full rounded-2xl bg-[#10B981] text-lg font-bold hover:bg-[#059669] transition-colors"
            >
              Next: Emergency Contact
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : currentStep === 2 ? (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                className="h-14 w-[40%] rounded-2xl border-[#E5E7EB] text-lg font-bold text-[#4B5563]"
              >
                Back
              </Button>
              <Button
                onClick={handleNext}
                className="h-14 w-[60%] rounded-2xl bg-[#10B981] text-lg font-bold hover:bg-[#059669] transition-colors"
              >
                Next: Review
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                // Clear any stale certificate data
                setCertificateRequest(null)

                // Generate unique identifiers
                const year = new Date().getFullYear()
                const qrtSequence = (qrtIds.length + 1).toString().padStart(6, '0')
                const qrtCode = `QRT-${year}-${qrtSequence}`

                // Generate verification code using existing codes
                const existingVerificationCodes = qrtIds.map(q => q.verificationCode)
                const verificationCode = generateVerificationCode(existingVerificationCodes)

                // Generate payment reference
                const paymentReference = `PAY-${Date.now()}`

                // Save QRT request data to context before navigation
                const amount = formData.requestType === "rush" ? 200 : 100
                const now = new Date().toISOString()

                // Build QR code data JSON matching scanner format
                const qrCodeData = JSON.stringify({
                  qrtCode: qrtCode,
                  verificationCode: verificationCode,
                  fullName: formData.fullName || "Demo User",
                  birthDate: formData.birthDate || "1990-01-01",
                  issueDate: now.split('T')[0],
                  verifyUrl: `${window.location.origin}/verify/qrt/${qrtCode}`
                })

                const qrtRequestData = {
                  id: `temp_qrt_${Date.now()}`,
                  qrtCode: qrtCode,
                  verificationCode: verificationCode,
                  userId: user?.id || "demo_user",
                  fullName: formData.fullName || "Demo User",
                  birthDate: formData.birthDate || "1990-01-01",
                  age: formData.age || 30,
                  gender: formData.gender || "Male",
                  civilStatus: formData.civilStatus || "Single",
                  birthPlace: formData.birthPlace || "Mawaque, Mabalacat",
                  address: formData.address || "123 Demo Street, Barangay Mawaque",
                  height: formData.height || "170",
                  weight: formData.weight || "70",
                  yearsResident: formData.yearsResident || 5,
                  citizenship: formData.citizenship || "Filipino",
                  photoUrl: formData.photoBase64 || "",
                  emergencyContactName: formData.emergencyContactName || "Emergency Contact",
                  emergencyContactAddress: formData.emergencyContactAddress || "Same Address",
                  emergencyContactPhone: formData.emergencyContactPhone || "09123456789",
                  emergencyContactRelationship: formData.emergencyContactRelationship || "Parent",
                  precinctNumber: "P001", // Demo precinct for Mawaque
                  qrCodeData: qrCodeData,
                  paymentReference: paymentReference,
                  paymentTransactionId: "",
                  requestType: formData.requestType,
                  amount,
                  status: "pending" as const,
                  createdAt: now,
                }
                setCurrentRequestImmediate(qrtRequestData)
                router.push("/payment?type=qrt")
              }}
              className="h-14 w-full rounded-2xl bg-[#10B981] text-lg font-bold hover:bg-[#059669] transition-colors"
            >
              Proceed to Payment • ₱{formData.requestType === "rush" ? "200" : "100"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
