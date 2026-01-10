"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useCertificates } from "@/lib/certificate-context"
import { useBlotters } from "@/lib/blotter-context"
import { useAnnouncements } from "@/lib/announcements-context"
import { useBayanihan } from "@/lib/bayanihan-context"
import { useQRT } from "@/lib/qrt-context"
import { useDelivery } from "@/lib/delivery-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LiveQRScanner } from "@/components/live-qr-scanner"
import { QRTIDRequest } from "@/lib/qrt-types"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import { fadeIn, slideUp, scaleIn, staggerContainer } from "@/lib/animations"
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
  HandHeart,
  ScanLine,
  Phone,
  User,
  ExternalLink,
  Printer,
  History,
  X,
  Search,
  Filter,
  Download,
  Truck,
} from "lucide-react"

export default function CaptainDashboard() {
  const router = useRouter()
  const { staffUser, isStaffAuthenticated, isLoading, staffLogout } = useAuth()
  const { certificates } = useCertificates()
  const { blotters } = useBlotters()
  const { announcements } = useAnnouncements()
  const { getPendingCount, getHighUrgencyCount } = useBayanihan()
  const { findQRTByVerificationCode, getQRTByCode, logVerification, getVerificationLogs } = useQRT()
  const { deliveryRequests } = useDelivery()

  // Scanner state
  const [showScanner, setShowScanner] = useState(false)
  const [scannedQRT, setScannedQRT] = useState<QRTIDRequest | null>(null)
  const [scanError, setScanError] = useState<string | null>(null)

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

  const handleQRScan = (data: string) => {
    try {
      setScanError(null)
      const parsed = JSON.parse(data)

      // Accept both verificationCode and qrtCode
      let verificationCode = parsed.verificationCode
      let qrt: QRTIDRequest | undefined

      if (verificationCode) {
        console.log(`[Scanner] Scanned verificationCode: ${verificationCode}`)
        qrt = findQRTByVerificationCode(verificationCode)
      } else if (parsed.qrtCode) {
        console.log(`[Scanner] Scanned qrtCode: ${parsed.qrtCode}`)
        qrt = getQRTByCode(parsed.qrtCode)
        if (qrt) {
          verificationCode = qrt.verificationCode
        }
      } else {
        setScanError("Invalid QR code: No verification code or QRT code found")
        return
      }

      if (qrt && verificationCode) {
        setScannedQRT(qrt)
        logVerification(qrt.qrtCode, verificationCode, staffUser?.fullName || "Captain")

        // Trigger confetti on success
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#059669', '#34D399']
        })

        console.log(`[Verification] Successfully verified: ${qrt.qrtCode}`)
      } else {
        setScanError("QRT ID not found in system")
        console.log(`[Verification] QRT not found in system`)
      }
    } catch (error) {
      setScanError("Invalid QR code format")
      console.error("[Scanner] Parse error:", error)
    }
  }

  const handleScanError = (error: string) => {
    setScanError(error)
  }

  const handleCloseScanner = () => {
    setShowScanner(false)
    setScannedQRT(null)
    setScanError(null)
  }

  const pendingCerts = certificates.filter((c) => c.status === "processing").length
  const completedCerts = certificates.filter((c) => c.status === "ready").length
  const activeComplaints = blotters.filter((b) => !["resolved", "dismissed"].includes(b.status)).length
  const publishedAnnouncements = announcements.filter((a) => a.isPublished).length
  const pendingDeliveries = deliveryRequests.filter((d) => ["requested", "printing", "printed"].includes(d.status)).length
  const outForDelivery = deliveryRequests.filter((d) => d.status === "out_for_delivery").length

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-100 bg-white px-4">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            <Image src="/images/logo.png" alt="Barangay Mawaque" fill className="object-contain" />
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
                <p className="text-xl font-bold text-emerald-900">{certificates.filter(c => c.staffSignature).length}</p>
                <p className="text-[10px] font-medium text-emerald-700">Digitally Signed</p>
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

          <Card className={`h-[88px] border-0 shadow-sm ${getHighUrgencyCount() > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
            <CardContent className="flex h-full items-center gap-3 p-3 relative">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${getHighUrgencyCount() > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}>
                <HandHeart className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className={`text-xl font-bold ${getHighUrgencyCount() > 0 ? 'text-red-900' : 'text-emerald-900'}`}>{getPendingCount()}</p>
                <p className={`text-[10px] font-medium ${getHighUrgencyCount() > 0 ? 'text-red-700' : 'text-emerald-700'}`}>Bayanihan Requests</p>
              </div>
              {getHighUrgencyCount() > 0 && (
                <div className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                  {getHighUrgencyCount()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <h2 className="mb-2 text-sm font-bold text-gray-900">Quick Actions</h2>
        <div className="space-y-2">
          {/* Quick Scan QRT ID Card */}
          <Card
            className="border-0 shadow-sm transition-all active:scale-[0.98] cursor-pointer bg-gradient-to-r from-emerald-50 to-emerald-100"
            onClick={() => setShowScanner(true)}
          >
            <CardContent className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600">
                  <ScanLine className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Quick Scan QRT ID</p>
                  <p className="text-[10px] text-gray-500">Verify resident identification</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </CardContent>
          </Card>

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

          <Link href="/staff/bayanihan">
            <Card className="border-0 shadow-sm transition-all active:scale-[0.98]">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${getHighUrgencyCount() > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}>
                    <HandHeart className={`h-5 w-5 ${getHighUrgencyCount() > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Bayanihan Requests</p>
                    <p className="text-[10px] text-gray-500">
                      {getPendingCount()} pending{getHighUrgencyCount() > 0 ? `, ${getHighUrgencyCount()} urgent` : ''}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/staff/delivery-management">
            <Card className="border-0 shadow-sm transition-all active:scale-[0.98]">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${outForDelivery > 0 ? 'bg-blue-100' : 'bg-slate-100'}`}>
                    <Truck className={`h-5 w-5 ${outForDelivery > 0 ? 'text-blue-600' : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">ID Deliveries</p>
                    <p className="text-[10px] text-gray-500">
                      {pendingDeliveries} pending{outForDelivery > 0 ? `, ${outForDelivery} out for delivery` : ''}
                    </p>
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
                      {cert.staffSignature && (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Signed by {cert.signedBy?.split(" ")[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {cert.staffSignature && (
                    <img 
                      src={cert.staffSignature} 
                      alt="Signature" 
                      className="mr-2 h-6 w-auto opacity-50"
                    />
                  )}
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

      {/* QR Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={handleCloseScanner}>
        <DialogContent className="sm:max-w-2xl overflow-hidden p-0 border-0 bg-transparent shadow-none">
          <AnimatePresence mode="wait">
            {!scannedQRT && !scanError ? (
              <motion.div
                key="scanner"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden p-6"
              >
                <DialogHeader className="mb-6 flex items-center justify-between flex-row space-y-0">
                  <div>
                    <DialogTitle className="text-xl font-bold text-gray-900">Identify Resident</DialogTitle>
                    <p className="text-xs text-gray-500">Scan QR code for instant verification</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleCloseScanner} className="rounded-full">
                    <X className="h-5 w-5" />
                  </Button>
                </DialogHeader>
                
                <div className="relative max-w-sm mx-auto overflow-hidden rounded-2xl">
                  <LiveQRScanner onScan={handleQRScan} onError={handleScanError} />
                </div>
              </motion.div>
            ) : scanError ? (
              <motion.div
                key="error"
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 text-center"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-gray-900">Verification Failed</DialogTitle>
                </DialogHeader>
                <p className="mt-2 text-sm text-gray-500">{scanError}</p>
                <Button
                  onClick={() => setScanError(null)}
                  className="mt-6 w-full bg-red-600 hover:bg-red-700 rounded-xl h-12 font-semibold"
                >
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleCloseScanner}
                  className="mt-2 w-full text-gray-500"
                >
                  Cancel
                </Button>
              </motion.div>
            ) : scannedQRT ? (
              <motion.div
                key="success"
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring" }}
                className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden"
              >
                <DialogHeader className="sr-only">
                  <DialogTitle>Resident Verified Successfully</DialogTitle>
                </DialogHeader>
                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-8 text-white">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md">
                      <CheckCircle2 className="h-6 w-6" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest">
                      Verified Resident
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="h-24 w-24 rounded-full border-4 border-white/30 overflow-hidden bg-white/10 shadow-xl">
                        {scannedQRT.photoUrl ? (
                          <img src={scannedQRT.photoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-full w-full p-4" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-emerald-400 border-4 border-emerald-600 flex items-center justify-center shadow-lg">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold leading-tight">{scannedQRT.fullName}</h2>
                      <p className="text-emerald-100 text-sm font-medium">{scannedQRT.qrtCode}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <p className="text-sm font-bold text-gray-900 capitalize">{scannedQRT.status}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Issued Date</p>
                      <p className="text-sm font-bold text-gray-900">
                        {scannedQRT.issuedDate ? new Date(scannedQRT.issuedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                      <History className="h-3.5 w-3.5" />
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="justify-start gap-2 h-11 rounded-xl border-slate-200">
                        <Phone className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-semibold">Emergency</span>
                      </Button>
                      <Button variant="outline" className="justify-start gap-2 h-11 rounded-xl border-slate-200">
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-semibold">Profile</span>
                      </Button>
                      <Button variant="outline" className="justify-start gap-2 h-11 rounded-xl border-slate-200">
                        <Printer className="h-4 w-4 text-gray-600" />
                        <span className="text-xs font-semibold">Print</span>
                      </Button>
                      <Button variant="outline" className="justify-start gap-2 h-11 rounded-xl border-slate-200">
                        <Download className="h-4 w-4 text-emerald-600" />
                        <span className="text-xs font-semibold">Export</span>
                      </Button>
                    </div>
                  </div>

                  <Button
                    onClick={handleCloseScanner}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-2xl h-14 font-bold text-base shadow-xl"
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  )
}
