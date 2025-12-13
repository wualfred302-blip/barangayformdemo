"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function RegisterSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard")
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center">
          <CheckCircle className="mb-4 h-16 w-16 text-green-600 animate-bounce" />
          <CardTitle className="text-2xl">Registration Successful!</CardTitle>
          <CardDescription>Redirecting to dashboard...</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6 text-sm text-gray-600">
            Your account has been created successfully. You will be redirected shortly.
          </p>
          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
            <a onClick={() => router.push("/dashboard")}>Go to Dashboard</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
