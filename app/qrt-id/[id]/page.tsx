"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { 
  ArrowLeft, 
  Share2, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Ruler, 
  Weight,
  Check,
  Printer
} from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { QRTStatusBadge } from "@/components/qrt-status-badge"
import { IDCardPreview } from "@/components/id-card-preview"

// Temporary hook until QRT context is created
const useQRT = () => {
  const [qrtIds, setQrtIds] = useState<any[]>([])
  
  useEffect(() => {
    const stored = localStorage.getItem("barangay_qrt_ids")
    if (stored) setQrtIds(JSON.parse(stored))
  }, [])
  
  const getQRTById = (id: string) => {
    return qrtIds.find(qrt => qrt.id === id)
  }
  
  return { qrtIds, getQRTById }
}

export default function QrtIdDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { getQRTById } = useQRT()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [qrtId, setQrtId] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [showBackSide, setShowBackSide] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    // Small delay to ensure qrtIds are loaded from local storage in the hook
    const timer = setTimeout(() => {
      const found = getQRTById(id)
      if (found) {
        setQrtId(found)
      } else if (!authLoading && useQRT().qrtIds.length > 0) {
        // Only redirect if we've attempted to load and found nothing, 
        // but we need to wait for qrtIds to populate first. 
        // In a real app with context, this would be cleaner.
        // For now, we'll handle the "not found" state in the UI if it stays null
      }
      setLoading(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [id, getQRTById, authLoading]) // Added getQRTById to dependencies, but since it's defined inside component in previous step (wait, I defined it outside or inside? Inside the component in the file I'm writing). 
  // Wait, I defined useQRT outside the component in my code below.

  const handleCopyLink = async () => {
    if (!qrtId) return
    const url = `${window.location.origin}/verify/qrt/${qrtId.qrtCode}`
    try {
      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link", err)
    }
  }

  const handleDownload = async () => {
    if (!qrtId) return
    setIsDownloading(true)
    
    // Simulate download delay
    setTimeout(() => {
      // In a real implementation, this would download the actual images
      // For now we'll just alert
      alert("Downloading ID images...")
      setIsDownloading(false)
    }, 1500)
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#10B981] border-t-transparent" />
      </div>
    )
  }

  if (!qrtId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] p-4">
        <p className="mb-4 text-gray-500">QRT ID not found</p>
        <Button onClick={() => router.push("/qrt-id")} variant="outline">
          Back to List
        </Button>
      </div>
    )
  }

  const verifyUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/verify/qrt/${qrtId.qrtCode}`
  const qrData = JSON.stringify({
    qrtCode: qrtId.qrtCode,
    fullName: qrtId.fullName,
    birthDate: qrtId.birthDate,
    issueDate: qrtId.issuedDate || new Date().toISOString().split('T')[0],
    verifyUrl
  })

  // Calculate timeline status
  const isPending = qrtId.status === "pending"
  const isProcessing = qrtId.status === "processing"
  const isReady = ["ready", "issued"].includes(qrtId.status)

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-[#E5E7EB] bg-white px-5 shadow-sm">
        <Link href="/qrt-id" className="rounded-lg p-1 transition-colors hover:bg-[#F9FAFB]">
          <ArrowLeft className="h-5 w-5 text-[#374151]" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8">
            <Image src="/images/logo.png" alt="Barangay Seal" fill className="object-contain" />
          </div>
          <h1 className="text-lg font-semibold text-[#111827]">QRT ID Details</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-4 px-5 pb-32 pt-5">
        
        {/* QRT Code Display Section */}
        <Card className="overflow-hidden rounded-2xl border-0 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="mb-4 rounded-full bg-emerald-50 p-4">
              <QRCodeSVG value={qrData} size={120} level="M" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-[#111827]">{qrtId.qrtCode || "PENDING"}</h2>
            <div className="mt-2 flex items-center gap-2">
              <QRTStatusBadge status={qrtId.status} />
            </div>
            <p className="mt-4 text-xs text-gray-500">Scan to verify identity</p>
          </CardContent>
        </Card>

        {/* ID Card Images Section */}
        <IDCardPreview 
          frontImageUrl={qrtId.idFrontImageUrl} 
          backImageUrl={qrtId.idBackImageUrl} 
          qrtCode={qrtId.qrtCode} 
          fullName={qrtId.fullName} 
          onDownload={handleDownload} 
          isReady={isReady} 
        />

        {/* Personal Information Section */}
        <Card className="overflow-hidden rounded-2xl border-0 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-[#111827]">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <User className="h-4 w-4" />
                  <span className="text-xs">Full Name</span>
                </div>
                <p className="font-medium text-[#111827]">{qrtId.fullName}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs">Birth Date</span>
                </div>
                <p className="font-medium text-[#111827]">{qrtId.birthDate}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <span className="text-xs">Age</span>
                </div>
                <p className="font-medium text-[#111827]">{qrtId.age} years old</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <span className="text-xs">Gender</span>
                </div>
                <p className="font-medium text-[#111827]">{qrtId.gender}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <span className="text-xs">Civil Status</span>
                </div>
                <p className="font-medium text-[#111827]">{qrtId.civilStatus}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Ruler className="h-4 w-4" />
                  <span className="text-xs">Height</span>
                </div>
                <p className="font-medium text-[#111827]">{qrtId.height || "-"}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Weight className="h-4 w-4" />
                  <span className="text-xs">Weight</span>
                </div>
                <p className="font-medium text-[#111827]">{qrtId.weight || "-"}</p>
              </div>

              <div className="col-span-2">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs">Address</span>
                </div>
                <p className="font-medium text-[#111827]">{qrtId.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Contact Section */}
        <Card className="overflow-hidden rounded-2xl border-0 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-[#111827]">Emergency Contact</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <User className="h-4 w-4" />
                  <span className="text-xs">Contact Person</span>
                </div>
                <p className="font-medium text-[#111827]">{qrtId.emergencyContactName}</p>
                <p className="text-xs text-gray-500">Relationship: {qrtId.emergencyContactRelationship}</p>
              </div>
              
              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Phone className="h-4 w-4" />
                  <span className="text-xs">Phone Number</span>
                </div>
                <a href={`tel:${qrtId.emergencyContactPhone}`} className="font-medium text-emerald-600 hover:underline">
                  {qrtId.emergencyContactPhone}
                </a>
              </div>

              <div>
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <MapPin className="h-4 w-4" />
                  <span className="text-xs">Address</span>
                </div>
                <p className="font-medium text-[#111827]">{qrtId.emergencyContactAddress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Timeline Section */}
        <Card className="overflow-hidden rounded-2xl border-0 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <CardContent className="p-6">
            <h3 className="mb-4 font-semibold text-[#111827]">Status Timeline</h3>
            <div className="relative border-l border-gray-200 ml-3 space-y-6">
              {/* Request Submitted */}
              <div className="relative pl-6">
                <div className="absolute -left-1.5 top-0 h-3 w-3 rounded-full bg-emerald-500" />
                <p className="text-sm font-medium text-[#111827]">Request Submitted</p>
                <p className="text-xs text-gray-500">
                  {new Date(qrtId.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Payment Confirmed - assuming payment is handled/confirmed if processing */}
              <div className="relative pl-6">
                <div className={cn(
                  "absolute -left-1.5 top-0 h-3 w-3 rounded-full",
                  isProcessing || isReady ? "bg-emerald-500" : "bg-gray-200"
                )} />
                <p className={cn(
                  "text-sm font-medium",
                  isProcessing || isReady ? "text-[#111827]" : "text-gray-400"
                )}>Payment Confirmed</p>
              </div>

              {/* ID Generation */}
              <div className="relative pl-6">
                <div className={cn(
                  "absolute -left-1.5 top-0 h-3 w-3 rounded-full",
                  isReady ? "bg-emerald-500" : "bg-gray-200"
                )} />
                <p className={cn(
                  "text-sm font-medium",
                  isReady ? "text-[#111827]" : "text-gray-400"
                )}>ID Generated</p>
              </div>

              {/* ID Ready */}
              <div className="relative pl-6">
                <div className={cn(
                  "absolute -left-1.5 top-0 h-3 w-3 rounded-full",
                  isReady ? "bg-emerald-500" : "bg-gray-200"
                )} />
                <p className={cn(
                  "text-sm font-medium",
                  isReady ? "text-[#111827]" : "text-gray-400"
                )}>Ready for Download</p>
                {isReady && qrtId.issuedDate && (
                  <p className="text-xs text-gray-500">
                    {new Date(qrtId.issuedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

      </main>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-[#E5E7EB] bg-white px-5 py-4">
        <div className="mx-auto max-w-md space-y-3">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              disabled={!isReady}
              className="h-[52px] flex-1 rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] bg-transparent"
            >
              {isCopied ? <Check className="mr-2 h-5 w-5 text-emerald-600" /> : <Share2 className="mr-2 h-5 w-5" />}
              {isCopied ? "Copied!" : "Share QRT"}
            </Button>
            <Button
              variant="outline"
              disabled={!isReady}
              className="h-[52px] flex-1 rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] bg-transparent"
            >
              <Printer className="mr-2 h-5 w-5" />
              Print
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
