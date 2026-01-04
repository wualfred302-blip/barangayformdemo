"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function QrtIdRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/requests?tab=qrt")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#10B981] border-t-transparent" />
    </div>
  )
}
