"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Wallet, Banknote, Receipt, CheckCircle2, AlertCircle, Clock, ChevronRight, Slash } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { usePayment } from "@/lib/payment-context"
import { PaymentReceiptModal } from "@/components/payment-receipt-modal"
import { PaymentTransaction } from "@/lib/payment-utils"
import { useRouter } from "next/navigation"

export default function PaymentHistoryPage() {
  const router = useRouter()
  const { getPayments } = usePayment()
  const payments = getPayments().sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const [selectedTransaction, setSelectedTransaction] = useState<PaymentTransaction | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [filter, setFilter] = useState("all")

  const handleTransactionClick = (transaction: PaymentTransaction) => {
    setSelectedTransaction(transaction)
    setShowReceipt(true)
  }

  const handleViewCertificate = () => {
    setShowReceipt(false)
    router.push("/requests")
  }

  const filteredPayments = payments.filter(p => {
    if (filter === "all") return true
    return p.status === filter
  })

  const getIcon = (method: string) => {
    switch(method) {
      case "gcash": return <Wallet className="h-5 w-5 text-white" />
      case "maya": return <Banknote className="h-5 w-5 text-white" />
      case "bank_transfer": return <Receipt className="h-5 w-5 text-white" />
      default: return <Wallet className="h-5 w-5 text-white" />
    }
  }

  const getBgColor = (method: string) => {
    switch(method) {
      case "gcash": return "bg-[#007DFE]"
      case "maya": return "bg-[#00D632]"
      case "bank_transfer": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case "success": return "text-emerald-600 bg-emerald-50"
      case "pending": return "text-amber-600 bg-amber-50"
      case "failed": return "text-red-600 bg-red-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      <PaymentReceiptModal
        transaction={selectedTransaction}
        open={showReceipt}
        onClose={() => setShowReceipt(false)}
        onViewCertificate={handleViewCertificate}
      />

      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-[#E5E7EB] bg-white px-5">
        <Link href="/dashboard" className="rounded-lg p-1 transition-colors hover:bg-[#F9FAFB]">
          <ArrowLeft className="h-5 w-5 text-[#374151]" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8">
            <Image src="/images/logo.png" alt="Barangay Seal" fill className="object-contain" />
          </div>
          <h1 className="text-lg font-semibold text-[#111827]">Payment History</h1>
        </div>
      </header>

      <main className="flex-1 px-5 pt-5 pb-10">
        <Tabs defaultValue="all" className="w-full mb-6" onValueChange={setFilter}>
          <TabsList className="w-full grid grid-cols-4 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg text-xs">All</TabsTrigger>
            <TabsTrigger value="success" className="rounded-lg text-xs">Success</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-lg text-xs">Pending</TabsTrigger>
            <TabsTrigger value="failed" className="rounded-lg text-xs">Failed</TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredPayments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Receipt className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No transactions yet</h3>
            <p className="text-gray-500 mb-6 max-w-xs">You haven't made any payments yet. Request a certificate to get started.</p>
            <Link href="/request">
              <div className="inline-flex h-10 items-center justify-center rounded-lg bg-[#10B981] px-6 text-sm font-medium text-white shadow transition-colors hover:bg-[#059669]">
                Request Certificate
              </div>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <Card 
                key={payment.id} 
                className="overflow-hidden border-0 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => handleTransactionClick(payment)}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0 ${getBgColor(payment.paymentMethod)}`}>
                    {getIcon(payment.paymentMethod)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-gray-900 truncate pr-2">
                        {payment.transactionReference}
                      </h4>
                      <span className="font-bold text-[#10B981]">₱{payment.amount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()} • {new Date(payment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getStatusColor(payment.status)}`}>
                        {payment.status}
                      </span>
                    </div>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-gray-300" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
