"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, User, LogOut, Menu } from "lucide-react"
import Image from "next/image"

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth() // Added isLoading
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white p-4 shadow-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image src="/images/image.png" alt="Barangay Seal" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Barangay Mawaque</h1>
              <p className="text-xs text-gray-600">Digital Services</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 pb-24">
        <div className="mx-auto max-w-4xl">
          {/* Welcome Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome, {user.fullName}!</CardTitle>
              <CardDescription>What would you like to do today?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Mobile:</span> {user.mobileNumber}
                </p>
                <p>
                  <span className="font-medium">Address:</span> {user.address}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Services Grid */}
          <div className="mb-6">
            <h2 className="mb-4 text-xl font-semibold">Available Services</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Request Certificate</CardTitle>
                  <CardDescription>Barangay Clearance, Residency, Indigency</CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">My Requests</CardTitle>
                  <CardDescription>View your certificate requests</CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Profile</CardTitle>
                  <CardDescription>Update your information</CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                    <Menu className="h-6 w-6 text-orange-600" />
                  </div>
                  <CardTitle className="text-lg">More Services</CardTitle>
                  <CardDescription>Explore additional services</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg">
        <div className="mx-auto flex max-w-4xl justify-around">
          <Button variant="ghost" size="sm" className="flex-col gap-1 text-green-600">
            <FileText className="h-5 w-5" />
            <span className="text-xs">Home</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col gap-1">
            <FileText className="h-5 w-5" />
            <span className="text-xs">Requests</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col gap-1">
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-col gap-1">
            <Menu className="h-5 w-5" />
            <span className="text-xs">More</span>
          </Button>
        </div>
      </nav>
    </div>
  )
}
