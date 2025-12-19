"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SignaturePad } from "@/components/signature-pad"
import { CheckCircle2 } from "lucide-react"

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (signature: string) => void
  certificateType: string
  residentName: string
}

export function SignatureModal({ isOpen, onClose, onConfirm, certificateType, residentName }: SignatureModalProps) {
  const [signature, setSignature] = useState<string | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const handleSignatureSave = (signatureData: string) => {
    setSignature(signatureData)
    setIsEmpty(false)
  }

  const handleClear = () => {
    setSignature(null)
    setIsEmpty(true)
  }

  const handleConfirm = () => {
    if (signature && !isEmpty) {
      onConfirm(signature)
    }
  }

  const handleClose = () => {
    handleClear()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl w-[calc(100%-2rem)] p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Digital Signature Required</DialogTitle>
          <DialogDescription className="text-sm text-slate-600">
            Sign to approve {certificateType} for {residentName}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <SignaturePad onSave={handleSignatureSave} onClear={handleClear} />
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3">
          <Button variant="ghost" onClick={handleClose} className="h-12 w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isEmpty}
            className="h-12 w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Approve & Sign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
