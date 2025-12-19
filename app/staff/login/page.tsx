"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { ArrowLeft, Shield, Loader2 } from "lucide-react"

// Demo staff accounts
const DEMO_STAFF = [
  { id: "1", fullName: 'DOMINGO "Lhoy" Gomez', email: "captain@mawaque.gov.ph", role: "captain" as const },
  { id: "2", fullName: "Barangay Secretary", email: "secretary@mawaque.gov.ph", role: "secretary" as const },
  { id: "3", fullName: "Barangay Treasurer", email: "treasurer@mawaque.gov.ph", role: "treasurer" as const },
]

export default function StaffLoginPage() {
  const router = useRouter()
  const { staffLogin } = useAuth()
  const [email, setEmail] = useState("")
  const [pin, setPin] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simulate loading
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Demo mode: accept any PIN for demo accounts
    const staff = DEMO_STAFF.find((s) => s.email.toLowerCase() === email.toLowerCase())

    if (staff) {
      staffLogin(staff)
      // Route based on role
      router.push(`/staff/${staff.role}`)
    } else {
      setError("Invalid credentials. Use a demo account.")
    }

    setIsLoading(false)
  }

  const handleQuickLogin = (staff: (typeof DEMO_STAFF)[0]) => {
    setEmail(staff.email)
    setPin("123456")
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="flex h-14 items-center px-4">
        <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Back</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative mb-4 h-16 w-16">
            <Image src="/images/mawaque-logo.png" alt="Barangay Mawaque Seal" fill className="object-contain" />
          </div>
          <div className="flex items-center gap-2 text-emerald-600">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Staff Portal</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Barangay Mawaque</h1>
          <p className="mt-1 text-sm text-slate-500">Official Staff Login</p>
        </div>

        {/* Login Form - Changed from dark transparent card to white card with shadow */}
        <Card className="w-full max-w-sm border-0 bg-white shadow-lg">
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="staff@mawaque.gov.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pin" className="text-sm font-medium text-slate-700">
                  PIN Code
                </Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Enter 6-digit PIN"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                />
              </div>

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

              <Button
                type="submit"
                disabled={isLoading || !email}
                className="h-12 w-full bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Demo Accounts - Updated to light theme colors */}
            <div className="mt-6 border-t border-slate-100 pt-6">
              <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-slate-400">
                Demo Accounts
              </p>
              <div className="space-y-2">
                {DEMO_STAFF.map((staff) => (
                  <button
                    key={staff.id}
                    type="button"
                    onClick={() => handleQuickLogin(staff)}
                    className="flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-3 text-left transition-colors hover:bg-slate-100"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{staff.fullName}</p>
                      <p className="text-xs text-slate-500">{staff.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
