"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  User,
  MapPin,
  Phone,
  Printer,
  History,
  Scan,
  RefreshCw,
  Search,
  Calendar,
  MoreHorizontal
} from "lucide-react"
import { QRScanner } from "@/components/qr-scanner"
import { QRTStatusBadge } from "@/components/qrt-status-badge"
import { motion, AnimatePresence } from "framer-motion"
import { slideUp, fadeIn, staggerContainer, scaleIn } from "@/lib/animations"
import { cn } from "@/lib/utils"
import { useQRT } from "@/lib/qrt-context"

type VerificationStatus = "valid" | "invalid" | "expired"

interface VerificationResult {
  status: VerificationStatus
  qrtData?: any
  verifiedAt?: string
}

export default function QRTVerifyPage() {
  const router = useRouter()
  const { staffUser, isStaffAuthenticated, isLoading } = useAuth()
  const { findQRTByVerificationCode, getQRTByCode, logVerification, getVerificationLogs } = useQRT()
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [recentVerifications, setRecentVerifications] = useState<any[]>([])
  const [isScanning, setIsScanning] = useState(true)

  useEffect(() => {
    if (!isLoading && !isStaffAuthenticated) {
      router.push("/staff/login")
    }
  }, [isLoading, isStaffAuthenticated, router])

  if (isLoading || !isStaffAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-10 w-10 rounded-full border-4 border-emerald-500 border-t-transparent" 
        />
      </div>
    )
  }

  const handleVerify = async (code: string) => {
    if (!code) return

    setIsVerifying(true)
    setIsScanning(false)

    // Simulate high-end verification animation delay
    await new Promise(resolve => setTimeout(resolve, 1500))

    // Try to find QRT by verificationCode or qrtCode
    let qrt = findQRTByVerificationCode(code)
    if (!qrt) {
      qrt = getQRTByCode(code)
    }

    let result: VerificationResult
    if (qrt) {
      // Check if expired
      const isExpired = qrt.expiryDate && new Date(qrt.expiryDate) < new Date()

      // Map QRT data to verification result format
      const qrtData = {
        qrtCode: qrt.qrtCode,
        fullName: qrt.fullName,
        birthDate: qrt.birthDate,
        address: qrt.address,
        gender: qrt.gender,
        civilStatus: qrt.civilStatus,
        yearsResident: qrt.yearsResident,
        contactName: qrt.emergencyContactName,
        contactRelation: qrt.emergencyContactRelationship,
        contactPhone: qrt.emergencyContactPhone,
        contactAddress: qrt.emergencyContactAddress,
        status: isExpired ? "expired" : qrt.status,
        issueDate: qrt.issuedDate,
        expiryDate: qrt.expiryDate,
        photo: qrt.photoUrl
      }

      result = {
        status: isExpired ? "expired" : "valid",
        qrtData: qrtData,
        verifiedAt: new Date().toISOString()
      }

      // Log the verification
      logVerification(qrt.qrtCode, qrt.verificationCode, staffUser?.fullName || "Staff")
    } else {
      result = { status: "invalid" }
    }

    setVerificationResult(result)
    setRecentVerifications(prev => [result, ...prev].slice(0, 5))
    setIsVerifying(false)
  }

  const handleQRScan = (data: string) => {
    // If data is JSON (from our QR generator), parse it
    try {
      const parsed = JSON.parse(data)
      // Try verificationCode first, then qrtCode
      if (parsed.verificationCode) {
        handleVerify(parsed.verificationCode)
      } else if (parsed.qrtCode) {
        handleVerify(parsed.qrtCode)
      } else {
        handleVerify(data)
      }
    } catch {
      handleVerify(data)
    }
  }

  const resetVerification = () => {
    setVerificationResult(null)
    setIsScanning(true)
  }

  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      {/* Premium Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center bg-white/80 backdrop-blur-xl px-4 border-b border-gray-100">
        <button 
          onClick={() => router.back()}
          className="mr-4 h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-900" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-black uppercase tracking-widest text-gray-400">Security Terminal</h1>
          <p className="text-lg font-black text-gray-900">ID Verification</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Secure</span>
        </div>
      </header>

      <main className="mx-auto max-w-md p-4 space-y-6">
        <AnimatePresence mode="wait">
          {isVerifying ? (
            <motion.div
              key="verifying"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="relative h-24 w-24 mb-8">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500"
                />
                <div className="absolute inset-4 flex items-center justify-center">
                  <ShieldCheck className="h-10 w-10 text-emerald-500" />
                </div>
              </div>
              <h2 className="text-xl font-black text-gray-900 mb-2">Verifying Credentials</h2>
              <p className="text-sm font-medium text-gray-400">Communicating with secure database...</p>
            </motion.div>
          ) : verificationResult ? (
            <motion.div
              key="result"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* Status Banner */}
              <motion.div variants={slideUp}>
                <Card className={cn(
                  "overflow-hidden border-0 shadow-lg transition-colors duration-500",
                  verificationResult.status === "valid" ? "bg-emerald-500" :
                  verificationResult.status === "expired" ? "bg-amber-500" : "bg-red-500"
                )}>
                  <CardContent className="p-8 text-center text-white">
                    <motion.div variants={scaleIn}>
                      {verificationResult.status === "valid" ? (
                        <div className="mx-auto h-20 w-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/30">
                          <CheckCircle2 className="h-12 w-12 text-white" />
                        </div>
                      ) : verificationResult.status === "expired" ? (
                        <div className="mx-auto h-20 w-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/30">
                          <AlertTriangle className="h-12 w-12 text-white" />
                        </div>
                      ) : (
                        <div className="mx-auto h-20 w-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/30">
                          <XCircle className="h-12 w-12 text-white" />
                        </div>
                      )}
                    </motion.div>
                    
                    <h2 className="mt-6 text-3xl font-black tracking-tight">
                      {verificationResult.status === "valid" ? "VERIFIED VALID" :
                       verificationResult.status === "expired" ? "ID EXPIRED" : "INVALID ID"}
                    </h2>
                    
                    {verificationResult.qrtData && (
                      <p className="mt-2 text-sm font-bold opacity-80 tracking-widest uppercase">
                        {verificationResult.qrtData.qrtCode}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Resident Data Card */}
              {verificationResult.qrtData && (
                <motion.div variants={slideUp}>
                  <Card className="border-0 shadow-xl shadow-gray-200/50 rounded-[32px] overflow-hidden bg-white">
                    <CardContent className="p-0">
                      <div className="p-6 border-b border-gray-50 flex items-center gap-5">
                        <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-4 border-gray-50 ring-1 ring-gray-100 shadow-sm">
                          <Image 
                            src={verificationResult.qrtData.photo} 
                            alt="Resident" 
                            fill 
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-black text-gray-900 leading-tight">
                            {verificationResult.qrtData.fullName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              Resident
                            </span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {calculateAge(verificationResult.qrtData.birthDate)}Y • {verificationResult.qrtData.gender}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Civil Status</p>
                          <p className="text-sm font-bold text-gray-900">{verificationResult.qrtData.civilStatus}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Residency</p>
                          <p className="text-sm font-bold text-gray-900">{verificationResult.qrtData.yearsResident} Years</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Registered Address</p>
                          <p className="text-sm font-bold text-gray-900 leading-relaxed">{verificationResult.qrtData.address}</p>
                        </div>
                        <div className="col-span-2 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Emergency Contact</p>
                            <Phone className="h-3 w-3 text-emerald-500" />
                          </div>
                          <p className="text-sm font-bold text-gray-900">{verificationResult.qrtData.contactName}</p>
                          <p className="text-[10px] font-medium text-gray-500 mb-2">{verificationResult.qrtData.contactRelation}</p>
                          <p className="text-sm font-black text-emerald-600">{verificationResult.qrtData.contactPhone}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50/50 flex gap-3">
                        <Button 
                          className="flex-1 h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-bold shadow-lg shadow-emerald-200" 
                          onClick={resetVerification}
                        >
                          <Scan className="mr-2 h-5 w-5" />
                          Scan Next
                        </Button>
                        <Button variant="outline" className="h-14 w-14 rounded-2xl border-gray-200 bg-white shadow-sm">
                          <Printer className="h-6 w-6 text-gray-600" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
              
              {!verificationResult.qrtData && (
                <motion.div variants={slideUp}>
                  <Button 
                    className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-700 font-bold shadow-lg shadow-red-200" 
                    onClick={resetVerification}
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    Try Again
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-[32px] blur opacity-20 group-hover:opacity-30 transition-all duration-500" />
                <div className="relative">
                  <QRScanner 
                    onScan={handleQRScan} 
                    onError={(err) => console.error(err)} 
                  />
                </div>
              </div>

              {/* Tips Section */}
              <div className="p-6 rounded-[32px] bg-white shadow-sm border border-gray-100 flex gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Search className="h-6 w-6 text-emerald-600" />
                 </div>
                 <div>
                    <h4 className="font-black text-gray-900 text-sm">Scanner Protocol</h4>
                    <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                      Ensure the QR code is centered and well-lit for optimal verification speed.
                    </p>
                 </div>
              </div>

              {/* Recent Activity */}
              {recentVerifications.length > 0 && (
                <motion.div variants={slideUp} initial="hidden" animate="visible" className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Recent Logs</h3>
                    <History className="h-3 w-3 text-gray-300" />
                  </div>
                  <div className="space-y-2">
                    {recentVerifications.map((result, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer rounded-2xl bg-white overflow-hidden">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <div className={cn(
                                 "h-10 w-10 rounded-xl flex items-center justify-center",
                                 result.status === 'valid' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                               )}>
                                 <User className="h-5 w-5" />
                               </div>
                               <div>
                                 <p className="text-sm font-black text-gray-900 leading-none mb-1">
                                   {result.qrtData?.fullName || "Unrecognized ID"}
                                 </p>
                                 <p className="text-[10px] font-bold text-gray-400 tracking-widest">
                                   {result.qrtData?.qrtCode || "FAILED_SCAN"}
                                 </p>
                               </div>
                            </div>
                            <div className="text-right">
                               <QRTStatusBadge 
                                 status={result.status === 'valid' ? 'issued' : result.status === 'expired' ? 'expired' : 'rejected'} 
                                 size="sm" 
                               />
                               <p className="text-[9px] font-bold text-gray-300 mt-1 uppercase">
                                 {new Date(result.verifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                               </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
