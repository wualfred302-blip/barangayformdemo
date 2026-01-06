# Dashboard Header with QRT Integration - Technical Specification

**Revision History:**
- **2026-01-06 (v1.1)**: Updated QRT Card responsive heights - Mobile: 160px, Tablet: 200px, Desktop: 240px (previously fixed 120px). This ensures the full ID card is visible across all screen sizes.
- **2026-01-06 (v1.0)**: Initial specification

---

## Executive Summary

This specification outlines the enhancement of the Barangay Mawaque dashboard with a personalized header section, integrated QRT ID card display, realigned service grid, coming soon page system, and dynamic data integration. The implementation will improve user experience by providing immediate access to personalized information and QRT ID functionality directly from the dashboard.

### Goals
- Add personalized dashboard header with user profile and notifications
- Integrate compact QRT ID card preview with flip functionality
- Realign services grid to prioritize key services
- Implement reusable coming soon page system
- Integrate dynamic data from existing context APIs
- Ensure responsive design and accessibility

### Success Metrics
- User greeting displays correctly with Philippine timezone
- QRT ID card is accessible and functional from dashboard
- All services navigate to appropriate pages (active or coming soon)
- Zero layout shift issues on load
- Mobile-first responsive design working across devices

---

## Current State Analysis

### 1. Dashboard Structure (`/home/user/barangayformdemo/app/dashboard/page.tsx`)

**Current Implementation:**
- Lines 1-178: Full page component with tabs, services grid, and announcements
- Lines 25-34: Auth check using `useAuth()` hook
- Lines 44-46: Announcements fetched using `useAnnouncements()` context
- Lines 58-67: Services array with 8 items in 4-column grid
- Lines 72-96: Tabs component (Services, Requests, Payments)
- Lines 99-108: Services grid rendered as 4-column grid
- Lines 111-173: Barangay updates and announcements sections

**Issues:**
- No personalized header or greeting
- No QRT ID card display
- Services are not prioritized (no specific ordering)
- No placeholder pages for incomplete services
- Missing dynamic user information display

### 2. Context APIs

**Auth Context (`/home/user/barangayformdemo/lib/auth-context.tsx`):**
- Lines 6-14: User interface with `id`, `fullName`, `mobileNumber`, `email`, `address`, `role`
- Lines 23-35: AuthContextType with `user`, `isAuthenticated`, `isLoading`, `userRole`, `login`, `logout`, `updateUser`
- Lines 46-85: Loading from localStorage on mount
- Available data: Full user profile information

**QRT Context (`/home/user/barangayformdemo/lib/qrt-context.tsx`):**
- Lines 6-41: QRTIDRequest interface with complete QRT ID data structure
- Lines 51-68: QRTContextType with methods like `getUserQRTIds()`, `getQRTById()`, `refreshQRTIds()`
- Lines 445-450: `getUserQRTIds(userId)` method to fetch user's QRT IDs
- Lines 169-275: Provider loads QRT IDs from Supabase on mount

### 3. QRT ID Card Component (`/home/user/barangayformdemo/components/id-card-preview.tsx`)

**Current Implementation:**
- Lines 11-18: Props include `frontImageUrl`, `backImageUrl`, `qrtCode`, `fullName`, `onDownload`, `isReady`
- Lines 28-29: State for `showBackSide` (flip functionality) and `isZoomed`
- Lines 59-218: Full card display with flip animation using framer-motion
- Lines 99-178: Portrait container with 3D perspective and rotation
- Lines 118-123: Framer-motion animation for card flip (rotateX: 0 to 180)
- Lines 220-290: Zoomed modal view

**Reusable Elements:**
- Flip animation logic (lines 118-123)
- Card display structure
- QR code integration
- Download functionality

### 4. Existing Components

**Bottom Navigation (`/home/user/barangayformdemo/components/bottom-nav.tsx`):**
- Lines 8-12: Navigation items (Home, News, Profile)
- Lines 18-53: Fixed bottom navigation with active state
- Uses primary blue: `#3B82F6`

**Profile Page (`/home/user/barangayformdemo/app/profile/page.tsx`):**
- Lines 40-46: User initials generation logic
- Lines 75-83: Avatar display with initials
- Clean card-based layout

### 5. Routing Structure

**Existing Routes:**
- `/dashboard` - Main dashboard (current file)
- `/request` - Certificate requests (lines 59)
- `/bayanihan` - Bayanihan service (line 60)
- `/blotter` - Blotter filing (line 61)
- `/qrt-id/request` - QRT ID request form (line 62)
- `/announcements` - Events/announcements (line 64)
- `/requests` - All requests view
- `/requests/qrt/[id]` - QRT ID detail page (exists at `/home/user/barangayformdemo/app/requests/qrt/[id]/page.tsx`)
- `/profile` - User profile

**Routes to Create:**
- `/health-center` - Coming soon
- `/permits` - Coming soon
- `/taxes` - Coming soon

### 6. Design System

**Colors (from existing code):**
- Primary Blue: `#3B82F6` (dashboard tabs, active states)
- Success Green: `#10B981` or `#00C73C` (profile page)
- Gray scale: `#111827`, `#4B5563`, `#9CA3AF`, `#E5E7EB`, `#F9FAFB`
- Emerald: `#10B981` (used in QRT ID cards)

**Typography:**
- Font family: Inter (default Next.js)
- Heading sizes: `text-lg`, `text-xl`
- Body sizes: `text-sm`, `text-base`
- Labels: `text-xs`, `text-[10px]`

**Spacing:**
- Container padding: `px-4`, `py-4`
- Section margins: `mb-6`, `mb-8`
- Card padding: `p-6`, `p-8`

**Border Radius:**
- Cards: `rounded-2xl`, `rounded-3xl`, `rounded-[32px]`
- Buttons: `rounded-full`, `rounded-2xl`
- Small elements: `rounded-full`, `rounded-xl`

---

## Detailed Implementation Plan

### Phase 1: Dashboard Header with User Profile & Notification

**Objective:** Add a personalized header section with user avatar, dynamic greeting, and notification bell.

#### 1.1 Create Dashboard Header Component

**File:** `/home/user/barangayformdemo/components/dashboard-header.tsx`

**Implementation Details:**

```tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { UserCircle2, Bell } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"
import { toZonedTime } from "date-fns-tz"

export function DashboardHeader() {
  const router = useRouter()
  const { user } = useAuth()
  const [greeting, setGreeting] = useState("Good Day")

  useEffect(() => {
    const updateGreeting = () => {
      // Get current time in Philippine timezone
      const timezone = "Asia/Manila"
      const now = new Date()
      const phTime = toZonedTime(now, timezone)
      const hour = phTime.getHours()

      if (hour >= 5 && hour < 12) {
        setGreeting("Good Morning")
      } else if (hour >= 12 && hour < 18) {
        setGreeting("Good Afternoon")
      } else {
        setGreeting("Good Evening")
      }
    }

    updateGreeting()
    // Update every minute
    const interval = setInterval(updateGreeting, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleProfileClick = () => {
    router.push("/profile")
  }

  return (
    <div className="flex items-center justify-between py-4 px-4 bg-white">
      {/* Left: Profile Avatar */}
      <button
        onClick={handleProfileClick}
        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center shadow-md">
          <UserCircle2 className="h-6 w-6 text-white" strokeWidth={2} />
        </div>
        <div className="text-left">
          <p className="text-sm text-gray-500">{greeting},</p>
          <p className="text-base font-semibold text-gray-900">{user?.fullName || "Guest"}</p>
        </div>
      </button>

      {/* Right: Notification Bell */}
      <button className="h-10 w-10 rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors">
        <Bell className="h-5 w-5 text-gray-500" strokeWidth={2} />
      </button>
    </div>
  )
}
```

**Key Features:**
- Lines 15-35: Philippine timezone greeting logic using `date-fns-tz`
- Lines 42-57: Profile avatar button with gradient background
- Lines 52-55: Dynamic greeting and user name
- Lines 60-63: Notification bell (aesthetic only)

**Dependencies Required:**
- `date-fns-tz` (already in package.json as dependency of `date-fns`)

#### 1.2 Integrate Header into Dashboard

**File:** `/home/user/barangayformdemo/app/dashboard/page.tsx`

**Changes:**
1. Import DashboardHeader component (after line 22)
2. Add header before tabs section (after line 71, before line 72)

```tsx
// Add import
import { DashboardHeader } from "@/components/dashboard-header"

// Add in JSX (line 71)
<main className="flex-1 px-4 pb-24 pt-6">
  {/* Dashboard Header */}
  <DashboardHeader />

  {/* Tabs Pilled */}
  <div className="mb-6">
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      ...
    </Tabs>
  </div>
  ...
</main>
```

**Testing Considerations:**
- Test greeting changes at different times of day
- Verify timezone is Philippine (UTC+8)
- Test navigation to profile page on avatar click
- Verify layout on mobile devices

---

### Phase 2: QRT ID Card Display Component

**Objective:** Create a compact, reusable QRT ID card component that displays on the dashboard with flip functionality.

#### 2.1 Create Mini QRT Card Component

**File:** `/home/user/barangayformdemo/components/qrt-card-mini.tsx`

**Implementation Details:**

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { RefreshCw, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { QRTIDRequest } from "@/lib/qrt-context"

interface QRTCardMiniProps {
  qrtId: QRTIDRequest | null
  onRequestClick?: () => void
}

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
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] p-6 cursor-pointer hover:shadow-lg transition-shadow"
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

  // Has QRT ID - Show mini card
  return (
    <div className="relative">
      <div
        onClick={handleCardClick}
        className="relative overflow-visible cursor-pointer h-[160px] sm:h-[200px] lg:h-[240px]"
        style={{
          perspective: '1000px'
        }}
      >
        <motion.div
          animate={{ rotateY: showBackSide ? 180 : 0 }}
          transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
          className="relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Front Side */}
          <div
            className="absolute inset-0 rounded-2xl overflow-hidden shadow-lg"
            style={{ backfaceVisibility: 'hidden' }}
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
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
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

      {/* Flip Button */}
      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">QRT ID Card</p>
          <p className="text-sm font-semibold text-gray-900">{qrtId.qrtCode}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleFlipClick}
          className="rounded-full h-8 px-3 text-xs font-medium hover:bg-gray-100"
        >
          <RefreshCw className="h-3 w-3 mr-1.5" />
          Flip
        </Button>
      </div>
    </div>
  )
}
```

**Key Features:**
- Lines 36-56: Empty state with CTA to request QRT ID
- Lines 59-126: Card display with framer-motion flip animation
- Lines 69-75: 3D flip animation using rotateY
- Lines 128-140: Card info and flip button
- Lines 20-27: Click handler to navigate to full details page

**Design Specifications:**
- Height: Responsive (mobile: 160px, tablet: 200px, desktop: 240px) - ensures full card visibility
- Animation: Spring animation with 0.6s duration
- Perspective: 1000px for 3D effect
- Border radius: 16px (rounded-2xl)
- Max-width: 448px (max-w-md) to prevent over-stretching
- Aspect ratio: Maintains ID card proportions across all screen sizes

#### 2.2 Integrate Mini Card into Dashboard

**File:** `/home/user/barangayformdemo/app/dashboard/page.tsx`

**Changes:**

1. Add imports (after line 22):
```tsx
import { useQRT } from "@/lib/qrt-context"
import { QRTCardMini } from "@/components/qrt-card-mini"
```

2. Add state and data fetching (after line 27):
```tsx
const { getUserQRTIds, isLoaded: qrtLoaded } = useQRT()
const [userQrtId, setUserQrtId] = useState<any | null>(null)

useEffect(() => {
  if (user?.id && qrtLoaded) {
    const qrtIds = getUserQRTIds(user.id)
    // Get the most recent issued or ready QRT ID
    const activeQrt = qrtIds.find(qrt =>
      qrt.status === "issued" || qrt.status === "ready"
    )
    setUserQrtId(activeQrt || qrtIds[0] || null)
  }
}, [user, qrtLoaded, getUserQRTIds])
```

3. Add card display (after DashboardHeader, before Tabs):
```tsx
{/* QRT ID Card */}
<div className="mb-4">
  <QRTCardMini
    qrtId={userQrtId}
    onRequestClick={() => router.push("/qrt-id/request")}
  />
</div>
```

**Edge Cases Handled:**
- No QRT ID: Shows CTA to request
- QRT ID pending: Shows processing state
- Multiple QRT IDs: Prioritizes issued/ready status
- Loading state: Waits for context to load

---

### Phase 3: Services Grid Realignment

**Objective:** Reorder services to prioritize key features in a logical arrangement.

#### 3.1 Update Services Array

**File:** `/home/user/barangayformdemo/app/dashboard/page.tsx`

**Changes:** Replace services array (lines 58-67):

```tsx
const services = [
  // Row 1: Primary Services (4 items - aligned)
  { icon: FileText, label: "Request Certificate", href: "/request" },
  { icon: Users, label: "Bayanihan", href: "/bayanihan" },
  { icon: ShieldAlert, label: "File Blotter", href: "/blotter" },
  { icon: CreditCard, label: "Request ID", href: "/qrt-id/request" },

  // Row 2: Secondary Services (4 items)
  { icon: Plus, label: "Health Center", href: "/health-center" },
  { icon: Calendar, label: "Events", href: "/announcements" },
  { icon: FileSignature, label: "Permits", href: "/permits" },
  { icon: CircleDollarSign, label: "Taxes", href: "/taxes" },
]
```

**Changes Summary:**
- Row 1 now includes: Request Certificate, Bayanihan, File Blotter, Request ID
- Row 2 includes: Health Center, Events, Permits, Taxes
- Maintains 4-column grid layout
- Icons remain the same

**No Layout Changes Required:**
- Grid remains `grid-cols-4` (line 99)
- Gap and spacing unchanged
- Icon styling unchanged (lines 102-105)

---

### Phase 4: Coming Soon Pages & Route Management

**Objective:** Create a reusable coming soon page component and implement it for incomplete services.

#### 4.1 Create Coming Soon Component

**File:** `/home/user/barangayformdemo/components/coming-soon-page.tsx`

**Implementation Details:**

```tsx
"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock } from "lucide-react"
import { motion } from "framer-motion"

interface ComingSoonPageProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

export function ComingSoonPage({
  title,
  description = "We're working hard to bring this feature to you. Stay tuned!",
  icon
}: ComingSoonPageProps) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 px-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center text-center max-w-md"
      >
        {/* Logo */}
        <div className="relative h-20 w-20 mb-6">
          <Image
            src="/images/logo.png"
            alt="Barangay Seal"
            fill
            className="object-contain opacity-40 grayscale"
          />
        </div>

        {/* Icon */}
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[#3B82F6]/10 to-[#2563EB]/10 flex items-center justify-center mb-6">
          {icon || <Clock className="h-12 w-12 text-[#3B82F6]" strokeWidth={1.5} />}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {title}
        </h1>

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3B82F6]/10 mb-6">
          <div className="h-2 w-2 rounded-full bg-[#3B82F6] animate-pulse" />
          <span className="text-sm font-semibold text-[#3B82F6]">Coming Soon</span>
        </div>

        {/* Description */}
        <p className="text-gray-500 text-base leading-relaxed mb-10">
          {description}
        </p>

        {/* Back Button */}
        <Button
          onClick={() => router.push("/dashboard")}
          className="h-12 px-8 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] font-semibold shadow-lg shadow-blue-200"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-20 text-center"
      >
        <p className="text-xs text-gray-400">
          For urgent concerns, please visit the Barangay Hall
        </p>
      </motion.div>
    </div>
  )
}
```

**Key Features:**
- Lines 23-70: Centered layout with animated entrance
- Lines 30-37: Barangay logo (grayscale)
- Lines 40-43: Custom icon support with fallback
- Lines 51-55: "Coming Soon" badge with pulse animation
- Lines 63-68: Back to dashboard button
- Fully responsive and accessible

#### 4.2 Create Coming Soon Route Pages

**File 1:** `/home/user/barangayformdemo/app/health-center/page.tsx`

```tsx
import { ComingSoonPage } from "@/components/coming-soon-page"
import { Plus } from "lucide-react"

export default function HealthCenterPage() {
  return (
    <ComingSoonPage
      title="Health Center"
      description="Access health services, medical records, and schedule appointments with barangay health workers. This feature is under development."
      icon={<Plus className="h-12 w-12 text-[#3B82F6]" strokeWidth={1.5} />}
    />
  )
}
```

**File 2:** `/home/user/barangayformdemo/app/permits/page.tsx`

```tsx
import { ComingSoonPage } from "@/components/coming-soon-page"
import { FileSignature } from "lucide-react"

export default function PermitsPage() {
  return (
    <ComingSoonPage
      title="Permits & Clearances"
      description="Apply for business permits, building permits, and other barangay clearances online. This feature will be available soon."
      icon={<FileSignature className="h-12 w-12 text-[#3B82F6]" strokeWidth={1.5} />}
    />
  )
}
```

**File 3:** `/home/user/barangayformdemo/app/taxes/page.tsx`

```tsx
import { ComingSoonPage } from "@/components/coming-soon-page"
import { CircleDollarSign } from "lucide-react"

export default function TaxesPage() {
  return (
    <ComingSoonPage
      title="Taxes & Payments"
      description="View and pay your barangay taxes, community dues, and other fees online. This service is coming soon."
      icon={<CircleDollarSign className="h-12 w-12 text-[#3B82F6]" strokeWidth={1.5} />}
    />
  )
}
```

#### 4.3 Feature Flags for Existing Routes (Optional)

**Note:** Bayanihan, Blotter, and Events pages already exist. Based on requirements, we may want to temporarily disconnect them. However, since they're already implemented, we'll add clear comments for easy reconnection rather than breaking existing functionality.

**File:** `/home/user/barangayformdemo/app/dashboard/page.tsx`

**Add comments to services array:**

```tsx
const services = [
  { icon: FileText, label: "Request Certificate", href: "/request" },
  // TODO: Review and refine Bayanihan feature before final release
  { icon: Users, label: "Bayanihan", href: "/bayanihan" },
  // TODO: Review and refine Blotter feature before final release
  { icon: ShieldAlert, label: "File Blotter", href: "/blotter" },
  { icon: CreditCard, label: "Request ID", href: "/qrt-id/request" },
  { icon: Plus, label: "Health Center", href: "/health-center" }, // Coming soon
  // TODO: Announcements feature exists but may need refinement
  { icon: Calendar, label: "Events", href: "/announcements" },
  { icon: FileSignature, label: "Permits", href: "/permits" }, // Coming soon
  { icon: CircleDollarSign, label: "Taxes", href: "/taxes" }, // Coming soon
]
```

**Alternative - Feature Flag Pattern:**

If disconnection is required, create a feature flags file:

**File:** `/home/user/barangayformdemo/lib/feature-flags.ts`

```tsx
export const FEATURE_FLAGS = {
  BAYANIHAN_ENABLED: false, // Set to true to reconnect
  BLOTTER_ENABLED: false,   // Set to true to reconnect
  EVENTS_ENABLED: true,     // Keep enabled as announcements work
  HEALTH_CENTER_ENABLED: false,
  PERMITS_ENABLED: false,
  TAXES_ENABLED: false,
} as const
```

Then modify services to use flags:

```tsx
import { FEATURE_FLAGS } from "@/lib/feature-flags"

const services = [
  { icon: FileText, label: "Request Certificate", href: "/request" },
  {
    icon: Users,
    label: "Bayanihan",
    href: FEATURE_FLAGS.BAYANIHAN_ENABLED ? "/bayanihan" : "/coming-soon/bayanihan"
  },
  // ... etc
]
```

---

### Phase 5: Dynamic Data Integration

**Objective:** Ensure all user data is fetched dynamically from context APIs with proper loading and error states.

#### 5.1 Data Flow Architecture

**Context Dependencies:**
1. **Auth Context** (`useAuth`)
   - Provides: `user`, `isAuthenticated`, `isLoading`
   - Used by: DashboardHeader, QRTCardMini (indirectly)
   - Loading strategy: Show spinner until `isLoading === false`

2. **QRT Context** (`useQRT`)
   - Provides: `getUserQRTIds()`, `qrtIds`, `isLoaded`
   - Used by: Dashboard (for QRTCardMini data)
   - Loading strategy: Wait for `isLoaded === true`

3. **Announcements Context** (`useAnnouncements`)
   - Already implemented in current dashboard
   - No changes required

#### 5.2 Loading State Management

**File:** `/home/user/barangayformdemo/app/dashboard/page.tsx`

**Enhanced loading logic:**

```tsx
export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { getUserQRTIds, isLoaded: qrtLoaded } = useQRT()
  const { getPublishedAnnouncements } = useAnnouncements()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("services")
  const [userQrtId, setUserQrtId] = useState<any | null>(null)
  const [dataReady, setDataReady] = useState(false)

  // Auth check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, router])

  // Load user QRT ID
  useEffect(() => {
    if (user?.id && qrtLoaded) {
      const qrtIds = getUserQRTIds(user.id)
      const activeQrt = qrtIds.find(qrt =>
        qrt.status === "issued" || qrt.status === "ready"
      ) || qrtIds[0] || null
      setUserQrtId(activeQrt)
      setDataReady(true)
    }
  }, [user, qrtLoaded, getUserQRTIds])

  // Loading state - wait for auth AND data to be ready
  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#3B82F6] border-t-transparent" />
      </div>
    )
  }

  // ... rest of component
}
```

#### 5.3 Error Boundary Implementation

**File:** `/home/user/barangayformdemo/app/dashboard/error.tsx` (if not exists)

```tsx
"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6">
      <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
      <p className="text-gray-500 text-center mb-6 max-w-sm">
        We encountered an error while loading your dashboard. Please try again.
      </p>
      <Button
        onClick={reset}
        className="h-12 px-8 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB]"
      >
        Try Again
      </Button>
    </div>
  )
}
```

#### 5.4 Philippine Timezone Implementation

**File:** `/home/user/barangayformdemo/lib/utils/timezone.ts`

```tsx
import { toZonedTime, format } from "date-fns-tz"

export const PHILIPPINE_TIMEZONE = "Asia/Manila"

export function getPhilippineTime(): Date {
  return toZonedTime(new Date(), PHILIPPINE_TIMEZONE)
}

export function getGreeting(): string {
  const phTime = getPhilippineTime()
  const hour = phTime.getHours()

  if (hour >= 5 && hour < 12) {
    return "Good Morning"
  } else if (hour >= 12 && hour < 18) {
    return "Good Afternoon"
  } else {
    return "Good Evening"
  }
}

export function formatPhilippineDate(date: Date | string, formatString: string = "PPP"): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return format(toZonedTime(dateObj, PHILIPPINE_TIMEZONE), formatString, {
    timeZone: PHILIPPINE_TIMEZONE
  })
}
```

**Usage in DashboardHeader:**

```tsx
import { getGreeting } from "@/lib/utils/timezone"

export function DashboardHeader() {
  const [greeting, setGreeting] = useState(getGreeting())

  useEffect(() => {
    const updateGreeting = () => setGreeting(getGreeting())
    updateGreeting()
    const interval = setInterval(updateGreeting, 60000)
    return () => clearInterval(interval)
  }, [])

  // ... rest of component
}
```

---

### Phase 6: Polish & Responsive Design

**Objective:** Ensure consistent styling, smooth animations, and responsive behavior across all devices.

#### 6.1 Responsive Breakpoints

**Tailwind Configuration:**

All components should follow mobile-first design:

- **Mobile**: Default (< 640px)
  - Full width containers
  - Single column layouts
  - Touch-optimized buttons (min 44px height)

- **Tablet**: `sm:` (≥ 640px)
  - Slightly increased padding
  - May maintain single column

- **Desktop**: `md:` (≥ 768px) and `lg:` (≥ 1024px)
  - Max width containers
  - Multi-column layouts where appropriate

#### 6.2 Component-Specific Responsive Rules

**DashboardHeader:**
```tsx
<div className="flex items-center justify-between py-4 px-4 bg-white">
  <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
    <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full ...">
      {/* Avatar scales slightly on tablet+ */}
    </div>
    <div className="text-left">
      <p className="text-sm text-gray-500">{greeting},</p>
      <p className="text-base sm:text-lg font-semibold text-gray-900 truncate max-w-[150px] sm:max-w-none">
        {user?.fullName || "Guest"}
      </p>
    </div>
  </button>
</div>
```

**QRTCardMini:**
```tsx
<div
  className="relative overflow-visible cursor-pointer max-w-md mx-auto h-[160px] sm:h-[200px] lg:h-[240px]"
  style={{ perspective: '1000px' }}
>
  {/* Card content with responsive height for full card visibility */}
</div>
```

**Services Grid:**
```tsx
{/* Current: 4 columns on all screens */}
<div className="grid grid-cols-4 gap-x-2 gap-y-6 mb-8">
  {/* Keep existing implementation - works well on mobile */}
</div>
```

#### 6.3 Animation Performance

**Optimization Techniques:**

1. **Use GPU-accelerated properties:**
   - `transform` instead of `top/left`
   - `opacity` for fading
   - Avoid animating `width`, `height`, `margin`

2. **Framer Motion configuration:**
```tsx
// Efficient animation
<motion.div
  animate={{ rotateY: showBackSide ? 180 : 0 }}
  transition={{
    duration: 0.6,
    type: "spring",
    stiffness: 200,
    damping: 20
  }}
  style={{
    transformStyle: 'preserve-3d',
    willChange: 'transform' // Hint to browser
  }}
>
```

3. **Lazy loading for images:**
```tsx
<Image
  src={qrtId.idFrontImageUrl}
  alt={`QRT ID for ${qrtId.fullName}`}
  fill
  className="object-cover"
  priority={false} // Only set priority={true} for above-fold images
  loading="lazy"
/>
```

#### 6.4 Accessibility Requirements

**ARIA Labels:**

```tsx
// DashboardHeader
<button
  onClick={handleProfileClick}
  aria-label="Go to profile page"
  className="flex items-center gap-3..."
>
  {/* Avatar and name */}
</button>

<button
  aria-label="View notifications"
  className="h-10 w-10..."
>
  <Bell className="h-5 w-5 text-gray-500" />
</button>

// QRTCardMini
<button
  aria-label={showBackSide ? "Show front of ID card" : "Show back of ID card"}
  onClick={handleFlipClick}
>
  <RefreshCw className="h-3 w-3 mr-1.5" />
  Flip
</button>
```

**Keyboard Navigation:**

```tsx
// Ensure all interactive elements are keyboard accessible
<div
  onClick={handleCardClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardClick()
    }
  }}
  role="button"
  tabIndex={0}
  className="relative overflow-hidden rounded-2xl..."
>
```

**Focus Styles:**

```tsx
// Add to global styles or component
className="focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2 rounded-2xl"
```

#### 6.5 Touch Optimization

**Minimum Touch Targets:**

```tsx
// All buttons should have minimum 44px touch target
<button className="h-10 w-10 min-h-[44px] min-w-[44px]">
  <Bell className="h-5 w-5" />
</button>
```

**Active States:**

```tsx
// Add active state for better touch feedback
<button className="... active:scale-95 transition-transform">
  {/* Content */}
</button>
```

#### 6.6 Loading Skeleton (Optional Enhancement)

**File:** `/home/user/barangayformdemo/components/dashboard-skeleton.tsx`

```tsx
export function DashboardSkeleton() {
  return (
    <div className="flex-1 px-4 pb-24 pt-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between py-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200" />
          <div>
            <div className="h-4 w-24 bg-gray-200 rounded mb-1" />
            <div className="h-5 w-32 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-10 w-10 rounded-full bg-gray-200" />
      </div>

      {/* QRT Card Skeleton */}
      <div className="mb-4 h-[160px] sm:h-[200px] lg:h-[240px] rounded-2xl bg-gray-200" />

      {/* Tabs Skeleton */}
      <div className="mb-6 h-[44px] rounded-full bg-gray-200" />

      {/* Services Grid Skeleton */}
      <div className="grid grid-cols-4 gap-x-2 gap-y-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-gray-200" />
            <div className="h-4 w-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## File Modification Summary

### New Files to Create

| File Path | Purpose | Lines (Est.) |
|-----------|---------|--------------|
| `/components/dashboard-header.tsx` | User profile header with greeting | ~80 |
| `/components/qrt-card-mini.tsx` | Compact QRT ID card display | ~170 |
| `/components/coming-soon-page.tsx` | Reusable coming soon component | ~90 |
| `/app/health-center/page.tsx` | Health center coming soon route | ~15 |
| `/app/permits/page.tsx` | Permits coming soon route | ~15 |
| `/app/taxes/page.tsx` | Taxes coming soon route | ~15 |
| `/lib/utils/timezone.ts` | Philippine timezone utilities | ~35 |
| `/app/dashboard/error.tsx` | Error boundary for dashboard | ~40 |
| `/components/dashboard-skeleton.tsx` (optional) | Loading skeleton | ~40 |
| `/lib/feature-flags.ts` (optional) | Feature flag configuration | ~10 |

**Total New Files:** 9-10 files, ~510-520 lines of code

### Files to Modify

| File Path | Changes Required | Lines Affected |
|-----------|------------------|----------------|
| `/app/dashboard/page.tsx` | Add imports, state, QRT logic, header, card | Lines 1-22 (imports), 25-34 (state), 70-98 (layout) |
| `/app/dashboard/page.tsx` | Update services array order | Lines 58-67 (8 lines) |

**Total Modified Files:** 1 file, ~30 lines changed/added

### No Changes Required

| File Path | Reason |
|-----------|--------|
| `/lib/auth-context.tsx` | Already provides all needed functionality |
| `/lib/qrt-context.tsx` | Already provides all needed functionality |
| `/components/id-card-preview.tsx` | Used as reference, not modified |
| `/components/bottom-nav.tsx` | No changes needed |
| `/app/requests/qrt/[id]/page.tsx` | Already exists and works |

---

## Technical Considerations

### 1. Performance Optimization

**Image Loading:**
- Use Next.js `<Image>` component for automatic optimization
- Set `priority={true}` only for above-fold images (header avatar)
- Use `loading="lazy"` for QRT card images
- Implement blur placeholder for smoother loading

**Code Splitting:**
- QRTCardMini uses dynamic import if needed:
```tsx
import dynamic from 'next/dynamic'
const QRTCardMini = dynamic(() => import('@/components/qrt-card-mini'), {
  loading: () => <div className="h-[160px] sm:h-[200px] lg:h-[240px] rounded-2xl bg-gray-100 animate-pulse" />
})
```

**Memoization:**
```tsx
// In dashboard page
const userQrtId = useMemo(() => {
  if (!user?.id || !qrtLoaded) return null
  const qrtIds = getUserQRTIds(user.id)
  return qrtIds.find(qrt => qrt.status === "issued" || qrt.status === "ready") || qrtIds[0] || null
}, [user?.id, qrtLoaded, getUserQRTIds])
```

### 2. State Management

**Local State vs Context:**
- **Local State:** UI state (flip toggle, greeting)
- **Context State:** User data, QRT IDs (already implemented)
- **No Redux needed:** Current context system is sufficient

**State Update Patterns:**
```tsx
// Avoid unnecessary re-renders
const [showBackSide, setShowBackSide] = useState(false)

// Memoize expensive operations
const greeting = useMemo(() => getGreeting(), [])

// Debounce greeting updates
useEffect(() => {
  const interval = setInterval(() => setGreeting(getGreeting()), 60000)
  return () => clearInterval(interval)
}, [])
```

### 3. Routing Strategy

**Client-Side Navigation:**
```tsx
// Use Next.js router for instant navigation
import { useRouter } from "next/navigation"
const router = useRouter()

// Prefetch links on hover
<Link href="/requests/qrt/123" prefetch={true}>
```

**Route Guards:**
```tsx
// Already implemented in dashboard
useEffect(() => {
  if (!isLoading && !isAuthenticated) {
    router.push("/login")
  }
}, [isLoading, isAuthenticated, router])
```

### 4. Date/Time Handling

**Philippine Timezone:**
```tsx
import { toZonedTime } from "date-fns-tz"

const TIMEZONE = "Asia/Manila"
const phTime = toZonedTime(new Date(), TIMEZONE)
```

**Greeting Logic:**
- 5:00 AM - 11:59 AM → "Good Morning"
- 12:00 PM - 5:59 PM → "Good Afternoon"
- 6:00 PM - 4:59 AM → "Good Evening"

### 5. Error Handling

**Context Loading Errors:**
```tsx
// QRT Context already has timeout handling (lines 178-181)
const timeoutId = setTimeout(() => {
  console.warn("[QRT Context] Load timeout reached")
  setIsLoaded(true)
}, 5000)
```

**Component Error Boundaries:**
- Implement error.tsx for dashboard route
- Show friendly error messages
- Provide retry functionality

**Network Failure Handling:**
```tsx
// Graceful degradation
if (!qrtLoaded) {
  return <QRTCardSkeleton />
}

if (qrtError) {
  return <QRTCardError onRetry={refreshQRTIds} />
}
```

### 6. Browser Compatibility

**CSS Features:**
- `backdrop-filter`: Widely supported (95%+)
- `transform-style: preserve-3d`: Supported in all modern browsers
- Fallback for older browsers:
```tsx
@supports not (transform-style: preserve-3d) {
  .card-flip {
    /* Simple opacity transition instead */
    transition: opacity 0.3s;
  }
}
```

**JavaScript Features:**
- All ES6+ features supported by Next.js transpilation
- No polyfills needed for target browsers (modern mobile + desktop)

### 7. Security Considerations

**Data Privacy:**
- No sensitive data in localStorage (already handled by contexts)
- QRT images served from secure storage URLs
- User data only accessible when authenticated

**XSS Prevention:**
- Next.js automatically escapes rendered content
- No `dangerouslySetInnerHTML` used
- All user input sanitized through React

**Route Protection:**
- Auth check on every protected page
- Redirect to login if not authenticated
- Server-side validation for API routes (if applicable)

---

## Testing Requirements

### 1. Unit Tests

**Components to Test:**

**DashboardHeader (`dashboard-header.test.tsx`):**
```typescript
describe("DashboardHeader", () => {
  it("displays correct greeting based on Philippine time", () => {
    // Mock Philippine timezone
    // Assert greeting matches time of day
  })

  it("navigates to profile on avatar click", () => {
    // Mock router
    // Click avatar
    // Assert router.push("/profile") called
  })

  it("displays user name correctly", () => {
    // Mock user context
    // Assert user name rendered
  })

  it("shows placeholder when user is null", () => {
    // Mock null user
    // Assert "Guest" displayed
  })
})
```

**QRTCardMini (`qrt-card-mini.test.tsx`):**
```typescript
describe("QRTCardMini", () => {
  it("shows full card with responsive height", () => {
    // Verify responsive heights: 160px (mobile), 200px (tablet), 240px (desktop)
    // Ensure full card is visible at all breakpoints
  })

  it("shows CTA when no QRT ID exists", () => {
    // Pass null qrtId
    // Assert "Request Your ID" displayed
  })

  it("displays QRT ID card when data exists", () => {
    // Pass mock qrtId
    // Assert card displayed with correct data
  })

  it("flips card on button click", () => {
    // Click flip button
    // Assert showBackSide state changes
  })

  it("navigates to details page on card click", () => {
    // Click card
    // Assert router.push called with correct ID
  })

  it("shows processing state when images not ready", () => {
    // Pass qrtId without image URLs
    // Assert processing message shown
  })
})
```

**ComingSoonPage (`coming-soon-page.test.tsx`):**
```typescript
describe("ComingSoonPage", () => {
  it("displays custom title and description", () => {
    // Render with props
    // Assert title and description match
  })

  it("navigates back to dashboard on button click", () => {
    // Click back button
    // Assert router.push("/dashboard") called
  })

  it("displays custom icon when provided", () => {
    // Pass custom icon
    // Assert icon rendered
  })
})
```

### 2. Integration Tests

**Dashboard Flow:**
```typescript
describe("Dashboard Integration", () => {
  it("loads user data and displays header", async () => {
    // Mock auth context
    // Render dashboard
    // Wait for loading
    // Assert header displays user info
  })

  it("loads QRT ID and displays card", async () => {
    // Mock QRT context
    // Render dashboard
    // Assert QRT card displayed
  })

  it("navigates to QRT details from mini card", async () => {
    // Render dashboard with QRT ID
    // Click card
    // Assert navigation occurred
  })

  it("handles no QRT ID state", async () => {
    // Mock empty QRT array
    // Render dashboard
    // Assert CTA displayed
  })
})
```

### 3. E2E Tests (Playwright)

**File:** `/tests/dashboard.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="mobileNumber"]', '09171234567')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('displays user greeting', async ({ page }) => {
    await expect(page.locator('text=/Good (Morning|Afternoon|Evening)/')).toBeVisible()
  })

  test('shows QRT ID card when user has one', async ({ page }) => {
    const qrtCard = page.locator('[data-testid="qrt-card-mini"]')
    await expect(qrtCard).toBeVisible()
  })

  test('can flip QRT ID card', async ({ page }) => {
    await page.click('text=Flip')
    // Wait for animation
    await page.waitForTimeout(700)
    // Assert back side visible (check for different content)
  })

  test('navigates to QRT details on card click', async ({ page }) => {
    await page.click('[data-testid="qrt-card-mini"]')
    await expect(page).toHaveURL(/\/requests\/qrt\//)
  })

  test('services grid displays correctly', async ({ page }) => {
    const services = page.locator('[data-testid="service-item"]')
    await expect(services).toHaveCount(8)
  })

  test('coming soon page works', async ({ page }) => {
    await page.click('text=Health Center')
    await expect(page.locator('text=Coming Soon')).toBeVisible()
    await page.click('text=Back to Dashboard')
    await expect(page).toHaveURL('/dashboard')
  })
})
```

### 4. Visual Regression Tests

**Snapshots to capture:**
- Dashboard with QRT ID
- Dashboard without QRT ID (CTA state)
- Dashboard header at different viewport sizes
- QRT card flip animation (multiple frames)
- Coming soon pages

**Tools:**
- Playwright visual comparisons
- Percy.io or similar service

### 5. Accessibility Tests

**Automated Testing:**
```typescript
import { injectAxe, checkA11y } from 'axe-playwright'

test('dashboard is accessible', async ({ page }) => {
  await page.goto('/dashboard')
  await injectAxe(page)
  await checkA11y(page)
})
```

**Manual Testing Checklist:**
- [ ] Keyboard navigation works for all interactive elements
- [ ] Screen reader announces all content correctly
- [ ] Focus indicators visible on all focusable elements
- [ ] Color contrast meets WCAG AA standards
- [ ] Touch targets are at least 44x44px
- [ ] Images have appropriate alt text
- [ ] ARIA labels present where needed

### 6. Performance Tests

**Metrics to Track:**
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

**Tools:**
- Lighthouse CI
- WebPageTest
- Chrome DevTools Performance panel

### 7. Responsive Design Tests

**Breakpoints to test:**
- Mobile: 375px (iPhone SE)
- Mobile: 390px (iPhone 13)
- Tablet: 768px (iPad)
- Desktop: 1024px
- Desktop: 1440px

**Manual testing:**
- Chrome DevTools device emulation
- Real device testing (iOS/Android)
- Rotation testing (portrait/landscape)

---

## Success Criteria

### Functional Requirements

- [ ] **Header Implementation**
  - [ ] User avatar displays as circular placeholder with UserCircle2 icon
  - [ ] Avatar click navigates to `/profile` page
  - [ ] Dynamic greeting displays based on Philippine time (Good Morning/Afternoon/Evening)
  - [ ] User name displays correctly from auth context
  - [ ] Notification bell renders on right side (aesthetic only, no functionality required)

- [ ] **QRT ID Card Display**
  - [ ] Mini card displays when user has QRT ID (status: issued or ready)
  - [ ] Card shows front side image or processing state
  - [ ] Flip button toggles between front and back sides with smooth 3D animation
  - [ ] Card click navigates to `/requests/qrt/[id]` page
  - [ ] CTA displays when user has no QRT ID
  - [ ] CTA click navigates to `/qrt-id/request` page

- [ ] **Services Grid Alignment**
  - [ ] Row 1 contains: Request Certificate, Bayanihan, File Blotter, Request ID
  - [ ] Row 2 contains: Health Center, Events, Permits, Taxes
  - [ ] All icons display correctly with consistent styling
  - [ ] 4-column grid maintained on all screen sizes

- [ ] **Coming Soon Pages**
  - [ ] Health Center page displays coming soon message
  - [ ] Permits page displays coming soon message
  - [ ] Taxes page displays coming soon message
  - [ ] All coming soon pages have "Back to Dashboard" button
  - [ ] Custom icons display for each service

- [ ] **Dynamic Data Integration**
  - [ ] User data loaded from `useAuth()` context
  - [ ] QRT ID data loaded from `useQRT()` context
  - [ ] Philippine timezone implemented correctly
  - [ ] Loading states handled gracefully
  - [ ] No hardcoded user data

### Non-Functional Requirements

- [ ] **Performance**
  - [ ] Page loads in < 2 seconds on 3G connection
  - [ ] No layout shift on load (CLS < 0.1)
  - [ ] Smooth animations (60fps)
  - [ ] Images optimized and lazy-loaded

- [ ] **Design Consistency**
  - [ ] Color scheme matches existing app (primary blue: #3B82F6)
  - [ ] Typography consistent with existing pages
  - [ ] Spacing follows established patterns
  - [ ] Border radius matches design system

- [ ] **Responsive Design**
  - [ ] Works on mobile (375px+)
  - [ ] Works on tablet (768px+)
  - [ ] Works on desktop (1024px+)
  - [ ] Touch targets minimum 44x44px
  - [ ] No horizontal scroll on any device

- [ ] **Accessibility**
  - [ ] WCAG AA color contrast compliance
  - [ ] Keyboard navigation functional
  - [ ] Screen reader compatible
  - [ ] ARIA labels present
  - [ ] Focus indicators visible

- [ ] **Browser Compatibility**
  - [ ] Works in Chrome/Edge (latest)
  - [ ] Works in Safari (latest)
  - [ ] Works in Firefox (latest)
  - [ ] Works on iOS Safari
  - [ ] Works on Chrome Android

- [ ] **Code Quality**
  - [ ] TypeScript types properly defined
  - [ ] No console errors
  - [ ] No ESLint warnings
  - [ ] Components properly documented
  - [ ] Code follows existing patterns

---

## Implementation Phases - Detailed Breakdown

### Phase 1: Dashboard Header (Est. 2-3 hours)

**Step 1.1:** Create timezone utility (30 min)
- Create `/lib/utils/timezone.ts`
- Implement `getGreeting()` function
- Test with different times

**Step 1.2:** Create DashboardHeader component (1 hour)
- Create `/components/dashboard-header.tsx`
- Implement greeting logic
- Add navigation handlers
- Style according to specs

**Step 1.3:** Integrate into dashboard (30 min)
- Update `/app/dashboard/page.tsx`
- Add import and component
- Test rendering and navigation

**Step 1.4:** Testing (30 min)
- Write unit tests
- Test timezone logic
- Test navigation

**Deliverables:**
- `dashboard-header.tsx` component
- `timezone.ts` utility
- Updated `dashboard/page.tsx`
- Unit tests

---

### Phase 2: QRT ID Card Display (Est. 4-5 hours)

**Step 2.1:** Create QRTCardMini component (2 hours)
- Create `/components/qrt-card-mini.tsx`
- Implement empty state (CTA)
- Implement card state with flip animation
- Add click handlers

**Step 2.2:** Integrate into dashboard (1 hour)
- Update dashboard with QRT context
- Add state management for user's QRT ID
- Handle loading states
- Position card in layout

**Step 2.3:** Testing and refinement (1-2 hours)
- Test flip animation
- Test navigation
- Test edge cases (no ID, processing, etc.)
- Optimize animation performance
- Write unit tests

**Deliverables:**
- `qrt-card-mini.tsx` component
- Updated `dashboard/page.tsx` with QRT logic
- Unit tests
- Integration tests

---

### Phase 3: Services Grid Realignment (Est. 30 min)

**Step 3.1:** Update services array (15 min)
- Modify `/app/dashboard/page.tsx`
- Reorder services array
- Update comments

**Step 3.2:** Verification (15 min)
- Visual verification
- Test all links
- Ensure icons display correctly

**Deliverables:**
- Updated services array
- Verification screenshots

---

### Phase 4: Coming Soon Pages (Est. 2-3 hours)

**Step 4.1:** Create ComingSoonPage component (1 hour)
- Create `/components/coming-soon-page.tsx`
- Implement layout and animations
- Add customization props

**Step 4.2:** Create route pages (1 hour)
- Create `/app/health-center/page.tsx`
- Create `/app/permits/page.tsx`
- Create `/app/taxes/page.tsx`
- Customize each with appropriate content

**Step 4.3:** Testing (30 min)
- Test navigation from dashboard
- Test back button
- Test responsive design
- Write unit tests

**Deliverables:**
- `coming-soon-page.tsx` component
- 3 route page files
- Unit tests

---

### Phase 5: Dynamic Data Integration (Est. 2 hours)

**Step 5.1:** Audit current data flow (30 min)
- Review auth context usage
- Review QRT context usage
- Identify any hardcoded data

**Step 5.2:** Implement loading states (1 hour)
- Add proper loading checks
- Create loading skeleton (optional)
- Handle error states

**Step 5.3:** Create error boundary (30 min)
- Create `/app/dashboard/error.tsx`
- Test error scenarios
- Verify recovery flow

**Deliverables:**
- Updated dashboard with proper data loading
- Error boundary component
- Loading skeleton (optional)

---

### Phase 6: Polish & Responsive Design (Est. 3-4 hours)

**Step 6.1:** Responsive testing (1 hour)
- Test on mobile devices
- Test on tablets
- Test on desktop
- Fix any layout issues

**Step 6.2:** Accessibility improvements (1 hour)
- Add ARIA labels
- Test keyboard navigation
- Test with screen reader
- Ensure focus indicators

**Step 6.3:** Animation optimization (1 hour)
- Test animation performance
- Optimize for 60fps
- Add will-change hints
- Test on lower-end devices

**Step 6.4:** Final polish (1 hour)
- Code cleanup
- Documentation
- Final visual adjustments
- Cross-browser testing

**Deliverables:**
- Fully responsive components
- Accessibility improvements
- Performance optimizations
- Documentation

---

## Total Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Dashboard Header | 2-3 hours | None |
| Phase 2: QRT ID Card | 4-5 hours | None (parallel with Phase 1) |
| Phase 3: Services Grid | 30 min | None |
| Phase 4: Coming Soon Pages | 2-3 hours | None (parallel with Phases 1-3) |
| Phase 5: Data Integration | 2 hours | Phases 1-2 complete |
| Phase 6: Polish & Testing | 3-4 hours | All phases complete |
| **Total** | **14-18 hours** | Sequential + Parallel |

**Recommended Approach:**
- Phases 1, 2, 3, 4 can be worked on in parallel by different developers
- Phase 5 requires Phases 1-2 to be complete
- Phase 6 requires all previous phases to be complete

---

## Deployment Checklist

### Pre-Deployment

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] No console errors or warnings
- [ ] Lighthouse score > 90
- [ ] Accessibility audit passed
- [ ] Code review completed
- [ ] TypeScript compilation successful
- [ ] Build successful (`npm run build`)

### Deployment Steps

1. [ ] Create feature branch from main
2. [ ] Commit all changes with descriptive messages
3. [ ] Push to remote repository
4. [ ] Create pull request
5. [ ] Wait for CI/CD checks to pass
6. [ ] Get approval from reviewer
7. [ ] Merge to main branch
8. [ ] Deploy to staging environment
9. [ ] Verify on staging
10. [ ] Deploy to production

### Post-Deployment

- [ ] Verify all features work in production
- [ ] Monitor error logs
- [ ] Check analytics for issues
- [ ] Verify performance metrics
- [ ] Notify stakeholders

---

## Rollback Plan

**If issues occur in production:**

1. **Immediate actions:**
   - Monitor error logs
   - Check user reports
   - Assess severity

2. **Rollback procedure:**
   ```bash
   # Revert to previous commit
   git revert <commit-hash>
   git push origin main

   # Or reset to previous stable version
   git reset --hard <previous-stable-commit>
   git push --force origin main
   ```

3. **Communication:**
   - Notify team
   - Update status page
   - Communicate with users if necessary

4. **Investigation:**
   - Identify root cause
   - Create bug report
   - Develop fix
   - Test thoroughly
   - Redeploy

---

## Future Enhancements

### Potential Additions (Not in Current Scope)

1. **Notification System**
   - Actual notification functionality for bell icon
   - Real-time updates via WebSocket
   - Notification preferences

2. **QRT Card Enhancements**
   - Share QRT card as image
   - Add to Apple Wallet
   - NFC tap functionality

3. **Dashboard Widgets**
   - Recent requests summary
   - Upcoming events
   - Payment reminders

4. **Personalization**
   - Custom dashboard layout
   - Theme preferences
   - Quick actions

5. **Analytics**
   - Dashboard usage tracking
   - Feature engagement metrics
   - User journey analysis

---

## Appendix

### A. Color Reference

```css
/* Primary Colors */
--primary-blue: #3B82F6;
--primary-blue-dark: #2563EB;
--primary-blue-light: #60A5FA;

/* Success */
--success-green: #10B981;
--success-emerald: #059669;

/* Grayscale */
--gray-900: #111827;
--gray-700: #374151;
--gray-600: #4B5563;
--gray-500: #6B7280;
--gray-400: #9CA3AF;
--gray-300: #D1D5DB;
--gray-200: #E5E7EB;
--gray-100: #F3F4F6;
--gray-50: #F9FAFB;

/* Backgrounds */
--bg-white: #FFFFFF;
--bg-gray: #F8F9FA;
```

### B. Typography Scale

```css
/* Font Sizes */
--text-3xl: 1.875rem;  /* 30px */
--text-2xl: 1.5rem;    /* 24px */
--text-xl: 1.25rem;    /* 20px */
--text-lg: 1.125rem;   /* 18px */
--text-base: 1rem;     /* 16px */
--text-sm: 0.875rem;   /* 14px */
--text-xs: 0.75rem;    /* 12px */
--text-xxs: 0.625rem;  /* 10px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-black: 900;
```

### C. Spacing Scale

```css
/* Spacing (Tailwind default) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

### D. Border Radius

```css
/* Border Radius */
--rounded-sm: 0.125rem;    /* 2px */
--rounded: 0.25rem;        /* 4px */
--rounded-md: 0.375rem;    /* 6px */
--rounded-lg: 0.5rem;      /* 8px */
--rounded-xl: 0.75rem;     /* 12px */
--rounded-2xl: 1rem;       /* 16px */
--rounded-3xl: 1.5rem;     /* 24px */
--rounded-full: 9999px;    /* Circle */
```

### E. Animation Presets

```typescript
// Framer Motion Variants
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
}

export const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export const slideDown = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } }
}

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}
```

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-06 | Spec Writer Agent | Initial specification document |

---

**End of Specification Document**
