"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useNotifications, type Notification, type NotificationType } from "@/lib/notifications-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BottomNav } from "@/components/bottom-nav"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  Bell,
  Truck,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Check,
  Trash2,
  Filter,
  Inbox,
} from "lucide-react"

type FilterType = "all" | "unread" | "delivery" | "announcement"

export default function NotificationsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const {
    notifications,
    unreadCount,
    isLoaded,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()

  const [filter, setFilter] = useState<FilterType>("all")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  if (authLoading || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9FAFB]">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-500 border-t-transparent" />
      </div>
    )
  }

  // Get icon for notification type
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "delivery_update":
        return <Truck className="h-5 w-5 text-blue-500" />
      case "delivery_confirmed":
        return <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      case "action_required":
        return <AlertCircle className="h-5 w-5 text-amber-500" />
      case "announcement":
        return <Megaphone className="h-5 w-5 text-purple-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  // Get background color for notification type
  const getIconBg = (type: NotificationType) => {
    switch (type) {
      case "delivery_update":
        return "bg-blue-100"
      case "delivery_confirmed":
        return "bg-emerald-100"
      case "action_required":
        return "bg-amber-100"
      case "announcement":
        return "bg-purple-100"
      default:
        return "bg-gray-100"
    }
  }

  // Get link for notification
  const getNotificationLink = (notification: Notification) => {
    if (notification.referenceType === "delivery_request" && notification.referenceId) {
      return `/delivery/${notification.referenceId}`
    }
    return null
  }

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    return date.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
  }

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    const link = getNotificationLink(notification)
    if (link) {
      router.push(link)
    }
  }

  // Handle delete
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    await deleteNotification(id)
  }

  // Filter notifications
  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "all") return true
    if (filter === "unread") return !notification.isRead
    if (filter === "delivery") {
      return ["delivery_update", "delivery_confirmed", "action_required"].includes(notification.type)
    }
    if (filter === "announcement") return notification.type === "announcement"
    return true
  })

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce(
    (groups, notification) => {
      const date = new Date(notification.createdAt)
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      let groupKey: string
      if (date.toDateString() === today.toDateString()) {
        groupKey = "Today"
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday"
      } else {
        groupKey = date.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(notification)
      return groups
    },
    {} as Record<string, Notification[]>
  )

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "All" },
    { value: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
    { value: "delivery", label: "Deliveries" },
    { value: "announcement", label: "Announcements" },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-full p-1.5 hover:bg-gray-100">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="relative h-8 w-8">
                <Image src="/images/logo.png" alt="Barangay Seal" fill className="object-contain" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={() => markAllAsRead()}
            >
              <Check className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all whitespace-nowrap",
                filter === f.value
                  ? "bg-emerald-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <main className="flex-1 px-4 py-4 pb-28">
        {filteredNotifications.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Inbox className="h-8 w-8 text-gray-300" />
              </div>
              <p className="mb-2 text-lg font-semibold text-gray-600">No notifications</p>
              <p className="text-sm text-gray-400 text-center">
                {filter === "all"
                  ? "You don't have any notifications yet."
                  : filter === "unread"
                    ? "You've read all your notifications."
                    : `No ${filter} notifications.`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedNotifications).map(([date, notifs]) => (
              <div key={date}>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
                  {date}
                </h2>
                <div className="space-y-2">
                  {notifs.map((notification) => {
                    const link = getNotificationLink(notification)
                    const NotificationWrapper = link ? "button" : "div"

                    return (
                      <Card
                        key={notification.id}
                        className={cn(
                          "border-0 shadow-sm transition-all",
                          !notification.isRead && "bg-emerald-50/50",
                          link && "cursor-pointer hover:shadow-md active:scale-[0.99]"
                        )}
                      >
                        <CardContent className="p-4">
                          <NotificationWrapper
                            className="flex items-start gap-3 w-full text-left"
                            onClick={() => link && handleNotificationClick(notification)}
                          >
                            <div
                              className={cn(
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                                getIconBg(notification.type)
                              )}
                            >
                              {getIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p
                                  className={cn(
                                    "text-sm leading-tight",
                                    !notification.isRead
                                      ? "font-semibold text-gray-900"
                                      : "font-medium text-gray-700"
                                  )}
                                >
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <div className="shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                          </NotificationWrapper>
                          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-gray-500 hover:text-emerald-600"
                                onClick={() => markAsRead(notification.id)}
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Mark as read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs text-gray-500 hover:text-red-600"
                              onClick={(e) => handleDelete(e, notification.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
