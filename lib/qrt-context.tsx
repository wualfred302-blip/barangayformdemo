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

interface QRTContextType {
  qrtIds: QRTIDRequest[]
  currentRequest: Partial<QRTIDRequest> | null
  setCurrentRequest: (request: Partial<QRTIDRequest> | null) => void
  addQRTRequest: (request: QRTIDRequest) => void
  updateQRTStatus: (
    id: string,
    status: string,
    imageData?: { frontUrl: string; backUrl: string }
  ) => void
  getQRTByCode: (code: string) => QRTIDRequest | undefined
  getUserQRTIds: (userId: string) => QRTIDRequest[]
  getQRTById: (id: string) => QRTIDRequest | undefined
}

const QRTContext = createContext<QRTContextType | undefined>(undefined)

const STORAGE_KEY = "barangay_qrt_ids"
const CURRENT_REQUEST_KEY = "barangay_qrt_current_request"

export const QRTProvider = memo(({ children }: { children: ReactNode }) => {
  const [qrtIds, setQrtIds] = useState<QRTIDRequest[]>([])
  const [currentRequest, setCurrentRequest] = useState<Partial<QRTIDRequest> | null>(null)
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
    } catch (error) {
      console.error("Failed to load QRT IDs from localStorage:", error)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(CURRENT_REQUEST_KEY)
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

  const value = useMemo(
    () => ({
      qrtIds,
      currentRequest,
      setCurrentRequest,
      addQRTRequest,
      updateQRTStatus,
      getQRTByCode,
      getUserQRTIds,
      getQRTById,
    }),
    [
      qrtIds,
      currentRequest,
      addQRTRequest,
      updateQRTStatus,
      getQRTByCode,
      getUserQRTIds,
      getQRTById,
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
