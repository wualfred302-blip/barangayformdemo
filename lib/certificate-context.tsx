"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, memo, useCallback, useMemo } from "react"
import { usePayment } from "./payment-context"
import { createClient } from "./supabase/client"

export interface CertificateRequest {
  id: string // UUID from database (gen_random_uuid())
  userId?: string // Added for Supabase user association
  certificateType: string
  purpose: string
  customPurpose?: string
  requestType: "regular" | "rush"
  amount: number
  paymentReference: string
  paymentTransactionId?: string
  serialNumber: string
  status: "processing" | "ready"
  createdAt: string
  readyAt?: string
  purok: string
  yearsOfResidency?: number
  residencySince?: string
  residentName?: string
  sex?: string
  sexOrientation?: string
  civilStatus?: string
  birthplace?: string
  occupation?: string
  monthlyIncome?: number
  validIdType?: string
  validIdNumber?: string
  staffSignature?: string
  signedBy?: string
  signedByRole?: string
  signedAt?: string
}

interface CertificateContextType {
  certificates: CertificateRequest[]
  currentRequest: Partial<CertificateRequest> | null
  setCurrentRequest: (request: Partial<CertificateRequest> | null) => void
  addCertificate: (cert: CertificateRequest) => Promise<void>
  updateCertificateStatus: (
    id: string,
    status: "processing" | "ready",
    signatureData?: {
      signature: string
      signedBy: string
      signedByRole: string
    },
  ) => Promise<void>
  getCertificate: (id: string) => CertificateRequest | undefined
  getVerificationUrl: (serialNumber: string) => string
  getCertificatesByPaymentStatus: (status: "pending" | "success" | "failed") => CertificateRequest[]
  getCertificatesByUserId: (userId: string) => CertificateRequest[]
  refreshCertificates: () => Promise<void>
  isLoaded: boolean
}

const CertificateContext = createContext<CertificateContextType | undefined>(undefined)

export const CertificateProvider = memo(({ children }: { children: ReactNode }) => {
  const [certificates, setCertificates] = useState<CertificateRequest[]>([])
  const [currentRequest, setCurrentRequest] = useState<Partial<CertificateRequest> | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const { payments } = usePayment()

  // Helper function to map database row to CertificateRequest
  const dbRowToCertificate = useCallback((row: any): CertificateRequest => {
    return {
      id: row.id,
      userId: row.user_id,
      certificateType: row.certificate_type,
      purpose: row.purpose,
      customPurpose: row.custom_purpose,
      requestType: row.request_type,
      amount: row.amount,
      paymentReference: row.payment_reference,
      paymentTransactionId: row.payment_transaction_id,
      serialNumber: row.serial_number,
      status: row.status,
      createdAt: row.created_at,
      readyAt: row.ready_at,
      purok: row.purok || "",
      yearsOfResidency: row.years_of_residency,
      residencySince: row.residency_since,
      residentName: row.resident_name,
      sex: row.sex,
      sexOrientation: row.sex_orientation,
      civilStatus: row.civil_status,
      birthplace: row.birthplace,
      occupation: row.occupation,
      monthlyIncome: row.monthly_income,
      validIdType: row.valid_id_type,
      validIdNumber: row.valid_id_number,
      staffSignature: row.staff_signature,
      signedBy: row.signed_by,
      signedByRole: row.signed_by_role,
      signedAt: row.signed_at,
    }
  }, [])

  // Load certificates from Supabase on mount
  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const supabase = createClient()
        const { data: certData, error: certError } = await supabase
          .from("certificates")
          .select("*")
          .order("created_at", { ascending: false })

        if (certError) {
          console.error("[Certificates] Error loading from Supabase:", certError)
          return
        }

        if (certData) {
          const mappedCertificates = certData.map(dbRowToCertificate)
          setCertificates(mappedCertificates)
        }
        setIsLoaded(true)
      } catch (error) {
        console.error("[Certificates] Failed to load from Supabase:", error)
        setIsLoaded(true)
      }
    }

    loadCertificates()
  }, [dbRowToCertificate])

  const addCertificate = useCallback(async (cert: CertificateRequest) => {
    try {
      const supabase = createClient()

      // Validate that user_id is provided
      if (!cert.userId) {
        throw new Error('User ID is required to request a certificate')
      }

      const dbRow = {
        // Don't insert id - let DB generate UUID via gen_random_uuid()
        user_id: cert.userId,
        certificate_type: cert.certificateType,
        purpose: cert.purpose,
        custom_purpose: cert.customPurpose,
        request_type: cert.requestType,
        amount: cert.amount,
        payment_reference: cert.paymentReference,
        payment_transaction_id: cert.paymentTransactionId,
        serial_number: cert.serialNumber,
        status: cert.status,
        created_at: cert.createdAt,
        purok: cert.purok,
        years_of_residency: cert.yearsOfResidency,
        residency_since: cert.residencySince,
        resident_name: cert.residentName,
        sex: cert.sex,
        sex_orientation: cert.sexOrientation,
        civil_status: cert.civilStatus,
        birthplace: cert.birthplace,
        occupation: cert.occupation,
        monthly_income: cert.monthlyIncome,
        valid_id_type: cert.validIdType,
        valid_id_number: cert.validIdNumber,
      }

      const { data, error } = await supabase
        .from("certificates")
        .insert(dbRow)
        .select()
        .single()

      if (error) {
        console.error("[Certificates] Error inserting to Supabase:", error)
        throw error
      }

      if (data) {
        const newCert = dbRowToCertificate(data)
        setCertificates(prev => [newCert, ...prev])
      }
    } catch (error) {
      console.error("[Certificates] Failed to add certificate:", error)
      throw error
    }
  }, [dbRowToCertificate])

  const updateCertificateStatus = useCallback(async (
    id: string,
    status: "processing" | "ready",
    signatureData?: {
      signature: string
      signedBy: string
      signedByRole: string
    },
  ) => {
    try {
      const supabase = createClient()

      const updateData: any = {
        status,
        ready_at: status === "ready" ? new Date().toISOString() : null,
      }

      if (signatureData) {
        updateData.staff_signature = signatureData.signature
        updateData.signed_by = signatureData.signedBy
        updateData.signed_by_role = signatureData.signedByRole
        updateData.signed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from("certificates")
        .update(updateData)
        .eq("id", id)

      if (error) {
        console.error("[Certificates] Error updating status in Supabase:", error)
        throw error
      }

      // Update local state
      setCertificates(prev => prev.map((cert) =>
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
      ))
    } catch (error) {
      console.error("[Certificates] Failed to update certificate status:", error)
      throw error
    }
  }, [])

  const getCertificate = useCallback((id: string) => {
    return certificates.find((cert) => cert.id === id)
  }, [certificates])

  const getVerificationUrl = useCallback((serialNumber: string) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://mawaque.gov.ph"
    return `${baseUrl}/verify/${serialNumber}`
  }, [])

  const getCertificatesByPaymentStatus = useCallback((status: "pending" | "success" | "failed") => {
    return certificates.filter((cert) => {
      if (!cert.paymentTransactionId) return false
      const payment = payments.find((p) => p.id === cert.paymentTransactionId)
      return payment?.status === status
    })
  }, [certificates, payments])

  const getCertificatesByUserId = useCallback((userId: string) => {
    return certificates.filter((cert) => cert.userId === userId)
  }, [certificates])

  const refreshCertificates = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: certData, error: certError } = await supabase
        .from("certificates")
        .select("*")
        .order("created_at", { ascending: false })

      if (certError) {
        console.error("[Certificates] Error refreshing from Supabase:", certError)
        return
      }

      if (certData) {
        const mappedCertificates = certData.map(dbRowToCertificate)
        setCertificates(mappedCertificates)
      }
    } catch (error) {
      console.error("[Certificates] Failed to refresh certificates:", error)
    }
  }, [dbRowToCertificate])

  const setCurrentRequestCallback = useCallback((request: Partial<CertificateRequest> | null) => {
    setCurrentRequest(request)
  }, [])

  const value = useMemo(() => ({
    certificates,
    currentRequest,
    setCurrentRequest: setCurrentRequestCallback,
    addCertificate,
    updateCertificateStatus,
    getCertificate,
    getVerificationUrl,
    getCertificatesByPaymentStatus,
    getCertificatesByUserId,
    refreshCertificates,
    isLoaded,
  }), [
    certificates,
    currentRequest,
    setCurrentRequestCallback,
    addCertificate,
    updateCertificateStatus,
    getCertificate,
    getVerificationUrl,
    getCertificatesByPaymentStatus,
    getCertificatesByUserId,
    refreshCertificates,
    isLoaded,
  ])

  return (
    <CertificateContext.Provider value={value}>
      {children}
    </CertificateContext.Provider>
  )
})

export function useCertificates() {
  const context = useContext(CertificateContext)
  if (context === undefined) {
    throw new Error("useCertificates must be used within a CertificateProvider")
  }
  return context
}
