"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useCertificates } from "@/lib/certificate-context"
import { useBlotters } from "@/lib/blotter-context"
import { useAnnouncements } from "@/lib/announcements-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  ShieldAlert,
  Megaphone,
  LogOut,
  Clock,
  CheckCircle2,
  Plus,
  Filter,
  Search,
  ClipboardList,
} from "lucide-react"
import { Input } from "@/components/ui/input"

export default function SecretaryDashboard() {
  const router = useRouter()
  const { staffUser, isStaffAuthenticated, isLoading, staffLogout } = useAuth()
  const { certificates, updateCertificateStatus } = useCertificates()
  const { blotters } = useBlotters()
  const { announcements } = useAnnouncements()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "processing" | "ready">("all")

  useEffect(() => {
    if (!isLoading && (!isStaffAuthenticated || staffUser?.role !== "secretary")) {
      router.push("/staff/login")
    }
  }, [isLoading, isStaffAuthenticated, staffUser, router])

  if (isLoading || !isStaffAuthenticated || staffUser?.role !== "secretary") {
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

  const filteredCerts = certificates.filter((cert) => {
    const matchesSearch =
      cert.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || cert.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCerts = certificates.filter((c) => c.status === "processing").length
  const activeComplaints = blotters.filter((b) => !["resolved", "dismissed"].includes(b.status)).length
  const draftAnnouncements = announcements.filter((a) => !a.isPublished).length

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-100 bg-white px-4">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <Image src="/images/mawaque-logo.png" alt="Barangay Mawaque" fill className="object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">Secretary</span>
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
          <h1 className="text-lg font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-xs text-gray-500">Manage certificates, complaints, and announcements</p>
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <Card className="h-[72px] min-w-[100px] shrink-0 border-0 bg-amber-50 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600" />
                <span className="text-[10px] font-medium text-amber-700">Pending</span>
              </div>
              <p className="mt-1 text-xl font-bold text-amber-900">{pendingCerts}</p>
            </CardContent>
          </Card>
          <Card className="h-[72px] min-w-[100px] shrink-0 border-0 bg-red-50 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                <span className="text-[10px] font-medium text-red-700">Complaints</span>
              </div>
              <p className="mt-1 text-xl font-bold text-red-900">{activeComplaints}</p>
            </CardContent>
          </Card>
          <Card className="h-[72px] min-w-[100px] shrink-0 border-0 bg-blue-50 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-[10px] font-medium text-blue-700">Drafts</span>
              </div>
              <p className="mt-1 text-xl font-bold text-blue-900">{draftAnnouncements}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="certificates" className="w-full">
          <TabsList className="mb-3 grid w-full grid-cols-3 bg-slate-100">
            <TabsTrigger value="certificates" className="text-xs">
              Certificates
            </TabsTrigger>
            <TabsTrigger value="blotters" className="text-xs">
              Complaints
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs">
              Announce
            </TabsTrigger>
          </TabsList>

          <TabsContent value="certificates" className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 pl-9 text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setStatusFilter(statusFilter === "all" ? "processing" : "all")}
                className={`h-9 w-9 ${statusFilter !== "all" ? "border-emerald-500 text-emerald-600" : ""}`}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2">
              {filteredCerts.map((cert) => (
                <Card key={cert.id} className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{cert.certificateType}</p>
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              cert.status === "ready"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {cert.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{cert.serialNumber}</p>
                      </div>
                      {cert.status === "processing" && (
                        <Button
                          size="sm"
                          onClick={() => updateCertificateStatus(cert.id, "ready")}
                          className="h-7 bg-emerald-600 text-xs hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Approve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredCerts.length === 0 && (
                <div className="py-8 text-center">
                  <FileText className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-xs text-gray-500">No certificates found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="blotters" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Active Complaints</h3>
              <Link href="/staff/blotters/new">
                <Button size="sm" className="h-8 bg-emerald-600 text-xs hover:bg-emerald-700">
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  New
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {blotters.slice(0, 5).map((blotter) => (
                <Card key={blotter.id} className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{blotter.blotterNumber}</p>
                        <p className="mt-0.5 text-xs text-gray-600">{blotter.incidentType}</p>
                        <p className="mt-0.5 text-[10px] text-gray-400">
                          {blotter.isAnonymous ? "Anonymous Report" : blotter.complainantName}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          blotter.status === "resolved"
                            ? "bg-emerald-100 text-emerald-700"
                            : blotter.status === "filed"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {blotter.status.replace("_", " ")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {blotters.length === 0 && (
                <div className="py-8 text-center">
                  <ShieldAlert className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-xs text-gray-500">No complaints filed</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Announcements</h3>
              <Link href="/staff/announcements/new">
                <Button size="sm" className="h-8 bg-emerald-600 text-xs hover:bg-emerald-700">
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Create
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {announcements.slice(0, 5).map((ann) => (
                <Card key={ann.id} className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-gray-900">{ann.title}</p>
                          {ann.isPinned && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                              Pinned
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{ann.content}</p>
                      </div>
                      <span
                        className={`ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          ann.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {ann.isPublished ? "Live" : "Draft"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
