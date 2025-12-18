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
  ShieldAlert,
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
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
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
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-100 bg-white px-4">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <Image src="/images/mawaque-logo.png" alt="Barangay Seal" fill className="object-contain" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Barangay Mawaque</p>
            <p className="text-xs text-gray-500">Digital Services</p>
          </div>
        </div>
        <Link href="/announcements" className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
          <Bell className="h-4 w-4 text-gray-600" />
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-24 pt-4">
        <Card className="mb-4 rounded-2xl border-0 bg-gradient-to-br from-blue-50 to-slate-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500">Welcome back,</p>
                <h2 className="text-lg font-bold text-gray-900">{user.fullName}</h2>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    <span>{user.mobileNumber}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-gray-600">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="line-clamp-2">{user.address}</span>
                  </div>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500">
                <span className="text-base font-semibold text-white">{initials}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {announcements.length > 0 && (
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Announcements</h3>
              <Link href="/announcements" className="text-xs font-medium text-emerald-600">
                View All
              </Link>
            </div>
            <div className="space-y-2">
              {announcements.map((ann) => (
                <Card
                  key={ann.id}
                  className={`border-0 shadow-sm ${ann.priority === "urgent" ? "bg-red-50" : ann.isPinned ? "bg-amber-50" : "bg-white"}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
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
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-gray-900">{ann.title}</p>
                          {ann.isPinned && <Pin className="h-3 w-3 shrink-0 text-amber-500" />}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">{ann.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <h3 className="mb-3 text-sm font-bold text-gray-900">Services</h3>

        <Link href="/request" className="block">
          <Card className="group mb-3 overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md transition-all active:scale-[0.98]">
            <CardContent className="relative flex h-[120px] flex-col justify-between p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Request Certificate</h4>
                <p className="text-xs font-medium text-white/90">Clearance, Residency, Indigency</p>
              </div>
              <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-white/80" />
            </CardContent>
          </Card>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/requests" className="block">
            <Card className="h-[88px] rounded-xl border-0 shadow-sm transition-all active:scale-[0.98]">
              <CardContent className="flex h-full flex-col justify-between p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                  <ClipboardList className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">My Requests</p>
                  <p className="text-xs text-gray-500">View history</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/blotter" className="block">
            <Card className="h-[88px] rounded-xl border-0 shadow-sm transition-all active:scale-[0.98]">
              <CardContent className="flex h-full flex-col justify-between p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Data Privacy</p>
                  <p className="text-xs text-gray-500">File complaint</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/announcements" className="block">
            <Card className="h-[88px] rounded-xl border-0 shadow-sm transition-all active:scale-[0.98]">
              <CardContent className="flex h-full flex-col justify-between p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  <Megaphone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Announcements</p>
                  <p className="text-xs text-gray-500">Latest news</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/profile" className="block">
            <Card className="h-[88px] rounded-xl border-0 shadow-sm transition-all active:scale-[0.98]">
              <CardContent className="flex h-full flex-col justify-between p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Profile</p>
                  <p className="text-xs text-gray-500">Update info</p>
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
