"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Download, ExternalLink, Copy, Check } from "lucide-react"
import { PaymentTransaction, generateReceiptPDF } from "@/lib/payment-utils"

interface PaymentReceiptModalProps {
  transaction: PaymentTransaction | null
  open: boolean
  onClose: () => void
  onViewCertificate: () => void
}

export function PaymentReceiptModal({ transaction, open, onClose, onViewCertificate }: PaymentReceiptModalProps) {
  const [copied, setCopied] = React.useState(false)

  if (!transaction) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(transaction.transactionReference)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    // In a real app, this might download a PDF
    // For demo, we trigger print
    const receiptContent = generateReceiptPDF(transaction)
    console.log(receiptContent) // Fallback log
    window.print()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl">
        <div className="bg-[#10B981] p-6 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <CheckCircle2 className="h-10 w-10 text-white animate-pulse" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">Payment Successful</DialogTitle>
          </DialogHeader>
          <p className="text-emerald-100">Thank you for your payment!</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Reference No.</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-gray-900">{transaction.transactionReference}</span>
                <button onClick={handleCopy} className="text-gray-400 hover:text-[#10B981]">
                  {copied ? <Check className="h-4 w-4 text-[#10B981]" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Amount Paid</span>
              <span className="font-bold text-lg text-[#10B981]">₱{transaction.amount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Payment Method</span>
              <span className="font-medium text-gray-900 uppercase">{transaction.paymentMethod.replace('_', ' ')}</span>
            </div>
            
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-500 text-sm">Date & Time</span>
              <span className="font-medium text-gray-900 text-right">
                {new Date(transaction.completedAt || transaction.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={handleDownload} 
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white h-12"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Receipt
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onViewCertificate}
              className="w-full h-12 border-[#10B981] text-[#10B981] hover:bg-emerald-50"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View Certificate Status
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="w-full text-gray-500"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
