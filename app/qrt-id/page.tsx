"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, IdCard, ChevronRight, FileText } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { BottomNav } from "@/components/bottom-nav"
import { cn } from "@/lib/utils"
import { QRTStatusBadge } from "@/components/qrt-status-badge"

// Temporary hook until QRT context is created
const useQRT = () => {
  const [qrtIds, setQrtIds] = useState<any[]>([])
  // Load from localStorage for demo
  useEffect(() => {
    const stored = localStorage.getItem("barangay_qrt_ids")
    if (stored) setQrtIds(JSON.parse(stored))
  }, [])
  return { qrtIds }
}

type FilterType = "all" | "processing" | "ready"

export default function QrtIdListPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuth()
  const { qrtIds } = useQRT()
  const [filter, setFilter] = useState<FilterType>("all")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#10B981] border-t-transparent" />
      </div>
    )
  }

  // Filter QRT IDs for the current user (if user ID matching is possible with the mock data)
  // Since mock data might not have userId, we'll assume all local storage data belongs to the user for this demo
  const myQrtIds = qrtIds

  const filteredIds = myQrtIds.filter((item) => {
    if (filter === "all") return true
    
    if (filter === "processing") {
      return ["pending", "processing"].includes(item.status)
    }
    
    if (filter === "ready") {
      return ["ready", "issued"].includes(item.status)
    }

    return false
  })

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "processing", label: "Processing" },
    { value: "ready", label: "Ready" },
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
            <h1 className="text-lg font-bold text-[#1A1A1A]">My QRT IDs</h1>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="bg-white px-5 pb-4">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all",
                filter === f.value ? "bg-[#10B981] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-5 pb-28 pt-4">
        {filteredIds.length === 0 ? (
          <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <IdCard className="h-8 w-8 text-gray-300" />
              </div>
              <p className="mb-2 text-lg font-semibold text-gray-600">No QRT IDs found</p>
              <p className="mb-6 text-sm text-gray-400 text-center">
                {filter === "all" ? "You haven't requested a QRT ID yet." : `No ${filter} QRT IDs found.`}
              </p>
              <Button asChild className="rounded-xl bg-[#10B981] hover:bg-[#059669] w-full">
                <Link href="/qrt-id/request">Request New ID</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredIds.map((item) => {
              const isReady = ["ready", "issued"].includes(item.status)
              
              return (
                <Link key={item.id} href={`/qrt-id/${item.id}`}>
                  <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-md transition-transform active:scale-[0.98]">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl",
                            isReady ? "bg-[#10B981]/10" : "bg-orange-100",
                          )}
                        >
                          <IdCard
                            className={cn("h-6 w-6", isReady ? "text-[#10B981]" : "text-orange-500")}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">QRT ID</span>
                          </div>
                          <p className="font-semibold text-[#1A1A1A]">{item.qrtCode || "Processing..."}</p>
                          <p className="text-sm text-gray-500">
                            Requested: {new Date(item.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <QRTStatusBadge status={item.status} size="sm" />
                        <ChevronRight className="h-5 w-5 text-gray-300" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
