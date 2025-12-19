"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface CertificateRequest {
  id: string
  certificateType: string
  purpose: string
  customPurpose?: string
  requestType: "regular" | "rush"
  amount: number
  paymentReference: string
  serialNumber: string
  status: "processing" | "ready"
  createdAt: string
  readyAt?: string
  age: number
  purok: string
  yearsOfResidency: number
  residentName?: string
  staffSignature?: string
  signedBy?: string
  signedByRole?: string
  signedAt?: string
}

interface CertificateContextType {
  certificates: CertificateRequest[]
  currentRequest: Partial<CertificateRequest> | null
  setCurrentRequest: (request: Partial<CertificateRequest> | null) => void
  addCertificate: (cert: CertificateRequest) => void
  updateCertificateStatus: (
    id: string,
    status: "processing" | "ready",
    signatureData?: {
      signature: string
      signedBy: string
      signedByRole: string
    },
  ) => void
  getCertificate: (id: string) => CertificateRequest | undefined
}

const CertificateContext = createContext<CertificateContextType | undefined>(undefined)

export function CertificateProvider({ children }: { children: ReactNode }) {
  const [certificates, setCertificates] = useState<CertificateRequest[]>([])
  const [currentRequest, setCurrentRequest] = useState<Partial<CertificateRequest> | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem("barangay_certificates")
    if (stored) {
      setCertificates(JSON.parse(stored))
    }
  }, [])

  const addCertificate = (cert: CertificateRequest) => {
    const updated = [...certificates, cert]
    setCertificates(updated)
    localStorage.setItem("barangay_certificates", JSON.stringify(updated))
  }

  const updateCertificateStatus = (
    id: string,
    status: "processing" | "ready",
    signatureData?: {
      signature: string
      signedBy: string
      signedByRole: string
    },
  ) => {
    const updated = certificates.map((cert) =>
      cert.id === id
        ? {
            ...cert,
            status,
            readyAt: status === "ready" ? new Date().toISOString() : undefined,
            ...(signatureData && {
              staffSignature: signatureData.signature,
              signedBy: signatureData.signedBy,
              signedByRole: signatureData.signedByRole,
              signedAt: new Date().toISOString(),
            }),
          }
        : cert,
    )
    setCertificates(updated)
    localStorage.setItem("barangay_certificates", JSON.stringify(updated))
  }

  const getCertificate = (id: string) => {
    return certificates.find((cert) => cert.id === id)
  }

  return (
    <CertificateContext.Provider
      value={{
        certificates,
        currentRequest,
        setCurrentRequest,
        addCertificate,
        updateCertificateStatus,
        getCertificate,
      }}
    >
      {children}
    </CertificateContext.Provider>
  )
}

export function useCertificates() {
  const context = useContext(CertificateContext)
  if (context === undefined) {
    throw new Error("useCertificates must be used within a CertificateProvider")
  }
  return context
}
