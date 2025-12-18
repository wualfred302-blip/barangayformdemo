"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useCertificates } from "@/lib/certificate-context"
import { useBlotters } from "@/lib/blotter-context"
import { useAnnouncements } from "@/lib/announcements-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Shield,
  FileText,
  ShieldAlert,
  Megaphone,
  BarChart3,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react"

export default function CaptainDashboard() {
  const router = useRouter()
  const { staffUser, isStaffAuthenticated, isLoading, staffLogout } = useAuth()
  const { certificates } = useCertificates()
  const { blotters } = useBlotters()
  const { announcements } = useAnnouncements()

  useEffect(() => {
    if (!isLoading && (!isStaffAuthenticated || staffUser?.role !== "captain")) {
      router.push("/staff/login")
    }
  }, [isLoading, isStaffAuthenticated, staffUser, router])

  if (isLoading || !isStaffAuthenticated || staffUser?.role !== "captain") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  const handleLogout = () => {
    staffLogout()
    router.push("/staff/login")
  }

  const pendingCerts = certificates.filter((c) => c.status === "processing").length
  const completedCerts = certificates.filter((c) => c.status === "ready").length
  const activeComplaints = blotters.filter((b) => !["resolved", "dismissed"].includes(b.status)).length
  const publishedAnnouncements = announcements.filter((a) => a.isPublished).length

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-100 bg-white px-4">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <Image src="/images/mawaque-logo.png" alt="Barangay Mawaque" fill className="object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                Punong Barangay
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900">{staffUser.fullName}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="h-9 w-9 rounded-full bg-slate-100 p-0 text-gray-500"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <main className="flex-1 px-4 py-4">
        <div className="mb-4">
          <h1 className="text-lg font-bold text-gray-900">Good day, Kapitan!</h1>
          <p className="text-xs text-gray-500">Executive Dashboard Overview</p>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <Card className="h-[88px] border-0 bg-amber-50 shadow-sm">
            <CardContent className="flex h-full items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-amber-900">{pendingCerts}</p>
                <p className="text-[10px] font-medium text-amber-700">Pending Approval</p>
              </div>
            </CardContent>
          </Card>

          <Card className="h-[88px] border-0 bg-red-50 shadow-sm">
            <CardContent className="flex h-full items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500">
                <ShieldAlert className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-900">{activeComplaints}</p>
                <p className="text-[10px] font-medium text-red-700">Active Complaints</p>
              </div>
            </CardContent>
          </Card>

          <Card className="h-[88px] border-0 bg-emerald-50 shadow-sm">
            <CardContent className="flex h-full items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-900">{completedCerts}</p>
                <p className="text-[10px] font-medium text-emerald-700">Issued Today</p>
              </div>
            </CardContent>
          </Card>

          <Card className="h-[88px] border-0 bg-blue-50 shadow-sm">
            <CardContent className="flex h-full items-center gap-3 p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500">
                <Megaphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-blue-900">{publishedAnnouncements}</p>
                <p className="text-[10px] font-medium text-blue-700">Announcements</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="mb-2 text-sm font-bold text-gray-900">Quick Actions</h2>
        <div className="space-y-2">
          <Link href="/staff/certificates">
            <Card className="border-0 shadow-sm transition-all active:scale-[0.98]">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Approve Certificates</p>
                    <p className="text-[10px] text-gray-500">{pendingCerts} pending your signature</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/staff/blotters">
            <Card className="border-0 shadow-sm transition-all active:scale-[0.98]">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">
                    <ShieldAlert className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Review Complaints</p>
                    <p className="text-[10px] text-gray-500">{activeComplaints} cases need attention</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/staff/reports">
            <Card className="border-0 shadow-sm transition-all active:scale-[0.98]">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">DILG Reports</p>
                    <p className="text-[10px] text-gray-500">Generate compliance reports</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/staff/announcements">
            <Card className="border-0 shadow-sm transition-all active:scale-[0.98]">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100">
                    <Megaphone className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Manage Announcements</p>
                    <p className="text-[10px] text-gray-500">Approve and publish updates</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Activity */}
        <Card className="mt-4 border-0 shadow-sm">
          <CardContent className="p-3">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Recent Activity</h3>
            <div className="space-y-2">
              {certificates.slice(0, 3).map((cert) => (
                <div key={cert.id} className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        cert.status === "ready" ? "bg-emerald-100" : "bg-amber-100"
                      }`}
                    >
                      {cert.status === "ready" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900">{cert.certificateType}</p>
                      <p className="text-[10px] text-gray-500">{cert.serialNumber}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      cert.status === "ready" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {cert.status}
                  </span>
                </div>
              ))}
              {certificates.length === 0 && (
                <p className="py-3 text-center text-xs text-gray-500">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
