# Dashboard Header with QRT Integration

## Overview
Enhance the dashboard with a personalized header (user profile, dynamic greeting, notifications), integrate a compact QRT ID card display, realign services grid, implement coming soon pages, and add dynamic data integration.

## Phases

### Phase 1: Dashboard Header with User Profile & Notification
Add header section with:
- Profile avatar (circular, question mark icon placeholder, clickable → redirects to /profile)
- Dynamic greeting (time-based using Philippine timezone: "Good Morning/Afternoon/Evening, [User's Name]")
- Notification bell (aesthetic only, right-aligned)
- Use lucide-react icons: UserCircle2 for placeholder, Bell for notifications
- Styling: Match app's blue theme (#3B82F6), clean spacing, no borders

### Phase 2: QRT ID Card Display Component
Create compact QRT ID card preview component (reuse logic from id-card-preview.tsx)

Features:
- Display user's QRT ID card (front view by default)
- Flip functionality (tap to flip, show QR code on back)
- Clickable → Navigate to full QRT ID details page (/requests/qrt/[id])
- Responsive sizing (~120px height, maintains aspect ratio)
- Smooth animations using framer-motion
- Handle edge case: If user has no QRT ID, show "Request QRT ID" CTA

### Phase 3: Services Grid Realignment
Reorder services array to position:
- Row 1: Request Certificate, Bayanihan, File Blotter, Request ID (aligned)
- Row 2: Health Center, Events, Permits, Taxes
- Maintain existing icon styling and 4-column grid layout

### Phase 4: Coming Soon Pages & Route Management
Create reusable ComingSoonPage component:
- Clean, centered design
- App-consistent colors (blue accent: #3B82F6)
- Simple message: "Coming Soon" + brief description
- "Back to Dashboard" button
- Optional: Subtle icon/illustration

Apply to services:
- Health Center → /health-center (coming soon)
- Events → Keep /announcements but add overlay/interception
- Permits → /permits (coming soon)
- Taxes → /taxes (coming soon)

Temporarily disconnect existing routes:
- Add route guards/overlays for Bayanihan, File Blotter, Events
- Use feature flag pattern for easy reconnection later
- Comment clearly: // TODO: Reconnect after refinement

### Phase 5: Dynamic Data Integration
- Fetch user data from useAuth() context
- Implement Philippine timezone logic using date-fns with date-fns-tz
- Fetch user's QRT ID from useQRT() context
- Handle loading states gracefully
- Add error boundaries for missing data

### Phase 6: Polish & Responsive Design
- Ensure header is responsive (mobile-first)
- Test QRT card flip animation on various devices
- Verify spacing consistency across sections
- Add subtle transitions for smooth UX
- Accessibility: ARIA labels, keyboard navigation

## Design Decisions

### Color Palette (from existing app)
- Primary Blue: #3B82F6
- Success Green: #10B981
- Gray Scale: #111827, #4B5563, #9CA3AF, #E5E7EB

### Typography
- Greeting: text-sm text-gray-500 (subtle)
- User Name: text-base font-semibold text-gray-900 (prominent)
- Consistent with Inter font family

### Spacing
- Header: py-4 px-4 (16px vertical, 16px horizontal)
- QRT Card: mb-4 (16px bottom margin)
- Tabs: mb-6 (24px bottom margin)

## Technical Approach

### Libraries to use
- lucide-react for icons (already in use)
- framer-motion for animations (already in use)
- date-fns + date-fns-tz for timezone handling (already in use)
- next/navigation for routing
- Existing context APIs: useAuth, useQRT

### File Structure
- app/dashboard/page.tsx - Main dashboard updates
- components/dashboard-header.tsx - New header component
- components/qrt-card-mini.tsx - Compact QRT card component
- app/coming-soon/page.tsx - Reusable coming soon page
- app/(coming-soon-routes)/ - New routes for coming soon services

## Success Criteria
- ✅ Header displays user avatar (placeholder), greeting, and notification bell
- ✅ Greeting is time-based using Philippine timezone
- ✅ QRT ID card is displayed and flippable
- ✅ Request ID icon is aligned with Request Certificate
- ✅ Coming soon pages are implemented for specified services
- ✅ Existing routes (Bayanihan, Blotter, Events) are temporarily disconnected but easily reconnectable
- ✅ All user data is dynamic (no hardcoded values)
- ✅ Design is consistent with app's existing style
- ✅ Responsive and accessible

## Implementation Notes
You will execute the plan above using haiku as code changes and research agent, sonnet will be the main planning agent.
