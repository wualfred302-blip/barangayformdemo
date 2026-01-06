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

  const fullName = certificate?.residentName || "JUAN DELA CRUZ"
  const purok = certificate?.purok || "Purok 1"
  const purpose = certificate?.purpose || "Employment"
  const issueDate = formatCertificateDate(new Date())

  const residencyText = certificate?.residencySince
    ? `since ${new Date(certificate.residencySince).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`
    : certificate?.yearsOfResidency
    ? `for about ${certificate.yearsOfResidency} years`
    : "for several years"

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

    // Preload logo as data URL for watermark
    let logoDataUrl = ""
    try {
      const logoResponse = await fetch('/images/logo.png')
      const logoBlob = await logoResponse.blob()
      logoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(logoBlob)
      })
    } catch (err) {
      console.error("Failed to preload logo for watermark", err)
    }

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
    doc.setFontSize(9)
    doc.setFont("helvetica", "normal")
    doc.text("Republic of the Philippines", contentX + contentWidth / 2, 22, { align: "center" })
    doc.text("Province of Pampanga", contentX + contentWidth / 2, 27, { align: "center" })
    doc.text("Municipality of Mabalacat", contentX + contentWidth / 2, 32, { align: "center" })
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.text("BARANGAY MAWAQUE", contentX + contentWidth / 2, 38, { align: "center" })

    doc.setLineWidth(0.5)
    doc.line(contentX, 50, contentX + contentWidth, 50)

    doc.setFontSize(10)
    doc.text("OFFICE OF THE PUNONG BARANGAY", contentX + contentWidth / 2, 55, { align: "center" })

    // Watermark
    try {
      doc.setGState(doc.GState({ opacity: 0.05 }))
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, "PNG", contentX + (contentWidth - 70) / 2, 90, 70, 70)
      } else {
        doc.addImage("/images/logo.png", "PNG", contentX + (contentWidth - 70) / 2, 90, 70, 70)
      }
      doc.setGState(doc.GState({ opacity: 1 }))
    } catch (e) {
      console.error("Failed to add watermark to PDF", e)
    }

    // Title
    doc.setFontSize(24)
    doc.setFont("helvetica", "bold")
    doc.text("BARANGAY", contentX + contentWidth / 2, 88, { align: "center" })
    doc.text("CERTIFICATION", contentX + contentWidth / 2, 98, { align: "center" })

    doc.setFontSize(11)
    doc.setFont("helvetica", "italic")
    doc.text(`(${certificate?.certificateType || "Residency"})`, contentX + contentWidth / 2, 105, { align: "center" })

    // Body
    doc.setFontSize(11)
    doc.setFont("helvetica", "bold")
    doc.text("TO WHOM IT MAY CONCERN:", contentX, 130)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)

    let bodyText = `       This is to certify that ${fullName.toUpperCase()}`
    if (certificate.sex) bodyText += `, ${certificate.sex}`
    if (certificate.sexOrientation) bodyText += `, ${certificate.sexOrientation}`
    bodyText += `, Filipino`
    if (certificate.civilStatus) bodyText += `, ${certificate.civilStatus}`
    bodyText += `, and bona-fide resident of ${purok}, Barangay Mawaque, Municipality of Mabalacat, Province of Pampanga ${residencyText}.`
    
    let yPosContent = 135
    const splitBody = doc.splitTextToSize(bodyText, contentWidth)
    doc.text(splitBody, contentX, yPosContent)
    yPosContent += splitBody.length * 6

    if (certificate.occupation || certificate.monthlyIncome) {
      let jobText = `       The above-named individual is`
      jobText += certificate.occupation ? ` currently employed as ${certificate.occupation}` : " presently stay-at-home"
      if (certificate.monthlyIncome) jobText += ` with a monthly income of P${certificate.monthlyIncome.toLocaleString()}`
      jobText += "."
      const splitJob = doc.splitTextToSize(jobText, contentWidth)
      doc.text(splitJob, contentX, yPosContent)
      yPosContent += splitJob.length * 6
    }

    if (certificate.validIdType) {
      let idText = `       Presented Identification: ${certificate.validIdType}`
      if (certificate.validIdNumber) idText += ` with Number: ${certificate.validIdNumber}`
      idText += "."
      const splitId = doc.splitTextToSize(idText, contentWidth)
      doc.text(splitId, contentX, yPosContent)
      yPosContent += splitId.length * 6
    }

    const certifyText = `       THIS FURTHER CERTIFIES that he/she is known to me as a person of good moral character, a law-abiding citizen, and has never violated any law, ordinance, or rule duly implemented by the government authorities.`
    const splitCertify = doc.splitTextToSize(certifyText, contentWidth)
    doc.text(splitCertify, contentX, yPosContent)
    yPosContent += splitCertify.length * 6

    const purposeText = `       This certification is issued upon the request of the above-mentioned individual for ${purpose} purposes.`
    const splitPurpose = doc.splitTextToSize(purposeText, contentWidth)
    doc.text(splitPurpose, contentX, yPosContent)
    yPosContent += splitPurpose.length * 10

    doc.text(`       DONE AND ISSUED this ${issueDate} at`, contentX, yPosContent)
    doc.text("Barangay Mawaque, Mabalacat, Pampanga.", contentX, yPosContent + 7)

    // Signature
    const signatureY = 250

    if (certificate.staffSignature) {
      try {
        doc.addImage(certificate.staffSignature, "PNG", contentX + contentWidth - 50, signatureY - 15, 40, 10)
      } catch (error) {
        console.error("Failed to add signature to PDF:", error)
      }
    }

    doc.setLineWidth(0.3)
    doc.line(contentX + contentWidth - 60, signatureY, contentX + contentWidth, signatureY)
    doc.setFont("helvetica", "bold")
    doc.setFontSize(10)
    doc.text(certificate.signedBy || "HON. JOHN DOE", contentX + contentWidth - 30, signatureY + 5, { align: "center" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    const roleText = certificate.signedByRole
      ? certificate.signedByRole.charAt(0).toUpperCase() + certificate.signedByRole.slice(1)
      : "Punong Barangay"
    doc.text(roleText, contentX + contentWidth - 30, signatureY + 10, { align: "center" })

    // Footer Info
    doc.setDrawColor(200, 200, 200)
    doc.line(contentX, pageHeight - 30, contentX + contentWidth, pageHeight - 30)
    
    doc.setFontSize(6.5)
    doc.setTextColor(120, 120, 120)
    doc.text("Barangay Mawaque, Municipality of Mabalacat, Province of Pampanga", contentX, pageHeight - 25)
    doc.text("Tel: (045) 123-4567 | mawaque@mabalacat.gov.ph | www.mawaque.gov.ph", contentX, pageHeight - 21)

    // Serial
    doc.setFillColor(245, 245, 245)
    doc.rect(contentX, pageHeight - 15, 60, 8, "F")
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(9)
    doc.setFont("courier", "bold")
    doc.text(`Serial: ${certificate?.serialNumber || "BGRY-MWQ-2025-000001"}`, contentX + 2, pageHeight - 10)

    // QR Code
    if (qrDataUrl) {
      doc.addImage(qrDataUrl, "PNG", contentX + contentWidth - 30, pageHeight - 38, 28, 28)
      doc.setFontSize(7)
      doc.setFont("helvetica", "bold")
      doc.text("Scan to verify", contentX + contentWidth - 15, pageHeight - 8, { align: "center" })
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
            <div className="flex min-w-full sm:min-w-[500px] md:min-w-[650px]">
              {/* Green Sidebar */}
              <div className="w-20 sm:w-28 md:w-36 shrink-0 bg-[#10B981] p-3 md:p-4 text-white">
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
              <CardContent className="relative flex-1 p-4 md:p-6 lg:p-8 overflow-hidden">
                {/* Watermark Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.05]">
                  <div className="relative h-48 w-48 md:h-56 md:w-56 lg:h-64 lg:w-64">
                    <Image src="/images/logo.png" alt="Watermark" fill className="object-contain" />
                  </div>
                </div>

                {/* Header */}
                <div className="relative z-10 mb-6 text-center text-sm tracking-wide">
                  <p className="uppercase">Republic of the Philippines</p>
                  <p className="uppercase">Province of Pampanga</p>
                  <p className="uppercase">Municipality of Mabalacat</p>
                  <p className="text-base font-extrabold text-[#111827]">BARANGAY MAWAQUE</p>
                </div>
                <hr className="relative z-10 mb-4 border-[#E5E7EB]" />
                <p className="relative z-10 mb-10 text-center text-sm font-bold tracking-widest text-[#374151]">OFFICE OF THE PUNONG BARANGAY</p>

                {/* Title */}
                <div className="relative z-10 mb-10 text-center">
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-[#111827]">Barangay</h2>
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-[#111827]">Certification</h2>
                </div>
                <div className="relative z-10 mb-8 flex items-center justify-center gap-2">
                  <p className="text-center text-sm italic font-medium text-[#6B7280]">({certificate.certificateType})</p>
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
                <div className="relative z-10">
                  <p className="mb-6 font-bold text-[#111827]">TO WHOM IT MAY CONCERN:</p>
                  
                  <p className="mb-6 text-justify text-sm md:text-base leading-normal md:leading-relaxed text-[#374151]">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;This is to certify that <span className="font-bold underline">{fullName.toUpperCase()}</span>, 
                    {certificate.sex && <span>, {certificate.sex}</span>}
                    {certificate.sexOrientation && <span>, {certificate.sexOrientation}</span>}, 
                    Filipino, {certificate.civilStatus && <span>{certificate.civilStatus}, </span>}
                    and bona-fide resident of <span className="font-bold">{purok}</span>, Barangay Mawaque, Municipality of Mabalacat,
                    Province of Pampanga {residencyText}.
                  </p>

                  {(certificate.occupation || certificate.monthlyIncome) && (
                    <p className="mb-6 text-justify text-sm md:text-base leading-normal md:leading-relaxed text-[#374151]">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;The above-named individual is 
                      {certificate.occupation ? ` currently employed as ${certificate.occupation}` : " presently stay-at-home"}
                      {certificate.monthlyIncome ? ` with a monthly income of ₱${certificate.monthlyIncome.toLocaleString()}` : ""}.
                    </p>
                  )}

                  {certificate.validIdType && (
                    <p className="mb-6 text-justify text-sm md:text-base leading-normal md:leading-relaxed text-[#374151]">
                      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Presented Identification: <span className="font-bold">{certificate.validIdType}</span>
                      {certificate.validIdNumber && <span> with Number: <span className="font-bold">{certificate.validIdNumber}</span></span>}.
                    </p>
                  )}

                  <p className="mb-6 text-justify text-sm md:text-base leading-normal md:leading-relaxed text-[#374151]">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;THIS FURTHER CERTIFIES that he/she is known to me as a person of good moral character, a law-abiding
                    citizen, and has never violated any law, ordinance, or rule duly implemented by the government
                    authorities.
                  </p>
                  <p className="mb-6 text-justify text-sm md:text-base leading-normal md:leading-relaxed text-[#374151]">
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;This certification is issued upon the request of the above-mentioned individual for <span className="font-bold">{purpose}</span> purposes.
                  </p>
                  <p className="mb-16 text-sm text-[#374151]">
                    DONE AND ISSUED this {issueDate} at Barangay Mawaque, Mabalacat, Pampanga.
                  </p>
                </div>

                {/* Signature */}
                <div className="relative z-10 mb-16 text-right">
                  <div className="inline-block text-center">
                    {certificate.staffSignature && (
                      <div className="mb-0 inline-block translate-y-4">
                        <img src={certificate.staffSignature} alt="Digital Signature" className="h-16 w-auto" />
                      </div>
                    )}
                    <p className="text-lg font-bold text-[#111827] border-t border-slate-900 pt-1 min-w-[200px]">
                      {certificate.signedBy || "HON. JOHN DOE"}
                    </p>
                    <p className="text-sm text-[#6B7280]">
                      {certificate.signedByRole
                        ? certificate.signedByRole.charAt(0).toUpperCase() + certificate.signedByRole.slice(1)
                        : "Punong Barangay"}
                    </p>
                    {certificate.signedAt && (
                      <p className="mt-1 text-[10px] text-[#9CA3AF]">
                        Digitally signed on{" "}
                        {new Date(certificate.signedAt).toLocaleDateString("en-PH", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Section */}
                <div className="relative z-10 mt-12 border-t border-gray-200 pt-6">
                  <div className="flex items-start justify-between">
                    <div className="max-w-[70%]">
                      <div className="mb-4 inline-block px-3 py-1 bg-gray-50 rounded-md border border-gray-100">
                        <p className="font-mono text-sm text-[#374151]">
                          <span className="font-bold text-gray-400">Serial No:</span> {certificate.serialNumber}
                        </p>
                      </div>
                      <div className="space-y-1 text-[10px] text-gray-500">
                        <p className="font-medium">Barangay Mawaque, Municipality of Mabalacat, Province of Pampanga</p>
                        <div className="flex items-center gap-2">
                          <span>Tel: (045) 123-4567</span>
                          <span className="text-gray-300">|</span>
                          <span>mawaque@mabalacat.gov.ph</span>
                          <span className="text-gray-300">|</span>
                          <span>www.mawaque.gov.ph</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="rounded-lg border border-[#E5E7EB] p-2 bg-white">
                        <QRCodeSVG value={qrData} size={100} level="M" />
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-gray-600 font-medium">
                        <Check className="h-3 w-3 text-emerald-600" />
                        <span>Scan to Verify</span>
                      </div>
                    </div>
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
