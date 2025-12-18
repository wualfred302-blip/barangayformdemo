"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { IDScanner } from "@/components/id-scanner"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    mobileNumber: "",
    address: "",
    agreedToTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [wasScanned, setWasScanned] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleIDDataExtracted = (data: {
    fullName: string
    birthDate: string
    address: string
    mobileNumber: string
    age: string
  }) => {
    setFormData((prev) => ({
      ...prev,
      fullName: data.fullName || prev.fullName,
      mobileNumber: data.mobileNumber || prev.mobileNumber,
      address: data.address || prev.address,
    }))
    setWasScanned(true)

    setTimeout(() => {
      document.getElementById("registration-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 300)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    setTimeout(() => {
      login({
        userId: `user_${Date.now()}`,
        mobileNumber: formData.mobileNumber || "+63 912 345 6789",
        fullName: formData.fullName || "Demo User",
        email: formData.email || "demo@example.com",
        address: formData.address || "Barangay Mawaque, Mabalacat, Pampanga",
      })
      router.push("/register/success")
    }, 2000)
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
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative mb-3 h-20 w-20">
            <Image src="/images/mawaque-logo.png" alt="Barangay Mawaque Seal" fill className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Register</h1>
          <p className="mt-1 text-sm text-gray-500">Create your account</p>
        </div>

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
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name (as appears on ID)
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

              <div className="space-y-2">
                <Label htmlFor="mobileNumber" className="text-sm font-medium">
                  Mobile Number
                </Label>
                <Input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="+63 912 345 6789"
                  disabled={isLoading}
                  className={`h-11 ${wasScanned && formData.mobileNumber ? "border-emerald-300 bg-emerald-50/50" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Complete Address in Barangay Mawaque
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

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="text"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
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

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, agreedToTerms: checked === true })}
                  disabled={isLoading}
                  className="mt-0.5"
                />
                <Label htmlFor="agreedToTerms" className="text-sm leading-tight text-gray-600">
                  I certify that I am a resident of Barangay Mawaque, Mabalacat, Pampanga
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
