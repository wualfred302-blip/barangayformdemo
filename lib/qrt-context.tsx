"use client"

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  ReactNode,
} from "react"

export interface QRTIDRequest {
  id: string
  qrtCode: string
  verificationCode: string
  userId: string
  fullName: string
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
  addQRTRequest: (request: QRTIDRequest) => void
  updateQRTStatus: (
    id: string,
    status: string,
    imageData?: { frontUrl: string; backUrl: string }
  ) => void
  getQRTByCode: (code: string) => QRTIDRequest | undefined
  findQRTByVerificationCode: (code: string) => QRTIDRequest | undefined
  getUserQRTIds: (userId: string) => QRTIDRequest[]
  getQRTById: (id: string) => QRTIDRequest | undefined
  logVerification: (qrtCode: string, verificationCode: string, verifiedBy: string) => void
  getVerificationLogs: () => QRTVerificationLog[]
  getQRTVerificationHistory: (qrtCode: string) => QRTVerificationLog[]
}

const QRTContext = createContext<QRTContextType | undefined>(undefined)

const STORAGE_KEY = "barangay_qrt_ids"
const CURRENT_REQUEST_KEY = "barangay_qrt_current_request"
const VERIFICATION_LOGS_KEY = "barangay_verification_logs"

// Utility function to generate unique verification code
function generateVerificationCode(existingCodes: string[]): string {
  const year = new Date().getFullYear()
  let code: string
  let attempts = 0
  const maxAttempts = 100

  do {
    const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
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

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setQrtIds(parsed)
      }

      const storedCurrent = localStorage.getItem(CURRENT_REQUEST_KEY)
      if (storedCurrent) {
        const parsedCurrent = JSON.parse(storedCurrent)
        setCurrentRequest(parsedCurrent)
      }

      const storedLogs = localStorage.getItem(VERIFICATION_LOGS_KEY)
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs)
        setVerificationLogs(parsedLogs)
      }
    } catch (error) {
      console.error("Failed to load QRT IDs from localStorage:", error)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(CURRENT_REQUEST_KEY)
      localStorage.removeItem(VERIFICATION_LOGS_KEY)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save to localStorage with debounce (1 second)
  useEffect(() => {
    if (!isLoaded) return

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(qrtIds))
      } catch (error) {
        console.error("Failed to save QRT IDs to localStorage:", error)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [qrtIds, isLoaded])

  // Save current request to localStorage with debounce
  useEffect(() => {
    if (!isLoaded) return

    const timeoutId = setTimeout(() => {
      try {
        if (currentRequest) {
          localStorage.setItem(CURRENT_REQUEST_KEY, JSON.stringify(currentRequest))
        } else {
          localStorage.removeItem(CURRENT_REQUEST_KEY)
        }
      } catch (error) {
        console.error("Failed to save current request to localStorage:", error)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [currentRequest, isLoaded])

  // Save verification logs to localStorage with debounce
  useEffect(() => {
    if (!isLoaded) return

    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(VERIFICATION_LOGS_KEY, JSON.stringify(verificationLogs))
      } catch (error) {
        console.error("Failed to save verification logs to localStorage:", error)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [verificationLogs, isLoaded])

  const addQRTRequest = useCallback((request: QRTIDRequest) => {
    setQrtIds((prev) => [request, ...prev])
  }, [])

  const updateQRTStatus = useCallback(
    (
      id: string,
      status: string,
      imageData?: { frontUrl: string; backUrl: string }
    ) => {
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
        })
      )
    },
    []
  )

  const getQRTByCode = useCallback(
    (code: string) => {
      return qrtIds.find((qrt) => qrt.qrtCode === code)
    },
    [qrtIds]
  )

  const getUserQRTIds = useCallback(
    (userId: string) => {
      return qrtIds.filter((qrt) => qrt.userId === userId)
    },
    [qrtIds]
  )

  const getQRTById = useCallback(
    (id: string) => {
      return qrtIds.find((qrt) => qrt.id === id)
    },
    [qrtIds]
  )

  const findQRTByVerificationCode = useCallback(
    (code: string) => {
      return qrtIds.find((qrt) => qrt.verificationCode === code)
    },
    [qrtIds]
  )

  const logVerification = useCallback(
    (qrtCode: string, verificationCode: string, verifiedBy: string) => {
      const newLog: QRTVerificationLog = {
        qrtCode,
        verificationCode,
        verifiedBy,
        timestamp: new Date().toISOString(),
        action: "qrt_verification",
      }

      setVerificationLogs((prev) => [newLog, ...prev])

      // Also call API endpoint for server-side logging (fire-and-forget)
      fetch('/api/qrt-id/verify/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog),
      }).catch((error) => {
        console.error('[Verification Log] Failed to log to API:', error)
      })

      console.log('[Verification Log] Saved to localStorage:', newLog)
    },
    []
  )

  const getVerificationLogs = useCallback(() => {
    return verificationLogs
  }, [verificationLogs])

  const getQRTVerificationHistory = useCallback(
    (qrtCode: string) => {
      return verificationLogs.filter((log) => log.qrtCode === qrtCode)
    },
    [verificationLogs]
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
    ]
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
