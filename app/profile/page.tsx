"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Mail, Phone, MapPin, LogOut, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { BottomNav } from "@/components/bottom-nav"

const extractBarangay = (address: string): string => {
  if (!address) return "Mawaque"

  // Match "Barangay X" or "Brgy X" pattern
  const match = address.match(/(?:Barangay|Brgy\.?)\s+([^,]+)/i)
  if (match) return match[1].trim()

  // Fallback to default
  return "Mawaque"
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, logout } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#00C73C] border-t-transparent" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  // Get user initials
  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const profileItems = [
    { icon: User, label: "Full Name", value: user.fullName },
    { icon: Mail, label: "Email", value: user.email },
    { icon: Phone, label: "Mobile Number", value: user.mobileNumber },
    { icon: MapPin, label: "Address", value: user.address },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="rounded-full p-1 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8">
              <Image src="/images/logo.png" alt="Barangay Seal" fill className="object-contain" />
            </div>
            <h1 className="text-lg font-bold text-[#1A1A1A]">Profile</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pb-28 pt-5">
        {/* Profile Avatar Card */}
        <Card className="mb-5 overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-[#00C73C] to-[#00A832] shadow-lg">
          <CardContent className="flex flex-col items-center p-8">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <span className="text-3xl font-bold text-white">{initials}</span>
            </div>
            <h2 className="text-xl font-bold text-white">{user.fullName}</h2>
            <p className="text-sm text-white/80">
              Barangay {extractBarangay(user.address)} Resident
            </p>
          </CardContent>
        </Card>

        {/* Profile Info */}
        <Card className="mb-5 overflow-hidden rounded-2xl border-0 bg-white shadow-md">
          <CardContent className="p-0">
            {profileItems.map((item, index) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-4 px-5 py-4",
                  index !== profileItems.length - 1 && "border-b border-gray-100",
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                  <item.icon className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="font-medium text-[#1A1A1A]">{item.value || "Not provided"}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="h-14 w-full rounded-2xl border-2 border-red-200 bg-red-50 font-semibold text-red-600 hover:bg-red-100 hover:text-red-700"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </main>

      <BottomNav />
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
