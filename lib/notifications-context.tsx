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

// Notification Types
export type NotificationType =
  | "delivery_update"
  | "delivery_confirmed"
  | "action_required"
  | "system"
  | "announcement"

// Notification Interface
export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: NotificationType
  referenceType?: string
  referenceId?: string
  isRead: boolean
  createdAt: string
}

// Create Notification Data
export interface CreateNotificationData {
  userId: string
  title: string
  message: string
  type: NotificationType
  referenceType?: string
  referenceId?: string
}

// Context Type
interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  isLoaded: boolean

  // Actions
  markAsRead: (id: string) => Promise<boolean>
  markAllAsRead: () => Promise<boolean>
  deleteNotification: (id: string) => Promise<boolean>
  createNotification: (data: CreateNotificationData) => Promise<Notification | null>

  // Queries
  getNotificationsByType: (type: NotificationType) => Notification[]
  getUnreadNotifications: () => Notification[]

  // Refresh
  refreshNotifications: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

// Helper function to convert database row to Notification
function dbRowToNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    message: row.message as string,
    type: row.type as NotificationType,
    referenceType: row.reference_type as string | undefined,
    referenceId: row.reference_id as string | undefined,
    isRead: row.is_read as boolean,
    createdAt: row.created_at as string,
  }
}

export const NotificationsProvider = memo(({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const isMountedRef = useRef(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Get current user ID from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("barangay_user")
      if (storedUser) {
        const user = JSON.parse(storedUser)
        setCurrentUserId(user.id || user.qrCode || null)
      }
    } catch (e) {
      console.error("[Notifications Context] Failed to get user from localStorage:", e)
    }
  }, [])

  // Load notifications on mount
  useEffect(() => {
    if (!currentUserId) {
      setIsLoaded(true)
      return
    }

    isMountedRef.current = true

    const loadData = async () => {
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      // Set a timeout to ensure isLoaded is set even if Supabase hangs
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          console.warn("[Notifications Context] Load timeout reached, setting isLoaded to true")
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
            .from("in_app_notifications")
            .select("*")
            .eq("user_id", currentUserId)
            .order("created_at", { ascending: false })
            .limit(50)
            .abortSignal(signal)

          if (!isMountedRef.current || signal.aborted) return

          if (error) {
            if (error.name !== "AbortError" && !error.message?.includes("aborted")) {
              console.error("Failed to load notifications from Supabase:", error.message)
            }
          } else if (data) {
            const mappedData = data.map(dbRowToNotification)
            setNotifications(mappedData)
          }
        } catch (fetchError: any) {
          if (fetchError.name !== "AbortError" && !fetchError.message?.includes("aborted")) {
            console.error("[Notifications Context] Supabase query failed:", fetchError)
          }
        }
      } catch (error: any) {
        if (error.name !== "AbortError" && !error.message?.includes("aborted")) {
          console.error("Failed to load notifications:", error)
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
  }, [currentUserId])

  // Calculate unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length
  }, [notifications])

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    if (!currentUserId) return

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("in_app_notifications")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(50)
        .abortSignal(controller.signal)

      if (error) {
        console.error("Failed to refresh notifications:", error.message)
      } else if (data) {
        const mappedData = data.map(dbRowToNotification)
        setNotifications(mappedData)
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.warn("[Notifications Context] Refresh timed out after 5 seconds")
      } else {
        console.error("Failed to refresh notifications:", error)
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }, [currentUserId])

  // Mark a single notification as read
  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("in_app_notifications")
        .update({ is_read: true })
        .eq("id", id)

      if (error) {
        console.error("Failed to mark notification as read:", error)
        return false
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )

      return true
    } catch (error) {
      console.error("Failed to mark notification as read:", error)
      return false
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!currentUserId) return false

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("in_app_notifications")
        .update({ is_read: true })
        .eq("user_id", currentUserId)
        .eq("is_read", false)

      if (error) {
        console.error("Failed to mark all notifications as read:", error)
        return false
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))

      return true
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error)
      return false
    }
  }, [currentUserId])

  // Delete a notification
  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("in_app_notifications")
        .delete()
        .eq("id", id)

      if (error) {
        console.error("Failed to delete notification:", error)
        return false
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id))

      return true
    } catch (error) {
      console.error("Failed to delete notification:", error)
      return false
    }
  }, [])

  // Create a new notification
  const createNotification = useCallback(
    async (data: CreateNotificationData): Promise<Notification | null> => {
      try {
        const supabase = createClient()

        const { data: insertedData, error } = await supabase
          .from("in_app_notifications")
          .insert({
            user_id: data.userId,
            title: data.title,
            message: data.message,
            type: data.type,
            reference_type: data.referenceType,
            reference_id: data.referenceId,
            is_read: false,
          })
          .select()
          .single()

        if (error) {
          console.error("Failed to create notification:", error)
          return null
        }

        const newNotification = dbRowToNotification(insertedData)

        // Only add to local state if it's for the current user
        if (data.userId === currentUserId) {
          setNotifications((prev) => [newNotification, ...prev])
        }

        return newNotification
      } catch (error) {
        console.error("Failed to create notification:", error)
        return null
      }
    },
    [currentUserId]
  )

  // Get notifications by type
  const getNotificationsByType = useCallback(
    (type: NotificationType) => {
      return notifications.filter((n) => n.type === type)
    },
    [notifications]
  )

  // Get unread notifications
  const getUnreadNotifications = useCallback(() => {
    return notifications.filter((n) => !n.isRead)
  }, [notifications])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoaded,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      createNotification,
      getNotificationsByType,
      getUnreadNotifications,
      refreshNotifications,
    }),
    [
      notifications,
      unreadCount,
      isLoaded,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      createNotification,
      getNotificationsByType,
      getUnreadNotifications,
      refreshNotifications,
    ]
  )

  return (
    <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
  )
})

NotificationsProvider.displayName = "NotificationsProvider"

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider")
  }
  return context
}
