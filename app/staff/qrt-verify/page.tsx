"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  User,
  MapPin,
  Phone,
  Printer
} from "lucide-react"
import { QRScanner } from "@/components/qr-scanner"
import { QRTStatusBadge } from "@/components/qrt-status-badge"

// Mock data for verification results - in a real app this would come from the API
const MOCK_RESIDENTS = {
  "QRT-2025-000001": {
    qrtCode: "QRT-2025-000001",
    fullName: "Juan Dela Cruz",
    birthDate: "1990-01-15",
    address: "Purok 1, Mawaque",
    gender: "Male",
    civilStatus: "Married",
    yearsResident: 35,
    contactName: "Maria Dela Cruz",
    contactRelation: "Spouse",
    contactPhone: "0917-123-4567",
    contactAddress: "Purok 1, Mawaque",
    status: "active",
    issueDate: "2025-01-01",
    expiryDate: "2025-12-31",
    photo: "/placeholder-user.jpg"
  },
  "QRT-2025-000002": {
    qrtCode: "QRT-2025-000002",
    fullName: "Maria Santos",
    birthDate: "1992-05-20",
    address: "Purok 2, Mawaque",
    gender: "Female",
    civilStatus: "Single",
    yearsResident: 32,
    contactName: "Jose Santos",
    contactRelation: "Father",
    contactPhone: "0918-123-4567",
    contactAddress: "Purok 2, Mawaque",
    status: "expired",
    issueDate: "2024-01-01",
    expiryDate: "2024-12-31",
    photo: "/placeholder-user.jpg"
  }
}

type VerificationStatus = "valid" | "invalid" | "expired"

interface VerificationResult {
  status: VerificationStatus
  qrtData?: any
  verifiedAt?: string
}

export default function QRTVerifyPage() {
  const router = useRouter()
  const { staffUser, isStaffAuthenticated, isLoading } = useAuth()
  const [qrtCode, setQrtCode] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)
  const [recentVerifications, setRecentVerifications] = useState<any[]>([])

  useEffect(() => {
    if (!isLoading && !isStaffAuthenticated) {
      router.push("/staff/login")
    }
  }, [isLoading, isStaffAuthenticated, router])

  if (isLoading || !isStaffAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  const handleVerify = async (code: string) => {
    if (!code) return

    setIsVerifying(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const data = MOCK_RESIDENTS[code as keyof typeof MOCK_RESIDENTS]
    
    if (data) {
      const isExpired = data.status === "expired"
      const result: VerificationResult = {
        status: isExpired ? "expired" : "valid",
        qrtData: data,
        verifiedAt: new Date().toISOString()
      }
      setVerificationResult(result)
      setRecentVerifications(prev => [result, ...prev].slice(0, 5))
    } else {
      setVerificationResult({ status: "invalid" })
    }
    
    setIsVerifying(false)
  }

  const handleQRScan = (data: string) => {
    setQrtCode(data)
    handleVerify(data)
  }

  const handleScanError = (error: string) => {
    console.error("Scan error:", error)
  }

  const resetVerification = () => {
    setVerificationResult(null)
    setQrtCode("")
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
      <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-slate-100 bg-white px-4">
        <div className="flex items-center gap-3">
          <Link href="/staff/secretary">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <h1 className="text-sm font-bold text-gray-900">QRT Verification</h1>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-md p-4">
        {verificationResult ? (
          <div className="space-y-4">
            <Card className={`overflow-hidden border-0 shadow-sm ${
              verificationResult.status === "valid" ? "bg-emerald-50" :
              verificationResult.status === "expired" ? "bg-amber-50" : "bg-red-50"
            }`}>
              <CardContent className="p-6 text-center">
                {verificationResult.status === "valid" ? (
                  <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" />
                ) : verificationResult.status === "expired" ? (
                  <AlertTriangle className="mx-auto h-16 w-16 text-amber-600" />
                ) : (
                  <XCircle className="mx-auto h-16 w-16 text-red-600" />
                )}
                
                <h2 className={`mt-4 text-2xl font-bold ${
                  verificationResult.status === "valid" ? "text-emerald-700" :
                  verificationResult.status === "expired" ? "text-amber-700" : "text-red-700"
                }`}>
                  {verificationResult.status === "valid" ? "Valid QRT ID" :
                   verificationResult.status === "expired" ? "ID Expired" : "Invalid ID"}
                </h2>
                
                {verificationResult.qrtData && (
                  <p className="mt-2 text-sm font-medium text-gray-600">
                    {verificationResult.qrtData.qrtCode}
                  </p>
                )}
              </CardContent>
            </Card>

            {verificationResult.qrtData && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-full border border-slate-200">
                      <Image 
                        src={verificationResult.qrtData.photo} 
                        alt="Resident" 
                        fill 
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{verificationResult.qrtData.fullName}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        <span>
                          {calculateAge(verificationResult.qrtData.birthDate)} years old • {verificationResult.qrtData.gender}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3 text-xs">
                    <div>
                      <p className="text-slate-500">Address</p>
                      <p className="font-medium text-slate-900">{verificationResult.qrtData.address}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Civil Status</p>
                      <p className="font-medium text-slate-900">{verificationResult.qrtData.civilStatus}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Resident Since</p>
                      <p className="font-medium text-slate-900">{new Date().getFullYear() - verificationResult.qrtData.yearsResident}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Expiry Date</p>
                      <p className={`font-medium ${
                        verificationResult.status === "expired" ? "text-red-600" : "text-slate-900"
                      }`}>
                        {verificationResult.qrtData.expiryDate}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Emergency Contact
                    </h4>
                    <div className="rounded-lg border border-slate-100 p-3">
                      <p className="text-sm font-medium text-gray-900">
                        {verificationResult.qrtData.contactName} 
                        <span className="ml-1 text-xs font-normal text-gray-500">
                          ({verificationResult.qrtData.contactRelation})
                        </span>
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span>{verificationResult.qrtData.contactPhone}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-600">
                        <MapPin className="h-3 w-3" />
                        <span>{verificationResult.qrtData.contactAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700" 
                      onClick={resetVerification}
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Verify Another
                    </Button>
                    <Button variant="outline" size="icon">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {!verificationResult.qrtData && (
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700" 
                onClick={resetVerification}
              >
                Try Again
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <QRScanner 
              onScan={handleQRScan} 
              onError={handleScanError} 
              disabled={isVerifying} 
            />

            {recentVerifications.length > 0 && (
              <div>
                <h3 className="mb-2 text-xs font-semibold text-gray-500">Recent Verifications</h3>
                <div className="space-y-2">
                  {recentVerifications.map((result, i) => (
                    <Card key={i} className="border-0 shadow-sm">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {result.qrtData?.qrtCode || "Unknown Code"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {result.qrtData?.fullName || "Invalid Resident"}
                          </p>
                        </div>
                        <QRTStatusBadge 
                          status={result.status === 'valid' ? 'issued' : result.status === 'expired' ? 'expired' : 'rejected'} 
                          size="sm" 
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
