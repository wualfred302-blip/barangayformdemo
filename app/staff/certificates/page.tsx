"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useCertificates, type CertificateRequest } from "@/lib/certificate-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronLeft,
  Calendar,
  DollarSign,
  X,
  Download,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SignatureModal } from "@/components/signature-modal"

const exportToCSV = (certificates: CertificateRequest[]) => {
  const headers = [
    "Serial Number",
    "Certificate Type",
    "Resident Name",
    "Purpose",
    "Status",
    "Created Date",
    "Amount",
    "Payment Status",
    "Purok",
    "Request Type",
  ]

  const rows = certificates.map((cert) => {
    const status = cert.status.charAt(0).toUpperCase() + cert.status.slice(1)
    const date = new Date(cert.createdAt).toLocaleDateString("en-PH")
    const amount = `₱${cert.amount.toFixed(2)}`
    const paymentStatus = cert.paymentReference ? "Paid" : "Unpaid"
    const residentName = cert.residentName || "N/A"
    const purok = cert.purok || "N/A"

    return [
      cert.serialNumber,
      cert.certificateType,
      residentName,
      cert.purpose,
      status,
      date,
      amount,
      paymentStatus,
      purok,
      cert.requestType,
    ].map((field) => {
      const fieldStr = String(field)
      if (fieldStr.includes(",") || fieldStr.includes('"') || fieldStr.includes("\n")) {
        return `"${fieldStr.replace(/"/g, '""')}"`
      }
      return fieldStr
    })
  })

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  link.setAttribute("href", url)
  link.setAttribute("download", `certificates_export_${timestamp}.csv`)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export default function StaffCertificatesPage() {
  const router = useRouter()
  const { staffUser, isStaffAuthenticated } = useAuth()
  const { certificates, updateCertificateStatus } = useCertificates()

  const [filters, setFilters] = useState({
    search: "",
    status: "all" as "all" | "processing" | "ready",
    dateFrom: "",
    dateTo: "",
    purok: "all",
    paymentStatus: "all" as "all" | "paid" | "unpaid",
  })
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "calendar">("list")
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [signatureModalOpen, setSignatureModalOpen] = useState(false)
  const [certificateToSign, setCertificateToSign] = useState<CertificateRequest | null>(null)

  const filteredCerts = useMemo(() => {
    return certificates.filter((cert) => {
      // Search: serial, type, purpose, OR resident name
      const searchLower = filters.search.toLowerCase()
      const matchesSearch =
        !filters.search ||
        cert.serialNumber.toLowerCase().includes(searchLower) ||
        cert.certificateType.toLowerCase().includes(searchLower) ||
        cert.purpose.toLowerCase().includes(searchLower) ||
        (cert.residentName?.toLowerCase().includes(searchLower) ?? false)

      // Status
      const matchesStatus = filters.status === "all" || cert.status === filters.status

      // Date range
      const certDate = new Date(cert.createdAt)
      const matchesDateFrom = !filters.dateFrom || certDate >= new Date(filters.dateFrom)
      const matchesDateTo = !filters.dateTo || certDate <= new Date(filters.dateTo + "T23:59:59")

      // Purok
      const matchesPurok = filters.purok === "all" || cert.purok === filters.purok

      // Payment status
      const matchesPayment =
        filters.paymentStatus === "all" ||
        (filters.paymentStatus === "paid" && cert.paymentReference) ||
        (filters.paymentStatus === "unpaid" && !cert.paymentReference)

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesPurok && matchesPayment
    })
  }, [certificates, filters])

  const processingCerts = filteredCerts.filter((c) => c.status === "processing")
  const readyCerts = filteredCerts.filter((c) => c.status === "ready")

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + E: Export selected certificates
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        if (selectedIds.length > 0) {
          e.preventDefault()
          const selectedCerts = certificates.filter((c) => selectedIds.includes(c.id))
          handleExport(selectedCerts)
        }
      }

      // Ctrl/Cmd + A: Select all processing certificates
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        if (processingCerts.length > 0) {
          e.preventDefault()
          setSelectedIds(processingCerts.map((c) => c.id))
        }
      }

      // Escape: Clear selection or date filter
      if (e.key === "Escape") {
        if (selectedIds.length > 0) {
          setSelectedIds([])
        } else if (selectedDate) {
          setSelectedDate(null)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedIds, selectedDate, certificates, processingCerts])

  const handleExport = (certs: CertificateRequest[]) => {
    setIsExporting(true)
    setTimeout(() => {
      exportToCSV(certs)
      setIsExporting(false)
    }, 500)
  }


  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === "search") return value !== ""
    return value !== "all" && value !== ""
  })

  const clearFilters = () => {
    setFilters({
      search: "",
      status: "all",
      dateFrom: "",
      dateTo: "",
      purok: "all",
      paymentStatus: "all",
    })
  }

  const handleApproveClick = (cert: CertificateRequest) => {
    setCertificateToSign(cert)
    setSignatureModalOpen(true)
  }

  const handleSignatureConfirm = (signature: string) => {
    if (!certificateToSign || !staffUser) return

    updateCertificateStatus(certificateToSign.id, "ready", {
      signature,
      signedBy: staffUser.fullName,
      signedByRole: staffUser.role,
    })

    const remainingIds = selectedIds.filter((id) => id !== certificateToSign.id)
    setSelectedIds(remainingIds)
    setSignatureModalOpen(false)
    setCertificateToSign(null)

    // Continue bulk approval if there are more selected items
    const nextCert = certificates.find((c) => remainingIds.includes(c.id) && c.status === "processing")
    if (nextCert) {
      setTimeout(() => {
        handleApproveClick(nextCert)
      }, 300)
    }
  }

  const handleBulkApprove = () => {
    // Get first processing certificate from selection
    const firstCert = certificates.find((c) => selectedIds.includes(c.id) && c.status === "processing")

    if (firstCert) {
      handleApproveClick(firstCert)
    }
  }

  const certsByDate = useMemo(() => {
    return filteredCerts.reduce(
      (acc, cert) => {
        const date = new Date(cert.createdAt).toDateString()
        if (!acc[date]) acc[date] = []
        acc[date].push(cert)
        return acc
      },
      {} as Record<string, CertificateRequest[]>,
    )
  }, [filteredCerts])

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const CertificateCard = ({
    cert,
    compact = false,
    showCheckbox = false,
  }: {
    cert: CertificateRequest
    compact?: boolean
    showCheckbox?: boolean
  }) => (
    <Card className={`border-0 shadow-sm ${compact ? "mb-2" : ""}`}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-start gap-3">
          {showCheckbox && cert.status === "processing" && (
            <Checkbox
              checked={selectedIds.includes(cert.id)}
              onCheckedChange={(checked) => {
                setSelectedIds(checked ? [...selectedIds, cert.id] : selectedIds.filter((i) => i !== cert.id))
              }}
              className="mt-1"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className={`font-semibold text-slate-900 ${compact ? "text-sm" : ""}`}>{cert.certificateType}</p>
              {cert.requestType === "rush" && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">RUSH</span>
              )}
            </div>
            <p className={`text-slate-500 ${compact ? "text-xs" : "mt-1 text-sm"}`}>{cert.serialNumber}</p>
            {cert.residentName && !compact && <p className="mt-1 text-sm text-slate-600">{cert.residentName}</p>}
            {!compact && (
              <>
                <p className="mt-1 text-sm text-slate-600">{cert.purpose}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(cert.createdAt).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />₱{cert.amount.toFixed(2)}
                  </span>
                  {cert.purok && <span className="rounded bg-slate-100 px-1.5 py-0.5">{cert.purok}</span>}
                </div>
              </>
            )}
          </div>
          {cert.status === "processing" && !showCheckbox && (
            <Button
              size="sm"
              onClick={() => handleApproveClick(cert)}
              className={`bg-emerald-600 hover:bg-emerald-700 ${compact ? "h-7 text-xs" : ""}`}
            >
              <CheckCircle2 className={`mr-1 ${compact ? "h-3 w-3" : "h-4 w-4"}`} />
              Approve
            </Button>
          )}
          {cert.status === "ready" && !compact && (
            <Link href={`/certificate/${cert.id}`}>
              <Button size="sm" variant="outline">
                View
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const CalendarView = () => (
    <div>
      {/* Month navigation */}
      <div className="mb-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900">
            {currentMonth.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2"
            disabled={isExporting}
            onClick={() => {
              const monthCerts = filteredCerts.filter((cert) => {
                const d = new Date(cert.createdAt)
                return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()
              })
              handleExport(monthCerts)
            }}
          >
            {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="mb-2 grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center text-xs font-medium text-slate-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
          const dateStr = date.toDateString()
          const certs = certsByDate[dateStr] || []
          const isToday = date.toDateString() === new Date().toDateString()

          return (
            <button
              key={day}
              onClick={() => setSelectedDate(date)}
              className={cn(
                "aspect-square rounded-lg border p-1 text-left transition-colors hover:border-emerald-500",
                certs.length > 0 ? "border-emerald-200 bg-emerald-50" : "border-slate-200",
                isToday && "ring-2 ring-emerald-500",
                selectedDate?.toDateString() === dateStr && "ring-2 ring-emerald-600",
              )}
            >
              <div className={cn("text-xs font-medium", isToday ? "text-emerald-600" : "text-slate-900")}>{day}</div>
              {certs.length > 0 && (
                <div className="mt-0.5 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-emerald-600">{certs.length}</span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Selected date certificates */}
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-900">
            {selectedDate
              ? `Certificates on ${selectedDate.toLocaleDateString("en-PH", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}`
              : "All Certificates This Month"}
          </h4>
          {selectedDate && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(null)} className="h-7 text-xs">
              View all
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {(selectedDate
            ? filteredCerts.filter((cert) => new Date(cert.createdAt).toDateString() === selectedDate.toDateString())
            : filteredCerts.slice(0, 10)
          ).map((cert) => (
            <CertificateCard key={cert.id} cert={cert} compact />
          ))}
          {(selectedDate
            ? filteredCerts.filter((cert) => new Date(cert.createdAt).toDateString() === selectedDate.toDateString())
            : filteredCerts
          ).length === 0 && <p className="py-4 text-center text-sm text-slate-500">No certificates</p>}
        </div>
      </div>
    </div>
  )

  if (!isStaffAuthenticated) {
    router.push("/staff/login")
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href={`/staff/${staffUser?.role}`} className="text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              <h1 className="text-lg font-semibold text-slate-900">Certificates</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("list")}
              className={viewMode === "list" ? "bg-slate-100" : ""}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("kanban")}
              className={viewMode === "kanban" ? "bg-slate-100" : ""}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode("calendar")}
              className={viewMode === "calendar" ? "bg-slate-100" : ""}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="space-y-3 border-b border-slate-100 bg-white p-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by serial, type, name, purpose..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Filter row 1 */}
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={filters.status}
            onValueChange={(v) => setFilters({ ...filters, status: v as typeof filters.status })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.purok} onValueChange={(v) => setFilters({ ...filters, purok: v })}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Puroks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Puroks</SelectItem>
              <SelectItem value="Purok 1">Purok 1</SelectItem>
              <SelectItem value="Purok 2">Purok 2</SelectItem>
              <SelectItem value="Purok 3">Purok 3</SelectItem>
              <SelectItem value="Purok 4">Purok 4</SelectItem>
              <SelectItem value="Purok 5">Purok 5</SelectItem>
              <SelectItem value="Purok 6">Purok 6</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter row 2 - Date range + payment */}
        <div className="grid grid-cols-3 gap-2">
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            placeholder="From"
            className="h-9 text-xs"
          />
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            placeholder="To"
            className="h-9 text-xs"
          />
          <Select
            value={filters.paymentStatus}
            onValueChange={(v) => setFilters({ ...filters, paymentStatus: v as typeof filters.paymentStatus })}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter actions */}
        <div className="flex items-center justify-between">
          {hasActiveFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-slate-500">
              <X className="mr-1 h-3 w-3" />
              Clear all filters ({filteredCerts.length} results)
            </Button>
          ) : (
            <div />
          )}

          {filteredCerts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isExporting}
              onClick={() => handleExport(filteredCerts)}
              className="h-8 text-xs text-slate-600"
            >
              {isExporting ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Download className="mr-1 h-3 w-3" />
              )}
              Export all filtered results ({filteredCerts.length})
            </Button>
          )}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="sticky top-14 z-10 border-b border-emerald-200 bg-emerald-50 px-4 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-emerald-900">{selectedIds.length} selected</span>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleBulkApprove} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="mr-1 h-4 w-4" />
                Approve All
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isExporting}
                onClick={() => {
                  const selectedCerts = certificates.filter((c) => selectedIds.includes(c.id))
                  handleExport(selectedCerts)
                }}
              >
                {isExporting ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-1 h-4 w-4" />
                )}
                <span className="hidden sm:inline">Export to CSV</span>
                <span className="sm:hidden">Export</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} className="text-slate-600">
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 px-5 py-6">
        {viewMode === "calendar" ? (
          <CalendarView />
        ) : viewMode === "list" ? (
          <div className="space-y-3">
            {/* Select all for bulk */}
            {processingCerts.length > 0 && (
              <div className="flex items-center gap-2 pb-2">
                <Checkbox
                  checked={selectedIds.length === processingCerts.length && processingCerts.length > 0}
                  onCheckedChange={(checked) => {
                    setSelectedIds(checked ? processingCerts.map((c) => c.id) : [])
                  }}
                />
                <span className="text-sm text-slate-600">Select all processing ({processingCerts.length})</span>
              </div>
            )}

            {filteredCerts.map((cert) => (
              <CertificateCard key={cert.id} cert={cert} showCheckbox={cert.status === "processing"} />
            ))}
            {filteredCerts.length === 0 && (
              <div className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">No certificates match your filters</p>
              </div>
            )}
          </div>
        ) : (
          // Kanban View
          <div className="grid grid-cols-2 gap-4">
            {/* Processing Column */}
            <div className="rounded-xl bg-amber-50 p-3">
              <div className="mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-900">Processing</h3>
                <span className="ml-auto rounded-full bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {processingCerts.length}
                </span>
              </div>
              <div className="space-y-2">
                {processingCerts.map((cert) => (
                  <CertificateCard key={cert.id} cert={cert} compact />
                ))}
                {processingCerts.length === 0 && <p className="py-4 text-center text-xs text-amber-600">No pending</p>}
              </div>
            </div>

            {/* Ready Column */}
            <div className="rounded-xl bg-emerald-50 p-3">
              <div className="mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-emerald-900">Ready</h3>
                <span className="ml-auto rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-800">
                  {readyCerts.length}
                </span>
              </div>
              <div className="space-y-2">
                {readyCerts.map((cert) => (
                  <Card key={cert.id} className="mb-2 border-0 shadow-sm">
                    <CardContent className="p-3">
                      <p className="text-sm font-semibold text-slate-900">{cert.certificateType}</p>
                      <p className="text-xs text-slate-500">{cert.serialNumber}</p>
                    </CardContent>
                  </Card>
                ))}
                {readyCerts.length === 0 && <p className="py-4 text-center text-xs text-emerald-600">No ready</p>}
              </div>
            </div>
          </div>
        )}
      </main>

      <SignatureModal
        isOpen={signatureModalOpen}
        onClose={() => {
          setSignatureModalOpen(false)
          setCertificateToSign(null)
        }}
        onConfirm={handleSignatureConfirm}
        certificateType={certificateToSign?.certificateType || ""}
        residentName={certificateToSign?.residentName || ""}
      />
    </div>
  )
}
