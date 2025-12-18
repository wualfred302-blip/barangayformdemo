"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useCertificates } from "@/lib/certificate-context"
import { useBlotters } from "@/lib/blotter-context"
import { useAnnouncements } from "@/lib/announcements-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  BarChart3,
  FileText,
  AlertTriangle,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Banknote,
  Activity,
  Megaphone,
} from "lucide-react"

type ReportType =
  | "certificate_summary"
  | "blotter_summary"
  | "financial_summary"
  | "lupong_tagapamayapa"
  | "activity_report"

export default function StaffReportsPage() {
  const router = useRouter()
  const { staffUser, isStaffAuthenticated } = useAuth()
  const { certificates } = useCertificates()
  const { blotters } = useBlotters()
  const { announcements } = useAnnouncements()
  const [selectedReport, setSelectedReport] = useState<ReportType>("certificate_summary")
  const [period, setPeriod] = useState("2025-01")

  if (!isStaffAuthenticated) {
    router.push("/staff/login")
    return null
  }

  // Certificate stats
  const certStats = {
    total: certificates.length,
    byType: certificates.reduce(
      (acc, cert) => {
        acc[cert.certificateType] = (acc[cert.certificateType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
    byStatus: {
      processing: certificates.filter((c) => c.status === "processing").length,
      ready: certificates.filter((c) => c.status === "ready").length,
    },
    revenue: certificates.reduce((sum, c) => sum + c.amount, 0),
  }

  // Blotter stats
  const blotterStats = {
    total: blotters.length,
    byStatus: {
      filed: blotters.filter((b) => b.status === "filed").length,
      under_investigation: blotters.filter((b) => b.status === "under_investigation").length,
      scheduled_mediation: blotters.filter((b) => b.status === "scheduled_mediation").length,
      resolved: blotters.filter((b) => b.status === "resolved").length,
      escalated: blotters.filter((b) => b.status === "escalated").length,
    },
    byType: blotters.reduce(
      (acc, b) => {
        acc[b.incidentType] = (acc[b.incidentType] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ),
    resolutionRate:
      blotters.length > 0
        ? ((blotters.filter((b) => b.status === "resolved").length / blotters.length) * 100).toFixed(1)
        : 0,
  }

  // Activity stats
  const activityStats = {
    totalActivities: certificates.length + blotters.length + announcements.length,
    certificates: certificates.length,
    blotters: blotters.length,
    announcements: announcements.filter((a) => a.isPublished).length,
    draftAnnouncements: announcements.filter((a) => !a.isPublished).length,
  }

  const getReportTitle = (type: ReportType) => {
    switch (type) {
      case "certificate_summary":
        return "Certificate Issuance Summary (BGPMS)"
      case "blotter_summary":
        return "Blotter/Complaint Summary"
      case "financial_summary":
        return "Financial Summary"
      case "lupong_tagapamayapa":
        return "Lupong Tagapamayapa Report"
      case "activity_report":
        return "Activity Reports"
    }
  }

  const handleExportCSV = () => {
    let csvContent = ""
    let filename = ""

    if (selectedReport === "certificate_summary") {
      csvContent = "Certificate Type,Count,Revenue\n"
      Object.entries(certStats.byType).forEach(([type, count]) => {
        const revenue = certificates.filter((c) => c.certificateType === type).reduce((sum, c) => sum + c.amount, 0)
        csvContent += `${type},${count},${revenue.toFixed(2)}\n`
      })
      filename = `certificate_summary_${period}.csv`
    } else if (selectedReport === "blotter_summary") {
      csvContent = "Status,Count\n"
      Object.entries(blotterStats.byStatus).forEach(([status, count]) => {
        csvContent += `${status.replace("_", " ")},${count}\n`
      })
      filename = `blotter_summary_${period}.csv`
    } else if (selectedReport === "financial_summary") {
      csvContent = "Category,Amount\n"
      csvContent += `Total Revenue,${certStats.revenue.toFixed(2)}\n`
      Object.entries(certStats.byType).forEach(([type, count]) => {
        const revenue = certificates.filter((c) => c.certificateType === type).reduce((sum, c) => sum + c.amount, 0)
        csvContent += `${type},${revenue.toFixed(2)}\n`
      })
      filename = `financial_summary_${period}.csv`
    } else if (selectedReport === "activity_report") {
      csvContent = "Activity Type,Count\n"
      csvContent += `Certificates Issued,${activityStats.certificates}\n`
      csvContent += `Blotters Filed,${activityStats.blotters}\n`
      csvContent += `Announcements Published,${activityStats.announcements}\n`
      csvContent += `Draft Announcements,${activityStats.draftAnnouncements}\n`
      csvContent += `Total Activities,${activityStats.totalActivities}\n`
      filename = `activity_report_${period}.csv`
    } else {
      csvContent = "Metric,Value\n"
      csvContent += `Total Cases,${blotterStats.total}\n`
      csvContent += `Resolved,${blotterStats.byStatus.resolved}\n`
      csvContent += `Mediation Scheduled,${blotterStats.byStatus.scheduled_mediation}\n`
      csvContent += `Resolution Rate,${blotterStats.resolutionRate}%\n`
      filename = `lupong_report_${period}.csv`
    }

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExportPDF = async () => {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()

    // Header
    doc.setFontSize(18)
    doc.text("Barangay Mawaque", 105, 20, { align: "center" })
    doc.setFontSize(14)
    doc.text("Mabalacat, Pampanga", 105, 28, { align: "center" })
    doc.setFontSize(12)
    doc.text(getReportTitle(selectedReport), 105, 38, { align: "center" })
    doc.setFontSize(10)
    doc.text(`Period: ${period}`, 105, 46, { align: "center" })
    doc.text(`Generated: ${new Date().toLocaleDateString("en-PH")}`, 105, 52, { align: "center" })

    // Line separator
    doc.setLineWidth(0.5)
    doc.line(20, 58, 190, 58)

    let yPos = 68

    if (selectedReport === "certificate_summary") {
      doc.setFontSize(12)
      doc.text(`Total Certificates Issued: ${certStats.total}`, 20, yPos)
      yPos += 10
      doc.text(`Total Revenue: PHP ${certStats.revenue.toFixed(2)}`, 20, yPos)
      yPos += 15

      doc.setFontSize(11)
      doc.text("Breakdown by Type:", 20, yPos)
      yPos += 8

      Object.entries(certStats.byType).forEach(([type, count]) => {
        const revenue = certificates.filter((c) => c.certificateType === type).reduce((sum, c) => sum + c.amount, 0)
        doc.text(`  ${type}: ${count} issued (PHP ${revenue.toFixed(2)})`, 25, yPos)
        yPos += 7
      })
    } else if (selectedReport === "blotter_summary") {
      doc.setFontSize(12)
      doc.text(`Total Blotters Filed: ${blotterStats.total}`, 20, yPos)
      yPos += 15

      doc.setFontSize(11)
      doc.text("Status Breakdown:", 20, yPos)
      yPos += 8

      Object.entries(blotterStats.byStatus).forEach(([status, count]) => {
        doc.text(`  ${status.replace("_", " ")}: ${count}`, 25, yPos)
        yPos += 7
      })

      yPos += 8
      doc.text("Incident Types:", 20, yPos)
      yPos += 8

      Object.entries(blotterStats.byType).forEach(([type, count]) => {
        doc.text(`  ${type}: ${count}`, 25, yPos)
        yPos += 7
      })
    } else if (selectedReport === "financial_summary") {
      doc.setFontSize(12)
      doc.text(`Total Revenue: PHP ${certStats.revenue.toFixed(2)}`, 20, yPos)
      yPos += 15

      doc.setFontSize(11)
      doc.text("Revenue by Certificate Type:", 20, yPos)
      yPos += 8

      Object.entries(certStats.byType).forEach(([type, count]) => {
        const revenue = certificates.filter((c) => c.certificateType === type).reduce((sum, c) => sum + c.amount, 0)
        doc.text(`  ${type}: PHP ${revenue.toFixed(2)} (${count} transactions)`, 25, yPos)
        yPos += 7
      })
    } else if (selectedReport === "activity_report") {
      doc.setFontSize(12)
      doc.text(`Total Activities: ${activityStats.totalActivities}`, 20, yPos)
      yPos += 15

      doc.setFontSize(11)
      doc.text("Activity Breakdown:", 20, yPos)
      yPos += 8

      doc.text(`  Certificates Issued: ${activityStats.certificates}`, 25, yPos)
      yPos += 7
      doc.text(`  Blotters Filed: ${activityStats.blotters}`, 25, yPos)
      yPos += 7
      doc.text(`  Announcements Published: ${activityStats.announcements}`, 25, yPos)
      yPos += 7
      doc.text(`  Draft Announcements: ${activityStats.draftAnnouncements}`, 25, yPos)
    } else {
      doc.setFontSize(12)
      doc.text("Lupong Tagapamayapa Summary", 20, yPos)
      yPos += 10
      doc.text(`Total Cases Handled: ${blotterStats.total}`, 20, yPos)
      yPos += 8
      doc.text(`Resolution Rate: ${blotterStats.resolutionRate}%`, 20, yPos)
      yPos += 15

      doc.setFontSize(11)
      doc.text("Case Disposition:", 20, yPos)
      yPos += 8

      doc.text(`  Cases Resolved: ${blotterStats.byStatus.resolved}`, 25, yPos)
      yPos += 7
      doc.text(`  Mediations Scheduled: ${blotterStats.byStatus.scheduled_mediation}`, 25, yPos)
      yPos += 7
      doc.text(`  Under Investigation: ${blotterStats.byStatus.under_investigation}`, 25, yPos)
      yPos += 7
      doc.text(`  Escalated to Higher Courts: ${blotterStats.byStatus.escalated}`, 25, yPos)
    }

    // Footer
    doc.setFontSize(9)
    doc.text("This is a computer-generated report.", 105, 280, { align: "center" })
    doc.text("Barangay Mawaque Digital Services", 105, 286, { align: "center" })

    doc.save(`${selectedReport}_${period}.pdf`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link href={`/staff/${staffUser?.role}`} className="text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            <h1 className="text-lg font-semibold text-slate-900">DILG Reports</h1>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 px-5 py-6">
        {/* Report Selection */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="space-y-4 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-slate-700">Report Type</label>
                <Select value={selectedReport} onValueChange={(v) => setSelectedReport(v as ReportType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="certificate_summary">Certificate Issuance Summary (BGPMS)</SelectItem>
                    <SelectItem value="blotter_summary">Blotter/Complaint Summary</SelectItem>
                    <SelectItem value="financial_summary">Financial Summary</SelectItem>
                    <SelectItem value="lupong_tagapamayapa">Lupong Tagapamayapa Report</SelectItem>
                    <SelectItem value="activity_report">Activity Reports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-[140px]">
                <label className="mb-1 block text-sm font-medium text-slate-700">Period</label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025-01">Jan 2025</SelectItem>
                    <SelectItem value="2025-Q1">Q1 2025</SelectItem>
                    <SelectItem value="2024">Year 2024</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportCSV} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={handleExportPDF} variant="outline" className="flex-1 bg-transparent">
                <FileText className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Certificate Summary Report */}
        {selectedReport === "certificate_summary" && (
          <div className="space-y-4">
            <Card className="border-0 bg-gradient-to-br from-emerald-500 to-emerald-600">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-100">Total Certificates Issued</p>
                    <p className="mt-1 text-4xl font-bold text-white">{certStats.total}</p>
                  </div>
                  <FileText className="h-12 w-12 text-white/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">By Certificate Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(certStats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{type}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${(count / certStats.total) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-semibold text-slate-900">{count}</span>
                    </div>
                  </div>
                ))}
                {Object.keys(certStats.byType).length === 0 && (
                  <p className="py-4 text-center text-sm text-slate-500">No data available</p>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Calendar className="h-4 w-4" />
                    <span className="text-xs font-medium">Processing</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-amber-900">{certStats.byStatus.processing}</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-emerald-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Completed</span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-emerald-900">{certStats.byStatus.ready}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Blotter Summary Report */}
        {selectedReport === "blotter_summary" && (
          <div className="space-y-4">
            <Card className="border-0 bg-gradient-to-br from-red-500 to-red-600">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-100">Total Blotters Filed</p>
                    <p className="mt-1 text-4xl font-bold text-white">{blotterStats.total}</p>
                  </div>
                  <AlertTriangle className="h-12 w-12 text-white/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">By Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(blotterStats.byStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm capitalize text-slate-600">{status.replace("_", " ")}</span>
                    <span className="text-sm font-semibold text-slate-900">{count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">By Incident Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(blotterStats.byType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">{type}</span>
                    <span className="text-sm font-semibold text-slate-900">{count}</span>
                  </div>
                ))}
                {Object.keys(blotterStats.byType).length === 0 && (
                  <p className="py-4 text-center text-sm text-slate-500">No incidents recorded</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Financial Summary */}
        {selectedReport === "financial_summary" && (
          <div className="space-y-4">
            <Card className="border-0 bg-gradient-to-br from-blue-600 to-blue-700">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100">Total Revenue</p>
                    <p className="mt-1 text-4xl font-bold text-white">
                      ₱{certStats.revenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <Banknote className="h-12 w-12 text-white/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Revenue by Certificate Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(certStats.byType).map(([type, count]) => {
                  const revenue = certificates
                    .filter((c) => c.certificateType === type)
                    .reduce((sum, c) => sum + c.amount, 0)
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-slate-900">{type}</span>
                        <span className="ml-2 text-xs text-slate-400">({count} issued)</span>
                      </div>
                      <span className="font-semibold text-emerald-600">
                        ₱{revenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lupong Tagapamayapa Report */}
        {selectedReport === "lupong_tagapamayapa" && (
          <div className="space-y-4">
            <Card className="border-0 bg-gradient-to-br from-purple-600 to-purple-700">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-100">Resolution Rate</p>
                    <p className="mt-1 text-4xl font-bold text-white">{blotterStats.resolutionRate}%</p>
                  </div>
                  <Users className="h-12 w-12 text-white/30" />
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 bg-emerald-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-900">{blotterStats.byStatus.resolved}</p>
                  <p className="text-xs font-medium text-emerald-700">Cases Resolved</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-purple-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-purple-900">{blotterStats.byStatus.scheduled_mediation}</p>
                  <p className="text-xs font-medium text-purple-700">Mediations Set</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-amber-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-amber-900">{blotterStats.byStatus.under_investigation}</p>
                  <p className="text-xs font-medium text-amber-700">Under Investigation</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-red-50">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-red-900">{blotterStats.byStatus.escalated}</p>
                  <p className="text-xs font-medium text-red-700">Escalated</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 bg-slate-50">
              <CardContent className="p-4">
                <h3 className="mb-3 font-semibold text-slate-900">Compliance Summary</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    Total disputes handled: {blotterStats.total}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    Successfully mediated: {blotterStats.byStatus.resolved}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    Pending resolution:{" "}
                    {blotterStats.total - blotterStats.byStatus.resolved - blotterStats.byStatus.escalated}
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    Referred to higher courts: {blotterStats.byStatus.escalated}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Activity Report */}
        {selectedReport === "activity_report" && (
          <div className="space-y-4">
            <Card className="border-0 bg-gradient-to-br from-indigo-500 to-indigo-600">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-100">Total Activities</p>
                    <p className="mt-1 text-4xl font-bold text-white">{activityStats.totalActivities}</p>
                  </div>
                  <Activity className="h-12 w-12 text-white/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Activity Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100">
                      <FileText className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Certificates Issued</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-600">{activityStats.certificates}</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Blotters Filed</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">{activityStats.blotters}</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
                      <Megaphone className="h-4 w-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Announcements Published</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{activityStats.announcements}</span>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-slate-100 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200">
                      <FileText className="h-4 w-4 text-slate-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">Draft Announcements</span>
                  </div>
                  <span className="text-lg font-bold text-slate-600">{activityStats.draftAnnouncements}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 bg-indigo-50">
              <CardContent className="p-4">
                <h3 className="mb-3 font-semibold text-indigo-900">Period Summary</h3>
                <p className="text-sm text-indigo-700">
                  During this period, Barangay Mawaque processed {activityStats.certificates} certificate requests,
                  handled {activityStats.blotters} blotter reports, and published {activityStats.announcements}{" "}
                  community announcements.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
