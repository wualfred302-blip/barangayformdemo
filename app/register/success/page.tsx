"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export default function RegisterSuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push("/dashboard")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-6">
      <Card className="w-full max-w-[400px] rounded-2xl border-0 shadow-lg">
        <CardContent className="px-8 py-12">
          {/* Checkmark Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-8 w-8 text-emerald-600" strokeWidth={3} />
            </div>
          </div>

          {/* Heading */}
          <h1 className="mb-3 text-center text-2xl font-bold tracking-tight text-gray-900">
            Account Created Successfully!
          </h1>

          <p className="mb-6 text-center text-base text-gray-600">You can now access all barangay services.</p>

          <p className="mb-8 text-center text-sm text-gray-500">Redirecting to dashboard in {countdown} seconds...</p>

          {/* Button */}
          <Button
            onClick={() => router.push("/dashboard")}
            className="h-12 w-full rounded-xl bg-emerald-500 text-base font-semibold text-white hover:bg-emerald-600"
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
