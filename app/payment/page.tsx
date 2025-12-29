"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, FileText, ShieldCheck, Loader2 } from "lucide-react"
import { useCertificates, type CertificateRequest } from "@/lib/certificate-context"
import { useQRT } from "@/lib/qrt-context"
import { usePayment } from "@/lib/payment-context"
import { processPayment, validatePaymentMethod, type PaymentTransaction } from "@/lib/payment-utils"
import { GCashForm, MayaForm, BankTransferForm } from "@/components/payment-methods"
import { PaymentReceiptModal } from "@/components/payment-receipt-modal"
import { generateQRTIDImages } from "@/lib/qrt-id-generator-canvas"
import QRCode from "qrcode"

// Function to generate verification code
function generateVerificationCode(existingCodes: string[]): string {
  const code = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0")
  if (existingCodes.includes(code)) {
    return generateVerificationCode(existingCodes)
  }
  return code
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
          <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
        </div>
      }
    >
      <PaymentPageContent />
    </Suspense>
  )
}

function PaymentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currentRequest, addCertificate, setCurrentRequest } = useCertificates()
  const {
    currentRequest: qrtRequest,
    setCurrentRequest: setQrtRequest,
    addQRTRequest,
    isLoaded: qrtContextLoaded,
  } = useQRT()
  const { addPayment } = usePayment()

  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState("Connecting to payment provider...")
  const [lastTransaction, setLastTransaction] = useState<PaymentTransaction | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentCompleted, setPaymentCompleted] = useState(false)

  const paymentType = searchParams.get("type")

  useEffect(() => {
    console.log("[v0] Payment Page State:", {
      qrtContextLoaded,
      hasQrtRequest: !!qrtRequest,
      hasCertRequest: !!currentRequest,
      paymentType,
      paymentCompleted,
      showReceipt,
    })
  }, [qrtContextLoaded, qrtRequest, currentRequest, paymentType, paymentCompleted, showReceipt])

  useEffect(() => {
    if (paymentCompleted || showReceipt) {
      console.log("[v0] Payment completed or showing receipt, skipping redirect")
      return
    }

    if (qrtContextLoaded && !currentRequest && !qrtRequest) {
      console.log("[v0] No request found after context loaded, redirecting...")
      if (paymentType === "qrt") {
        router.push("/qrt-id/request")
      } else {
        router.push("/request")
      }
    }
  }, [qrtContextLoaded, currentRequest, qrtRequest, router, paymentCompleted, showReceipt, paymentType])

  if (!qrtContextLoaded) {
    console.log("[v0] QRT context still loading...")
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#10B981] mx-auto" />
          <p className="mt-4 text-sm text-gray-500">Loading payment details...</p>
        </div>
      </div>
    )
  }

  // Don't render null if payment was completed - show receipt instead
  if (!currentRequest && !qrtRequest && !paymentCompleted && !showReceipt) return null

  // Determine payment type - use URL parameter as primary source, fallback to context
  const isQRTPayment = paymentType === "qrt" || !!qrtRequest

  // Calculate total with processing fee
  const fee = isQRTPayment ? qrtRequest?.amount || 100 : currentRequest?.amount || 50
  const certFee = fee
  const processingFee = 5
  const totalAmount = certFee + processingFee

  // Determine back URL based on payment type
  const backUrl = isQRTPayment ? "/qrt-id/request" : "/request"

  const handlePaymentSubmit = async (method: "gcash" | "maya" | "bank_transfer", formData: any) => {
    setError(null)

    // Validate
    const validation = validatePaymentMethod(method, formData)
    if (!validation.isValid) {
      setError(validation.error || "Invalid payment details")
      return
    }

    setIsProcessing(true)

    // Simulated steps
    const messages = isQRTPayment
      ? ["Connecting to payment provider...", "Verifying account...", "Processing payment...", "Generating QRT ID..."]
      : ["Connecting to payment provider...", "Verifying account...", "Processing payment..."]
    let msgIndex = 0
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length
      setProcessingMessage(messages[msgIndex])
    }, 800)

    try {
      const requestId = isQRTPayment
        ? qrtRequest?.id || `temp-${Date.now()}`
        : currentRequest?.id || `temp-${Date.now()}`
      const transaction = await processPayment(method, totalAmount, requestId)

      clearInterval(interval)

      // Save payment
      addPayment(transaction)
      setLastTransaction(transaction)

      if (isQRTPayment && qrtRequest) {
        // QRT ID GENERATION FLOW
        setProcessingMessage("Generating QRT ID...")

        // 1. Generate QRT Code
        const year = new Date().getFullYear()
        const sequentialNumber = String(Math.floor(Math.random() * 1000000)).padStart(6, "0")
        const qrtCode = `QRT-${year}-${sequentialNumber}`

        // 2. Generate Verification Code
        const existingCodes: string[] = []
        const verificationCode = generateVerificationCode(existingCodes)
        console.log(`[v0] Verification Code Generated: ${verificationCode}`)

        // 3. Generate QR Code Data URL with only verification code (security enhancement)
        const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
        const qrData = {
          verificationCode,
          verifyUrl: `${baseUrl}/api/qrt-id/verify/${verificationCode}`,
        }
        const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData))

        // 4. Calculate Dates (format for display)
        const now = new Date()
        const issuedDate = now.toISOString()
        const issuedDateFormatted = now.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
        const expiryDateObj = new Date()
        expiryDateObj.setFullYear(expiryDateObj.getFullYear() + 1)
        const expiryDateISO = expiryDateObj.toISOString()
        const expiryDateFormatted = expiryDateObj.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })

        setProcessingMessage("Generating ID card images...")
        let idFrontImageUrl = ""
        let idBackImageUrl = ""

        try {
          const idImages = await generateQRTIDImages({
            qrtCode,
            verificationCode,
            fullName: qrtRequest.fullName || "",
            birthDate: qrtRequest.birthDate || "",
            address: qrtRequest.address || "",
            gender: qrtRequest.gender || "",
            civilStatus: qrtRequest.civilStatus || "",
            birthPlace: qrtRequest.birthPlace || "",
            photoUrl: qrtRequest.photoUrl || "",
            issuedDate: issuedDateFormatted,
            expiryDate: expiryDateFormatted,
            emergencyContactName: qrtRequest.emergencyContactName || "",
            emergencyContactPhone: qrtRequest.emergencyContactPhone || "",
            emergencyContactRelationship: qrtRequest.emergencyContactRelationship || "",
            emergencyContactAddress: qrtRequest.emergencyContactAddress || "",
            qrCodeData: qrCodeDataUrl,
          })

          if (idImages.success) {
            idFrontImageUrl = idImages.frontImageUrl || ""
            idBackImageUrl = idImages.backImageUrl || ""
            console.log("[v0] ID images generated successfully")
          } else {
            console.error("[v0] Failed to generate ID images:", idImages.error)
          }
        } catch (imgError) {
          console.error("[v0] Error generating ID images:", imgError)
        }

        // 5. Create Complete QRT Record (use UUID for database compatibility)
        const qrtId = crypto.randomUUID()
        const newQRTRecord = {
          id: qrtId,
          qrtCode,
          verificationCode,
          userId: qrtRequest.userId || "",
          fullName: qrtRequest.fullName || "",
          birthDate: qrtRequest.birthDate || "",
          age: qrtRequest.age || 0,
          gender: qrtRequest.gender || "",
          civilStatus: qrtRequest.civilStatus || "",
          birthPlace: qrtRequest.birthPlace || "",
          address: qrtRequest.address || "",
          height: qrtRequest.height || "",
          weight: qrtRequest.weight || "",
          yearsResident: qrtRequest.yearsResident || 0,
          citizenship: qrtRequest.citizenship || "",
          emergencyContactName: qrtRequest.emergencyContactName || "",
          emergencyContactAddress: qrtRequest.emergencyContactAddress || "",
          emergencyContactPhone: qrtRequest.emergencyContactPhone || "",
          emergencyContactRelationship: qrtRequest.emergencyContactRelationship || "",
          photoUrl: qrtRequest.photoUrl || "",
          qrCodeData: qrCodeDataUrl,
          idFrontImageUrl, // Now populated with generated image
          idBackImageUrl, // Now populated with generated image
          status: "ready" as const,
          issuedDate,
          expiryDate: expiryDateISO,
          createdAt: qrtRequest.createdAt || new Date().toISOString(),
          paymentReference: transaction.transactionReference,
          paymentTransactionId: transaction.id,
          requestType: qrtRequest.requestType || "regular",
          amount: qrtRequest.amount || 100,
        }

        // 6. Save to Context
        addQRTRequest(newQRTRecord)

        console.log("[v0] QRT ID created, waiting for Supabase sync...")
        await new Promise((resolve) => setTimeout(resolve, 500)) // Brief delay for Supabase consistency

        // IMPORTANT: Set paymentCompleted BEFORE clearing context to prevent redirect
        setPaymentCompleted(true)
        setQrtRequest(null)

        setIsProcessing(false)
        setShowReceipt(true)
      } else {
        // CERTIFICATE GENERATION FLOW (existing)
        const serial = `BGRY-MWQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(6, "0")}`
        const certId = `cert_${Date.now()}`

        const newCertificate: CertificateRequest = {
          id: certId,
          certificateType: currentRequest?.certificateType || "Barangay Clearance",
          purpose: currentRequest?.purpose || "Employment",
          customPurpose: currentRequest?.customPurpose,
          requestType: currentRequest?.requestType || "regular",
          amount: totalAmount,
          paymentReference: transaction.transactionReference,
          paymentTransactionId: transaction.id,
          serialNumber: serial,
          status: "processing",
          createdAt: new Date().toISOString(),
          age: currentRequest?.age || 0,
          residentName: currentRequest?.residentName,
          purok: currentRequest?.purok || "",
          yearsOfResidency: currentRequest?.yearsOfResidency || 0,
        }

        addCertificate(newCertificate)

        // IMPORTANT: Set paymentCompleted BEFORE clearing context to prevent redirect
        setPaymentCompleted(true)
        setIsProcessing(false)
        setShowReceipt(true)
      }
    } catch (err) {
      clearInterval(interval)
      setIsProcessing(false)
      setError("Payment failed. Please try again.")
    }
  }

  const handleCloseReceipt = () => {
    setShowReceipt(false)
    if (isQRTPayment) {
      setQrtRequest(null)
      setCurrentRequest(null)
      router.push("/qrt-id")
    } else {
      setCurrentRequest(null)
      setQrtRequest(null)
      router.push("/requests")
    }
  }

  const handleViewCertificate = () => {
    setShowReceipt(false)
    if (isQRTPayment) {
      setQrtRequest(null)
      setCurrentRequest(null)
      router.push("/qrt-id")
    } else {
      setCurrentRequest(null)
      setQrtRequest(null)
      router.push("/requests")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <PaymentReceiptModal
        transaction={lastTransaction}
        open={showReceipt}
        onClose={handleCloseReceipt}
        onViewCertificate={handleViewCertificate}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-[#E5E7EB] bg-white px-5">
        <Link href={backUrl} className="rounded-lg p-1 transition-colors hover:bg-[#F9FAFB]">
          <ArrowLeft className="h-5 w-5 text-[#374151]" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8">
            <Image src="/images/logo.png" alt="Barangay Seal" fill className="object-contain" />
          </div>
          <h1 className="text-lg font-semibold text-[#111827]">Payment</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pt-5 pb-10">
        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#10B981]" />
              <p className="font-medium text-gray-900">{processingMessage}</p>
            </div>
          </div>
        )}

        {/* Order Summary */}
        <Card className="mb-6 rounded-2xl border-0 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-[#10B981]">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {isQRTPayment ? "QRT ID Request" : currentRequest?.certificateType}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {isQRTPayment
                      ? `${qrtRequest?.fullName || "QRT ID"} - ${qrtRequest?.requestType === "rush" ? "Rush Processing" : "Regular Processing"}`
                      : currentRequest?.purpose}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{isQRTPayment ? "QRT ID Fee" : "Certificate Fee"}</span>
                <span className="text-gray-900">₱{certFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Processing Fee</span>
                <span className="text-gray-900">₱{processingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-gray-900">Total Amount</span>
                <span className="text-xl font-bold text-[#10B981]">₱{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="mb-2 text-sm font-medium text-gray-500 uppercase tracking-wider">Select Payment Method</div>

        <Tabs defaultValue="gcash" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 p-1 rounded-xl h-12">
            <TabsTrigger
              value="gcash"
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              GCash
            </TabsTrigger>
            <TabsTrigger value="maya" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Maya
            </TabsTrigger>
            <TabsTrigger value="bank" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Bank
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gcash" className="mt-0">
            <GCashForm isLoading={isProcessing} onSubmit={(data) => handlePaymentSubmit("gcash", data)} />
          </TabsContent>

          <TabsContent value="maya" className="mt-0">
            <MayaForm isLoading={isProcessing} onSubmit={(data) => handlePaymentSubmit("maya", data)} />
          </TabsContent>

          <TabsContent value="bank" className="mt-0">
            <BankTransferForm
              isLoading={isProcessing}
              onSubmit={(data) => handlePaymentSubmit("bank_transfer", data)}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
          <ShieldCheck className="h-4 w-4" />
          <span>Secure 256-bit encrypted payment</span>
        </div>
      </main>
    </div>
  )
}
