"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, FileText, ShieldCheck, Loader2 } from "lucide-react"
import { useCertificates, type CertificateRequest } from "@/lib/certificate-context"
import { usePayment } from "@/lib/payment-context"
import { processPayment, validatePaymentMethod, PaymentTransaction } from "@/lib/payment-utils"
import { GCashForm, MayaForm, BankTransferForm } from "@/components/payment-methods"
import { PaymentReceiptModal } from "@/components/payment-receipt-modal"

export default function PaymentPage() {
  const router = useRouter()
  const { currentRequest, addCertificate, setCurrentRequest } = useCertificates()
  const { addPayment } = usePayment()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState("Connecting to payment provider...")
  const [lastTransaction, setLastTransaction] = useState<PaymentTransaction | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentRequest) {
      router.push("/request")
    }
  }, [currentRequest, router])

  if (!currentRequest) return null

  // Calculate total with processing fee
  const certFee = currentRequest.amount || 50
  const processingFee = 5
  const totalAmount = certFee + processingFee

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
    const messages = ["Connecting to payment provider...", "Verifying account...", "Processing payment..."]
    let msgIndex = 0
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length
      setProcessingMessage(messages[msgIndex])
    }, 800)

    try {
      const transaction = await processPayment(method, totalAmount, currentRequest.id || `temp-${Date.now()}`)
      
      clearInterval(interval)
      
      // Save payment
      addPayment(transaction)
      setLastTransaction(transaction)

      // Generate Certificate
      const serial = `BGRY-MWQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(6, "0")}`
      const certId = `cert_${Date.now()}`
      
      const newCertificate: CertificateRequest = {
        id: certId,
        certificateType: currentRequest.certificateType || "Barangay Clearance",
        purpose: currentRequest.purpose || "Employment",
        customPurpose: currentRequest.customPurpose,
        requestType: currentRequest.requestType || "regular",
        amount: totalAmount,
        paymentReference: transaction.transactionReference,
        paymentTransactionId: transaction.id,
        serialNumber: serial,
        status: "processing",
        createdAt: new Date().toISOString(),
        age: currentRequest.age || 0,
        residentName: currentRequest.residentName,
        purok: currentRequest.purok || "",
        yearsOfResidency: currentRequest.yearsOfResidency || 0,
      }

      addCertificate(newCertificate)
      
      setIsProcessing(false)
      setShowReceipt(true)
      
    } catch (err) {
      clearInterval(interval)
      setIsProcessing(false)
      setError("Payment failed. Please try again.")
    }
  }

  const handleCloseReceipt = () => {
    setShowReceipt(false)
    setCurrentRequest(null)
    router.push("/requests")
  }

  const handleViewCertificate = () => {
    setShowReceipt(false)
    setCurrentRequest(null)
    router.push("/requests")
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
        <Link href="/request" className="rounded-lg p-1 transition-colors hover:bg-[#F9FAFB]">
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
                   <h3 className="font-semibold text-gray-900">{currentRequest.certificateType}</h3>
                   <p className="text-sm text-gray-500">{currentRequest.purpose}</p>
                 </div>
               </div>
            </div>

            <div className="space-y-2 border-t border-gray-100 pt-4">
               <div className="flex justify-between text-sm">
                 <span className="text-gray-500">Certificate Fee</span>
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
            <TabsTrigger value="gcash" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">GCash</TabsTrigger>
            <TabsTrigger value="maya" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Maya</TabsTrigger>
            <TabsTrigger value="bank" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Bank</TabsTrigger>
          </TabsList>
          
          <TabsContent value="gcash" className="mt-0">
            <GCashForm 
              isLoading={isProcessing} 
              onSubmit={(data) => handlePaymentSubmit("gcash", data)} 
            />
          </TabsContent>
          
          <TabsContent value="maya" className="mt-0">
            <MayaForm 
              isLoading={isProcessing} 
              onSubmit={(data) => handlePaymentSubmit("maya", data)} 
            />
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
