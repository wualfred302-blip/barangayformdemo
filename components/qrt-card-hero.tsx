"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { RefreshCw, CreditCard, User, MapPin, Phone, Calendar, Shield, AlertCircle } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { format, addYears } from "date-fns"
import { Button } from "@/components/ui/button"

/**
 * Props for the QRTCardHero component
 */
interface QRTCardHeroProps {
  /** The user's QRT ID data or null if not available */
  qrtId: {
    id: string
    qrtCode: string
    verificationCode: string
    fullName: string
    birthDate?: string
    address?: string
    phoneNumber?: string // From QRTIDRequest type
    mobileNumber?: string // Fallback for API response
    photoUrl?: string
    createdAt: string
    emergencyContactName?: string
    emergencyContactPhone?: string
  } | null
  /** Optional callback when the "Get Your QRT ID" CTA is clicked */
  onRequestClick?: () => void
}

/**
 * QRTCardHero Component
 *
 * A hero-sized QRT ID card display component with 3D flip animation.
 * Designed for prominent dashboard display with full card details.
 *
 * Features:
 * - Empty state CTA when no QRT ID exists (gradient card with call-to-action)
 * - 3D flip animation between front and back sides (GPU-accelerated, 60fps)
 * - Responsive sizing: h-[200px] mobile, h-[280px] tablet, h-[320px] desktop
 * - Teal gradient theme matching barangay branding
 * - Full card details including photo, QR code, emergency contacts
 * - Keyboard accessible with Enter/Space key support
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
 * <QRTCardHero qrtId={userQrtId} />
 *
 * // Without QRT ID (shows CTA)
 * <QRTCardHero
 *   qrtId={null}
 *   onRequestClick={() => router.push("/qrt-id/request")}
 * />
 * ```
 */
export function QRTCardHero({ qrtId, onRequestClick }: QRTCardHeroProps) {
  const [showBackSide, setShowBackSide] = useState(false)

  const handleFlipClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowBackSide(!showBackSide)
  }

  const handleFlipKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      setShowBackSide(!showBackSide)
    }
  }

  // No QRT ID - Show CTA
  if (!qrtId) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div
          onClick={onRequestClick}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#14B8A6] via-[#06B6D4] to-[#22D3EE] p-8 sm:p-10 lg:p-12 cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] h-[200px] sm:h-[280px] lg:h-[320px]"
          role="button"
          tabIndex={0}
          aria-label="Get Your QRT ID"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onRequestClick?.()
            }
          }}
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative h-full flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white/90 text-sm sm:text-base font-medium mb-2">BARANGAY MAWAQUE</p>
                  <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                    Get Your QRT ID
                  </h2>
                </div>
                <div className="h-14 w-14 sm:h-16 sm:w-16 lg:h-20 lg:w-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <CreditCard className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white" />
                </div>
              </div>
              <p className="text-white/80 text-sm sm:text-base lg:text-lg max-w-md">
                Get your official Quick Response Team identification card and be ready to serve your community
              </p>
            </div>

            <div className="flex items-center gap-2 text-white/70 text-xs sm:text-sm">
              <Shield className="h-4 w-4" />
              <span>Official Barangay ID • Verified & Secure</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Format dates
  const createdDate = new Date(qrtId.createdAt)
  const validUntilDate = addYears(createdDate, 1)
  const formattedValidUntil = format(validUntilDate, "MM/dd/yyyy")
  const formattedBirthDate = qrtId.birthDate ? format(new Date(qrtId.birthDate), "MM/dd/yyyy") : "N/A"

  // Truncate address if too long
  const displayAddress = qrtId.address && qrtId.address.length > 50
    ? qrtId.address.substring(0, 50) + "..."
    : qrtId.address || "N/A"

  // Has QRT ID - Show hero card with flip functionality
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className="relative overflow-visible h-[200px] sm:h-[280px] lg:h-[320px]"
        style={{
          perspective: '1500px'
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
          {/* FRONT SIDE */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'translateZ(0)' // Force GPU layer
            }}
          >
            <div className="w-full h-full bg-gradient-to-br from-[#14B8A6] via-[#06B6D4] to-[#22D3EE] p-4 sm:p-6 lg:p-8">
              {/* Header */}
              <div className="text-center mb-2 sm:mb-3 lg:mb-4">
                <h3 className="text-white text-xs sm:text-sm lg:text-base font-bold tracking-wide">
                  BARANGAY MAWAQUE
                </h3>
                <p className="text-white/90 text-[10px] sm:text-xs lg:text-sm font-medium">
                  Quick Response Team ID
                </p>
              </div>

              <div className="flex gap-3 sm:gap-4 lg:gap-6 h-[calc(100%-4rem)] sm:h-[calc(100%-5rem)] lg:h-[calc(100%-6rem)]">
                {/* Left Section: Photo & QR Code */}
                <div className="flex flex-col items-center justify-between">
                  {/* User Photo */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center overflow-hidden">
                    {qrtId.photoUrl ? (
                      <img
                        src={qrtId.photoUrl}
                        alt={qrtId.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                    )}
                  </div>

                  {/* QR Code */}
                  <div className="bg-white p-1.5 sm:p-2 lg:p-2.5 rounded-lg shadow-lg">
                    <QRCodeSVG
                      value={`https://barangaymawaque.ph/verify/${qrtId.verificationCode}`}
                      size={48}
                      className="sm:w-16 sm:h-16 lg:w-20 lg:h-20"
                      level="M"
                    />
                  </div>
                </div>

                {/* Right Section: Details */}
                <div className="flex-1 flex flex-col justify-between text-white">
                  {/* User Info */}
                  <div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-0.5 sm:mb-1 leading-tight">
                      {qrtId.fullName}
                    </h2>
                    <p className="text-white/90 text-xs sm:text-sm lg:text-base font-semibold mb-2 sm:mb-3">
                      {qrtId.qrtCode}
                    </p>

                    {/* Details Grid */}
                    <div className="space-y-0.5 sm:space-y-1 lg:space-y-1.5">
                      <div className="flex items-start gap-1.5 sm:gap-2">
                        <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-white/80 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white/70 text-[9px] sm:text-[10px] lg:text-xs leading-tight">Birth Date</p>
                          <p className="text-white text-[10px] sm:text-xs lg:text-sm font-medium leading-tight">
                            {formattedBirthDate}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5 sm:gap-2">
                        <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 text-white/80 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-white/70 text-[9px] sm:text-[10px] lg:text-xs leading-tight">Address</p>
                          <p className="text-white text-[10px] sm:text-xs lg:text-sm font-medium leading-tight">
                            {displayAddress}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Valid Until */}
                  <div className="mt-auto">
                    <p className="text-white/70 text-[9px] sm:text-[10px] lg:text-xs">Valid Until</p>
                    <p className="text-white text-xs sm:text-sm lg:text-base font-bold">
                      {formattedValidUntil}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BACK SIDE */}
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg) translateZ(0)' // Force GPU layer
            }}
          >
            <div className="w-full h-full bg-gradient-to-br from-[#0D9488] via-[#0891B2] to-[#06B6D4] p-4 sm:p-6 lg:p-8">
              {/* Header */}
              <div className="text-center mb-3 sm:mb-4 lg:mb-6">
                <h3 className="text-white text-xs sm:text-sm lg:text-base font-bold tracking-wide">
                  QUICK RESPONSE TEAM
                </h3>
                <p className="text-white/90 text-[10px] sm:text-xs lg:text-sm">
                  Emergency Contact Information
                </p>
              </div>

              <div className="space-y-3 sm:space-y-4 lg:space-y-5 mb-4 sm:mb-6 lg:mb-8">
                {/* Emergency Contact */}
                {qrtId.emergencyContactName && qrtId.emergencyContactPhone ? (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-white/80 text-[10px] sm:text-xs lg:text-sm mb-1">
                          Emergency Contact
                        </p>
                        <p className="text-white text-sm sm:text-base lg:text-lg font-bold leading-tight">
                          {qrtId.emergencyContactName}
                        </p>
                        <p className="text-white/90 text-xs sm:text-sm lg:text-base font-medium mt-0.5">
                          {qrtId.emergencyContactPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white/60 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white/80 text-[10px] sm:text-xs lg:text-sm mb-1">
                          Emergency Contact
                        </p>
                        <p className="text-white/70 text-xs sm:text-sm lg:text-base">
                          No emergency contact on file
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verification Code */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <Shield className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-white/80 text-[10px] sm:text-xs lg:text-sm mb-1">
                        Verification Code
                      </p>
                      <p className="text-white text-base sm:text-lg lg:text-xl font-mono font-bold tracking-wider">
                        {qrtId.verificationCode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Instructions */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20 mb-3 sm:mb-4">
                <p className="text-white/90 text-[10px] sm:text-xs lg:text-sm font-semibold mb-1 sm:mb-2">
                  Verify this ID at:
                </p>
                <p className="text-white text-xs sm:text-sm lg:text-base font-mono">
                  barangaymawaque.ph/verify
                </p>
              </div>

              {/* Return Instructions */}
              <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10">
                <p className="text-white/70 text-[9px] sm:text-[10px] lg:text-xs text-center leading-relaxed">
                  If found, please return to Barangay Mawaque Hall or contact
                  <span className="block text-white font-semibold mt-0.5">
                    {qrtId.phoneNumber || qrtId.mobileNumber || "(123) 456-7890"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Flip Button */}
      <div className="mt-4 sm:mt-5 lg:mt-6 flex justify-center">
        <Button
          variant="outline"
          size="lg"
          onClick={handleFlipClick}
          onKeyDown={handleFlipKeyDown}
          className="rounded-full h-11 min-h-[44px] px-6 text-sm font-semibold hover:bg-gray-100 border-2 shadow-md hover:shadow-lg transition-all"
          aria-label={showBackSide ? "Show front of QRT ID card" : "Show back of QRT ID card"}
          aria-pressed={showBackSide}
        >
          <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-300 ${showBackSide ? 'rotate-180' : ''}`} />
          {showBackSide ? 'Show Front' : 'Show Back'}
        </Button>
      </div>
    </div>
  )
}
