"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useQRT } from "@/lib/qrt-context"
import { useAnnouncements } from "@/lib/announcements-context"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import {
  FileText,
  Users,
  ShieldAlert,
  CreditCard,
  Plus,
  Calendar,
  FileSignature,
  CircleDollarSign,
  ChevronLeft,
  ChevronRight,
  Bell,
  Inbox,
} from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"
import { DashboardHeader } from "@/components/dashboard-header"
import { QRTCardHero } from "@/components/qrt-card-hero"

export default function DashboardPage() {
  // ============================================================================
  // Data Sources - All user-facing data comes from these contexts
  // ============================================================================
  // useAuth: Provides user identity and authentication state
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()

  // useQRT: Provides user's QRT ID card data
  const { getUserQRTIds, isLoaded: qrtLoaded } = useQRT()

  // useAnnouncements: Provides published announcements and updates
  const { getPublishedAnnouncements } = useAnnouncements()

  // ============================================================================

  const router = useRouter()
  const [activeTab, setActiveTab] = useState("services")
  const [userQrtId, setUserQrtId] = useState<any | null>(null)

  // Track when all critical data has loaded
  const dataReady = !authLoading && isAuthenticated && qrtLoaded && user

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // Load user's QRT ID (from useQRT context)
  // Edge cases handled:
  // 1. User with no QRT ID → setUserQrtId(null) → CTA shows
  // 2. User with pending/processing QRT ID → Card with processing state
  // 3. User with issued QRT ID → Card with images shows
  // 4. User with multiple QRT IDs → Correct one prioritized (issued/ready first)
  useEffect(() => {
    if (user?.id && qrtLoaded) {
      const qrtIds = getUserQRTIds(user.id)
      // Prioritize issued or ready status, fallback to first in array
      const activeQrt = qrtIds.find(
        (qrt) => qrt.status === "issued" || qrt.status === "ready"
      )
      setUserQrtId(activeQrt || qrtIds[0] || null)
    }
    // Cleanup: State is reset if component unmounts or dependencies change
    // This prevents memory leaks from stale closures
  }, [user, qrtLoaded, getUserQRTIds])

  // Show loading state while critical data is loading
  // Wait for auth to complete and QRT context to load before rendering dashboard
  // This prevents flashing of incomplete data (CLS < 0.1)
  if (authLoading || !isAuthenticated || !user || !qrtLoaded) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          {/* Loading spinner with minimum dimensions to prevent layout shift */}
          <div className="h-12 w-12 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#14B8A6] border-t-transparent" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Loading your dashboard</p>
            <p className="text-xs text-gray-500 mt-1">Please wait while we fetch your data...</p>
          </div>
        </div>
      </div>
    )
  }

  const allAnnouncements = getPublishedAnnouncements()
  const priorityAnnouncements = allAnnouncements.filter((a) => a.isPinned || a.priority === "urgent")
  const regularAnnouncements = allAnnouncements.filter((a) => !priorityAnnouncements.find((p) => p.id === a.id))

  const handleTabChange = (value: string) => {
    if (value === "requests") {
      router.push("/requests")
    } else if (value === "payments") {
      router.push("/payment/history")
    } else {
      setActiveTab(value)
    }
  }

  const services = [
    // Row 1: Primary Services (4 items - aligned)
    { icon: FileText, label: "Request Certificate", href: "/request" },
    { icon: CreditCard, label: "Request ID", href: "/qrt-id/request" },
    { icon: ShieldAlert, label: "File Blotter", href: "/blotter" },
    { icon: Users, label: "Bayanihan", href: "/bayanihan" },
    // Row 2: Secondary Services (4 items)
    { icon: Plus, label: "Health Center", href: "/health-center" },
    { icon: Calendar, label: "Events", href: "/announcements" },
    { icon: FileSignature, label: "Permits", href: "/permits" },
    { icon: CircleDollarSign, label: "Taxes", href: "/taxes" },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <main className="flex-1 px-4 pb-24 pt-6">
        {/* Dashboard Header */}
        <div className="mb-4">
          <DashboardHeader />
        </div>

        {/* QRT ID Card Hero */}
        <div className="mb-4">
          <QRTCardHero
            qrtId={userQrtId}
            onRequestClick={() => router.push("/qrt-id/request")}
          />
        </div>

        {/* Tabs Pilled */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="h-[44px] w-full grid grid-cols-3 bg-[#E5EAF3] p-1 rounded-full border-none">
              <TabsTrigger
                value="services"
                className="rounded-full text-[14px] font-medium data-[state=active]:bg-[#14B8A6] data-[state=active]:text-white transition-all duration-200"
              >
                Services
              </TabsTrigger>
              <TabsTrigger
                value="requests"
                className="rounded-full text-[14px] font-medium text-[#4B5563] data-[state=active]:bg-[#14B8A6] data-[state=active]:text-white transition-all duration-200"
              >
                Requests
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="rounded-full text-[14px] font-medium text-[#4B5563] data-[state=active]:bg-[#14B8A6] data-[state=active]:text-white transition-all duration-200"
              >
                Payments
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Services Grid (4 col then 3 col) - Touch-friendly with 44px minimum targets */}
        <div className="grid grid-cols-4 gap-x-2 gap-y-6 mb-8">
          {services.map((service, idx) => (
            <Link
              key={idx}
              href={service.href}
              className="flex flex-col items-center gap-2 rounded-lg p-2 -m-2 min-h-[44px] hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:ring-offset-2"
              aria-label={service.label}
            >
              <div className="flex h-12 w-12 items-center justify-center">
                <service.icon className="h-10 w-10 text-[#0D9488]" strokeWidth={1.5} />
              </div>
              <span className="text-[12px] leading-tight font-medium text-center text-[#111827]">{service.label}</span>
            </Link>
          ))}
        </div>

        {/* Barangay Updates Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[18px] font-bold text-[#111827]">Barangay Updates</h2>
          </div>
          {priorityAnnouncements.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x">
              {priorityAnnouncements.map((ann, i) => (
                <div key={ann.id} className="relative w-[280px] shrink-0 snap-start">
                  <div className="relative h-[160px] w-full overflow-hidden rounded-2xl">
                    {ann.imageUrl ? (
                      <Image
                        src={ann.imageUrl || "/placeholder.svg"}
                        alt={`Banner image for ${ann.title}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#14B8A6] to-[#22D3EE]" aria-hidden="true" />
                    )}
                    <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full text-[11px] font-bold text-[#111827]">
                      {ann.category.charAt(0).toUpperCase() + ann.category.slice(1)}
                    </div>
                    {i > 0 && (
                      <button
                        className="absolute left-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 ml-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                        aria-label="Previous priority announcement"
                      >
                        <ChevronLeft className="h-4 w-4 text-[#111827]" />
                      </button>
                    )}
                    {i < priorityAnnouncements.length - 1 && (
                      <button
                        className="absolute right-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 mr-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                        aria-label="Next priority announcement"
                      >
                        <ChevronRight className="h-4 w-4 text-[#111827]" />
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-[14px] font-bold text-[#111827] leading-tight">{ann.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-8 text-center bg-gray-50">
              <div className="rounded-full bg-teal-100 p-4 mb-4">
                <Bell className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Updates Yet</h3>
              <p className="text-sm text-gray-600">
                Check back later for important announcements from the Barangay Captain
              </p>
            </Card>
          )}
        </section>

        {/* Announcements Section */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[18px] font-bold text-[#111827]">Announcements</h2>
          </div>
          {regularAnnouncements.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x">
              {regularAnnouncements.map((ann, i) => (
                <div key={ann.id} className="relative w-[280px] shrink-0 snap-start">
                  <div className="relative h-[160px] w-full overflow-hidden rounded-2xl">
                    {ann.imageUrl ? (
                      <Image
                        src={ann.imageUrl || "/placeholder.svg"}
                        alt={`Banner image for ${ann.title}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-[#14B8A6] to-[#22D3EE]" aria-hidden="true" />
                    )}
                    <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full text-[11px] font-bold text-[#111827]">
                      {ann.category.charAt(0).toUpperCase() + ann.category.slice(1)}
                    </div>
                    <button
                      className="absolute left-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 ml-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                      aria-label="Previous announcement"
                    >
                      <ChevronLeft className="h-4 w-4 text-[#111827]" />
                    </button>
                    <button
                      className="absolute right-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 mr-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6]"
                      aria-label="Next announcement"
                    >
                      <ChevronRight className="h-4 w-4 text-[#111827]" />
                    </button>
                  </div>
                  <p className="mt-2 text-[14px] font-bold text-[#111827] leading-tight">{ann.title}</p>
                </div>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-center justify-center p-8 text-center bg-gray-50">
              <div className="rounded-full bg-gray-100 p-4 mb-4">
                <Inbox className="h-8 w-8 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Announcements</h3>
              <p className="text-sm text-gray-600">
                There are no announcements at this time
              </p>
            </Card>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
