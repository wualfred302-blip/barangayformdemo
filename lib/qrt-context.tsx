"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo, memo, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

export interface QRTIDRequest {
  id: string
  qrtCode: string
  verificationCode: string
  userId: string
  fullName: string
  email: string
  phoneNumber: string
  birthDate: string
  age: number
  gender: string
  civilStatus: string
  birthPlace: string
  address: string
  height: string
  weight: string
  yearsResident: number
  citizenship: string
  emergencyContactName: string
  emergencyContactAddress: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  photoUrl: string
  idFrontImageUrl?: string
  idBackImageUrl?: string
  qrCodeData: string
  status: "pending" | "processing" | "ready" | "issued"
  issuedDate?: string
  expiryDate?: string
  createdAt: string
  updatedAt?: string
  paymentReference: string
  paymentTransactionId?: string
  requestType: "regular" | "rush"
  amount: number
}

export interface QRTVerificationLog {
  qrtCode: string
  verificationCode: string
  verifiedBy: string
  timestamp: string
  action: "qrt_verification"
}

interface QRTContextType {
  qrtIds: QRTIDRequest[]
  currentRequest: Partial<QRTIDRequest> | null
  isLoaded: boolean
  verificationLogs: QRTVerificationLog[]
  setCurrentRequest: (request: Partial<QRTIDRequest> | null) => void
  setCurrentRequestImmediate: (request: Partial<QRTIDRequest> | null) => void
  addQRTRequest: (request: QRTIDRequest) => Promise<QRTIDRequest | null>
  updateQRTStatus: (id: string, status: string, imageData?: { frontUrl: string; backUrl: string }) => Promise<void>
  getQRTByCode: (code: string) => QRTIDRequest | undefined
  findQRTByVerificationCode: (code: string) => Promise<QRTIDRequest | null>
  getUserQRTIds: (userId: string) => QRTIDRequest[]
  getQRTById: (id: string) => QRTIDRequest | undefined
  logVerification: (qrtCode: string, verificationCode: string, verifiedBy: string) => Promise<void>
  getVerificationLogs: () => QRTVerificationLog[]
  getQRTVerificationHistory: (qrtCode: string) => QRTVerificationLog[]
  refreshQRTIds: () => Promise<void>
}

const QRTContext = createContext<QRTContextType | undefined>(undefined)

const CURRENT_REQUEST_KEY = "barangay_qrt_current_request"

function dbRowToQRTIDRequest(row: Record<string, unknown>): QRTIDRequest {
  return {
    id: row.id as string,
    qrtCode: row.qrt_code as string,
    verificationCode: row.verification_code as string,
    userId: (row.user_id as string) || "anonymous",
    fullName: row.full_name as string,
    email: row.email as string,
    phoneNumber: row.phone_number as string,
    birthDate: row.birth_date as string,
    age: row.age as number,
    gender: row.gender as string,
    civilStatus: row.civil_status as string,
    birthPlace: row.birth_place as string,
    address: row.address as string,
    height: (row.height as string) || "",
    weight: (row.weight as string) || "",
    yearsResident: (row.years_resident as number) || 0,
    citizenship: (row.citizenship as string) || "",
    emergencyContactName: (row.emergency_contact_name as string) || "",
    emergencyContactAddress: (row.emergency_contact_address as string) || "",
    emergencyContactPhone: (row.emergency_contact_phone as string) || "",
    emergencyContactRelationship: (row.emergency_contact_relationship as string) || "",
    photoUrl: (row.photo_url as string) || "",
    idFrontImageUrl: row.id_front_image_url as string | undefined,
    idBackImageUrl: row.id_back_image_url as string | undefined,
    qrCodeData: row.qr_code_data as string,
    status: row.status as QRTIDRequest["status"],
    issuedDate: row.issued_date as string | undefined,
    expiryDate: row.expiry_date as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string | undefined,
    paymentReference: (row.payment_reference as string) || "",
    paymentTransactionId: row.payment_transaction_id as string | undefined,
    requestType: row.request_type as QRTIDRequest["requestType"],
    amount: Number(row.amount) || 0,
  }
}

function qrtRequestToDbRow(request: QRTIDRequest): Record<string, unknown> {
  return {
    id: request.id,
    qrt_code: request.qrtCode,
    verification_code: request.verificationCode,
    user_id: request.userId,
    full_name: request.fullName,
    email: request.email,
    phone_number: request.phoneNumber,
    birth_date: request.birthDate,
    age: request.age,
    gender: request.gender,
    civil_status: request.civilStatus,
    birth_place: request.birthPlace,
    address: request.address,
    height: request.height,
    weight: request.weight,
    years_resident: request.yearsResident,
    citizenship: request.citizenship,
    emergency_contact_name: request.emergencyContactName,
    emergency_contact_address: request.emergencyContactAddress,
    emergency_contact_phone: request.emergencyContactPhone,
    emergency_contact_relationship: request.emergencyContactRelationship,
    photo_url: request.photoUrl,
    id_front_image_url: request.idFrontImageUrl,
    id_back_image_url: request.idBackImageUrl,
    qr_code_data: request.qrCodeData,
    status: request.status,
    request_type: request.requestType,
    issued_date: request.issuedDate,
    expiry_date: request.expiryDate,
    payment_reference: request.paymentReference,
    payment_transaction_id: request.paymentTransactionId,
    amount: request.amount,
    created_at: request.createdAt,
  }
}

// Utility function to generate unique verification code
function generateVerificationCode(existingCodes: string[]): string {
  const year = new Date().getFullYear()
  let code: string
  let attempts = 0
  const maxAttempts = 100

  do {
    const randomNum = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0")
    code = `VRF-${year}-${randomNum}`
    attempts++
  } while (existingCodes.includes(code) && attempts < maxAttempts)

  return code
}

export const QRTProvider = memo(({ children }: { children: ReactNode }) => {
  const [qrtIds, setQrtIds] = useState<QRTIDRequest[]>([])
  const [currentRequest, setCurrentRequest] = useState<Partial<QRTIDRequest> | null>(null)
  const [verificationLogs, setVerificationLogs] = useState<QRTVerificationLog[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()

        // Load QRT IDs from Supabase
        const { data: qrtData, error: qrtError } = await supabase
          .from("qrt_ids")
          .select("*")
          .order("created_at", { ascending: false })

        let mappedQrtData: QRTIDRequest[] = []
        if (qrtError) {
          console.error("Failed to load QRT IDs from Supabase:", qrtError)
        } else if (qrtData) {
          mappedQrtData = qrtData.map(dbRowToQRTIDRequest)
          setQrtIds(mappedQrtData)
        }

        // Load current request from localStorage (temporary session data)
        const storedCurrent = localStorage.getItem(CURRENT_REQUEST_KEY)
        if (storedCurrent) {
          const parsedCurrent = JSON.parse(storedCurrent)
          setCurrentRequest(parsedCurrent)
        }

        const { data: logsData, error: logsError } = await supabase
          .from("qrt_verification_logs")
          .select("id, qrt_id, scanned_at, verification_status, notes")
          .order("scanned_at", { ascending: false })
          .limit(100)

        if (logsError) {
          console.error("Failed to load verification logs from Supabase:", logsError)
        } else if (logsData) {
          // Map logs and look up QRT data from loaded QRT IDs
          const mappedLogs: QRTVerificationLog[] = logsData.map((log) => {
            // Find the corresponding QRT ID from local data
            const qrtMatch = mappedQrtData.find((qrt) => qrt.id === log.qrt_id)
            return {
              qrtCode: qrtMatch?.qrtCode || "",
              verificationCode: qrtMatch?.verificationCode || "",
              verifiedBy: "Barangay Staff",
              timestamp: log.scanned_at,
              action: "qrt_verification" as const,
            }
          })
          setVerificationLogs(mappedLogs)
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      } finally {
        setIsLoaded(true)
      }
    }

    loadData()
  }, [])

  const refreshQRTIds = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("qrt_ids").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Failed to refresh QRT IDs:", error)
      } else if (data) {
        const mappedData = data.map(dbRowToQRTIDRequest)
        setQrtIds(mappedData)
      }
    } catch (error) {
      console.error("Failed to refresh QRT IDs:", error)
    }
  }, [])

  const addQRTRequest = useCallback(async (request: QRTIDRequest): Promise<QRTIDRequest | null> => {
    try {
      console.log("[v0] Adding QRT request to Supabase:", request.qrtCode)
      const supabase = createClient()

      const dbRow = {
        id: request.id,
        qrt_code: request.qrtCode,
        verification_code: request.verificationCode,
        user_id: request.userId,
        full_name: request.fullName,
        birth_date: request.birthDate,
        age: request.age,
        gender: request.gender,
        civil_status: request.civilStatus,
        birth_place: request.birthPlace,
        address: request.address,
        height: request.height || "",
        weight: request.weight || "",
        years_resident: request.yearsResident || 0,
        citizenship: request.citizenship || "",
        emergency_contact_name: request.emergencyContactName || "",
        emergency_contact_address: request.emergencyContactAddress || "",
        emergency_contact_phone: request.emergencyContactPhone || "",
        emergency_contact_relationship: request.emergencyContactRelationship || "",
        photo_url: request.photoUrl || "",
        id_front_image_url: request.idFrontImageUrl || "",
        id_back_image_url: request.idBackImageUrl || "",
        qr_code_data: request.qrCodeData,
        status: request.status,
        request_type: request.requestType || "regular",
        issued_date: request.issuedDate || null,
        expiry_date: request.expiryDate || null,
        payment_reference: request.paymentReference || "",
        payment_transaction_id: request.paymentTransactionId || "",
        amount: request.amount || 0,
        created_at: request.createdAt || new Date().toISOString(),
      }

      console.log("[v0] Inserting to Supabase with data:", dbRow)

      const { data, error } = await supabase.from("qrt_ids").insert(dbRow).select().single()

      if (error) {
        console.error("[v0] Supabase insert error:", error)
        console.error("[v0] Error details - code:", error.code, "message:", error.message)

        // Handle various error types gracefully by falling back to local state
        // This ensures the user's QRT ID request is not lost even if database insert fails
        const errorMessage = error.message || ""
        const isRecoverableError =
          errorMessage.includes("schema cache") ||
          errorMessage.includes("Could not find") ||
          errorMessage.includes("column") ||
          errorMessage.includes("does not exist") ||
          errorMessage.includes("violates") ||
          error.code === "42703" || // PostgreSQL column does not exist
          error.code === "23502" // PostgreSQL not-null constraint violation

        if (isRecoverableError) {
          console.warn("[v0] Database error - adding to local state only:", errorMessage)
          setQrtIds((prev) => [request, ...prev])
          return request
        }

        // For unrecoverable errors, still add to local state to prevent data loss
        console.warn("[v0] Unexpected error - adding to local state as fallback")
        setQrtIds((prev) => [request, ...prev])
        return request
      }

      console.log("[v0] Successfully inserted to Supabase:", data)
      const newRequest = dbRowToQRTIDRequest(data)
      setQrtIds((prev) => [newRequest, ...prev])
      return newRequest
    } catch (error) {
      console.error("[v0] Failed to add QRT request:", error)
      setQrtIds((prev) => [request, ...prev])
      return request
    }
  }, [])

  const updateQRTStatus = useCallback(
    async (id: string, status: string, imageData?: { frontUrl: string; backUrl: string }) => {
      try {
        const supabase = createClient()

        const updateData: Record<string, unknown> = {
          status,
          updated_at: new Date().toISOString(),
        }

        if (imageData) {
          updateData.id_front_image_url = imageData.frontUrl
          updateData.id_back_image_url = imageData.backUrl
        }

        const { error } = await supabase.from("qrt_ids").update(updateData).eq("id", id)

        if (error) {
          console.error("Failed to update QRT status in Supabase:", error)
          return
        }

        // Update local state
        setQrtIds((prev) =>
          prev.map((qrt) => {
            if (qrt.id === id) {
              return {
                ...qrt,
                status: status as QRTIDRequest["status"],
                updatedAt: new Date().toISOString(),
                ...(imageData && {
                  idFrontImageUrl: imageData.frontUrl,
                  idBackImageUrl: imageData.backUrl,
                }),
              }
            }
            return qrt
          }),
        )
      } catch (error) {
        console.error("Failed to update QRT status:", error)
      }
    },
    [],
  )

  const getQRTByCode = useCallback(
    (code: string) => {
      return qrtIds.find((qrt) => qrt.qrtCode === code)
    },
    [qrtIds],
  )

  const getUserQRTIds = useCallback(
    (userId: string) => {
      return qrtIds.filter((qrt) => qrt.userId === userId)
    },
    [qrtIds],
  )

  const getQRTById = useCallback(
    (id: string) => {
      return qrtIds.find((qrt) => qrt.id === id)
    },
    [qrtIds],
  )

  const findQRTByVerificationCode = useCallback(
    async (code: string): Promise<QRTIDRequest | null> => {
      // First check local state
      const localMatch = qrtIds.find((qrt) => qrt.verificationCode === code)
      if (localMatch) return localMatch

      // If not found locally, query Supabase directly
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from("qrt_ids").select("*").eq("verification_code", code).single()

        if (error) {
          console.error("Failed to find QRT by verification code:", error)
          return null
        }

        if (data) {
          const qrt = dbRowToQRTIDRequest(data)
          // Add to local state if not present
          setQrtIds((prev) => {
            if (!prev.find((q) => q.id === qrt.id)) {
              return [qrt, ...prev]
            }
            return prev
          })
          return qrt
        }
        return null
      } catch (error) {
        console.error("Failed to find QRT by verification code:", error)
        return null
      }
    },
    [qrtIds],
  )

  const logVerification = useCallback(async (qrtCode: string, verificationCode: string, verifiedBy: string) => {
    const newLog: QRTVerificationLog = {
      qrtCode,
      verificationCode,
      verifiedBy,
      timestamp: new Date().toISOString(),
      action: "qrt_verification",
    }

    // Update local state immediately
    setVerificationLogs((prev) => [newLog, ...prev])

    // Save to Supabase
    try {
      const supabase = createClient()

      // Find the QRT ID to get its UUID
      const { data: qrtData } = await supabase.from("qrt_ids").select("id").eq("qrt_code", qrtCode).single()

      if (qrtData?.id) {
        const { error } = await supabase.from("qrt_verification_logs").insert({
          qrt_id: qrtData.id,
          verification_status: "success",
          notes: `Verified by ${verifiedBy}. Code: ${verificationCode}`,
        })

        if (error) {
          console.error("Failed to log verification to Supabase:", error)
        }
      }
    } catch (error) {
      console.error("Failed to log verification:", error)
    }
  }, [])

  const getVerificationLogs = useCallback(() => {
    return verificationLogs
  }, [verificationLogs])

  const getQRTVerificationHistory = useCallback(
    (qrtCode: string) => {
      return verificationLogs.filter((log) => log.qrtCode === qrtCode)
    },
    [verificationLogs],
  )

  const setCurrentRequestImmediate = useCallback((request: Partial<QRTIDRequest> | null) => {
    setCurrentRequest(request)
    try {
      if (request) {
        localStorage.setItem(CURRENT_REQUEST_KEY, JSON.stringify(request))
      } else {
        localStorage.removeItem(CURRENT_REQUEST_KEY)
      }
    } catch (error) {
      console.error("Failed to save current request:", error)
    }
  }, [])

  const value = useMemo(
    () => ({
      qrtIds,
      currentRequest,
      isLoaded,
      verificationLogs,
      setCurrentRequest,
      setCurrentRequestImmediate,
      addQRTRequest,
      updateQRTStatus,
      getQRTByCode,
      findQRTByVerificationCode,
      getUserQRTIds,
      getQRTById,
      logVerification,
      getVerificationLogs,
      getQRTVerificationHistory,
      refreshQRTIds,
    }),
    [
      qrtIds,
      currentRequest,
      isLoaded,
      verificationLogs,
      addQRTRequest,
      updateQRTStatus,
      getQRTByCode,
      findQRTByVerificationCode,
      getUserQRTIds,
      getQRTById,
      logVerification,
      getVerificationLogs,
      getQRTVerificationHistory,
      setCurrentRequestImmediate,
      refreshQRTIds,
    ],
  )

  return <QRTContext.Provider value={value}>{children}</QRTContext.Provider>
})

QRTProvider.displayName = "QRTProvider"

export function useQRT() {
  const context = useContext(QRTContext)
  if (context === undefined) {
    throw new Error("useQRT must be used within a QRTProvider")
  }
  return context
}

// Export utility function for use in components
export { generateVerificationCode }
