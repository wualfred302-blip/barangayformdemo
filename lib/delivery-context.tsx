"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  useRef,
  type ReactNode,
} from "react"
import { createClient } from "@/lib/supabase/client"

// Delivery Status Types
export type DeliveryStatus =
  | "requested"
  | "printing"
  | "printed"
  | "out_for_delivery"
  | "delivered"
  | "delivery_failed"
  | "pickup_required"

export type DeliveryFailureReason = "not_home" | "wrong_address" | "refused"

export type DeliveryTimeSlot = "morning" | "afternoon" | "evening"

export type DeliveryType = "delivery" | "pickup"

// Delivery Request Interface
export interface DeliveryRequest {
  id: string
  qrtId: string
  userId: string
  barangayCode: string

  // Delivery Address (structured)
  deliveryProvince: string
  deliveryProvinceCode?: string
  deliveryCity: string
  deliveryCityCode?: string
  deliveryBarangay: string
  deliveryBarangayCode?: string
  deliveryStreetAddress: string
  deliveryZipCode?: string
  deliveryLandmark?: string

  // Delivery Preferences
  preferredDate?: string
  preferredTimeSlot?: DeliveryTimeSlot
  deliveryNotes?: string
  deliveryType: DeliveryType

  // Status Tracking
  status: DeliveryStatus
  failureReason?: DeliveryFailureReason
  failedAttempts: number

  // Updated Selfie (optional retake)
  updatedPhotoUrl?: string

  // Delivery Confirmation (by user)
  deliveryConfirmedAt?: string
  deliveryPhotoProof?: string
  deliverySignature?: string

  // Staff Assignment
  assignedStaffId?: string
  assignedStaffName?: string

  // Print Queue Reference
  printBatchId?: string

  // Timestamps
  createdAt: string
  updatedAt?: string
  sentToPrintAt?: string
  printedAt?: string
  outForDeliveryAt?: string
  deliveredAt?: string
}

// Status History Interface
export interface DeliveryStatusHistory {
  id: string
  deliveryRequestId: string
  previousStatus?: string
  newStatus: string
  changedBy: string
  changeReason?: string
  createdAt: string
}

// Create Request Data Interface
export interface CreateDeliveryRequestData {
  qrtId: string
  userId: string
  barangayCode: string
  deliveryProvince: string
  deliveryProvinceCode?: string
  deliveryCity: string
  deliveryCityCode?: string
  deliveryBarangay: string
  deliveryBarangayCode?: string
  deliveryStreetAddress: string
  deliveryZipCode?: string
  deliveryLandmark?: string
  preferredDate?: string
  preferredTimeSlot?: DeliveryTimeSlot
  deliveryNotes?: string
  deliveryType?: DeliveryType
  updatedPhotoUrl?: string
}

// Context Type
interface DeliveryContextType {
  deliveryRequests: DeliveryRequest[]
  isLoaded: boolean

  // User actions
  createDeliveryRequest: (data: CreateDeliveryRequestData) => Promise<DeliveryRequest | null>
  getUserDeliveryRequests: (userId: string) => DeliveryRequest[]
  getDeliveryRequestById: (id: string) => DeliveryRequest | undefined
  getDeliveryRequestByQrtId: (qrtId: string) => DeliveryRequest | undefined
  confirmDelivery: (id: string, photoProof: string, signature: string) => Promise<boolean>
  rescheduleDelivery: (id: string, newDate: string, newTimeSlot: DeliveryTimeSlot) => Promise<boolean>
  updateDeliveryAddress: (
    id: string,
    address: {
      province: string
      provinceCode?: string
      city: string
      cityCode?: string
      barangay: string
      barangayCode?: string
      streetAddress: string
      zipCode?: string
      landmark?: string
    }
  ) => Promise<boolean>

  // Staff actions
  getDeliveryRequestsByBarangay: (barangayCode: string) => DeliveryRequest[]
  getDeliveryRequestsByStatus: (status: DeliveryStatus) => DeliveryRequest[]
  updateDeliveryStatus: (
    id: string,
    status: DeliveryStatus,
    options?: { failureReason?: DeliveryFailureReason; staffName?: string }
  ) => Promise<boolean>
  assignStaff: (id: string, staffId: string, staffName: string) => Promise<boolean>
  markSentToPrint: (ids: string[], batchId?: string) => Promise<boolean>
  markPrinted: (ids: string[]) => Promise<boolean>

  // Status History
  getStatusHistory: (deliveryRequestId: string) => Promise<DeliveryStatusHistory[]>

  // Refresh
  refreshDeliveryRequests: () => Promise<void>
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined)

// Helper function to convert database row to DeliveryRequest
function dbRowToDeliveryRequest(row: Record<string, unknown>): DeliveryRequest {
  return {
    id: row.id as string,
    qrtId: row.qrt_id as string,
    userId: row.user_id as string,
    barangayCode: row.barangay_code as string,

    deliveryProvince: row.delivery_province as string,
    deliveryProvinceCode: row.delivery_province_code as string | undefined,
    deliveryCity: row.delivery_city as string,
    deliveryCityCode: row.delivery_city_code as string | undefined,
    deliveryBarangay: row.delivery_barangay as string,
    deliveryBarangayCode: row.delivery_barangay_code as string | undefined,
    deliveryStreetAddress: row.delivery_street_address as string,
    deliveryZipCode: row.delivery_zip_code as string | undefined,
    deliveryLandmark: row.delivery_landmark as string | undefined,

    preferredDate: row.preferred_date as string | undefined,
    preferredTimeSlot: row.preferred_time_slot as DeliveryTimeSlot | undefined,
    deliveryNotes: row.delivery_notes as string | undefined,
    deliveryType: (row.delivery_type as DeliveryType) || "delivery",

    status: row.status as DeliveryStatus,
    failureReason: row.failure_reason as DeliveryFailureReason | undefined,
    failedAttempts: (row.failed_attempts as number) || 0,

    updatedPhotoUrl: row.updated_photo_url as string | undefined,

    deliveryConfirmedAt: row.delivery_confirmed_at as string | undefined,
    deliveryPhotoProof: row.delivery_photo_proof as string | undefined,
    deliverySignature: row.delivery_signature as string | undefined,

    assignedStaffId: row.assigned_staff_id as string | undefined,
    assignedStaffName: row.assigned_staff_name as string | undefined,

    printBatchId: row.print_batch_id as string | undefined,

    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string | undefined,
    sentToPrintAt: row.sent_to_print_at as string | undefined,
    printedAt: row.printed_at as string | undefined,
    outForDeliveryAt: row.out_for_delivery_at as string | undefined,
    deliveredAt: row.delivered_at as string | undefined,
  }
}

// Helper function to convert DeliveryRequest to database row
function deliveryRequestToDbRow(request: CreateDeliveryRequestData): Record<string, unknown> {
  return {
    qrt_id: request.qrtId,
    user_id: request.userId,
    barangay_code: request.barangayCode,

    delivery_province: request.deliveryProvince,
    delivery_province_code: request.deliveryProvinceCode,
    delivery_city: request.deliveryCity,
    delivery_city_code: request.deliveryCityCode,
    delivery_barangay: request.deliveryBarangay,
    delivery_barangay_code: request.deliveryBarangayCode,
    delivery_street_address: request.deliveryStreetAddress,
    delivery_zip_code: request.deliveryZipCode,
    delivery_landmark: request.deliveryLandmark,

    preferred_date: request.preferredDate,
    preferred_time_slot: request.preferredTimeSlot,
    delivery_notes: request.deliveryNotes,
    delivery_type: request.deliveryType || "delivery",

    updated_photo_url: request.updatedPhotoUrl,

    status: "requested",
    failed_attempts: 0,
  }
}

export const DeliveryProvider = memo(({ children }: { children: ReactNode }) => {
  const [deliveryRequests, setDeliveryRequests] = useState<DeliveryRequest[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load data on mount
  useEffect(() => {
    isMountedRef.current = true

    const loadData = async () => {
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      // Set a timeout to ensure isLoaded is set even if Supabase hangs
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          console.warn("[Delivery Context] Load timeout reached, setting isLoaded to true")
          setIsLoaded(true)
        }
      }, 5000)

      try {
        if (signal.aborted) {
          clearTimeout(timeoutId)
          return
        }

        const supabase = createClient()

        try {
          const { data, error } = await supabase
            .from("id_delivery_requests")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100)
            .abortSignal(signal)

          if (!isMountedRef.current || signal.aborted) return

          if (error) {
            if (error.name !== "AbortError" && !error.message?.includes("aborted")) {
              console.error("Failed to load delivery requests from Supabase:", error.message)
            }
          } else if (data) {
            const mappedData = data.map(dbRowToDeliveryRequest)
            setDeliveryRequests(mappedData)
          }
        } catch (fetchError: any) {
          if (fetchError.name !== "AbortError" && !fetchError.message?.includes("aborted")) {
            console.error("[Delivery Context] Supabase query failed:", fetchError)
          }
        }
      } catch (error: any) {
        if (error.name !== "AbortError" && !error.message?.includes("aborted")) {
          console.error("Failed to load delivery data:", error)
        }
      } finally {
        clearTimeout(timeoutId)
        if (isMountedRef.current) {
          setIsLoaded(true)
        }
      }
    }

    loadData()

    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  // Refresh delivery requests
  const refreshDeliveryRequests = useCallback(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("id_delivery_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)
        .abortSignal(controller.signal)

      if (error) {
        console.error("Failed to refresh delivery requests:", error.message)
      } else if (data) {
        const mappedData = data.map(dbRowToDeliveryRequest)
        setDeliveryRequests(mappedData)
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.warn("[Delivery Context] Refresh timed out after 5 seconds")
      } else {
        console.error("Failed to refresh delivery requests:", error)
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }, [])

  // Create a new delivery request
  const createDeliveryRequest = useCallback(
    async (data: CreateDeliveryRequestData): Promise<DeliveryRequest | null> => {
      try {
        const supabase = createClient()
        const dbRow = deliveryRequestToDbRow(data)

        const { data: insertedData, error } = await supabase
          .from("id_delivery_requests")
          .insert(dbRow)
          .select()
          .single()

        if (error) {
          console.error("Failed to create delivery request:", error)
          return null
        }

        const newRequest = dbRowToDeliveryRequest(insertedData)
        setDeliveryRequests((prev) => [newRequest, ...prev])
        return newRequest
      } catch (error) {
        console.error("Failed to create delivery request:", error)
        return null
      }
    },
    []
  )

  // Get user's delivery requests
  const getUserDeliveryRequests = useCallback(
    (userId: string) => {
      return deliveryRequests.filter((req) => req.userId === userId)
    },
    [deliveryRequests]
  )

  // Get delivery request by ID
  const getDeliveryRequestById = useCallback(
    (id: string) => {
      return deliveryRequests.find((req) => req.id === id)
    },
    [deliveryRequests]
  )

  // Get delivery request by QRT ID
  const getDeliveryRequestByQrtId = useCallback(
    (qrtId: string) => {
      return deliveryRequests.find((req) => req.qrtId === qrtId)
    },
    [deliveryRequests]
  )

  // Confirm delivery (user action)
  const confirmDelivery = useCallback(
    async (id: string, photoProof: string, signature: string): Promise<boolean> => {
      try {
        const supabase = createClient()
        const now = new Date().toISOString()

        const { error } = await supabase
          .from("id_delivery_requests")
          .update({
            status: "delivered",
            delivery_confirmed_at: now,
            delivery_photo_proof: photoProof,
            delivery_signature: signature,
            delivered_at: now,
          })
          .eq("id", id)

        if (error) {
          console.error("Failed to confirm delivery:", error)
          return false
        }

        setDeliveryRequests((prev) =>
          prev.map((req) =>
            req.id === id
              ? {
                  ...req,
                  status: "delivered" as DeliveryStatus,
                  deliveryConfirmedAt: now,
                  deliveryPhotoProof: photoProof,
                  deliverySignature: signature,
                  deliveredAt: now,
                }
              : req
          )
        )

        return true
      } catch (error) {
        console.error("Failed to confirm delivery:", error)
        return false
      }
    },
    []
  )

  // Reschedule delivery
  const rescheduleDelivery = useCallback(
    async (id: string, newDate: string, newTimeSlot: DeliveryTimeSlot): Promise<boolean> => {
      try {
        const supabase = createClient()

        // Reset failed status back to printed (ready for re-delivery)
        const { error } = await supabase
          .from("id_delivery_requests")
          .update({
            preferred_date: newDate,
            preferred_time_slot: newTimeSlot,
            status: "printed",
            failure_reason: null,
          })
          .eq("id", id)

        if (error) {
          console.error("Failed to reschedule delivery:", error)
          return false
        }

        setDeliveryRequests((prev) =>
          prev.map((req) =>
            req.id === id
              ? {
                  ...req,
                  preferredDate: newDate,
                  preferredTimeSlot: newTimeSlot,
                  status: "printed" as DeliveryStatus,
                  failureReason: undefined,
                }
              : req
          )
        )

        return true
      } catch (error) {
        console.error("Failed to reschedule delivery:", error)
        return false
      }
    },
    []
  )

  // Update delivery address
  const updateDeliveryAddress = useCallback(
    async (
      id: string,
      address: {
        province: string
        provinceCode?: string
        city: string
        cityCode?: string
        barangay: string
        barangayCode?: string
        streetAddress: string
        zipCode?: string
        landmark?: string
      }
    ): Promise<boolean> => {
      try {
        const supabase = createClient()

        const { error } = await supabase
          .from("id_delivery_requests")
          .update({
            delivery_province: address.province,
            delivery_province_code: address.provinceCode,
            delivery_city: address.city,
            delivery_city_code: address.cityCode,
            delivery_barangay: address.barangay,
            delivery_barangay_code: address.barangayCode,
            delivery_street_address: address.streetAddress,
            delivery_zip_code: address.zipCode,
            delivery_landmark: address.landmark,
            status: "printed", // Reset to printed after address update
            failure_reason: null,
          })
          .eq("id", id)

        if (error) {
          console.error("Failed to update delivery address:", error)
          return false
        }

        setDeliveryRequests((prev) =>
          prev.map((req) =>
            req.id === id
              ? {
                  ...req,
                  deliveryProvince: address.province,
                  deliveryProvinceCode: address.provinceCode,
                  deliveryCity: address.city,
                  deliveryCityCode: address.cityCode,
                  deliveryBarangay: address.barangay,
                  deliveryBarangayCode: address.barangayCode,
                  deliveryStreetAddress: address.streetAddress,
                  deliveryZipCode: address.zipCode,
                  deliveryLandmark: address.landmark,
                  status: "printed" as DeliveryStatus,
                  failureReason: undefined,
                }
              : req
          )
        )

        return true
      } catch (error) {
        console.error("Failed to update delivery address:", error)
        return false
      }
    },
    []
  )

  // Get delivery requests by barangay (staff)
  const getDeliveryRequestsByBarangay = useCallback(
    (barangayCode: string) => {
      return deliveryRequests.filter((req) => req.barangayCode === barangayCode)
    },
    [deliveryRequests]
  )

  // Get delivery requests by status (staff)
  const getDeliveryRequestsByStatus = useCallback(
    (status: DeliveryStatus) => {
      return deliveryRequests.filter((req) => req.status === status)
    },
    [deliveryRequests]
  )

  // Update delivery status (staff action)
  const updateDeliveryStatus = useCallback(
    async (
      id: string,
      status: DeliveryStatus,
      options?: { failureReason?: DeliveryFailureReason; staffName?: string }
    ): Promise<boolean> => {
      try {
        const supabase = createClient()
        const now = new Date().toISOString()

        const updateData: Record<string, unknown> = {
          status,
          assigned_staff_name: options?.staffName,
        }

        // Set appropriate timestamp based on status
        switch (status) {
          case "printing":
            updateData.sent_to_print_at = now
            break
          case "printed":
            updateData.printed_at = now
            break
          case "out_for_delivery":
            updateData.out_for_delivery_at = now
            break
          case "delivered":
            updateData.delivered_at = now
            break
          case "delivery_failed":
            updateData.failure_reason = options?.failureReason
            // Increment failed attempts
            const currentRequest = deliveryRequests.find((req) => req.id === id)
            const newFailedAttempts = (currentRequest?.failedAttempts || 0) + 1
            updateData.failed_attempts = newFailedAttempts

            // Auto-convert to pickup_required after 2 failed attempts
            if (newFailedAttempts >= 2) {
              updateData.status = "pickup_required"
            }
            break
        }

        const { error } = await supabase.from("id_delivery_requests").update(updateData).eq("id", id)

        if (error) {
          console.error("Failed to update delivery status:", error)
          return false
        }

        setDeliveryRequests((prev) =>
          prev.map((req) => {
            if (req.id === id) {
              const updatedReq = { ...req, status, updatedAt: now }

              if (options?.staffName) {
                updatedReq.assignedStaffName = options.staffName
              }

              switch (status) {
                case "printing":
                  updatedReq.sentToPrintAt = now
                  break
                case "printed":
                  updatedReq.printedAt = now
                  break
                case "out_for_delivery":
                  updatedReq.outForDeliveryAt = now
                  break
                case "delivered":
                  updatedReq.deliveredAt = now
                  break
                case "delivery_failed":
                  updatedReq.failureReason = options?.failureReason
                  updatedReq.failedAttempts = (req.failedAttempts || 0) + 1
                  if (updatedReq.failedAttempts >= 2) {
                    updatedReq.status = "pickup_required"
                  }
                  break
              }

              return updatedReq
            }
            return req
          })
        )

        return true
      } catch (error) {
        console.error("Failed to update delivery status:", error)
        return false
      }
    },
    [deliveryRequests]
  )

  // Assign staff to delivery
  const assignStaff = useCallback(
    async (id: string, staffId: string, staffName: string): Promise<boolean> => {
      try {
        const supabase = createClient()

        const { error } = await supabase
          .from("id_delivery_requests")
          .update({
            assigned_staff_id: staffId,
            assigned_staff_name: staffName,
          })
          .eq("id", id)

        if (error) {
          console.error("Failed to assign staff:", error)
          return false
        }

        setDeliveryRequests((prev) =>
          prev.map((req) =>
            req.id === id ? { ...req, assignedStaffId: staffId, assignedStaffName: staffName } : req
          )
        )

        return true
      } catch (error) {
        console.error("Failed to assign staff:", error)
        return false
      }
    },
    []
  )

  // Mark multiple requests as sent to print
  const markSentToPrint = useCallback(async (ids: string[], batchId?: string): Promise<boolean> => {
    try {
      const supabase = createClient()
      const now = new Date().toISOString()
      const batch = batchId || `BATCH-${Date.now()}`

      const { error } = await supabase
        .from("id_delivery_requests")
        .update({
          status: "printing",
          sent_to_print_at: now,
          print_batch_id: batch,
        })
        .in("id", ids)

      if (error) {
        console.error("Failed to mark as sent to print:", error)
        return false
      }

      setDeliveryRequests((prev) =>
        prev.map((req) =>
          ids.includes(req.id)
            ? {
                ...req,
                status: "printing" as DeliveryStatus,
                sentToPrintAt: now,
                printBatchId: batch,
              }
            : req
        )
      )

      return true
    } catch (error) {
      console.error("Failed to mark as sent to print:", error)
      return false
    }
  }, [])

  // Mark multiple requests as printed
  const markPrinted = useCallback(async (ids: string[]): Promise<boolean> => {
    try {
      const supabase = createClient()
      const now = new Date().toISOString()

      const { error } = await supabase
        .from("id_delivery_requests")
        .update({
          status: "printed",
          printed_at: now,
        })
        .in("id", ids)

      if (error) {
        console.error("Failed to mark as printed:", error)
        return false
      }

      setDeliveryRequests((prev) =>
        prev.map((req) =>
          ids.includes(req.id)
            ? {
                ...req,
                status: "printed" as DeliveryStatus,
                printedAt: now,
              }
            : req
        )
      )

      return true
    } catch (error) {
      console.error("Failed to mark as printed:", error)
      return false
    }
  }, [])

  // Get status history for a delivery request
  const getStatusHistory = useCallback(async (deliveryRequestId: string): Promise<DeliveryStatusHistory[]> => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("delivery_status_history")
        .select("*")
        .eq("delivery_request_id", deliveryRequestId)
        .order("created_at", { ascending: true })

      if (error) {
        console.error("Failed to get status history:", error)
        return []
      }

      return data.map((row) => ({
        id: row.id,
        deliveryRequestId: row.delivery_request_id,
        previousStatus: row.previous_status,
        newStatus: row.new_status,
        changedBy: row.changed_by,
        changeReason: row.change_reason,
        createdAt: row.created_at,
      }))
    } catch (error) {
      console.error("Failed to get status history:", error)
      return []
    }
  }, [])

  const value = useMemo(
    () => ({
      deliveryRequests,
      isLoaded,
      createDeliveryRequest,
      getUserDeliveryRequests,
      getDeliveryRequestById,
      getDeliveryRequestByQrtId,
      confirmDelivery,
      rescheduleDelivery,
      updateDeliveryAddress,
      getDeliveryRequestsByBarangay,
      getDeliveryRequestsByStatus,
      updateDeliveryStatus,
      assignStaff,
      markSentToPrint,
      markPrinted,
      getStatusHistory,
      refreshDeliveryRequests,
    }),
    [
      deliveryRequests,
      isLoaded,
      createDeliveryRequest,
      getUserDeliveryRequests,
      getDeliveryRequestById,
      getDeliveryRequestByQrtId,
      confirmDelivery,
      rescheduleDelivery,
      updateDeliveryAddress,
      getDeliveryRequestsByBarangay,
      getDeliveryRequestsByStatus,
      updateDeliveryStatus,
      assignStaff,
      markSentToPrint,
      markPrinted,
      getStatusHistory,
      refreshDeliveryRequests,
    ]
  )

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>
})

DeliveryProvider.displayName = "DeliveryProvider"

export function useDelivery() {
  const context = useContext(DeliveryContext)
  if (context === undefined) {
    throw new Error("useDelivery must be used within a DeliveryProvider")
  }
  return context
}
