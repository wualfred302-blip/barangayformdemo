"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Eye, EyeOff, Smartphone, Lock, Hash } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [mobileNumber, setMobileNumber] = useState("")
  const [password, setPassword] = useState("")
  const [pin, setPin] = useState("")
  const [loginMethod, setLoginMethod] = useState<"password" | "pin">("password")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const hashString = async (str: string, salt: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(str + salt)
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate mobile number
    const cleanMobile = mobileNumber.replace(/\s/g, "")
    if (!/^(\+63|0)9\d{9}$/.test(cleanMobile)) {
      setError("Please enter a valid Philippine mobile number.")
      return
    }

    if (loginMethod === "password" && !password) {
      setError("Please enter your password.")
      return
    }

    if (loginMethod === "pin" && !/^\d{4}$/.test(pin)) {
      setError("Please enter your 4-digit PIN.")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { data: user, error: fetchError } = await supabase
        .from("residents")
        .select("*")
        .eq("mobile_number", cleanMobile)
        .single()

      if (fetchError || !user) {
        setError("Mobile number not found. Please register first.")
        setIsLoading(false)
        return
      }

      // Check if account is locked
      if (user.lockout_until && new Date(user.lockout_until) > new Date()) {
        const minutesLeft = Math.ceil((new Date(user.lockout_until).getTime() - Date.now()) / 60000)
        setError(`Account is locked. Please try again in ${minutesLeft} minutes.`)
        setIsLoading(false)
        return
      }

      // Verify credentials
      let isValid = false
      if (loginMethod === "password") {
        const passwordHash = await hashString(password, "barangay_salt_2024")
        isValid = passwordHash === user.password_hash
      } else {
        const pinHash = await hashString(pin, "barangay_pin_salt_2024")
        isValid = pinHash === user.pin_hash
      }

      if (!isValid) {
        // Increment failed attempts
        const newAttempts = (user.failed_login_attempts || 0) + 1
        const updates: any = { failed_login_attempts: newAttempts }

        // Lock account after 5 failed attempts
        if (newAttempts >= 5) {
          updates.lockout_until = new Date(Date.now() + 15 * 60 * 1000).toISOString()
          updates.failed_login_attempts = 0
        }

        await supabase.from("residents").update(updates).eq("id", user.id)

        if (newAttempts >= 5) {
          setError("Too many failed attempts. Account locked for 15 minutes.")
        } else {
          setError(`Invalid ${loginMethod}. ${5 - newAttempts} attempts remaining.`)
        }
        setIsLoading(false)
        return
      }

      // Reset failed attempts on successful login
      await supabase.from("residents").update({ failed_login_attempts: 0, lockout_until: null }).eq("id", user.id)

      // Login successful
      login({
        id: user.id,
        mobileNumber: user.mobile_number,
        fullName: user.full_name,
        email: user.email || "",
        address: user.address,
      })

      router.push("/dashboard")
    } catch (err: any) {
      console.error("Login error:", err)
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 to-white p-4">
      <Link href="/" className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>

      <div className="flex flex-1 items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardHeader className="items-center">
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>Welcome back to Barangay Mawaque</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Login Method Toggle */}
            <div className="mb-4 flex gap-2 rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setLoginMethod("password")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition ${
                  loginMethod === "password"
                    ? "bg-white text-emerald-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Lock className="h-4 w-4" />
                Password
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod("pin")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition ${
                  loginMethod === "pin" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Hash className="h-4 w-4" />
                PIN
              </button>
            </div>

            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-4">
                {error && <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{error}</div>}

                <div className="space-y-2">
                  <Label htmlFor="mobileNumber" className="text-sm font-medium">
                    Mobile Number
                  </Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="mobileNumber"
                      type="tel"
                      placeholder="+63 912 345 6789"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      disabled={isLoading}
                      className="h-11 pl-10"
                    />
                  </div>
                </div>

                {loginMethod === "password" ? (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="h-11 pl-10 pr-10"
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
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="pin" className="text-sm font-medium">
                      4-Digit PIN
                    </Label>
                    <Input
                      id="pin"
                      type="password"
                      placeholder="••••"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => {
                        if (/^\d*$/.test(e.target.value)) {
                          setPin(e.target.value)
                        }
                      }}
                      disabled={isLoading}
                      className="h-11 text-center text-2xl tracking-[1rem]"
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-emerald-500 text-sm font-semibold hover:bg-emerald-600"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </div>

              <div className="mt-4 text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/register" className="font-medium text-emerald-600 hover:underline">
                  Register
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
