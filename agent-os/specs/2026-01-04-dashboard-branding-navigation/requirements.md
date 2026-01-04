# Dashboard Branding & Navigation Cleanup

## Overview

Transform the dashboard from a barangay-specific interface to a nationwide-ready application by removing location-based branding and simplifying navigation patterns. This ensures the application is suitable for deployment across multiple barangays without local customization.

## Current State Analysis

### Branding Elements to Remove

**1. Dashboard Header (dashboard/page.tsx, lines 72-85)**
- Location: Sticky header at top of dashboard
- Contains:
  - Barangay Mawaque logo (`/images/logo.png`)
  - Text "Barangay Mawaque" (line 78)
  - Subtitle "Digital Services" (line 79)
- Impact: Appears on all dashboard views and is the first element users see

**2. Reports Document Footer (staff/reports/page.tsx, line 277)**
- Contains hardcoded "Barangay Mawaque Digital Services" text
- Used in PDF/document generation for reports

### Current Bottom Navigation Structure

**Location**: `components/bottom-nav.tsx`

**Current Navigation Items** (5 items):
1. Home → `/dashboard` (Home icon)
2. Services → `/dashboard` (LayoutDashboard icon) - REMOVE
3. Requests → `/requests` (ClipboardList icon) - REMOVE
4. News → `/announcements` (Megaphone icon)
5. Profile → `/profile` (User icon)

**Issue**: Both "Home" and "Services" point to `/dashboard`, creating redundancy. "Requests" button is unnecessary since requests are accessible via the Services tab on the dashboard itself.

### Dashboard Content Redundancy

**Dashboard Tabs** (dashboard/page.tsx, lines 91-111):
- Services tab (default view) - shows 8 service tiles
- Requests tab - navigates to `/requests` page
- Payments tab - navigates to `/payment/history`

**Analysis**: The dashboard already provides quick access to requests via the tab system, making a separate bottom nav button redundant.

### Related Branding References

**Other Mawaque References** (lower priority, context only):
- `/lib/residents-context.tsx`
- `/lib/qrt-id-generator-canvas.ts` (QRT card generation)
- Various staff pages (captain, secretary, treasurer, blotters)
- Login/register pages (should remain for branding continuity)

## Proposed Changes

### 1. Remove Dashboard Header Branding
**File**: `app/dashboard/page.tsx` (lines 72-85)
**Change**: Replace the hardcoded "Barangay Mawaque" header with a generic/neutral header
**Options**:
- Option A: Remove header entirely, adjust layout spacing
- Option B: Keep logo only (neutral branding)
- Option C: Replace with generic "Digital Services" or app name

### 2. Update Bottom Navigation
**File**: `components/bottom-nav.tsx`
**Changes**:
- Remove "Services" button (line 10)
- Remove "Requests" button (line 11)
- Simplify navItems array to 3 items:
  1. Home → `/dashboard`
  2. News → `/announcements`
  3. Profile → `/profile`

**Navigation Flow Impact**:
- Users access services via Home/dashboard
- Requests visible on dashboard via tabs
- Maintains news and profile sections

### 3. Remove Report Document Footer Branding
**File**: `app/staff/reports/page.tsx` (line 277)
**Change**: Replace hardcoded barangay reference with generic text or config-based value

## Files Requiring Modification

| File Path | Lines | Change Type | Description |
|-----------|-------|-------------|-------------|
| `app/dashboard/page.tsx` | 72-85 | Remove/Replace | Dashboard header with branding |
| `components/bottom-nav.tsx` | 8-14 | Remove | Two nav items (Services, Requests) |
| `app/staff/reports/page.tsx` | 277 | Replace | Hardcoded branding in PDF footer |

## Technical Considerations

### 1. Header Replacement Options
- **Option A (Minimal)**: Just remove logo/title section, reduce header height from 60px
- **Option B (Neutral)**: Keep header with app logo only, remove text
- **Option C (Branded)**: Replace with generic "Linkod App" or neutral branding
- **Recommendation**: Clarify with user (see Questions section)

### 2. Navigation Active State Logic
- Current bottom nav has special logic for "Services" and "Home" (lines 23-26 in bottom-nav.tsx)
- After removal, active state logic should simplify
- Current logic: Both Home and Services navigate to `/dashboard`, but only Home is marked active on the dashboard
- Verify: Navigation highlight logic works correctly after cleanup

### 3. Responsive Design
- Dashboard header currently uses flex layout with gap-2 (line 73)
- Header is sticky, appears on all dashboard views
- Ensure removal doesn't break responsive behavior on mobile/tablet

### 4. User Flow Impact
- Users with bookmarks to `/requests` will still work (page exists independently)
- Users expecting "Requests" in bottom nav will need to access via dashboard tabs
- Accessibility: Ensure keyboard navigation still works with simplified nav

## Dependent Features

**Services Tab Navigation** (dashboard/page.tsx, lines 49-57):
- Requests tab clicks navigate to `/requests` page
- This functionality remains intact and unaffected
- Users can still access requests from dashboard

**Reports Generation** (staff/reports/page.tsx):
- Currently includes Mawaque branding in PDF footer
- Should be updated for consistency
- May need config-based approach for multi-barangay support

## Testing Checklist

- [ ] Header removal/replacement displays correctly on all screen sizes
- [ ] Bottom navigation shows 3 items with correct icons and labels
- [ ] Active state highlighting works correctly for remaining nav items
- [ ] Navigation links all work (/dashboard, /announcements, /profile)
- [ ] Dashboard Services/Requests/Payments tabs still function
- [ ] Requests page still accessible via dashboard tab
- [ ] PDF reports generate without hardcoded branding
- [ ] No broken links or 404 errors
- [ ] Responsive design intact on mobile (375px) and tablet (768px) widths
