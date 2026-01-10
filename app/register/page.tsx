"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Eye, EyeOff, AlertCircle, Camera } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useQRT } from "@/lib/qrt-context"
import { IDScanner } from "@/components/id-scanner"
import { AddressCombobox } from "@/components/address-combobox"
import { SelfieCapture } from "@/components/selfie-capture"
import { fuzzyMatchAddresses } from "@/lib/address-matcher"

const ID_TYPES = [
  { value: "philippine_national_id", label: "Philippine National ID (PhilSys)" },
  { value: "drivers_license", label: "Driver's License" },
  { value: "umid", label: "UMID" },
  { value: "sss_id", label: "SSS ID" },
  { value: "philhealth_id", label: "PhilHealth ID" },
  { value: "postal_id", label: "Postal ID" },
  { value: "voters_id", label: "Voter's ID" },
  { value: "passport", label: "Philippine Passport" },
  { value: "prc_id", label: "PRC ID" },
  { value: "barangay_id", label: "Barangay ID" },
  { value: "senior_citizen_id", label: "Senior Citizen ID" },
  { value: "pwd_id", label: "PWD ID" },
  { value: "other", label: "Other Government ID" },
]

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    houseLotNo: "",
    street: "",
    purok: "",
    barangay: "",
    cityMunicipality: "",
    province: "",
    zipCode: "",
    birthDate: "",
    idType: "",
    idNumber: "",
    password: "",
    confirmPassword: "",
    pin: "",
    confirmPin: "",
    agreedToTerms: false,
  })

  const [provinceCode, setProvinceCode] = useState("")
  const [cityCode, setCityCode] = useState("")

  const [scannedFields, setScannedFields] = useState({
    fullName: false,
    birthDate: false,
    idType: false,
    idNumber: false,
    province: false,
    cityMunicipality: false,
    barangay: false,
    zipCode: false,
    houseLotNo: false,
    street: false,
    purok: false,
  })

  const [idImageBase64, setIdImageBase64] = useState<string | null>(null)
  const [selfieImageBase64, setSelfieImageBase64] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const router = useRouter()
  const { login } = useAuth()
  const { addQRTRequest } = useQRT()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if ((name === "pin" || name === "confirmPin") && value.length > 4) return
    if ((name === "pin" || name === "confirmPin") && !/^\d*$/.test(value)) return

    setFormData({ ...formData, [name]: value })
    if (error) setError(null)
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value })
    if (error) setError(null)
  }

  const handleIDDataExtracted = async (data: {
    fullName: string
    birthDate: string
    address: string
    mobileNumber: string
    age: string
    idType?: string
    idNumber?: string
    imageBase64?: string
    houseLotNo?: string
    street?: string
    purok?: string
    barangay?: string
    cityMunicipality?: string
    province?: string
    zipCode?: string
    candidates?: {
      barangay: Array<{ value: string; confidence: 'high' | 'medium' | 'low' }>
      city: Array<{ value: string; confidence: 'high' | 'medium' | 'low' }>
      province: Array<{ value: string; confidence: 'high' | 'medium' | 'low' }>
    }
  }) => {
    let mappedIdType = ""
    if (data.idType) {
      const idTypeLower = data.idType.toLowerCase()
      if (idTypeLower.includes("national") || idTypeLower.includes("philsys")) {
        mappedIdType = "philippine_national_id"
      } else if (idTypeLower.includes("driver")) {
        mappedIdType = "drivers_license"
      } else if (idTypeLower.includes("umid")) {
        mappedIdType = "umid"
      } else if (idTypeLower.includes("sss")) {
        mappedIdType = "sss_id"
      } else if (idTypeLower.includes("philhealth")) {
        mappedIdType = "philhealth_id"
      } else if (idTypeLower.includes("postal")) {
        mappedIdType = "postal_id"
      } else if (idTypeLower.includes("voter")) {
        mappedIdType = "voters_id"
      } else if (idTypeLower.includes("passport")) {
        mappedIdType = "passport"
      } else if (idTypeLower.includes("prc")) {
        mappedIdType = "prc_id"
      } else if (idTypeLower.includes("barangay")) {
        mappedIdType = "barangay_id"
      } else if (idTypeLower.includes("senior")) {
        mappedIdType = "senior_citizen_id"
      } else if (idTypeLower.includes("pwd")) {
        mappedIdType = "pwd_id"
      }
    }

    // Convert birthDate to YYYY-MM-DD format for type="date" input
    let formattedBirthDate = data.birthDate || ""
    if (formattedBirthDate && !formattedBirthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Try to parse and convert to YYYY-MM-DD
      const date = new Date(formattedBirthDate)
      if (!isNaN(date.getTime())) {
        formattedBirthDate = date.toISOString().split('T')[0]
      }
    }

    // Perform enhanced fuzzy matching with server-extracted candidates
    const addressMatches = await fuzzyMatchAddresses({
      rawAddress: data.address,
      candidates: data.candidates, // Server hints with confidence levels
    })

    // Use matched names and codes, fallback to original OCR text
    const finalProvince = addressMatches.province?.name || data.province || ""
    const finalCity = addressMatches.city?.name || data.cityMunicipality || ""
    const finalBarangay = addressMatches.barangay?.name || data.barangay || ""
    // ZIP fallback chain: city lookup -> OCR extracted -> raw text extraction -> empty
    const finalZipCode = addressMatches.city?.zip_code || data.zipCode || addressMatches.extractedZipCode || ""

    setFormData((prev) => ({
      ...prev,
      fullName: data.fullName || prev.fullName,
      birthDate: formattedBirthDate || prev.birthDate,
      mobileNumber: data.mobileNumber || prev.mobileNumber,
      idType: mappedIdType || prev.idType,
      idNumber: data.idNumber || prev.idNumber,
      houseLotNo: data.houseLotNo || prev.houseLotNo,
      street: data.street || prev.street,
      purok: data.purok || prev.purok,
      barangay: finalBarangay,
      cityMunicipality: finalCity,
      province: finalProvince,
      zipCode: finalZipCode,
    }))

    // Store matched codes for cascading
    if (addressMatches.province?.code) {
      setProvinceCode(addressMatches.province.code)
    }
    if (addressMatches.city?.code) {
      setCityCode(addressMatches.city.code)
    }

    setScannedFields({
      fullName: !!data.fullName,
      birthDate: !!data.birthDate,
      idType: !!mappedIdType,
      idNumber: !!data.idNumber,
      province: !!finalProvince,
      cityMunicipality: !!finalCity,
      barangay: !!finalBarangay,
      zipCode: !!finalZipCode,
      houseLotNo: !!data.houseLotNo,
      street: !!data.street,
      purok: !!data.purok,
    })

    if (data.imageBase64) {
      setIdImageBase64(data.imageBase64)
    }

    setTimeout(() => {
      document.getElementById("registration-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 300)
  }

  const handleProvinceChange = (value: string, code?: string) => {
    setFormData((prev) => ({
      ...prev,
      province: value,
      cityMunicipality: "",
      barangay: "",
      zipCode: "",
    }))
    setProvinceCode(code || "")
    setCityCode("")
    setScannedFields((prev) => ({ ...prev, province: false }))
  }

  const handleCityChange = (value: string, code?: string, zipCode?: string) => {
    setFormData((prev) => ({
      ...prev,
      cityMunicipality: value,
      barangay: "",
      zipCode: zipCode || prev.zipCode,
    }))
    setCityCode(code || "")
    setScannedFields((prev) => ({ ...prev, cityMunicipality: false, zipCode: !!zipCode }))
  }

  const handleBarangayChange = (value: string) => {
    setFormData((prev) => ({ ...prev, barangay: value }))
    setScannedFields((prev) => ({ ...prev, barangay: false }))
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.fullName || !formData.mobileNumber || !formData.barangay || !formData.cityMunicipality) {
      setError("Please fill in all required fields (Name, Mobile, Barangay, City/Municipality).")
      return
    }

    if (!formData.idType || !formData.idNumber) {
      setError("Please scan your ID or select ID type and enter ID number manually.")
      return
    }

    const cleanMobile = formData.mobileNumber.replace(/\s/g, "")
    if (!/^(\+63|0)9\d{9}$/.test(cleanMobile)) {
      setError("Please enter a valid Philippine mobile number.")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (!/\d/.test(formData.password)) {
      setError("Password must contain at least 1 number.")
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (!/^\d{4}$/.test(formData.pin)) {
      setError("PIN must be exactly 4 digits.")
      return
    }
    if (formData.pin !== formData.confirmPin) {
      setError("PINs do not match.")
      return
    }

    if (!formData.agreedToTerms) {
      setError("You must agree to the Privacy Policy to proceed.")
      return
    }

    setIsLoading(true)

    try {
      const fullAddress = [
        formData.houseLotNo,
        formData.street,
        formData.purok ? `Purok ${formData.purok}` : "",
        formData.barangay ? `Barangay ${formData.barangay}` : "",
        formData.cityMunicipality,
        formData.province,
        formData.zipCode,
      ]
        .filter(Boolean)
        .join(", ")

      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          mobileNumber: cleanMobile,
          email: formData.email || null,
          address: fullAddress,
          houseLotNo: formData.houseLotNo || null,
          street: formData.street || null,
          purok: formData.purok || null,
          barangay: formData.barangay || null,
          cityMunicipality: formData.cityMunicipality || null,
          province: formData.province || null,
          zipCode: formData.zipCode || null,
          birthDate: formData.birthDate || null,
          idType: formData.idType,
          idNumber: formData.idNumber,
          password: formData.password,
          pin: formData.pin,
          idImageBase64: idImageBase64,
          selfieImageBase64: selfieImageBase64,
          agreedToTerms: formData.agreedToTerms,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        if (result.error === "duplicate_mobile") {
          setError("This mobile number is already registered. Please login instead.")
        } else if (result.error === "duplicate_id") {
          setError("An account with this ID already exists. Try logging in or reset your password.")
        } else if (result.error === "privacy_not_accepted") {
          setError("Please check the Privacy Policy checkbox to continue with registration.")
        } else {
          setError(result.message || result.error || "Registration failed. Please try again.")
        }
        setIsLoading(false)
        return
      }

      login({
        id: result.user.id,
        mobileNumber: result.user.mobileNumber,
        fullName: result.user.fullName,
        email: result.user.email,
        address: result.user.address,
      })

      // Save QRT ID to context if it was created during registration
      if (result.qrtId) {
        try {
          // Convert the API response format to the QRTIDRequest format expected by context
          const qrtRequest = {
            id: result.qrtId.id,
            qrtCode: result.qrtId.qrtCode,
            verificationCode: result.qrtId.verificationCode,
            userId: result.user.id,
            fullName: result.qrtId.fullName,
            phoneNumber: result.qrtId.phoneNumber || result.user.mobileNumber,
            birthDate: result.qrtId.birthDate,
            age: result.qrtId.age || 0,
            gender: result.qrtId.gender || 'prefer_not_to_say',
            civilStatus: result.qrtId.civilStatus || 'single',
            birthPlace: result.qrtId.birthPlace || result.qrtId.address,
            address: result.qrtId.address,
            height: result.qrtId.height || '',
            weight: result.qrtId.weight || '',
            yearsResident: result.qrtId.yearsResident || 0,
            citizenship: result.qrtId.citizenship || 'Filipino',
            emergencyContactName: result.qrtId.emergencyContactName || '',
            emergencyContactAddress: result.qrtId.emergencyContactAddress || '',
            emergencyContactPhone: result.qrtId.emergencyContactPhone || '',
            emergencyContactRelationship: result.qrtId.emergencyContactRelationship || '',
            photoUrl: result.qrtId.photoUrl || '',
            qrCodeData: result.qrtId.qrCodeData || '',
            status: result.qrtId.status as "pending" | "processing" | "ready" | "issued",
            createdAt: result.qrtId.createdAt,
            paymentReference: result.qrtId.paymentReference || '',
            requestType: (result.qrtId.requestType || 'regular') as "regular" | "rush",
            amount: result.qrtId.amount || 0,
          }

          await addQRTRequest(qrtRequest)
        } catch (qrtError) {
          console.error('Failed to save QRT ID to context:', qrtError)
          // Don't block registration success if QRT save fails
        }
      }

      router.push("/register/success")
    } catch (err: any) {
      console.error("Registration error:", err)
      setError("Connection error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const calculateAge = () => {
    if (!formData.birthDate) return null
    const birth = new Date(formData.birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const age = calculateAge()

  const inputBaseClass = "h-12 w-full text-base"
  const inputScannedClass = "border-emerald-300 bg-emerald-50/50"
  const hasAnyScannedField = Object.values(scannedFields).some(Boolean)

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 to-white">
      <header className="sticky top-0 z-10 flex h-14 items-center border-b border-slate-100 bg-white/80 px-4 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </header>

      <main className="flex-1 px-4 py-6">
        <IDScanner onDataExtracted={handleIDDataExtracted} disabled={isLoading} />

        {hasAnyScannedField && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-center text-sm font-medium text-emerald-700">
              ID scanned successfully! Now take your selfie, then complete the form below.
            </p>
          </div>
        )}

        {/* Selfie Section - Moved here for better UX (ID photo → selfie → form) */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-5">
            <div className="space-y-5">
              <div className="border-b-2 border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                    <Camera className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Photo for QRT ID</h3>
                </div>
                <p className="mt-2 text-sm text-gray-500">This photo will appear on your barangay ID card</p>
              </div>

              {selfieImageBase64 ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-32 h-40 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md">
                    <img
                      src={selfieImageBase64}
                      alt="Your selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-emerald-600 font-medium">Photo captured successfully!</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelfieImageBase64(null)}
                    className="text-sm"
                  >
                    Retake Photo
                  </Button>
                </div>
              ) : (
                <SelfieCapture
                  onCapture={(imageBase64) => setSelfieImageBase64(imageBase64)}
                  onCancel={() => {}}
                  className="py-2"
                />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <form id="registration-form" onSubmit={handleRegister} className="space-y-8">
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    {error}
                    {(error.includes("login") || error.includes("reset")) && (
                      <div className="mt-2 flex gap-2">
                        <Link href="/login" className="text-red-700 underline">
                          Go to Login
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Personal Information Section */}
              <section className="space-y-5">
                <div className="border-b-2 border-gray-200 pb-3">
                  <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                  <p className="mt-1 text-sm text-gray-500">From your scanned ID</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Juan Dela Cruz"
                    disabled={isLoading}
                    className={`${inputBaseClass} ${scannedFields.fullName ? inputScannedClass : ""}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="idType" className="text-sm font-medium">
                      ID Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.idType}
                      onValueChange={(value) => handleSelectChange("idType", value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className={`!h-12 ${inputBaseClass} text-gray-900 ${scannedFields.idType ? inputScannedClass : ""}`}>
                        <SelectValue placeholder="Select ID" />
                      </SelectTrigger>
                      <SelectContent>
                        {ID_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idNumber" className="text-sm font-medium">
                      ID Number <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="idNumber"
                      name="idNumber"
                      value={formData.idNumber}
                      onChange={handleChange}
                      placeholder="1234-5678-9012"
                      disabled={isLoading}
                      className={`${inputBaseClass} ${scannedFields.idNumber ? inputScannedClass : ""}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-sm font-medium">
                    Birth Date {age !== null && <span className="text-gray-500">({age} years old)</span>}
                  </Label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleChange}
                    disabled={isLoading}
                    className={`${inputBaseClass} text-gray-900 ${scannedFields.birthDate ? inputScannedClass : ""}`}
                  />
                </div>
              </section>

              {/* Address Section - CHANGED to use AddressCombobox */}
              <section className="space-y-5">
                <div className="border-b-2 border-gray-200 pb-3">
                  <h3 className="text-xl font-bold text-gray-900">Address</h3>
                  <p className="mt-1 text-sm text-gray-500">Complete address for beneficiary ID</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="houseLotNo" className="text-sm font-medium">
                      House/Lot No.
                    </Label>
                    <Input
                      id="houseLotNo"
                      name="houseLotNo"
                      value={formData.houseLotNo}
                      onChange={handleChange}
                      placeholder="123"
                      disabled={isLoading}
                      className={`${inputBaseClass} ${scannedFields.houseLotNo ? inputScannedClass : ""}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street" className="text-sm font-medium">
                      Street
                    </Label>
                    <Input
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="Rizal Street"
                      disabled={isLoading}
                      className={`${inputBaseClass} ${scannedFields.street ? inputScannedClass : ""}`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purok" className="text-sm font-medium">
                    Purok
                  </Label>
                  <Input
                    id="purok"
                    name="purok"
                    value={formData.purok}
                    onChange={handleChange}
                    placeholder="1"
                    disabled={isLoading}
                    className={`${inputBaseClass} ${scannedFields.purok ? inputScannedClass : ""}`}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Province</Label>
                  <AddressCombobox
                    type="province"
                    value={formData.province}
                    onValueChange={handleProvinceChange}
                    placeholder="Select or search province"
                    wasScanned={scannedFields.province}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    City/Municipality <span className="text-red-500">*</span>
                  </Label>
                  <AddressCombobox
                    type="city"
                    value={formData.cityMunicipality}
                    onValueChange={handleCityChange}
                    placeholder="Select or search city"
                    parentCode={provinceCode}
                    wasScanned={scannedFields.cityMunicipality}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Barangay <span className="text-red-500">*</span>
                  </Label>
                  <AddressCombobox
                    type="barangay"
                    value={formData.barangay}
                    onValueChange={handleBarangayChange}
                    placeholder={cityCode ? "Select or search barangay" : "Select city first"}
                    parentCode={cityCode}
                    wasScanned={scannedFields.barangay}
                    disabled={isLoading || !cityCode}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-sm font-medium">
                    ZIP Code
                  </Label>
                  <Input
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="2010"
                    disabled={isLoading}
                    className={`${inputBaseClass} ${scannedFields.zipCode ? inputScannedClass : ""} ${formData.cityMunicipality && !formData.zipCode ? "border-amber-300" : ""}`}
                  />
                  {scannedFields.zipCode && <p className="text-xs text-emerald-600">Auto-filled from selected city</p>}
                  {formData.cityMunicipality && !formData.zipCode && !scannedFields.zipCode && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      ZIP not found - please enter manually
                    </p>
                  )}
                </div>
              </section>

              {/* Contact Information Section */}
              <section className="space-y-5">
                <div className="border-b-2 border-gray-200 pb-3">
                  <h3 className="text-xl font-bold text-gray-900">Contact Information</h3>
                  <p className="mt-1 text-sm text-gray-500">How we can reach you</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobileNumber" className="text-sm font-medium">
                    Mobile Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="mobileNumber"
                    name="mobileNumber"
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder="09XX XXX XXXX"
                    disabled={isLoading}
                    className={inputBaseClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="juan@example.com"
                    disabled={isLoading}
                    className={inputBaseClass}
                  />
                </div>
              </section>

              {/* Security Section */}
              <section className="space-y-5">
                <div className="border-b-2 border-gray-200 pb-3">
                  <h3 className="text-xl font-bold text-gray-900">Security</h3>
                  <p className="mt-1 text-sm text-gray-500">Create your login credentials</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 8 characters, 1 number"
                      disabled={isLoading}
                      className={`${inputBaseClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    disabled={isLoading}
                    className={inputBaseClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pin" className="text-sm font-medium">
                      4-Digit PIN <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="pin"
                        name="pin"
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={4}
                        value={formData.pin}
                        onChange={handleChange}
                        placeholder="••••"
                        disabled={isLoading}
                        className={`${inputBaseClass} pr-10`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPin" className="text-sm font-medium">
                      Confirm PIN <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="confirmPin"
                      name="confirmPin"
                      type={showPin ? "text" : "password"}
                      inputMode="numeric"
                      maxLength={4}
                      value={formData.confirmPin}
                      onChange={handleChange}
                      placeholder="••••"
                      disabled={isLoading}
                      className={inputBaseClass}
                    />
                  </div>
                </div>
              </section>

              {/* Terms and Submit */}
              <section className="space-y-5">
                <div className={`rounded-xl border p-4 transition-all ${formData.agreedToTerms ? 'border-emerald-200 bg-emerald-50/50' : 'border-gray-200 bg-gray-50/50'}`}>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="agreedToTerms"
                      checked={formData.agreedToTerms}
                      onCheckedChange={(checked) => setFormData({ ...formData, agreedToTerms: checked as boolean })}
                      disabled={isLoading}
                      className="mt-1 flex-shrink-0 h-5 w-5"
                    />
                    <div className="flex-1">
                      <Label htmlFor="agreedToTerms" className="text-sm leading-relaxed text-gray-700 cursor-pointer block">
                        I agree to the{" "}
                        <Link
                          href="/privacy"
                          className="font-semibold text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Privacy Policy
                        </Link>{" "}
                        and consent to the collection of my personal data.
                      </Label>
                      <p className="text-xs text-gray-500 mt-1.5">
                        Your data is protected and used only for barangay services.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !formData.agreedToTerms}
                  className="h-12 w-full bg-emerald-600 text-base font-semibold hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-emerald-600 hover:underline">
                    Sign In
                  </Link>
                </p>
              </section>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
