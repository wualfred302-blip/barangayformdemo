"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Download, Share2, Printer, CheckCircle2, Check, Copy } from "lucide-react"
import { useCertificates, type CertificateRequest } from "@/lib/certificate-context"
import { useAuth } from "@/lib/auth-context"
import { QRCodeSVG } from "qrcode.react"
import { generateSignatureHash } from "@/lib/signature-utils"
import QRCode from "qrcode"

const officials = [
  { name: "HON. JOHN DOE", title: "Punong Barangay" },
  { name: "HON. MARIA SANTOS", title: "Barangay Kagawad" },
  { name: "HON. PEDRO GARCIA", title: "Barangay Kagawad" },
  { name: "HON. ANA REYES", title: "Barangay Kagawad" },
  { name: "HON. JOSE CRUZ", title: "Barangay Kagawad" },
  { name: "HON. ROSA MENDOZA", title: "Barangay Kagawad" },
  { name: "HON. MIGUEL TORRES", title: "Barangay Kagawad" },
  { name: "HON. LUCIA RAMOS", title: "Barangay Kagawad" },
  { name: "MARK VILLANUEVA", title: "SK Chairperson" },
  { name: "ELENA SANTOS", title: "Barangay Secretary" },
  { name: "RICARDO DELA CRUZ", title: "Barangay Treasurer" },
]

function formatCertificateDate(date: Date): string {
  const day = date.getDate()
  const month = date.toLocaleDateString("en-US", { month: "long" })
  const year = date.getFullYear()
  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"]
    const v = n % 100
    return n + (s[(v - 20) % 10] || s[v] || s[0])
  }
  return `${getOrdinal(day)} day of ${month}, ${year}`
}

export default function CertificatePage() {
  const router = useRouter()
  const params = useParams()
  const certId = params.id as string
  const { getCertificate, getVerificationUrl } = useCertificates()
  const { user } = useAuth()
  const [certificate, setCertificate] = useState<CertificateRequest | null>(null)
  const [signatureHash, setSignatureHash] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (certId) {
      const cert = getCertificate(certId)
      if (cert) {
        setCertificate(cert)
      } else {
        router.push("/requests")
      }
    }
  }, [certId, getCertificate, router])

  useEffect(() => {
    async function computeHash() {
      if (certificate?.staffSignature) {
        const hash = await generateSignatureHash(certificate.staffSignature)
        setSignatureHash(hash)
      }
    }
    computeHash()
  }, [certificate?.staffSignature])

  const fullName = user?.fullName || "JUAN DELA CRUZ"
  const age = certificate?.age || 25
  const purok = certificate?.purok || "Purok 1"
  const yearsOfResidency = certificate?.yearsOfResidency || 5
  const purpose = certificate?.purpose || "Employment"
  const issueDate = formatCertificateDate(new Date())

  const verifyUrl = certificate ? getVerificationUrl(certificate.serialNumber) : ""
  const qrData = signatureHash ? `${verifyUrl}?signatureHash=${signatureHash}` : verifyUrl

  const handleCopyLink = async () => {
    if (!certificate) return
    const url = getVerificationUrl(certificate.serialNumber)
    try {
      await navigator.clipboard.writeText(url)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link", err)
    }
  }

  const handleDownload = async () => {
    if (!certificate) return

    let currentHash = signatureHash
    if (certificate.staffSignature) {
      currentHash = await generateSignatureHash(certificate.staffSignature)
    }
    
    const verifyUrl = getVerificationUrl(certificate.serialNumber)
    const pdfQrData = currentHash ? `${verifyUrl}?signatureHash=${currentHash}` : verifyUrl

    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF("p", "mm", "a4")

    // Generate QR Code for PDF
    let qrDataUrl = ""
    try {
      qrDataUrl = await QRCode.toDataURL(pdfQrData)
    } catch (err) {
      console.error("Failed to generate QR for PDF", err)
    }

    const pageWidth = 210
    const pageHeight = 297
    const sidebarWidth = 55
    const margin = 20

    // Green sidebar
    doc.setFillColor(16, 185, 129)
    doc.rect(0, 0, sidebarWidth, pageHeight, "F")

    // Sidebar - Punong Barangay
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("HON. JOHN DOE", sidebarWidth / 2, 35, { align: "center" })
    doc.setFont("helvetica", "italic")
    doc.setFontSize(7)
    doc.text("Punong Barangay", sidebarWidth / 2, 41, { align: "center" })

    // Kagawad section
    doc.setFontSize(8)
    doc.setFont("helvetica", "bold")
    doc.text("BARANGAY KAGAWAD", sidebarWidth / 2, 58, { align: "center" })

    let yPos = 70
    officials.slice(1, 8).forEach((official) => {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(7)
      doc.text(official.name, sidebarWidth / 2, yPos, { align: "center" })
      yPos += 10
    })

    // Other officials
    yPos += 10
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.text("MARK VILLANUEVA", sidebarWidth / 2, yPos, { align: "center" })
    doc.setFont("helvetica", "italic")
    doc.setFontSize(6)
    doc.text("SK Chairperson", sidebarWidth / 2, yPos + 5, { align: "center" })

    yPos += 18
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.text("ELENA SANTOS", sidebarWidth / 2, yPos, { align: "center" })
    doc.setFont("helvetica", "italic")
    doc.setFontSize(6)
    doc.text("Barangay Secretary", sidebarWidth / 2, yPos + 5, { align: "center" })

    yPos += 18
    doc.setFont("helvetica", "bold")
    doc.setFontSize(7)
    doc.text("RICARDO DELA CRUZ", sidebarWidth / 2, yPos, { align: "center" })
    doc.setFont("helvetica", "italic")
    doc.setFontSize(6)
    doc.text("Barangay Treasurer", sidebarWidth / 2, yPos + 5, { align: "center" })

    // Main content
    const contentX = sidebarWidth + margin
    const contentWidth = pageWidth - sidebarWidth - margin * 2

    // Header
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Republic of the Philippines", contentX + contentWidth / 2, 25, { align: "center" })
    doc.text("Province of Pampanga", contentX + contentWidth / 2, 31, { align: "center" })
    doc.text("Municipality of Mabalacat", contentX + contentWidth / 2, 37, { align: "center" })
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("BARANGAY MAWAQUE", contentX + contentWidth / 2, 44, { align: "center" })

    doc.setLineWidth(0.5)
    doc.line(contentX, 50, contentX + contentWidth, 50)

    doc.setFontSize(10)
    doc.text("OFFICE OF THE PUNONG BARANGAY", contentX + contentWidth / 2, 60, { align: "center" })

    // Title
    doc.setFontSize(28)
    doc.setFont("helvetica", "bold")
    doc.text("Barangay", contentX + contentWidth / 2, 85, { align: "center" })
    doc.text("Certification", contentX + contentWidth / 2, 98, { align: "center" })

    doc.setFontSize(11)
    doc.setFont("helvetica", "italic")
    doc.text(`(${certificate?.certificateType || "Residency"})`, contentX + contentWidth / 2, 108, { align: "center" })

    // Body
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("TO WHOM IT MAY CONCERN:", contentX, 130)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)

    const bodyText = `       This is to certify that ${fullName.toUpperCase()}, ${age} years old, Filipino, and bona-fide resident of ${purok}, Barangay Mawaque, Municipality of Mabalacat, Province of Pampanga for about ${yearsOfResidency} years.`
    const splitBody = doc.splitTextToSize(bodyText, contentWidth)
    doc.text(splitBody, contentX, 145)

    const certifyText = `       THIS FURTHER CERTIFIES that he/she is known to me as a person of good moral character, a law-abiding citizen, and has never violated any law, ordinance, or rule duly implemented by the government authorities.`
    const splitCertify = doc.splitTextToSize(certifyText, contentWidth)
    doc.text(splitCertify, contentX, 175)

    const purposeText = `       This certification is issued upon the request of the above-mentioned individual for ${purpose} purposes.`
    const splitPurpose = doc.splitTextToSize(purposeText, contentWidth)
    doc.text(splitPurpose, contentX, 210)

    doc.text(`       DONE AND ISSUED this ${issueDate} at`, contentX, 235)
    doc.text("Barangay Mawaque, Mabalacat, Pampanga.", contentX, 242)

    // Signature
    const signatureY = 270

    if (certificate.staffSignature) {
      // Add signature image to PDF
      try {
        doc.addImage(certificate.staffSignature, "PNG", contentX + contentWidth - 50, signatureY - 15, 40, 12)
      } catch (error) {
        console.error("Failed to add signature to PDF:", error)
      }
    }

    doc.setFont("helvetica", "bold")
    doc.text(certificate.signedBy || "HON. JOHN DOE", contentX + contentWidth - 30, signatureY, { align: "center" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    const roleText = certificate.signedByRole
      ? certificate.signedByRole.charAt(0).toUpperCase() + certificate.signedByRole.slice(1)
      : "Punong Barangay"
    doc.text(roleText, contentX + contentWidth - 30, signatureY + 6, { align: "center" })

    // Add digital signature timestamp
    if (certificate.signedAt) {
      doc.setFontSize(7)
      doc.setTextColor(100, 100, 100)
      doc.text(
        `Digitally signed: ${new Date(certificate.signedAt).toLocaleDateString("en-PH")}`,
        contentX + contentWidth - 30,
        signatureY + 12,
        { align: "center" },
      )
    }

    // Serial
    doc.setFontSize(8)
    doc.text(`Serial No: ${certificate?.serialNumber || "BGRY-MWQ-2025-000001"}`, contentX, pageHeight - 25)

    // QR Code
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", contentX + contentWidth - 25, pageHeight - 35, 25, 25)
      doc.setFontSize(6)
      doc.text("Scan to verify", contentX + contentWidth - 12.5, pageHeight - 8, { align: "center" })
    }

    doc.save(`certificate-${certificate?.serialNumber || "document"}.pdf`)
  }

  if (!certificate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#10B981] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-[#E5E7EB] bg-white px-5">
        <Link href="/requests" className="rounded-lg p-1 transition-colors hover:bg-[#F9FAFB]">
          <ArrowLeft className="h-5 w-5 text-[#374151]" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8">
            <Image src="/images/logo.png" alt="Barangay Seal" fill className="object-contain" />
          </div>
          <h1 className="text-lg font-semibold text-[#111827]">Certificate View</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pb-6 pt-5">
        {/* Certificate Preview Card */}
        <Card className="mb-6 overflow-hidden rounded-2xl border-0 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <div className="overflow-x-auto">
            <div className="flex min-w-[600px]">
              {/* Green Sidebar */}
              <div className="w-36 shrink-0 bg-[#10B981] p-4 text-white">
                <div className="mb-6 text-center">
                  <p className="text-xs font-bold">HON. JOHN DOE</p>
                  <p className="text-[10px] italic">Punong Barangay</p>
                </div>
                <p className="mb-3 text-center text-[10px] font-bold">BARANGAY KAGAWAD</p>
                <div className="space-y-2 text-center">
                  {officials.slice(1, 8).map((official, i) => (
                    <p key={i} className="text-[9px] font-medium">
                      {official.name}
                    </p>
                  ))}
                </div>
                <div className="mt-6 space-y-4 text-center">
                  <div>
                    <p className="text-[9px] font-bold">MARK VILLANUEVA</p>
                    <p className="text-[8px] italic">SK Chairperson</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold">ELENA SANTOS</p>
                    <p className="text-[8px] italic">Barangay Secretary</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold">RICARDO DELA CRUZ</p>
                    <p className="text-[8px] italic">Barangay Treasurer</p>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <CardContent className="flex-1 p-8">
                {/* Header */}
                <div className="mb-6 text-center text-sm">
                  <p>Republic of the Philippines</p>
                  <p>Province of Pampanga</p>
                  <p>Municipality of Mabalacat</p>
                  <p className="font-bold">BARANGAY MAWAQUE</p>
                </div>
                <hr className="mb-4 border-[#E5E7EB]" />
                <p className="mb-8 text-center text-sm font-medium">OFFICE OF THE PUNONG BARANGAY</p>

                {/* Title */}
                <h2 className="mb-1 text-center text-3xl font-bold text-[#111827]">Barangay</h2>
                <h2 className="mb-2 text-center text-3xl font-bold text-[#111827]">Certification</h2>
                <div className="mb-8 flex items-center justify-center gap-2">
                  <p className="text-center text-sm italic text-[#6B7280]">({certificate.certificateType})</p>
                  {certificate.staffSignature && (
                    <div 
                      className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200"
                      title="This certificate has been digitally signed and can be verified"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Digitally Signed
                    </div>
                  )}
                </div>

                {/* Body */}
                <p className="mb-6 font-bold text-[#111827]">TO WHOM IT MAY CONCERN:</p>
                <p className="mb-4 text-justify text-sm leading-relaxed text-[#374151]">
                  This is to certify that <span className="font-bold underline">{fullName.toUpperCase()}</span>, {age}{" "}
                  years old, Filipino, and bona-fide resident of {purok}, Barangay Mawaque, Municipality of Mabalacat,
                  Province of Pampanga for about {yearsOfResidency} years.
                </p>
                <p className="mb-4 text-justify text-sm leading-relaxed text-[#374151]">
                  THIS FURTHER CERTIFIES that he/she is known to me as a person of good moral character, a law-abiding
                  citizen, and has never violated any law, ordinance, or rule duly implemented by the government
                  authorities.
                </p>
                <p className="mb-6 text-justify text-sm leading-relaxed text-[#374151]">
                  This certification is issued upon the request of the above-mentioned individual for {purpose}{" "}
                  purposes.
                </p>
                <p className="mb-10 text-sm text-[#374151]">
                  DONE AND ISSUED this {issueDate} at Barangay Mawaque, Mabalacat, Pampanga.
                </p>

                {/* Signature */}
                <div className="mb-10 text-right">
                  {certificate.staffSignature && (
                    <div className="mb-2 inline-block">
                      <img src={certificate.staffSignature} alt="Digital Signature" className="h-16 w-auto" />
                    </div>
                  )}
                  <p className="font-bold text-[#111827]">{certificate.signedBy || "HON. JOHN DOE"}</p>
                  <p className="text-sm text-[#6B7280]">
                    {certificate.signedByRole
                      ? certificate.signedByRole.charAt(0).toUpperCase() + certificate.signedByRole.slice(1)
                      : "Punong Barangay"}
                  </p>
                  {certificate.signedAt && (
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      Digitally signed on{" "}
                      {new Date(certificate.signedAt).toLocaleDateString("en-PH", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-[#6B7280]">Serial No: {certificate.serialNumber}</p>
                    {certificate.staffSignature && (
                      <div className="mt-2">
                        <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Digitally Signed</span>
                        </div>
                        {signatureHash && (
                          <p className="mt-1 font-mono text-[10px] text-gray-400">
                            Hash: {signatureHash.substring(0, 8)}...
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-[#E5E7EB] p-2">
                    <QRCodeSVG value={qrData} size={80} level="M" />
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        </Card>

        <p className="mb-6 text-center text-xs text-[#9CA3AF]">
          Scroll horizontally to view full certificate. Tap Download for full-size PDF.
        </p>

        {/* Action Buttons */}
        <Button
          onClick={handleDownload}
          className="mb-3 h-[52px] w-full rounded-xl bg-[#10B981] text-base font-semibold text-white hover:bg-[#059669]"
        >
          <Download className="mr-2 h-5 w-5" />
          Download PDF
        </Button>

        <div className="mb-3 flex gap-3">
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="h-[52px] flex-1 rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] bg-transparent"
          >
            {isCopied ? <Check className="mr-2 h-5 w-5 text-emerald-600" /> : <Share2 className="mr-2 h-5 w-5" />}
            {isCopied ? "Copied!" : "Share"}
          </Button>
          <Button
            variant="outline"
            className="h-[52px] flex-1 rounded-xl border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] bg-transparent"
          >
            <Printer className="mr-2 h-5 w-5" />
            Print
          </Button>
        </div>

        <Button asChild variant="ghost" className="h-[52px] w-full text-[#6B7280] hover:text-[#111827]">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </main>
    </div>
  )
}
