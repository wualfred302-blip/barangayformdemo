"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useAnnouncements } from "@/lib/announcements-context"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Users,
  ShieldAlert,
  IdCard,
  Plus,
  Calendar,
  FileSignature,
  CircleDollarSign,
  Bell,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { getPublishedAnnouncements } = useAnnouncements()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("services")

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" />
      </div>
    )
  }

  const allAnnouncements = getPublishedAnnouncements()
  const priorityAnnouncements = allAnnouncements
    .filter((a) => a.isPinned || a.priority === "urgent")
  const regularAnnouncements = allAnnouncements
    .filter((a) => !priorityAnnouncements.find((p) => p.id === a.id))

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
    { icon: FileText, label: "Request Certificate", href: "/request" },
    { icon: Users, label: "Bayanihan", href: "/bayanihan" },
    { icon: ShieldAlert, label: "File Blotter", href: "/blotter" },
    { icon: IdCard, label: "Request ID", href: "/qrt-id/request" },
    { icon: Plus, label: "Health Center", href: "/dashboard" },
    { icon: Calendar, label: "Events", href: "/announcements" },
    { icon: FileSignature, label: "Permits", href: "/dashboard" },
    { icon: CircleDollarSign, label: "Taxes", href: "/dashboard" },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <header className="sticky top-0 z-10 flex h-[60px] items-center justify-between bg-white px-4">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8">
            <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-[#1F2937]">Barangay Mawaque</p>
            <p className="text-[11px] text-[#6B7280]">Digital Services</p>
          </div>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F3F4F6]">
          <Bell className="h-[18px] w-[18px] text-[#4B5563]" />
        </button>
      </header>

      <main className="flex-1 px-4 pb-24 pt-2">
        {/* Tabs Pilled */}
        <div className="mb-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="h-[44px] w-full grid grid-cols-3 bg-[#E5EAF3] p-1 rounded-full border-none">
              <TabsTrigger 
                value="services" 
                className="rounded-full text-[14px] font-medium data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white transition-all duration-200"
              >
                Services
              </TabsTrigger>
              <TabsTrigger 
                value="requests" 
                className="rounded-full text-[14px] font-medium text-[#4B5563] data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white transition-all duration-200"
              >
                Requests
              </TabsTrigger>
              <TabsTrigger 
                value="payments" 
                className="rounded-full text-[14px] font-medium text-[#4B5563] data-[state=active]:bg-[#3B82F6] data-[state=active]:text-white transition-all duration-200"
              >
                Payments
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Services Grid (4 col then 3 col) */}
        <div className="grid grid-cols-4 gap-x-2 gap-y-6 mb-8">
          {services.map((service, idx) => (
            <Link key={idx} href={service.href} className="flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center">
                <service.icon className="h-10 w-10 text-[#325A94]" strokeWidth={1.5} />
              </div>
              <span className="text-[12px] leading-tight font-medium text-center text-[#111827]">
                {service.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Barangay Updates Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[18px] font-bold text-[#111827]">Barangay Updates</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x">
            {priorityAnnouncements.map((ann, i) => (
              <div key={ann.id} className="relative w-[280px] shrink-0 snap-start">
                <div className="relative h-[160px] w-full overflow-hidden rounded-2xl">
                  {ann.imageUrl ? (
                    <Image src={ann.imageUrl} alt="" fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full bg-[#3B82F6]" />
                  )}
                  <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full text-[11px] font-bold text-[#111827]">
                    {ann.category.charAt(0).toUpperCase() + ann.category.slice(1)}
                  </div>
                  {i > 0 && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 ml-2 shadow-sm">
                      <ChevronLeft className="h-4 w-4 text-[#111827]" />
                    </div>
                  )}
                  {i < priorityAnnouncements.length - 1 && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 mr-2 shadow-sm">
                      <ChevronRight className="h-4 w-4 text-[#111827]" />
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[14px] font-bold text-[#111827] leading-tight">
                  {ann.title}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Announcements Section */}
        <section>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[18px] font-bold text-[#111827]">Announcements</h2>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 snap-x">
            {regularAnnouncements.map((ann, i) => (
              <div key={ann.id} className="relative w-[280px] shrink-0 snap-start">
                <div className="relative h-[160px] w-full overflow-hidden rounded-2xl">
                  {ann.imageUrl ? (
                    <Image src={ann.imageUrl} alt="" fill className="object-cover" />
                  ) : (
                    <div className="h-full w-full bg-[#3B82F6]" />
                  )}
                  <div className="absolute top-3 left-3 bg-white px-3 py-1 rounded-full text-[11px] font-bold text-[#111827]">
                    {ann.category.charAt(0).toUpperCase() + ann.category.slice(1)}
                  </div>
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 ml-2 shadow-sm">
                    <ChevronLeft className="h-4 w-4 text-[#111827]" />
                  </div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 mr-2 shadow-sm">
                    <ChevronRight className="h-4 w-4 text-[#111827]" />
                  </div>
                </div>
                <p className="mt-2 text-[14px] font-bold text-[#111827] leading-tight">
                  {ann.title}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
