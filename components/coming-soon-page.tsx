"use client"

import { useRouter } from "next/navigation"
import { Clock, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

/**
 * Props for the ComingSoonPage component
 */
interface ComingSoonPageProps {
  /** The main title/heading of the page */
  title: string
  /** Optional custom description (default: "We're working hard to bring this feature to you. Stay tuned!") */
  description?: string
  /** Optional custom icon to display (default: Clock icon) */
  icon?: React.ReactNode
}

/**
 * ComingSoonPage Component
 *
 * A reusable "coming soon" placeholder page for features under development.
 * Displays a branded, professional message with smooth fade-in animation.
 *
 * Features:
 * - Customizable title, description, and icon
 * - Smooth fade-in animation using Framer Motion
 * - GPU-accelerated animations for 60fps performance
 * - WCAG AA compliant with proper focus indicators
 * - Responsive design with bottom navigation spacing
 * - "Back to Dashboard" navigation button
 *
 * @example
 * ```tsx
 * <ComingSoonPage
 *   title="Notifications"
 *   description="View and manage your barangay notifications"
 *   icon={<Bell className="h-12 w-12 text-[#3B82F6]" />}
 * />
 * ```
 */
export function ComingSoonPage({
  title,
  description = "We're working hard to bring this feature to you. Stay tuned!",
  icon,
}: ComingSoonPageProps) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 px-6 pb-24">
      <motion.div
        className="flex max-w-md flex-col items-center text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: "easeOut"
        }}
        style={{
          willChange: 'transform, opacity',
          transform: 'translateZ(0)' // Force GPU acceleration
        }}
      >
        {/* Barangay Logo */}
        <div className="relative mb-6 h-20 w-20">
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full opacity-40 grayscale"
          >
            <circle cx="50" cy="50" r="45" fill="none" stroke="#3B82F6" strokeWidth="2" />
            <text
              x="50"
              y="55"
              textAnchor="middle"
              className="text-xs font-bold"
              fill="#3B82F6"
            >
              BM
            </text>
          </svg>
        </div>

        {/* Icon Circle */}
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#3B82F6]/10 to-[#2563EB]/10">
          {icon || <Clock className="h-12 w-12 text-[#3B82F6] stroke-[1.5]" />}
        </div>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-bold text-gray-900">{title}</h1>

        {/* Coming Soon Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#3B82F6]/10 px-4 py-2">
          <div className="h-2 w-2 rounded-full bg-[#3B82F6] animate-pulse" />
          <span className="text-sm font-semibold text-[#3B82F6]">Coming Soon</span>
        </div>

        {/* Description */}
        <p className="mb-10 text-base leading-relaxed text-gray-500">{description}</p>

        {/* Back to Dashboard Button */}
        <Button
          onClick={() => router.push("/dashboard")}
          className="h-12 rounded-2xl bg-[#3B82F6] px-8 font-semibold shadow-lg shadow-blue-200 hover:bg-[#2563EB]"
          aria-label="Return to dashboard"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Footer */}
        <p className="mt-20 text-xs text-gray-400">
          We'll notify you when this feature is ready
        </p>
      </motion.div>
    </div>
  )
}
