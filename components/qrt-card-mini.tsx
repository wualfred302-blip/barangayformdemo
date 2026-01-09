"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { RefreshCw, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QRTIDRequest } from "@/lib/qrt-context"

/**
 * Props for the QRTCardMini component
 */
interface QRTCardMiniProps {
  /** The user's QRT ID data or null if not available */
  qrtId: QRTIDRequest | null
  /** Optional callback when the "Request QRT ID" CTA is clicked */
  onRequestClick?: () => void
}

/**
 * QRTCardMini Component
 *
 * A compact, reusable QRT ID card display component for the dashboard.
 * Features smooth 3D flip animation and responsive design.
 *
 * Features:
 * - Empty state CTA when no QRT ID exists (gradient card with call-to-action)
 * - 3D flip animation between front and back sides (GPU-accelerated, 60fps)
 * - Responsive design with max-width constraint (160px mobile, 200px tablet, 240px desktop)
 * - Keyboard accessible with Enter/Space key support
 * - Navigation to full QRT details on card click
 * - Processing state for images not yet ready (spinning icon)
 * - Touch-friendly flip button (44px minimum touch target)
 * - WCAG AA compliant with proper ARIA labels
 *
 * Performance:
 * - GPU-accelerated flip animation using CSS transforms
 * - willChange hints for optimal performance
 * - Spring physics for natural, smooth animation feel
 *
 * @example
 * ```tsx
 * // With QRT ID
 * <QRTCardMini qrtId={userQrtId} />
 *
 * // Without QRT ID (shows CTA)
 * <QRTCardMini
 *   qrtId={null}
 *   onRequestClick={() => router.push("/qrt-id/request")}
 * />
 * ```
 */
export function QRTCardMini({ qrtId, onRequestClick }: QRTCardMiniProps) {
  const router = useRouter()
  const [showBackSide, setShowBackSide] = useState(false)

  const handleCardClick = () => {
    if (!qrtId) {
      onRequestClick?.()
      return
    }
    // Navigate to full QRT ID details page
    router.push(`/requests/qrt/${qrtId.id}`)
  }

  const handleFlipClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowBackSide(!showBackSide)
  }

  // No QRT ID - Show CTA
  if (!qrtId) {
    return (
      <div
        onClick={handleCardClick}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#14B8A6] via-[#06B6D4] to-[#22D3EE] p-6 cursor-pointer hover:shadow-lg transition-shadow"
        role="button"
        tabIndex={0}
        aria-label="Request QRT ID"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleCardClick()
          }
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">QRT ID</p>
            <p className="text-white text-lg font-bold">Request Your ID</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
        </div>
        <p className="text-white/60 text-xs mt-3">
          Get your official Barangay QRT identification card
        </p>
      </div>
    )
  }

  // Has QRT ID - Show mini card with flip functionality
  return (
    <div className="relative max-w-md mx-auto">
      <div
        onClick={handleCardClick}
        className="relative overflow-visible cursor-pointer h-[160px] sm:h-[200px] lg:h-[240px]"
        style={{
          perspective: '1000px'
        }}
        role="button"
        tabIndex={0}
        aria-label={`View QRT ID details for ${qrtId.fullName}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleCardClick()
          }
        }}
      >
        <motion.div
          animate={{ rotateY: showBackSide ? 180 : 0 }}
          transition={{
            duration: 0.6,
            type: "spring",
            stiffness: 200,
            damping: 20
          }}
          className="relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)' // Force GPU acceleration
          }}
        >
          {/* Front Side */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(0)' // Force GPU layer
            }}
          >
            {qrtId.idFrontImageUrl ? (
              <Image
                src={qrtId.idFrontImageUrl}
                alt={`QRT ID for ${qrtId.fullName}`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="h-6 w-6 text-gray-400 mx-auto mb-2 animate-spin" />
                  <p className="text-xs text-gray-500 font-medium">Processing...</p>
                </div>
              </div>
            )}
          </div>

          {/* Back Side */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg) translateZ(0)' // Force GPU layer
            }}
          >
            {qrtId.idBackImageUrl ? (
              <Image
                src={qrtId.idBackImageUrl}
                alt={`QRT ID Back for ${qrtId.fullName}`}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="h-6 w-6 text-gray-400 mx-auto mb-2 animate-spin" />
                  <p className="text-xs text-gray-500 font-medium">Processing...</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Info Section and Flip Button */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">QRT ID Card</p>
          <p className="text-sm font-semibold text-gray-900">{qrtId.qrtCode}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFlipClick}
          className="rounded-full h-10 min-h-[44px] px-4 text-xs font-medium hover:bg-gray-100"
          aria-label={showBackSide ? "Show front of ID card" : "Show back of ID card"}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Flip
        </Button>
      </div>

      <style jsx>{`
        div[style*="perspective"] {
          perspective: 1000px;
        }
      `}</style>
    </div>
  )
}
