"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useAnnouncements } from "@/lib/announcements-context"
import { Card, CardContent } from "@/components/ui/card"
import {
  FileText,
  ClipboardList,
  User,
  AlertTriangle,
  Megaphone,
  Bell,
  Phone,
  MapPin,
  ChevronRight,
  Pin,
} from "lucide-react"
import { BottomNav } from "@/components/bottom-nav"

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { getPublishedAnnouncements } = useAnnouncements()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#10B981] border-t-transparent" />
      </div>
    )
  }

  const initials = user.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const announcements = getPublishedAnnouncements().slice(0, 3)

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <Image src="/images/mawaque-20logo.jpeg" alt="Barangay Seal" fill className="object-contain" />
          </div>
          <div>
            <p className="text-base font-semibold text-[#111827]">Barangay Mawaque</p>
            <p className="text-[13px] font-medium text-[#6B7280]">Digital Services</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/announcements" className="text-[#374151] transition-colors hover:text-[#111827]">
            <Bell className="h-6 w-6" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pb-28 pt-5">
        {/* Welcome Card */}
        <Card className="mb-6 rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-[#6B7280]">Welcome back,</p>
                <h2 className="mt-1 text-2xl font-bold text-[#111827]">{user.fullName}</h2>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[#374151]">
                    <Phone className="h-4 w-4 text-[#6B7280]" />
                    <span>{user.mobileNumber}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-[#374151]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]" />
                    <span className="max-w-[200px]">{user.address}</span>
                  </div>
                </div>
              </div>
              <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#E0F2FE]">
                <span className="text-2xl font-semibold text-[#0369A1]">{initials}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Announcements Section */}
        {announcements.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#111827]">Announcements</h3>
              <Link href="/announcements" className="text-sm font-medium text-emerald-600">
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {announcements.map((ann) => (
                <Card
                  key={ann.id}
                  className={`border-0 shadow-sm ${ann.priority === "urgent" ? "bg-red-50" : ann.isPinned ? "bg-amber-50" : "bg-white"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          ann.priority === "urgent"
                            ? "bg-red-100"
                            : ann.category === "health"
                              ? "bg-emerald-100"
                              : ann.category === "event"
                                ? "bg-blue-100"
                                : "bg-amber-100"
                        }`}
                      >
                        <Megaphone
                          className={`h-4 w-4 ${
                            ann.priority === "urgent"
                              ? "text-red-600"
                              : ann.category === "health"
                                ? "text-emerald-600"
                                : ann.category === "event"
                                  ? "text-blue-600"
                                  : "text-amber-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{ann.title}</p>
                          {ann.isPinned && <Pin className="h-3 w-3 text-amber-500" />}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-600">{ann.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Section Heading */}
        <h3 className="mb-4 text-[22px] font-bold text-[#111827]">Services</h3>

        {/* Main Service Card - Request Certificate */}
        <Link href="/request" className="block">
          <Card className="group mb-4 h-[160px] overflow-hidden rounded-[20px] border-0 bg-gradient-to-br from-[#10B981] to-[#059669] shadow-[0_4px_6px_rgba(16,185,129,0.15)] transition-all active:scale-[0.98]">
            <CardContent className="relative flex h-full flex-col justify-between p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-[22px] font-bold text-white">Request Certificate</h4>
                <p className="mt-1 text-sm font-medium text-white/90">Clearance, Residency, Indigency</p>
              </div>
              <ChevronRight className="absolute bottom-6 right-6 h-6 w-6 text-white" />
            </CardContent>
          </Card>
        </Link>

        {/* Secondary Services Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/requests" className="block">
            <Card className="h-[120px] rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_4px_6px_rgba(0,0,0,0.07)] active:scale-[0.98]">
              <CardContent className="flex h-full flex-col justify-between p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF3C7]">
                  <ClipboardList className="h-5 w-5 text-[#D97706]" />
                </div>
                <div>
                  <p className="text-base font-semibold text-[#111827]">My Requests</p>
                  <p className="mt-1 text-[13px] text-[#6B7280]">View history</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/blotter" className="block">
            <Card className="h-[120px] rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_4px_6px_rgba(0,0,0,0.07)] active:scale-[0.98]">
              <CardContent className="flex h-full flex-col justify-between p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEE2E2]">
                  <AlertTriangle className="h-5 w-5 text-[#DC2626]" />
                </div>
                <div>
                  <p className="text-base font-semibold text-[#111827]">File Blotter</p>
                  <p className="mt-1 text-[13px] text-[#6B7280]">Report incident</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/announcements" className="block">
            <Card className="h-[120px] rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_4px_6px_rgba(0,0,0,0.07)] active:scale-[0.98]">
              <CardContent className="flex h-full flex-col justify-between p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DBEAFE]">
                  <Megaphone className="h-5 w-5 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-base font-semibold text-[#111827]">Announcements</p>
                  <p className="mt-1 text-[13px] text-[#6B7280]">Latest news</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile" className="block">
            <Card className="h-[120px] rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-shadow hover:shadow-[0_4px_6px_rgba(0,0,0,0.07)] active:scale-[0.98]">
              <CardContent className="flex h-full flex-col justify-between p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0E7FF]">
                  <User className="h-5 w-5 text-[#4F46E5]" />
                </div>
                <div>
                  <p className="text-base font-semibold text-[#111827]">Profile</p>
                  <p className="mt-1 text-[13px] text-[#6B7280]">Update info</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
