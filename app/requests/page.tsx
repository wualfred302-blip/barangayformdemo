"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, ChevronRight, HandHeart } from "lucide-react"
import { useCertificates } from "@/lib/certificate-context"
import { useBayanihan } from "@/lib/bayanihan-context"
import { useAuth } from "@/lib/auth-context"
import { BottomNav } from "@/components/bottom-nav"
import { cn } from "@/lib/utils"

type FilterType = "all" | "processing" | "ready"

export default function RequestsPage() {
  const router = useRouter()
  const { certificates } = useCertificates()
  const { isAuthenticated, isLoading, user } = useAuth()
  const { requests: bayanihanRequests } = useBayanihan()
  const [filter, setFilter] = useState<FilterType>("all")

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

  const myBayanihan = bayanihanRequests.filter(
    (req) => req.residentName === (user?.fullName || "Anonymous")
  )

  const combinedRequests = [
    ...certificates.map(c => ({ type: 'certificate' as const, data: c, date: c.createdAt })),
    ...myBayanihan.map(b => ({ type: 'bayanihan' as const, data: b, date: b.createdAt }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const filteredRequests = combinedRequests.filter((item) => {
    if (filter === "all") return true
    
    if (filter === "processing") {
      if (item.type === 'certificate') return item.data.status === 'processing'
      if (item.type === 'bayanihan') return ['pending', 'in_progress'].includes(item.data.status)
    }
    
    if (filter === "ready") {
      if (item.type === 'certificate') return item.data.status === 'ready'
      if (item.type === 'bayanihan') return ['resolved', 'rejected'].includes(item.data.status)
    }

    return false
  })

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "processing", label: "Processing" },
    { value: "ready", label: "Completed" },
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
            <h1 className="text-lg font-bold text-[#1A1A1A]">My Requests</h1>
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
                filter === f.value ? "bg-[#00C73C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-5 pb-28 pt-4">
        {filteredRequests.length === 0 ? (
          <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <FileText className="h-8 w-8 text-gray-300" />
              </div>
              <p className="mb-2 text-lg font-semibold text-gray-600">No requests found</p>
              <p className="mb-6 text-sm text-gray-400 text-center">
                {filter === "all" ? "You haven't made any requests yet." : `No ${filter} requests.`}
              </p>
              <div className="flex flex-col gap-3 w-full">
                <Button asChild className="rounded-xl bg-[#00C73C] hover:bg-[#00A832] w-full">
                  <Link href="/request">Request a Certificate</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl w-full border-gray-200">
                  <Link href="/bayanihan">Request Assistance</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((item) => {
              if (item.type === 'certificate') {
                const cert = item.data;
                return (
                  <Link key={cert.id} href={`/certificate/${cert.id}`}>
                    <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-md transition-transform active:scale-[0.98]">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-xl",
                              cert.status === "ready" ? "bg-[#00C73C]/10" : "bg-orange-100",
                            )}
                          >
                            <FileText
                              className={cn("h-6 w-6", cert.status === "ready" ? "text-[#00C73C]" : "text-orange-500")}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Certificate</span>
                            </div>
                            <p className="font-semibold text-[#1A1A1A]">{cert.certificateType}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(cert.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-medium",
                              cert.status === "ready" ? "bg-[#00C73C]/10 text-[#00C73C]" : "bg-orange-100 text-orange-600",
                            )}
                          >
                            {cert.status === "ready" ? "Ready" : "Processing"}
                          </span>
                          <ChevronRight className="h-5 w-5 text-gray-300" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              } else {
                const bayanihan = item.data;
                const isCompleted = ['resolved', 'rejected'].includes(bayanihan.status);
                const statusLabel = 
                  bayanihan.status === 'resolved' ? 'Resolved' : 
                  bayanihan.status === 'rejected' ? 'Rejected' :
                  bayanihan.status === 'in_progress' ? 'In Progress' : 'Pending';
                  
                return (
                  <Link key={bayanihan.id} href={`/bayanihan`}>
                    <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-md transition-transform active:scale-[0.98]">
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "flex h-12 w-12 items-center justify-center rounded-xl",
                              isCompleted ? "bg-[#00C73C]/10" : "bg-blue-100",
                            )}
                          >
                            <HandHeart
                              className={cn("h-6 w-6", isCompleted ? "text-[#00C73C]" : "text-blue-500")}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bayanihan</span>
                                <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                    bayanihan.urgency === 'high' ? "bg-red-100 text-red-700" :
                                    bayanihan.urgency === 'medium' ? "bg-amber-100 text-amber-700" :
                                    "bg-emerald-100 text-emerald-700"
                                )}>
                                    {bayanihan.urgency.toUpperCase()}
                                </span>
                            </div>
                            <p className="font-semibold text-[#1A1A1A]">{bayanihan.type}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{bayanihan.number}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(bayanihan.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-medium",
                              isCompleted ? "bg-[#00C73C]/10 text-[#00C73C]" : "bg-blue-100 text-blue-600",
                              bayanihan.status === 'rejected' && "bg-red-100 text-red-600"
                            )}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              }
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
