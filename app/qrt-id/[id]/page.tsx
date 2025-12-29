"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Share2, User, Phone, Check, Printer, Info, History } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useAuth } from "@/lib/auth-context"
import { useQRT } from "@/lib/qrt-context"
import { cn } from "@/lib/utils"
import { QRTStatusBadge } from "@/components/qrt-status-badge"
import { IDCardPreview } from "@/components/id-card-preview"
import { motion } from "framer-motion"
import { slideUp, fadeIn, staggerContainer } from "@/lib/animations"
import { downloadImage } from "@/lib/qrt-id-generator-canvas"

export default function QrtIdDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { getQRTById } = useQRT()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [qrtId, setQrtId] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCopied, setIsCopied] = useState(false)
  const [baseUrl, setBaseUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    const found = getQRTById(id)
    if (found) {
      setQrtId(found)
    }
    setLoading(false)
  }, [id, getQRTById])

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const handleShare = async () => {
    if (!qrtId || !baseUrl) return
    const url = `${baseUrl}/verify/qrt/${qrtId.qrtCode}`
    const shareData = {
      title: `QRT ID - ${qrtId.fullName}`,
      text: `Verify my Barangay Mawaque QRT ID: ${qrtId.qrtCode}`,
      url: url,
    }

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(url)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(url)
          setIsCopied(true)
          setTimeout(() => setIsCopied(false), 2000)
        } catch (clipErr) {
          console.error("Failed to copy link", clipErr)
        }
      }
    }
  }

  const handlePrint = () => {
    if (!qrtId) return

    const printWindow = window.open("", "_blank", "width=900,height=700")
    if (!printWindow) {
      alert("Please allow popups to print your ID")
      return
    }

    const frontImage = qrtId.idFrontImageUrl
    const backImage = qrtId.idBackImageUrl

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QRT ID - ${qrtId.fullName}</title>
          <style>
            @media print {
              @page { margin: 0.5in; size: landscape; }
              body { margin: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              text-align: center;
            }
            .id-container {
              display: flex;
              flex-direction: column;
              gap: 30px;
              align-items: center;
            }
            .id-card {
              width: 428px;
              height: 270px;
              border: 2px solid #333;
              border-radius: 12px;
              overflow: hidden;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .id-card img {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }
            .id-card-placeholder {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
              color: #0369a1;
            }
            .label {
              font-size: 12px;
              color: #666;
              margin-bottom: 10px;
              font-weight: 600;
            }
            h1 {
              margin-bottom: 20px;
              color: #1f2937;
            }
            .info {
              margin-top: 20px;
              font-size: 14px;
              color: #4b5563;
            }
            .print-btn {
              margin-top: 20px;
              padding: 12px 32px;
              background: #10b981;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
            }
            .print-btn:hover { background: #059669; }
            @media print { .print-btn { display: none; } }
          </style>
        </head>
        <body>
          <h1>QRT ID Card - ${qrtId.qrtCode}</h1>
          <div class="id-container">
            <div>
              <div class="label">FRONT SIDE</div>
              <div class="id-card">
                ${
                  frontImage
                    ? `<img src="${frontImage}" alt="Front of ID" />`
                    : `<div class="id-card-placeholder">
                      <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zM9 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 5H6v-1c0-1.3 2.7-2 4-2s4 .7 4 2v1zm5-3h-4v-1h4v1zm0-2h-4v-1h4v1zm0-2h-4V9h4v1z"/>
                      </svg>
                      <p style="margin-top:8px;">Front Side - ${qrtId.fullName}</p>
                    </div>`
                }
              </div>
            </div>
            <div>
              <div class="label">BACK SIDE</div>
              <div class="id-card">
                ${
                  backImage
                    ? `<img src="${backImage}" alt="Back of ID" />`
                    : `<div class="id-card-placeholder">
                      <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 5H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zM4 17V7h16v10H4z"/>
                        <path d="M6 9h12v2H6zm0 3h8v2H6z"/>
                      </svg>
                      <p style="margin-top:8px;">Back Side - Emergency Contact Info</p>
                    </div>`
                }
              </div>
            </div>
          </div>
          <div class="info">
            <strong>Name:</strong> ${qrtId.fullName} |
            <strong>QRT Code:</strong> ${qrtId.qrtCode} |
            <strong>Issued:</strong> ${qrtId.issuedDate ? new Date(qrtId.issuedDate).toLocaleDateString() : "N/A"}
          </div>
          <button class="print-btn" onclick="window.print()">Print ID Card</button>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownload = async () => {
    if (!qrtId) return
    try {
      if (qrtId.idFrontImageUrl) {
        downloadImage(qrtId.idFrontImageUrl, `${qrtId.qrtCode}-front.png`)
      }
      await new Promise((resolve) => setTimeout(resolve, 500))
      if (qrtId.idBackImageUrl) {
        downloadImage(qrtId.idBackImageUrl, `${qrtId.qrtCode}-back.png`)
      }
      if (!qrtId.idFrontImageUrl && !qrtId.idBackImageUrl) {
        alert("ID card images are not yet generated. Please try again later.")
      }
    } catch (err) {
      console.error("Download failed:", err)
      alert("Failed to download. Please try again.")
    }
  }

  if (authLoading || loading || !baseUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="h-10 w-10 rounded-full border-4 border-emerald-500 border-t-transparent"
        />
      </div>
    )
  }

  if (!qrtId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F9FAFB] p-6 text-center">
        <div className="mb-6 h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
          <Info className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">QRT ID Not Found</h2>
        <p className="text-gray-500 mb-8 max-w-xs">
          The QRT ID you are looking for might have been moved or doesn't exist.
        </p>
        <Button onClick={() => router.push("/qrt-id")} className="h-12 w-full rounded-2xl bg-emerald-600 font-bold">
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const verifyUrl = `${baseUrl}/verify/qrt/${qrtId.qrtCode}`
  const qrData = JSON.stringify({
    qrtCode: qrtId.qrtCode,
    verificationCode: qrtId.verificationCode,
    fullName: qrtId.fullName,
    birthDate: qrtId.birthDate,
    issueDate: qrtId.issuedDate || new Date().toISOString().split("T")[0],
    verifyUrl,
  })

  const isReady = ["ready", "issued"].includes(qrtId.status)

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Premium Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center bg-white/80 backdrop-blur-xl px-4 border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="mr-4 h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-900" />
        </button>
        <div className="flex-1">
          <h1 className="text-sm font-black uppercase tracking-widest text-gray-400">ID Details</h1>
          <p className="text-lg font-black text-gray-900 truncate">{qrtId.qrtCode || "Processing"}</p>
        </div>
        <div className="flex items-center gap-2">
          <QRTStatusBadge status={qrtId.status} />
        </div>
      </header>

      <main className="flex-1 space-y-6 px-4 pt-6 pb-32 max-w-2xl mx-auto w-full">
        {/* ID Card Experience */}
        <motion.div variants={slideUp} initial="hidden" animate="visible">
          <IDCardPreview
            frontImageUrl={qrtId.idFrontImageUrl}
            backImageUrl={qrtId.idBackImageUrl}
            qrtCode={qrtId.qrtCode}
            fullName={qrtId.fullName}
            onDownload={handleDownload}
            isReady={isReady}
          />
        </motion.div>

        {/* Action Grid */}
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-2 gap-3">
          <motion.div variants={fadeIn}>
            <Button
              variant="outline"
              onClick={handleShare}
              className="h-16 w-full rounded-2xl border-gray-100 bg-white shadow-sm flex flex-col items-center justify-center gap-1 group active:scale-95 transition-all"
            >
              {isCopied ? (
                <Check className="h-5 w-5 text-emerald-500 animate-in zoom-in" />
              ) : (
                <Share2 className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
              )}
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                {isCopied ? "Copied" : "Share ID"}
              </span>
            </Button>
          </motion.div>
          <motion.div variants={fadeIn}>
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={!isReady}
              className="h-16 w-full rounded-2xl border-gray-100 bg-white shadow-sm flex flex-col items-center justify-center gap-1 group active:scale-95 transition-all disabled:opacity-50"
            >
              <Printer className="h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Print Copy</span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Verification QR Section */}
        <motion.div variants={slideUp} initial="hidden" animate="visible">
          <Card className="overflow-hidden rounded-[32px] border-0 shadow-sm bg-white">
            <CardContent className="p-8 flex flex-col items-center text-center">
              <div className="relative group mb-6">
                <div className="absolute -inset-4 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
                <div className="relative p-6 rounded-3xl bg-white border-4 border-gray-100 shadow-inner">
                  <QRCodeSVG
                    value={qrData}
                    size={280}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    className="rounded-lg"
                  />
                </div>
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-1">Official Verification QR</h3>
              <p className="text-xs font-medium text-gray-400 max-w-[200px] leading-relaxed">
                Scan this code during checkpoint inspections or for secure verification.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Information Accordion-style cards */}
        <motion.div variants={slideUp} initial="hidden" animate="visible" className="space-y-4">
          {/* Personal Card */}
          <Card className="rounded-[32px] border-0 shadow-sm bg-white overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-emerald-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Personal Information</h3>
              </div>
            </div>
            <CardContent className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
              <div className="col-span-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Full Name</p>
                <p className="text-base font-bold text-gray-900">{qrtId.fullName}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Birth Date</p>
                <p className="text-sm font-bold text-gray-900">{qrtId.birthDate}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Sex / Status</p>
                <p className="text-sm font-bold text-gray-900">
                  {qrtId.gender} • {qrtId.civilStatus}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Height</p>
                <p className="text-sm font-bold text-gray-900">{qrtId.height ? `${qrtId.height} cm` : "--"}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Weight</p>
                <p className="text-sm font-bold text-gray-900">{qrtId.weight ? `${qrtId.weight} kg` : "--"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Address</p>
                <p className="text-sm font-bold text-gray-900 leading-relaxed">{qrtId.address}</p>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact Card */}
          <Card className="rounded-[32px] border-0 shadow-sm bg-white overflow-hidden">
            <div className="bg-red-50/30 px-6 py-4 flex items-center justify-between border-b border-red-50">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-red-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-400">Emergency Contact</h3>
              </div>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-base font-bold text-gray-900">{qrtId.emergencyContactName}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    {qrtId.emergencyContactRelationship}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pl-1">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Phone</p>
                  <a href={`tel:${qrtId.emergencyContactPhone}`} className="text-sm font-bold text-emerald-600">
                    {qrtId.emergencyContactPhone}
                  </a>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Address</p>
                  <p className="text-[11px] font-bold text-gray-900 leading-tight">{qrtId.emergencyContactAddress}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline Card */}
          <Card className="rounded-[32px] border-0 shadow-sm bg-white overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-gray-400" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Processing Timeline</h3>
              </div>
            </div>
            <CardContent className="p-8">
              <div className="relative space-y-8 before:absolute before:inset-0 before:left-3 before:h-full before:w-0.5 before:bg-gray-100">
                {/* Step 1 */}
                <div className="relative flex items-start gap-6">
                  <div className="absolute left-[-2px] h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-emerald-50 shadow-sm z-10" />
                  <div className="flex-1 pt-0">
                    <p className="text-sm font-bold text-gray-900">Application Submitted</p>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">
                      {new Date(qrtId.requestDate || qrtId.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-start gap-6">
                  <div
                    className={cn(
                      "absolute left-[-2px] h-4 w-4 rounded-full shadow-sm z-10 transition-colors duration-500",
                      isReady || qrtId.status === "processing"
                        ? "bg-emerald-500 ring-4 ring-emerald-50"
                        : "bg-gray-200 ring-4 ring-gray-50",
                    )}
                  />
                  <div className="flex-1 pt-0">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        isReady || qrtId.status === "processing" ? "text-gray-900" : "text-gray-400",
                      )}
                    >
                      Verification & Processing
                    </p>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">
                      {isReady || qrtId.status === "processing" ? "Completed" : "Pending"}
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-start gap-6">
                  <div
                    className={cn(
                      "absolute left-[-2px] h-4 w-4 rounded-full shadow-sm z-10 transition-colors duration-500",
                      isReady ? "bg-emerald-500 ring-4 ring-emerald-50" : "bg-gray-200 ring-4 ring-gray-50",
                    )}
                  />
                  <div className="flex-1 pt-0">
                    <p className={cn("text-sm font-bold", isReady ? "text-gray-900" : "text-gray-400")}>
                      ID Generated & Issued
                    </p>
                    {isReady && qrtId.issuedDate && (
                      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5">
                        {new Date(qrtId.issuedDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {/* Footer Branding */}
      <footer className="py-12 flex flex-col items-center justify-center opacity-30 grayscale">
        <Image src="/images/logo.png" alt="Seal" width={40} height={40} className="mb-2" />
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-900">Official Barangay QRT System</p>
      </footer>
    </div>
  )
}
