"use client"

import { useState } from "react"
import Link from "next/link"
import { useNotifications, type Notification, type NotificationType } from "@/lib/notifications-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Bell,
  Truck,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Settings,
  Check,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationDropdownProps {
  className?: string
}

export function NotificationDropdown({ className }: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    isLoaded,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications()

  const [isOpen, setIsOpen] = useState(false)

  // Get icon for notification type
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "delivery_update":
        return <Truck className="h-4 w-4 text-blue-500" />
      case "delivery_confirmed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      case "action_required":
        return <AlertCircle className="h-4 w-4 text-amber-500" />
      case "announcement":
        return <Megaphone className="h-4 w-4 text-purple-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  // Get link for notification
  const getNotificationLink = (notification: Notification) => {
    if (notification.referenceType === "delivery_request" && notification.referenceId) {
      return `/delivery/${notification.referenceId}`
    }
    return "/notifications"
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
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" })
  }

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }
    setIsOpen(false)
  }

  // Handle delete
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    await deleteNotification(id)
  }

  // Recent notifications (top 5)
  const recentNotifications = notifications.slice(0, 5)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative h-11 w-11 rounded-full", className)}
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-emerald-600 hover:text-emerald-700"
              onClick={() => markAllAsRead()}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {!isLoaded ? (
          <div className="py-8 text-center">
            <div className="h-5 w-5 mx-auto animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center">
            <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No notifications yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            {recentNotifications.map((notification) => (
              <Link
                key={notification.id}
                href={getNotificationLink(notification)}
                onClick={() => handleNotificationClick(notification)}
              >
                <DropdownMenuItem
                  className={cn(
                    "flex items-start gap-3 p-3 cursor-pointer",
                    !notification.isRead && "bg-emerald-50/50"
                  )}
                >
                  <div className="shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm leading-tight",
                          !notification.isRead ? "font-medium text-gray-900" : "text-gray-700"
                        )}
                      >
                        {notification.title}
                      </p>
                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="shrink-0 p-1 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-gray-400" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>
                  {!notification.isRead && (
                    <div className="shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                  )}
                </DropdownMenuItem>
              </Link>
            ))}
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Link href="/notifications">
                <Button variant="ghost" className="w-full h-8 text-xs text-emerald-600">
                  View all notifications
                </Button>
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
