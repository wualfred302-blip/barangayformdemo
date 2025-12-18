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
  AlertTriangle,
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  const handleLogout = () => {
    staffLogout()
    router.push("/staff/login")
  }

  // Filter certificates
  const filteredCerts = certificates.filter((cert) => {
    const matchesSearch =
      cert.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.certificateType.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || cert.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCerts = certificates.filter((c) => c.status === "processing").length
  const activeBlotters = blotters.filter((b) => !["resolved", "dismissed"].includes(b.status)).length
  const draftAnnouncements = announcements.filter((a) => !a.isPublished).length

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10">
              <Image src="/images/mawaque-20logo.jpeg" alt="Barangay Mawaque" fill className="object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Secretary</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{staffUser.fullName}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-5 py-6">
        {/* Welcome */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Operations Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Manage certificates, blotters, and announcements</p>
        </div>

        {/* Quick Stats */}
        <div className="mb-6 flex gap-3 overflow-x-auto pb-2">
          <Card className="min-w-[140px] flex-shrink-0 border-0 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-amber-700">Pending</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-amber-900">{pendingCerts}</p>
            </CardContent>
          </Card>
          <Card className="min-w-[140px] flex-shrink-0 border-0 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-red-700">Blotters</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-red-900">{activeBlotters}</p>
            </CardContent>
          </Card>
          <Card className="min-w-[140px] flex-shrink-0 border-0 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-700">Drafts</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-blue-900">{draftAnnouncements}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="certificates" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-3 bg-slate-100">
            <TabsTrigger value="certificates" className="text-xs">
              Certificates
            </TabsTrigger>
            <TabsTrigger value="blotters" className="text-xs">
              Blotters
            </TabsTrigger>
            <TabsTrigger value="announcements" className="text-xs">
              Announce
            </TabsTrigger>
          </TabsList>

          <TabsContent value="certificates" className="space-y-4">
            {/* Search & Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search certificates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setStatusFilter(statusFilter === "all" ? "processing" : "all")}
                className={statusFilter !== "all" ? "border-emerald-500 text-emerald-600" : ""}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Certificate List */}
            <div className="space-y-3">
              {filteredCerts.map((cert) => (
                <Card key={cert.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{cert.certificateType}</p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              cert.status === "ready"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {cert.status}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">{cert.serialNumber}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(cert.createdAt).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      {cert.status === "processing" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateCertificateStatus(cert.id, "ready")}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredCerts.length === 0 && (
                <div className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No certificates found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="blotters" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Active Blotters</h3>
              <Link href="/staff/blotters/new">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-1 h-4 w-4" />
                  New Blotter
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {blotters.slice(0, 5).map((blotter) => (
                <Card key={blotter.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{blotter.blotterNumber}</p>
                        <p className="text-sm text-slate-600">{blotter.incidentType}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {blotter.isAnonymous ? "Anonymous Report" : blotter.complainantName}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
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
                <div className="py-12 text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No blotters filed</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Announcements</h3>
              <Link href="/staff/announcements/new">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="mr-1 h-4 w-4" />
                  Create
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {announcements.slice(0, 5).map((ann) => (
                <Card key={ann.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{ann.title}</p>
                          {ann.isPinned && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                              Pinned
                            </span>
                          )}
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{ann.content}</p>
                      </div>
                      <span
                        className={`ml-3 rounded-full px-2 py-0.5 text-xs font-medium ${
                          ann.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {ann.isPublished ? "Published" : "Draft"}
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
