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
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { IDScanner } from "@/components/id-scanner"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    mobileNumber: "",
    email: "",
    address: "",
    birthDate: "",
    idType: "",
    idNumber: "",
    password: "",
    confirmPassword: "",
    pin: "",
    confirmPin: "",
    agreedToTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wasScanned, setWasScanned] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // For PIN fields, only allow digits and max 4 characters
    if ((name === "pin" || name === "confirmPin") && value.length > 4) return
    if ((name === "pin" || name === "confirmPin") && !/^\d*$/.test(value)) return

    setFormData({ ...formData, [name]: value })
    if (error) setError(null)
  }

  const handleIDDataExtracted = (data: {
    fullName: string
    birthDate: string
    address: string
    mobileNumber: string
    age: string
    idType?: string
    idNumber?: string
  }) => {
    setFormData((prev) => ({
      ...prev,
      fullName: data.fullName || prev.fullName,
      birthDate: data.birthDate || prev.birthDate,
      address: data.address || prev.address,
      mobileNumber: data.mobileNumber || prev.mobileNumber,
      idType: data.idType || prev.idType,
      idNumber: data.idNumber || prev.idNumber,
    }))
    setWasScanned(true)

    setTimeout(() => {
      document.getElementById("registration-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 300)
  }

  const hashString = async (str: string, salt: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(str + salt)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  const generateQRCode = (): string => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 10)
    return `BRGY-${timestamp}-${random}`.toUpperCase()
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.fullName || !formData.mobileNumber || !formData.address) {
      setError("Please fill in all required fields (Name, Mobile, Address).")
      return
    }

    if (!formData.idType || !formData.idNumber) {
      setError("Please scan your ID or enter ID type and number manually.")
      return
    }

    // Mobile number validation
    const cleanMobile = formData.mobileNumber.replace(/\s/g, "")
    if (!/^(\+63|0)9\d{9}$/.test(cleanMobile)) {
      setError("Please enter a valid Philippine mobile number.")
      return
    }

    // Password validation
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

    // PIN validation
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
      const passwordHash = await hashString(formData.password, "barangay_salt_2024")
      const pinHash = await hashString(formData.pin, "barangay_pin_salt_2024")
      const qrCode = generateQRCode()

      const supabase = createClient()

      // Check if mobile number already exists
      const { data: existing } = await supabase.from("residents").select("id").eq("mobile_number", cleanMobile).single()

      if (existing) {
        setError("This mobile number is already registered. Please login instead.")
        setIsLoading(false)
        return
      }

      const { data, error: insertError } = await supabase
        .from("residents")
        .insert({
          full_name: formData.fullName,
          mobile_number: cleanMobile,
          email: formData.email || null,
          address: formData.address,
          birth_date: formData.birthDate || null,
          id_type: formData.idType,
          id_number: formData.idNumber,
          password_hash: passwordHash,
          pin_hash: pinHash,
          qr_code: qrCode,
        })
        .select()
        .single()

      if (insertError) {
        console.error("Registration error:", insertError)
        if (insertError.message.includes("duplicate")) {
          setError("This mobile number or ID is already registered.")
        } else {
          setError("Registration failed. Please try again.")
        }
        setIsLoading(false)
        return
      }

      // Login the user
      login({
        id: data.id,
        mobileNumber: cleanMobile,
        fullName: formData.fullName,
        email: formData.email,
        address: formData.address,
      })

      router.push("/register/success")
    } catch (err: any) {
      console.error("Registration error:", err)
      setError("An error occurred during registration. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

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

        {wasScanned && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-center text-sm font-medium text-emerald-700">
              ID scanned successfully! Review and complete the details below.
            </p>
          </div>
        )}

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <form id="registration-form" onSubmit={handleRegister} className="space-y-4">
              {error && <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{error}</div>}

              {/* Personal Information Section */}
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-700">Personal Information</h3>
                <p className="text-xs text-gray-500">From your scanned ID</p>
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
                  className={`h-11 ${wasScanned && formData.fullName ? "border-emerald-300 bg-emerald-50/50" : ""}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="idType" className="text-sm font-medium">
                    ID Type <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="idType"
                    name="idType"
                    value={formData.idType}
                    onChange={handleChange}
                    placeholder="National ID"
                    disabled={isLoading}
                    className={`h-11 ${wasScanned && formData.idType ? "border-emerald-300 bg-emerald-50/50" : ""}`}
                  />
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
                    className={`h-11 ${wasScanned && formData.idNumber ? "border-emerald-300 bg-emerald-50/50" : ""}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate" className="text-sm font-medium">
                  Birth Date
                </Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={handleChange}
                  disabled={isLoading}
                  className={`h-11 ${wasScanned && formData.birthDate ? "border-emerald-300 bg-emerald-50/50" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Purok 1, Barangay Mawaque"
                  disabled={isLoading}
                  className={`h-11 ${wasScanned && formData.address ? "border-emerald-300 bg-emerald-50/50" : ""}`}
                />
              </div>

              {/* Contact Information Section */}
              <div className="space-y-1 pt-2">
                <h3 className="text-sm font-semibold text-gray-700">Contact Information</h3>
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
                  placeholder="+63 912 345 6789"
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email (optional)
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              {/* Security Section */}
              <div className="space-y-1 pt-2">
                <h3 className="text-sm font-semibold text-gray-700">Security</h3>
                <p className="text-xs text-gray-500">Create your password and PIN for login</p>
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
                    placeholder="Min 8 chars, 1 number"
                    disabled={isLoading}
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pin" className="text-sm font-medium">
                    4-Digit PIN <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="pin"
                      name="pin"
                      type={showPin ? "text" : "password"}
                      value={formData.pin}
                      onChange={handleChange}
                      placeholder="••••"
                      maxLength={4}
                      disabled={isLoading}
                      className="h-11 text-center tracking-widest"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPin" className="text-sm font-medium">
                    Confirm PIN <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="confirmPin"
                    name="confirmPin"
                    type="password"
                    value={formData.confirmPin}
                    onChange={handleChange}
                    placeholder="••••"
                    maxLength={4}
                    disabled={isLoading}
                    className="h-11 text-center tracking-widest"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, agreedToTerms: checked === true })}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <Label htmlFor="agreedToTerms" className="text-sm leading-tight text-gray-600">
                  I agree to the Privacy Policy and Terms of Service
                </Label>
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-emerald-500 text-sm font-semibold hover:bg-emerald-600"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Register"}
              </Button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-emerald-600 hover:underline">
                  Sign In
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
