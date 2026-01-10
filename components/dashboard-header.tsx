"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { UserCircle2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getGreeting } from "@/lib/utils/timezone"
import { NotificationDropdown } from "@/components/notification-dropdown"

/**
 * DashboardHeader Component
 *
 * Displays user profile with dynamic time-based greeting and notification bell.
 * Uses Philippine timezone (Asia/Manila) for accurate greeting logic.
 *
 * Features:
 * - Dynamic greeting based on Philippine time (Good Morning/Afternoon/Evening)
 * - User avatar with gradient background
 * - Clickable profile section navigating to /profile
 * - Notification bell button (ready for future implementation)
 * - Responsive avatar sizing (10px on mobile, 12px on tablet+)
 * - Text truncation on mobile to prevent overflow
 * - Auto-updates greeting every minute
 * - WCAG AA compliant with keyboard navigation and focus indicators
 * - Touch-friendly buttons (44px minimum touch targets)
 *
 * Greeting Logic (Philippine Time):
 * - 5:00 AM - 11:59 AM → "Good Morning"
 * - 12:00 PM - 5:59 PM → "Good Afternoon"
 * - 6:00 PM - 4:59 AM → "Good Evening"
 *
 * @example
 * ```tsx
 * <DashboardHeader />
 * ```
 */
export function DashboardHeader() {
  const router = useRouter()
  const { user } = useAuth()
  const [greeting, setGreeting] = useState("Good Day")

  /**
   * Update greeting based on Philippine time
   * Updates every minute to keep greeting accurate
   */
  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getGreeting())
    }

    // Set initial greeting
    updateGreeting()

    // Update greeting every minute
    const interval = setInterval(updateGreeting, 60000)

    return () => clearInterval(interval)
  }, [])

  /**
   * Navigate to profile page
   */
  const handleProfileClick = () => {
    router.push("/profile")
  }

  return (
    <div className="flex items-center justify-between py-4 px-0 bg-white">
      {/* Left: Profile Avatar & Greeting */}
      <button
        onClick={handleProfileClick}
        aria-label="Go to profile page"
        className="flex items-center gap-3 hover:opacity-80 transition-opacity rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2"
      >
        {/* Avatar Circle - Responsive sizing */}
        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center shadow-md flex-shrink-0">
          <UserCircle2 className="h-6 w-6 sm:h-7 sm:w-7 text-white" strokeWidth={2} />
        </div>

        {/* Greeting & Name */}
        <div className="text-left min-w-0">
          <p className="text-sm text-gray-500">{greeting},</p>
          <p className="text-base font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-none">
            {user?.fullName || "Guest"}
          </p>
        </div>
      </button>

      {/* Right: Notification Dropdown - Touch target compliant (44x44px minimum) */}
      <NotificationDropdown />
    </div>
  )
}
