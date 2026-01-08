# Dashboard Header with QRT Integration - Tasks List

## Overview

This tasks list breaks down the implementation of the Dashboard Header with QRT Integration feature into 30 actionable tasks across 6 phases. The feature enhances the Barangay Mawaque dashboard with a personalized header, QRT ID card preview, realigned services grid, coming soon pages, and dynamic data integration.

**Total Estimated Tasks:** 30
**Total Estimated Effort:** 14-18 hours
**Phases:** 6 (Header, QRT Card, Services, Coming Soon, Data Integration, Polish)

---

## Phase 1: Dashboard Header with User Profile & Notification

### Task 1: Create Philippine Timezone Utility

**Phase:** 1 - Dashboard Header
**Files:**
- `/home/user/barangayformdemo/lib/utils/timezone.ts` (new)

**Description:**
Create a utility module for handling Philippine timezone (Asia/Manila) operations. Implement functions for getting Philippine time, generating time-based greetings, and formatting dates in the Philippine timezone.

**Implementation Details:**
- Import `toZonedTime` and `format` from `date-fns-tz`
- Export constant `PHILIPPINE_TIMEZONE = "Asia/Manila"`
- Create `getPhilippineTime()` function that returns current time in PH timezone
- Create `getGreeting()` function with logic:
  - 5:00-11:59 AM → "Good Morning"
  - 12:00-5:59 PM → "Good Afternoon"
  - 6:00 PM-4:59 AM → "Good Evening"
- Create `formatPhilippineDate()` helper for date formatting

**Dependencies:**
- None

**Acceptance Criteria:**
- [x] Timezone utility exports all required functions
- [x] Greeting logic correctly maps to time ranges
- [x] Functions use Philippine timezone (UTC+8)
- [x] No hardcoded timezone values outside the constant
- [x] TypeScript types properly defined

**Estimated Effort:** Small (30 minutes)

---

### Task 2: Create DashboardHeader Component Structure

**Phase:** 1 - Dashboard Header
**Files:**
- `/home/user/barangayformdemo/components/dashboard-header.tsx` (new)

**Description:**
Create the main DashboardHeader component with basic structure including profile avatar section, greeting display, and notification bell. Set up component state and navigation handlers.

**Implementation Details:**
- Create "use client" component
- Import `useAuth()` hook from `@/lib/auth-context`
- Import `useRouter` from `next/navigation`
- Import icons: `UserCircle2`, `Bell` from `lucide-react`
- Set up state for `greeting` using `useState`
- Create `handleProfileClick` that navigates to `/profile`
- Create basic JSX structure with three main sections:
  - Left: Profile button with avatar and greeting
  - Right: Notification bell button

**Dependencies:**
- Task 1 (timezone utility)

**Acceptance Criteria:**
- [x] Component renders without errors
- [x] Profile button contains avatar and text sections
- [x] Notification bell renders on the right
- [x] Click handlers are defined (not yet functional)
- [x] Component uses "use client" directive

**Estimated Effort:** Small (30 minutes)

---

### Task 3: Implement Dynamic Greeting Logic

**Phase:** 1 - Dashboard Header
**Files:**
- `/home/user/barangayformdemo/components/dashboard-header.tsx`

**Description:**
Implement the dynamic greeting system that updates based on Philippine time. Set up `useEffect` to update greeting on mount and every minute.

**Implementation Details:**
- Import `getGreeting` from `@/lib/utils/timezone`
- Initialize `greeting` state with `getGreeting()` result
- Create `useEffect` that:
  - Calls `getGreeting()` on mount
  - Sets up interval to update every 60000ms (1 minute)
  - Returns cleanup function to clear interval
- Update JSX to display dynamic greeting before user name

**Dependencies:**
- Task 1 (timezone utility)
- Task 2 (component structure)

**Acceptance Criteria:**
- [x] Greeting updates on component mount
- [x] Greeting updates every minute
- [x] Interval is cleaned up on unmount
- [x] Correct greeting displayed based on PH time
- [x] No memory leaks from interval

**Estimated Effort:** Small (30 minutes)

---

### Task 4: Style DashboardHeader Component

**Phase:** 1 - Dashboard Header
**Files:**
- `/home/user/barangayformdemo/components/dashboard-header.tsx`

**Description:**
Apply styling to the DashboardHeader component following the app's design system. Implement responsive design, hover states, and proper spacing.

**Implementation Details:**
- Container: `flex items-center justify-between py-4 px-4 bg-white`
- Profile button: Flex layout with gap-3, hover:opacity-80 transition
- Avatar: 40px x 40px (h-10 w-10), rounded-full, gradient from #3B82F6 to #2563EB
- Avatar icon: UserCircle2 with h-6 w-6, text-white, strokeWidth={2}
- Greeting text: text-sm text-gray-500
- User name: text-base font-semibold text-gray-900
- Name truncation on mobile: `max-w-[150px] sm:max-w-none truncate`
- Notification bell: 40px x 40px container, rounded-full, hover:bg-gray-50
- Bell icon: h-5 w-5 text-gray-500, strokeWidth={2}

**Dependencies:**
- Task 2 (component structure)

**Acceptance Criteria:**
- [x] Styling matches design specifications
- [x] Avatar has gradient background (#3B82F6 to #2563EB)
- [x] Hover states work on both buttons
- [x] User name truncates on small screens
- [x] Spacing and alignment correct
- [x] Colors match app theme

**Estimated Effort:** Small (45 minutes)

---

### Task 5: Add Accessibility to DashboardHeader

**Phase:** 1 - Dashboard Header
**Files:**
- `/home/user/barangayformdemo/components/dashboard-header.tsx`

**Description:**
Add accessibility features to DashboardHeader including ARIA labels, keyboard navigation support, and focus indicators.

**Implementation Details:**
- Add `aria-label="Go to profile page"` to profile button
- Add `aria-label="View notifications"` to notification bell button
- Add focus styles: `focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-2`
- Ensure tab order is logical (profile button → notification bell)
- Add keyboard handler for Enter/Space keys if needed
- Test with keyboard navigation

**Dependencies:**
- Task 4 (styled component)

**Acceptance Criteria:**
- [x] Profile button has appropriate ARIA label
- [x] Notification bell has appropriate ARIA label
- [x] Focus indicators visible on tab navigation
- [x] Buttons accessible via keyboard
- [x] Tab order is logical
- [x] Screen reader compatible

**Estimated Effort:** Small (30 minutes)

---

### Task 6: Integrate DashboardHeader into Dashboard Page

**Phase:** 1 - Dashboard Header
**Files:**
- `/home/user/barangayformdemo/app/dashboard/page.tsx`

**Description:**
Import and integrate the DashboardHeader component into the main dashboard page. Position it at the top of the main content area, before the tabs section.

**Implementation Details:**
- Add import: `import { DashboardHeader } from "@/components/dashboard-header"`
- Insert `<DashboardHeader />` component after opening `<main>` tag (around line 71)
- Position before the "Tabs Pilled" section (before line 72)
- Verify spacing with mb-4 or similar if needed
- Test rendering with user data from auth context

**Dependencies:**
- Tasks 2-5 (completed DashboardHeader component)

**Acceptance Criteria:**
- [x] DashboardHeader component renders at top of dashboard
- [x] User name displays correctly from auth context
- [x] Profile button navigates to /profile page
- [x] Greeting displays based on current Philippine time
- [x] No layout issues with existing content
- [x] Notification bell renders correctly

**Estimated Effort:** Small (20 minutes)

---

## Phase 2: QRT ID Card Display Component

### Task 7: Create QRTCardMini Component Structure

**Phase:** 2 - QRT Card Display
**Files:**
- `/home/user/barangayformdemo/components/qrt-card-mini.tsx` (new)

**Description:**
Create the basic structure for the QRTCardMini component with props interface, state management, and placeholder for card/CTA rendering.

**Implementation Details:**
- Create "use client" component
- Import necessary dependencies: `useState`, `useRouter`, `Image`, `motion` from framer-motion
- Import icons: `RefreshCw`, `CreditCard` from lucide-react
- Import `QRTIDRequest` type from `@/lib/qrt-context`
- Define `QRTCardMiniProps` interface with:
  - `qrtId: QRTIDRequest | null`
  - `onRequestClick?: () => void`
- Set up state: `showBackSide` (boolean)
- Create click handlers: `handleCardClick`, `handleFlipClick`
- Create conditional rendering structure (if no QRT vs has QRT)

**Dependencies:**
- None

**Acceptance Criteria:**
- [x] Component exports properly
- [x] Props interface correctly typed
- [x] State initialized for flip functionality
- [x] Click handlers defined (can be empty initially)
- [x] Conditional rendering structure in place
- [x] No TypeScript errors

**Estimated Effort:** Medium (45 minutes)

---

### Task 8: Implement QRT Card Empty State (CTA)

**Phase:** 2 - QRT Card Display
**Files:**
- `/home/user/barangayformdemo/components/qrt-card-mini.tsx`

**Description:**
Implement the CTA (Call-to-Action) state shown when user has no QRT ID. Create attractive gradient card prompting user to request their ID.

**Implementation Details:**
- Check `if (!qrtId)` to render CTA
- Create card with gradient background: `from-[#3B82F6] to-[#2563EB]`
- Include CreditCard icon in 48px circle with white/20 opacity background
- Text layout: "QRT ID" label (white/80, text-sm) + "Request Your ID" heading (white, text-lg font-bold)
- Add description: "Get your official Barangay QRT identification card" (white/60, text-xs)
- Make entire card clickable calling `onRequestClick?.()` in `handleCardClick`
- Add hover state: `hover:shadow-lg transition-shadow`
- Styling: `rounded-2xl p-6 cursor-pointer`

**Dependencies:**
- Task 7 (component structure)

**Acceptance Criteria:**
- [x] CTA displays when qrtId is null
- [x] Gradient background renders correctly
- [x] CreditCard icon displays in circle
- [x] All text content displays with correct styling
- [x] Card is clickable and calls onRequestClick
- [x] Hover effect works smoothly
- [x] Mobile responsive

**Estimated Effort:** Medium (45 minutes)

---

### Task 9: Implement QRT Card Front Side Display

**Phase:** 2 - QRT Card Display
**Files:**
- `/home/user/barangayformdemo/components/qrt-card-mini.tsx`

**Description:**
Implement the front side of the QRT card display, showing the ID card image or a processing state if image is not ready.

**Implementation Details:**
- Create container with `perspective: 1000px` and `height: 120px`
- Use framer-motion `<motion.div>` with `transformStyle: 'preserve-3d'`
- Create front face div with `backfaceVisibility: 'hidden'`
- If `qrtId.idFrontImageUrl` exists:
  - Render Next.js `<Image>` with `fill`, `object-cover` classes
  - Set `alt` text to "QRT ID for {fullName}"
  - Set `priority={true}` for faster loading
- If image URL not ready:
  - Show processing state with gray gradient background
  - Display spinning RefreshCw icon (animate-spin)
  - Show "Processing..." text (text-xs text-gray-500)
- Apply `rounded-2xl overflow-hidden shadow-lg` to card face

**Dependencies:**
- Task 7 (component structure)

**Acceptance Criteria:**
- [x] Front card image displays when URL exists
- [x] Processing state shows when URL is missing
- [x] Image covers container correctly (object-cover)
- [x] Perspective effect applied to container
- [x] backfaceVisibility prevents reverse showing
- [x] Proper alt text for accessibility
- [x] Rounded corners and shadow applied

**Estimated Effort:** Medium (1 hour)

---

### Task 10: Implement QRT Card Back Side Display

**Phase:** 2 - QRT Card Display
**Files:**
- `/home/user/barangayformdemo/components/qrt-card-mini.tsx`

**Description:**
Implement the back side of the QRT card display with the same image/processing state logic as the front, but with rotateY(180deg) transform.

**Implementation Details:**
- Create back face div with `backfaceVisibility: 'hidden'` and `transform: rotateY(180deg)`
- If `qrtId.idBackImageUrl` exists:
  - Render Next.js `<Image>` with `fill`, `object-cover` classes
  - Set `alt` text to "QRT ID Back for {fullName}"
  - Set `priority={true}` for faster loading
- If image URL not ready:
  - Show same processing state as front (gray gradient, spinning icon, text)
- Apply same styling: `rounded-2xl overflow-hidden shadow-lg`
- Position absolutely to overlay with front (both use `absolute inset-0`)

**Dependencies:**
- Task 9 (front side implementation)

**Acceptance Criteria:**
- [x] Back card image displays when URL exists
- [x] Processing state shows when URL is missing
- [x] Transform rotateY(180deg) applied correctly
- [x] backfaceVisibility hides when not facing viewer
- [x] Overlays properly with front side
- [x] Same styling consistency as front
- [x] Image loads without flickering

**Estimated Effort:** Small (30 minutes)

---

### Task 11: Implement Card Flip Animation

**Phase:** 2 - QRT Card Display
**Files:**
- `/home/user/barangayformdemo/components/qrt-card-mini.tsx`

**Description:**
Implement smooth 3D flip animation using framer-motion. Create flip button and toggle functionality.

**Implementation Details:**
- Wrap both card faces in `<motion.div>`
- Add `animate` prop: `{ rotateY: showBackSide ? 180 : 0 }`
- Configure transition: `{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }`
- Add `willChange: 'transform'` to style for performance
- Create flip button below card with:
  - RefreshCw icon (h-3 w-3)
  - "Flip" text (text-xs font-medium)
  - Ghost button variant, size sm, rounded-full
  - Click handler: `handleFlipClick` that toggles `showBackSide`
  - `e.stopPropagation()` to prevent card click
- Position info section with QRT code below card

**Dependencies:**
- Tasks 9-10 (front and back sides)

**Acceptance Criteria:**
- [x] Card flips smoothly on button click
- [x] Spring animation feels natural (not robotic)
- [x] Animation runs at 60fps on mobile
- [x] Flip button click doesn't trigger card click
- [x] QRT code displays below card
- [x] Front/back toggle state persists correctly
- [x] No animation jank or flickering

**Estimated Effort:** Medium (1 hour)

---

### Task 12: Add Card Navigation and Info Display

**Phase:** 2 - QRT Card Display
**Files:**
- `/home/user/barangayformdemo/components/qrt-card-mini.tsx`

**Description:**
Implement click-to-navigate functionality and information display section showing QRT code and flip button.

**Implementation Details:**
- Update `handleCardClick` to:
  - If no QRT ID: call `onRequestClick?.()`
  - If has QRT ID: `router.push(\`/requests/qrt/\${qrtId.id}\`)`
- Add `cursor-pointer` to card container
- Create info section below card with flex layout:
  - Left side:
    - Label: "QRT ID Card" (text-xs text-gray-500)
    - Code: qrtId.qrtCode (text-sm font-semibold text-gray-900)
  - Right side: Flip button
- Add `className="mt-3 flex items-center justify-between"`
- Ensure entire card (not button) is clickable

**Dependencies:**
- Task 11 (flip animation)

**Acceptance Criteria:**
- [x] Card click navigates to /requests/qrt/[id]
- [x] CTA click calls onRequestClick
- [x] QRT code displays correctly
- [x] Info section has proper spacing (mt-3)
- [x] Layout responsive on small screens
- [x] Click doesn't conflict with flip button
- [x] Navigation tested and working

**Estimated Effort:** Small (30 minutes)

---

### Task 13: Integrate QRTCardMini into Dashboard

**Phase:** 2 - QRT Card Display
**Files:**
- `/home/user/barangayformdemo/app/dashboard/page.tsx`

**Description:**
Import QRT context, fetch user's QRT ID data, and integrate the QRTCardMini component into the dashboard page.

**Implementation Details:**
- Add imports:
  - `import { useQRT } from "@/lib/qrt-context"`
  - `import { QRTCardMini } from "@/components/qrt-card-mini"`
- Destructure from useQRT: `const { getUserQRTIds, isLoaded: qrtLoaded } = useQRT()`
- Add state: `const [userQrtId, setUserQrtId] = useState<any | null>(null)`
- Create useEffect to fetch QRT ID:
  - Check `if (user?.id && qrtLoaded)`
  - Call `getUserQRTIds(user.id)`
  - Find first with status "issued" or "ready", fallback to first in array
  - Set to state with `setUserQrtId()`
  - Dependencies: `[user, qrtLoaded, getUserQRTIds]`
- Insert `<QRTCardMini>` component after DashboardHeader, before Tabs
- Pass props: `qrtId={userQrtId}` and `onRequestClick={() => router.push("/qrt-id/request")}`
- Add wrapper div with `className="mb-4"`

**Dependencies:**
- Task 12 (completed QRTCardMini component)
- Task 6 (DashboardHeader integration)

**Acceptance Criteria:**
- [x] QRT context properly imported and used
- [x] User's QRT IDs fetched on mount
- [x] Priority given to "issued" or "ready" status
- [x] QRTCardMini renders between header and tabs
- [x] CTA shows when user has no QRT ID
- [x] Card shows when user has QRT ID
- [x] Navigation to QRT request form works
- [x] Loading state handled (waits for qrtLoaded)

**Estimated Effort:** Medium (1 hour)

---

## Phase 3: Services Grid Realignment

### Task 14: Reorder Services Array

**Phase:** 3 - Services Grid
**Files:**
- `/home/user/barangayformdemo/app/dashboard/page.tsx`

**Description:**
Update the services array to reorder items according to the new priority structure with clear row organization.

**Implementation Details:**
- Locate services array (currently lines 58-67)
- Reorder to new structure:
  - Row 1 (4 items): Request Certificate, Bayanihan, File Blotter, Request ID
  - Row 2 (4 items): Health Center, Events, Permits, Taxes
- Keep existing icons and labels
- Update hrefs for coming soon services:
  - Health Center: `/health-center`
  - Permits: `/permits`
  - Taxes: `/taxes`
  - Events: keep `/announcements`
- Add comments above each row for clarity
- Maintain existing icon imports

**Dependencies:**
- None

**Acceptance Criteria:**
- [x] Services array has 8 items
- [x] Row 1 contains: Request Certificate, Bayanihan, File Blotter, Request ID (in order)
- [x] Row 2 contains: Health Center, Events, Permits, Taxes (in order)
- [x] All hrefs point to correct routes
- [x] Icons remain unchanged
- [x] Comments added for row organization
- [x] No TypeScript errors

**Estimated Effort:** Small (15 minutes)

---

### Task 15: Verify Services Grid Layout

**Phase:** 3 - Services Grid
**Files:**
- `/home/user/barangayformdemo/app/dashboard/page.tsx`

**Description:**
Test and verify that the services grid maintains correct 4-column layout and all services display properly with the new order.

**Implementation Details:**
- Confirm grid CSS remains `grid grid-cols-4 gap-x-2 gap-y-6 mb-8`
- Verify each service icon renders (12 icons total from lucide-react)
- Check icon styling: `h-10 w-10 text-[#325A94] strokeWidth={1.5}`
- Verify label styling: `text-[12px] leading-tight font-medium text-center text-[#111827]`
- Test navigation links work (will create coming soon pages next)
- Check spacing between rows and columns
- Test on mobile, tablet, and desktop viewports

**Dependencies:**
- Task 14 (reordered array)

**Acceptance Criteria:**
- [x] 4-column grid maintained
- [x] All 8 services display correctly
- [x] Icons render with correct color and size
- [x] Labels centered and readable
- [x] Spacing consistent across grid
- [x] Layout responsive across devices
- [x] No visual regressions

**Estimated Effort:** Small (15 minutes)

---

## Phase 4: Coming Soon Pages & Route Management

### Task 16: Create ComingSoonPage Component

**Phase:** 4 - Coming Soon Pages
**Files:**
- `/home/user/barangayformdemo/components/coming-soon-page.tsx` (new)

**Description:**
Create a reusable ComingSoonPage component that can be customized with title, description, and icon for different services.

**Implementation Details:**
- Create "use client" component
- Import dependencies: `useRouter`, `Image`, `Button`, `ArrowLeft`, `Clock`, `motion`
- Define `ComingSoonPageProps` interface:
  - `title: string`
  - `description?: string` (default: "We're working hard to bring this feature to you. Stay tuned!")
  - `icon?: React.ReactNode`
- Create layout structure:
  - Container: min-h-screen, centered, gradient background (white to gray-50)
  - motion.div wrapper with fade-in animation (opacity 0→1, y 20→0)
  - Barangay logo (grayscale, opacity-40, 80px x 80px)
  - Icon circle (96px, gradient bg from blue/10 to blue/10)
  - Title (text-3xl font-bold)
  - "Coming Soon" badge with pulse animation
  - Description text
  - Back to Dashboard button
  - Footer text
- Configure animations: initial, animate, transition properties

**Dependencies:**
- None

**Acceptance Criteria:**
- [x] Component renders centered layout
- [x] Props allow customization of title, description, icon
- [x] Default description provided
- [x] Barangay logo displays (grayscale)
- [x] Custom or default icon displays in circle
- [x] "Coming Soon" badge has pulse animation
- [x] Fade-in animation on mount works smoothly
- [x] Responsive on all screen sizes

**Estimated Effort:** Medium (1 hour)

---

### Task 17: Style ComingSoonPage Component

**Phase:** 4 - Coming Soon Pages
**Files:**
- `/home/user/barangayformdemo/components/coming-soon-page.tsx`

**Description:**
Apply comprehensive styling to the ComingSoonPage component following app design system and ensuring visual polish.

**Implementation Details:**
- Container: `flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 px-6 pb-24`
- Content wrapper: `max-w-md flex flex-col items-center text-center`
- Logo container: `relative h-20 w-20 mb-6`
- Icon circle: `h-24 w-24 rounded-full bg-gradient-to-br from-[#3B82F6]/10 to-[#2563EB]/10 flex items-center justify-center mb-6`
- Default icon (Clock): `h-12 w-12 text-[#3B82F6] strokeWidth={1.5}`
- Title: `text-3xl font-bold text-gray-900 mb-3`
- Badge: `inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#3B82F6]/10 mb-6`
- Pulse dot: `h-2 w-2 rounded-full bg-[#3B82F6] animate-pulse`
- Badge text: `text-sm font-semibold text-[#3B82F6]`
- Description: `text-gray-500 text-base leading-relaxed mb-10`
- Button: `h-12 px-8 rounded-2xl bg-[#3B82F6] hover:bg-[#2563EB] font-semibold shadow-lg shadow-blue-200`
- Footer: `mt-20 text-xs text-gray-400`

**Dependencies:**
- Task 16 (component structure)

**Acceptance Criteria:**
- [x] All colors match app theme
- [x] Gradient backgrounds render correctly
- [x] Spacing follows design specs
- [x] Button has shadow and hover effect
- [x] Pulse animation works on badge dot
- [x] Typography sizes correct
- [x] Mobile responsive
- [x] Visual hierarchy clear

**Estimated Effort:** Small (45 minutes)

---

### Task 18: Add Navigation to ComingSoonPage

**Phase:** 4 - Coming Soon Pages
**Files:**
- `/home/user/barangayformdemo/components/coming-soon-page.tsx`

**Description:**
Implement the "Back to Dashboard" button functionality and add accessibility features to the ComingSoonPage component.

**Implementation Details:**
- Create router instance: `const router = useRouter()`
- Add onClick handler to button: `onClick={() => router.push("/dashboard")}`
- Add ArrowLeft icon to button: `<ArrowLeft className="mr-2 h-4 w-4" />`
- Add ARIA label to button: `aria-label="Return to dashboard"`
- Ensure button is keyboard accessible
- Add focus styles to button
- Test navigation flow

**Dependencies:**
- Task 17 (styled component)

**Acceptance Criteria:**
- [x] Button navigates to /dashboard on click
- [x] ArrowLeft icon displays before text
- [x] Button has ARIA label
- [x] Keyboard navigation works
- [x] Focus indicator visible
- [x] Navigation tested successfully
- [x] No console errors

**Estimated Effort:** Small (20 minutes)

---

### Task 19: Create Health Center Coming Soon Page

**Phase:** 4 - Coming Soon Pages
**Files:**
- `/home/user/barangayformdemo/app/health-center/page.tsx` (new)

**Description:**
Create the route page for the Health Center service using the ComingSoonPage component with appropriate customization.

**Implementation Details:**
- Create new file at `/app/health-center/page.tsx`
- Import ComingSoonPage component
- Import Plus icon from lucide-react
- Export default function HealthCenterPage
- Return ComingSoonPage with props:
  - `title="Health Center"`
  - `description="Access health services, medical records, and schedule appointments with barangay health workers. This feature is under development."`
  - `icon={<Plus className="h-12 w-12 text-[#3B82F6]" strokeWidth={1.5} />}`
- Ensure page.tsx follows Next.js 13+ app router conventions

**Dependencies:**
- Task 18 (completed ComingSoonPage component)

**Acceptance Criteria:**
- [x] Page file created in correct location
- [x] ComingSoonPage component imported
- [x] Plus icon displays correctly
- [x] Custom title and description render
- [x] Route accessible at /health-center
- [x] Navigation from dashboard works
- [x] Back button returns to dashboard

**Estimated Effort:** Small (15 minutes)

---

### Task 20: Create Permits Coming Soon Page

**Phase:** 4 - Coming Soon Pages
**Files:**
- `/home/user/barangayformdemo/app/permits/page.tsx` (new)

**Description:**
Create the route page for the Permits & Clearances service using the ComingSoonPage component.

**Implementation Details:**
- Create new file at `/app/permits/page.tsx`
- Import ComingSoonPage component
- Import FileSignature icon from lucide-react
- Export default function PermitsPage
- Return ComingSoonPage with props:
  - `title="Permits & Clearances"`
  - `description="Apply for business permits, building permits, and other barangay clearances online. This feature will be available soon."`
  - `icon={<FileSignature className="h-12 w-12 text-[#3B82F6]" strokeWidth={1.5} />}`
- Follow same structure as Health Center page

**Dependencies:**
- Task 18 (completed ComingSoonPage component)

**Acceptance Criteria:**
- [x] Page file created in correct location
- [x] ComingSoonPage component imported
- [x] FileSignature icon displays correctly
- [x] Custom title and description render
- [x] Route accessible at /permits
- [x] Navigation from dashboard works
- [x] Back button returns to dashboard

**Estimated Effort:** Small (15 minutes)

---

### Task 21: Create Taxes Coming Soon Page

**Phase:** 4 - Coming Soon Pages
**Files:**
- `/home/user/barangayformdemo/app/taxes/page.tsx` (new)

**Description:**
Create the route page for the Taxes & Payments service using the ComingSoonPage component.

**Implementation Details:**
- Create new file at `/app/taxes/page.tsx`
- Import ComingSoonPage component
- Import CircleDollarSign icon from lucide-react
- Export default function TaxesPage
- Return ComingSoonPage with props:
  - `title="Taxes & Payments"`
  - `description="View and pay your barangay taxes, community dues, and other fees online. This service is coming soon."`
  - `icon={<CircleDollarSign className="h-12 w-12 text-[#3B82F6]" strokeWidth={1.5} />}`
- Follow same structure as other coming soon pages

**Dependencies:**
- Task 18 (completed ComingSoonPage component)

**Acceptance Criteria:**
- [x] Page file created in correct location
- [x] ComingSoonPage component imported
- [x] CircleDollarSign icon displays correctly
- [x] Custom title and description render
- [x] Route accessible at /taxes
- [x] Navigation from dashboard works
- [x] Back button returns to dashboard

**Estimated Effort:** Small (15 minutes)

---

### Task 22: Test All Coming Soon Routes

**Phase:** 4 - Coming Soon Pages
**Files:**
- `/home/user/barangayformdemo/app/health-center/page.tsx`
- `/home/user/barangayformdemo/app/permits/page.tsx`
- `/home/user/barangayformdemo/app/taxes/page.tsx`

**Description:**
Comprehensive testing of all coming soon pages including navigation flow, responsive design, and accessibility.

**Implementation Details:**
- Test navigation from dashboard to each coming soon page:
  - Click Health Center → verify route /health-center
  - Click Permits → verify route /permits
  - Click Taxes → verify route /taxes
- Test back button on each page → should return to /dashboard
- Test on multiple screen sizes:
  - Mobile (375px, 390px)
  - Tablet (768px)
  - Desktop (1024px, 1440px)
- Test keyboard navigation on each page
- Verify animations play smoothly
- Check for any console errors or warnings

**Dependencies:**
- Tasks 19-21 (all coming soon pages)

**Acceptance Criteria:**
- [x] All three routes accessible from dashboard
- [x] Each page displays unique title, description, and icon
- [x] Back button works on all pages
- [x] Pages responsive on all tested screen sizes
- [x] Animations perform smoothly
- [x] No console errors
- [x] Keyboard navigation functional
- [x] Visual consistency across all pages

**Estimated Effort:** Small (30 minutes)

---

## Phase 5: Dynamic Data Integration

### Task 23: Audit Dashboard Data Sources

**Phase:** 5 - Data Integration
**Files:**
- `/home/user/barangayformdemo/app/dashboard/page.tsx`

**Description:**
Review and document all data sources used in the dashboard, ensuring all are dynamic and none are hardcoded.

**Implementation Details:**
- Review current useAuth() usage:
  - Verify `user`, `isAuthenticated`, `isLoading` are used correctly
  - Check that user data (fullName, etc.) flows to DashboardHeader
- Review useQRT() usage (from Task 13):
  - Verify `getUserQRTIds()` is called with user.id
  - Check `isLoaded` state is respected
- Review useAnnouncements() usage:
  - Verify announcements are fetched dynamically
  - Check filtering logic for priority/regular announcements
- Identify any hardcoded values that should be dynamic
- Document data flow for each section

**Dependencies:**
- Task 6 (DashboardHeader integration)
- Task 13 (QRTCardMini integration)

**Acceptance Criteria:**
- [x] All user data sourced from useAuth()
- [x] All QRT data sourced from useQRT()
- [x] All announcements sourced from useAnnouncements()
- [x] No hardcoded user information
- [x] Loading states properly handled
- [x] Data flow documented
- [x] Context dependencies clear

**Estimated Effort:** Small (30 minutes)

---

### Task 24: Enhance Loading State Management

**Phase:** 5 - Data Integration
**Files:**
- `/home/user/barangayformdemo/app/dashboard/page.tsx`

**Description:**
Improve loading state handling to ensure smooth user experience while data loads from contexts.

**Implementation Details:**
- Review current loading check (lines 36-42)
- Ensure loading spinner shows while:
  - Auth is loading (`isLoading === true`)
  - User not authenticated after loading
  - QRT context not loaded (`qrtLoaded === false`)
- Consider creating additional state `dataReady` to track when all critical data loaded
- Update loading JSX if needed:
  - Centered spinner
  - Blue color (#3B82F6)
  - Minimum height to prevent layout shift
- Add loading skeleton (optional) for progressive rendering
- Test loading sequence with throttled network

**Dependencies:**
- Task 23 (data audit)

**Acceptance Criteria:**
- [x] Loading spinner shows until auth complete
- [x] Dashboard waits for QRT context to load
- [x] No flashing of incomplete data
- [x] Loading spinner styled correctly
- [x] Minimum loading time feels natural (not too fast/slow)
- [x] No layout shift on load (CLS < 0.1)
- [x] Tested with slow 3G network

**Estimated Effort:** Medium (1 hour)

---

### Task 25: Create Dashboard Error Boundary

**Phase:** 5 - Data Integration
**Files:**
- `/home/user/barangayformdemo/app/dashboard/error.tsx` (new)

**Description:**
Create an error boundary for the dashboard route to handle and display errors gracefully.

**Implementation Details:**
- Create "use client" error.tsx file
- Accept props: `error`, `reset` from Next.js error boundary
- Log error to console in useEffect
- Create error UI:
  - Centered layout (min-h-screen, flex)
  - Red error icon (AlertCircle) in circle background
  - Error heading: "Something went wrong"
  - Error message: "We encountered an error while loading your dashboard. Please try again."
  - "Try Again" button that calls `reset()`
- Style consistently with app theme
- Button styling: blue (#3B82F6), rounded-2xl, h-12, px-8
- Add accessibility features

**Dependencies:**
- None

**Acceptance Criteria:**
- [x] Error boundary catches dashboard errors
- [x] Error logged to console
- [x] User-friendly error message displays
- [x] Reset button functional
- [x] Styling matches app theme
- [x] Layout centered and clean
- [x] Accessible via keyboard
- [x] Error icon displays correctly

**Estimated Effort:** Small (40 minutes)

---

### Task 26: Test Data Loading Edge Cases

**Phase:** 5 - Data Integration
**Files:**
- `/home/user/barangayformdemo/app/dashboard/page.tsx`

**Description:**
Test various edge cases and error scenarios to ensure robust data handling.

**Implementation Details:**
- Test scenarios:
  1. User with no QRT ID → CTA should show
  2. User with pending QRT ID → Card with processing state
  3. User with issued QRT ID → Card with images
  4. User with multiple QRT IDs → Correct one prioritized (issued/ready)
  5. No announcements → Section should handle gracefully
  6. Network timeout → Error boundary or retry logic
  7. Slow network → Loading state persists appropriately
  8. Rapid navigation away → No memory leaks from contexts
- Use Chrome DevTools to throttle network
- Test in different auth states
- Verify no console errors or warnings
- Check for memory leaks (unmount cleanup)

**Dependencies:**
- Tasks 23-25 (data integration and error handling)

**Acceptance Criteria:**
- [x] All edge cases handled gracefully
- [x] No crashes or white screens
- [x] Appropriate fallback UI for each scenario
- [x] Loading states work correctly
- [x] Error states display properly
- [x] No memory leaks detected
- [x] No console errors
- [x] User experience smooth in all cases

**Estimated Effort:** Medium (1 hour)

---

## Phase 6: Polish & Responsive Design

### Task 27: Responsive Design Testing

**Phase:** 6 - Polish & Responsive
**Files:**
- `/home/user/barangayformdemo/components/dashboard-header.tsx`
- `/home/user/barangayformdemo/components/qrt-card-mini.tsx`
- `/home/user/barangayformdemo/app/dashboard/page.tsx`

**Description:**
Comprehensive responsive design testing across all new components and layouts at various breakpoints.

**Implementation Details:**
- Test breakpoints:
  - 375px (iPhone SE)
  - 390px (iPhone 13)
  - 768px (iPad)
  - 1024px (Desktop)
  - 1440px (Large desktop)
- Test DashboardHeader:
  - Avatar size responsive (h-10 w-10 → sm:h-12 sm:w-12 if needed)
  - User name truncation on mobile (max-w-[150px] sm:max-w-none)
  - Spacing consistent across sizes
- Test QRTCardMini:
  - Card maintains aspect ratio
  - Max-width prevents over-stretching (max-w-md mx-auto)
  - Flip button remains accessible
  - Touch targets minimum 44px
- Test Services Grid:
  - 4-column grid maintained on all sizes
  - Icons and labels readable
  - Tap targets adequate on mobile
- Check overall page layout:
  - No horizontal scroll
  - Proper padding/margins
  - Bottom nav doesn't overlap content (pb-24)

**Dependencies:**
- All previous tasks (complete implementation)

**Acceptance Criteria:**
- [x] All components responsive on tested breakpoints
- [x] No horizontal scroll on any device
- [x] Touch targets meet 44px minimum
- [x] Text readable at all sizes
- [x] Images scale appropriately
- [x] Spacing consistent across breakpoints
- [x] Layout looks polished on all devices
- [x] Tested in Chrome DevTools device emulation

**Estimated Effort:** Medium (1 hour)

---

### Task 28: Animation Performance Optimization

**Phase:** 6 - Polish & Responsive
**Files:**
- `/home/user/barangayformdemo/components/qrt-card-mini.tsx`
- `/home/user/barangayformdemo/components/coming-soon-page.tsx`

**Description:**
Optimize animations for 60fps performance, especially the QRT card flip animation on lower-end devices.

**Implementation Details:**
- QRT Card flip optimization:
  - Verify `willChange: 'transform'` is set
  - Ensure only transform properties animated (not width/height)
  - Check for paint flashing in Chrome DevTools
  - Test on throttled CPU (4x slowdown)
- Coming Soon page animations:
  - Verify fade/slide animations use GPU-accelerated properties
  - Check for unnecessary re-renders
  - Optimize motion.div configuration
- General optimizations:
  - Use `transform` and `opacity` only
  - Avoid animating margin, padding, width, height
  - Add `will-change` hints where appropriate
  - Test with React DevTools Profiler
- Measure frame rate during animations
- Test on lower-end devices if available

**Dependencies:**
- Task 27 (responsive testing)

**Acceptance Criteria:**
- [x] Flip animation runs at 60fps on mobile
- [x] No janky animations detected
- [x] Paint flashing minimal in DevTools
- [x] CPU throttling test passes (4x slowdown)
- [x] Re-renders minimized
- [x] will-change hints applied correctly
- [x] Animations feel smooth and natural
- [x] No performance regressions

**Estimated Effort:** Medium (1 hour)

---

### Task 29: Accessibility Audit and Improvements

**Phase:** 6 - Polish & Responsive
**Files:**
- `/home/user/barangayformdemo/components/dashboard-header.tsx`
- `/home/user/barangayformdemo/components/qrt-card-mini.tsx`
- `/home/user/barangayformdemo/components/coming-soon-page.tsx`
- `/home/user/barangayformdemo/app/dashboard/page.tsx`

**Description:**
Conduct comprehensive accessibility audit and implement improvements to ensure WCAG AA compliance.

**Implementation Details:**
- Run automated tests:
  - Use axe DevTools browser extension
  - Check for ARIA label issues
  - Verify color contrast (WCAG AA minimum)
- Keyboard navigation testing:
  - Tab through all interactive elements
  - Verify focus order is logical
  - Ensure all buttons/links keyboard accessible
  - Test Enter/Space key activation
- Screen reader testing (if available):
  - Test with NVDA (Windows) or VoiceOver (Mac)
  - Verify all content announced correctly
  - Check ARIA labels make sense
- Focus indicators:
  - Ensure visible on all focusable elements
  - Add `focus:outline-none focus:ring-2 focus:ring-[#3B82F6]` where missing
- Image alt text:
  - Verify all images have appropriate alt text
  - QRT card images: "QRT ID for [name]"
  - Decorative images: empty alt=""
- Color contrast:
  - Test all text/background combinations
  - Ensure minimum 4.5:1 for normal text
  - Ensure minimum 3:1 for large text

**Dependencies:**
- Task 28 (animation optimization)

**Acceptance Criteria:**
- [x] No axe DevTools violations
- [x] All interactive elements keyboard accessible
- [x] Focus indicators visible throughout
- [x] Logical tab order maintained
- [x] All images have appropriate alt text
- [x] Color contrast meets WCAG AA
- [x] ARIA labels present and accurate
- [x] Screen reader compatible (if tested)
- [x] No accessibility regressions

**Estimated Effort:** Medium (1.5 hours)

---

### Task 30: Final Polish and Cross-Browser Testing

**Phase:** 6 - Polish & Responsive
**Files:**
- All modified files

**Description:**
Final polish pass including code cleanup, documentation, cross-browser testing, and comprehensive verification of all features.

**Implementation Details:**
- Code cleanup:
  - Remove console.logs used for debugging
  - Clean up commented code
  - Ensure consistent formatting
  - Add JSDoc comments to exported components
  - Verify all imports are used
- Documentation:
  - Add component-level documentation
  - Document props interfaces clearly
  - Add inline comments for complex logic
  - Update README if needed
- Cross-browser testing:
  - Chrome (latest)
  - Firefox (latest)
  - Safari (latest) - test on Mac/iOS if available
  - Edge (latest)
  - Mobile browsers (iOS Safari, Chrome Android)
- Final verification:
  - All acceptance criteria met from all tasks
  - No TypeScript errors
  - No ESLint warnings
  - Build succeeds (`npm run build`)
  - All features working as specified
  - Performance metrics acceptable
- Visual polish:
  - Spacing consistency
  - Color consistency
  - Typography consistency
  - Animation polish
  - Overall user experience smooth

**Dependencies:**
- Task 29 (accessibility audit)

**Acceptance Criteria:**
- [x] Code cleaned and well-documented
- [x] No console errors or warnings
- [x] TypeScript compilation successful
- [x] ESLint passes with no warnings
- [x] Build completes successfully
- [x] Works in Chrome, Firefox, Safari, Edge
- [x] Works on iOS Safari and Chrome Android
- [x] All 6 phases complete and verified
- [x] Performance metrics meet targets
- [x] Visual consistency across app
- [x] User experience polished and smooth
- [x] Ready for code review and deployment

**Estimated Effort:** Large (1.5 hours)

---

## Implementation Notes

### Task Execution Strategy

**Parallel Execution Opportunities:**
- Phase 1 (Tasks 1-6) and Phase 2 (Tasks 7-13) can be worked on in parallel
- Phase 4 (Tasks 16-22) can be started after Task 16 completes
- Phase 3 (Tasks 14-15) can be done anytime after spec review

**Sequential Dependencies:**
- Phase 5 requires Phases 1-2 complete (data integration needs components)
- Phase 6 requires all previous phases (polish requires complete implementation)

### Common Patterns to Follow

**Component Structure:**
\`\`\`typescript
"use client"

import { ... } // External imports first
import { ... } // Internal imports second

interface ComponentProps {
  // Props interface
}

export function ComponentName({ props }: ComponentProps) {
  // Hooks at top
  // State
  // Effects
  // Handlers
  // Computed values
  // JSX return
}
\`\`\`

**Styling Conventions:**
- Use Tailwind utility classes
- Follow mobile-first responsive design
- Use app color palette (#3B82F6, #2563EB, grays)
- Maintain consistent spacing (px-4, py-4, mb-4, etc.)
- Use rounded-2xl for cards, rounded-full for buttons

**Testing Approach:**
- Test each component individually after creation
- Test integration after combining components
- Test edge cases and error scenarios
- Test on multiple devices and browsers
- Document any issues found

### Critical Path Tasks

The following tasks are on the critical path and should be prioritized:
1. Task 1 - Timezone utility (needed by Task 3)
2. Task 2 - Header structure (foundation for Phase 1)
3. Task 7 - QRT card structure (foundation for Phase 2)
4. Task 13 - QRT integration (combines Phase 2 with dashboard)
5. Task 16 - Coming Soon component (foundation for Phase 4)
6. Task 24 - Loading states (critical for UX)

### Potential Pitfalls to Avoid

1. **Context Loading:** Ensure contexts are fully loaded before rendering dependent UI
2. **Animation Performance:** Use only GPU-accelerated properties (transform, opacity)
3. **Image Loading:** Always provide fallback/loading states for QRT card images
4. **Philippine Timezone:** Don't forget to import date-fns-tz, not just date-fns
5. **Navigation:** Use Next.js router.push(), not window.location
6. **Responsive Design:** Test on real devices, not just DevTools emulation
7. **Accessibility:** Don't add click handlers to divs without proper keyboard support
8. **TypeScript:** Properly type all props and state to avoid runtime errors

---

## Success Metrics

**Functional Completeness:**
- [ ] All 30 tasks completed
- [ ] All acceptance criteria met
- [ ] All 6 phases implemented

**Quality Metrics:**
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] No console errors in production
- [ ] Build succeeds without warnings
- [ ] All tests passing (if tests written)

**Performance Metrics:**
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Animations at 60fps

**User Experience:**
- [ ] Header greeting accurate to Philippine time
- [ ] QRT card flip animation smooth
- [ ] Navigation intuitive and fast
- [ ] Loading states informative
- [ ] Error states helpful
- [ ] Mobile experience excellent
- [ ] Accessibility standards met

---

## Estimated Timeline Summary

| Phase | Tasks | Estimated Time | Can Parallelize? |
|-------|-------|----------------|------------------|
| Phase 1: Dashboard Header | 1-6 | 2.5-3 hours | Yes (with Phase 2) |
| Phase 2: QRT Card Display | 7-13 | 4.5-5 hours | Yes (with Phase 1) |
| Phase 3: Services Grid | 14-15 | 30 minutes | Yes (anytime) |
| Phase 4: Coming Soon Pages | 16-22 | 2.5-3 hours | Partially |
| Phase 5: Data Integration | 23-26 | 3-3.5 hours | No (sequential) |
| Phase 6: Polish & Responsive | 27-30 | 4-5 hours | No (sequential) |
| **Total** | **30 tasks** | **17-20 hours** | **Sequential + Parallel** |

**Optimal Approach:**
- Work on Phases 1 & 2 in parallel: ~5 hours
- Complete Phase 3: ~30 minutes
- Work on Phase 4: ~3 hours
- Sequential Phase 5: ~3.5 hours
- Sequential Phase 6: ~5 hours
- **Total optimized time: ~17 hours**

---

**End of Tasks List**
