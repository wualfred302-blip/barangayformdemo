"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export default function RegisterSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard")
    }, 2000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB] px-6">
      <Card className="w-full max-w-[400px] rounded-2xl border-0 shadow-[0_4px_6px_rgba(0,0,0,0.07)]">
        <CardContent className="px-8 py-12">
          {/* Static Checkmark Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#10B981]">
              <Check className="h-8 w-8 text-[#10B981]" strokeWidth={3} />
            </div>
          </div>

          {/* Heading */}
          <h1 className="mb-3 text-center text-[28px] font-bold tracking-tight text-[#111827]">
            Registration Successful!
          </h1>

          {/* Status */}
          <p className="mb-6 text-center text-base text-[#6B7280]">Redirecting to dashboard...</p>

          {/* Body */}
          <p className="mb-8 text-center text-[15px] leading-relaxed text-[#374151]">
            Your account has been created successfully. You will be redirected shortly.
          </p>

          {/* Button */}
          <Button
            onClick={() => router.push("/dashboard")}
            className="h-[52px] w-full rounded-[10px] bg-[#10B981] text-base font-semibold text-white hover:bg-[#059669]"
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
