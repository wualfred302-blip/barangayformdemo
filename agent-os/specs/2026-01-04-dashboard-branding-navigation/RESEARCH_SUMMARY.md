# Research Summary: Dashboard Branding & Navigation Cleanup

## Research Completion Date
January 4, 2026

## Task Status
✓ Codebase Research Complete
✓ Requirements Documentation Complete
✓ Clarifying Questions Generated (7 questions)
✓ Ready for User Input

---

## What Was Researched

### 1. Branding Elements Location
- **Dashboard Header** (`/app/dashboard/page.tsx`, lines 72-85)
  - Sticky header with logo image and "Barangay Mawaque" text
  - "Digital Services" subtitle
  - Appears on all dashboard views

- **Report Footer** (`/app/staff/reports/page.tsx`, line 277)
  - Hardcoded "Barangay Mawaque Digital Services" in PDF footer

- **Other References** (25 files contain "Barangay Mawaque")
  - Login/register pages (intentional branding, not modified)
  - Staff portal pages (secondary priority)
  - QRT ID generation, certificate generation
  - Context and utility files

### 2. Bottom Navigation Component
- **File**: `/components/bottom-nav.tsx`
- **Current Items** (5 total):
  1. Home → `/dashboard`
  2. Services → `/dashboard` (REDUNDANT)
  3. Requests → `/requests`
  4. News → `/announcements`
  5. Profile → `/profile`

- **Issue**: Services and Requests buttons create redundancy and user confusion

### 3. Dashboard Layout & Flow
- **Dashboard Tabs** (3 tabs):
  1. Services (default) - Shows 8 service cards
  2. Requests - Navigates to `/requests` page
  3. Payments - Navigates to `/payment/history`

- **User Can Access Requests Via**:
  1. Dashboard "Requests" tab
  2. Bottom nav "Requests" button
  3. Direct `/requests` URL

### 4. Architecture Details

**Page Structure**:
- Root pages: `/app/page.tsx` (landing)
- Dashboard: `/app/dashboard/page.tsx`
- Requests: `/app/requests/page.tsx`
- Announcements: `/app/announcements/page.tsx`
- Profile: `/app/profile/page.tsx`

**Component Hierarchy**:
- BottomNav is used in dashboard and requests pages
- Header is dashboard-specific

**Next.js Setup**:
- App Router (modern)
- Responsive mobile-first design
- Tailwind CSS for styling
- TypeScript

---

## Key Findings

### Finding #1: Branding Redundancy
**Issue**: "Barangay Mawaque" appears prominently in a dashboard header that can't be customized per barangay deployment.

**Impact**: Cannot deploy this app to multiple barangays without code changes.

**Resolution**: Remove hardcoded text, make generic or configurable.

---

### Finding #2: Navigation Redundancy
**Issue**: Both "Home" and "Services" buttons point to the same `/dashboard` route.

**Impact**: Confusing UX, wastes bottom nav space, creates inconsistent active states.

**Resolution**: Remove one button, simplify navigation.

---

### Finding #3: Requests Access Duplication
**Issue**: Users can access requests through:
- Dashboard "Requests" tab (user-facing feature)
- Bottom nav "Requests" button (redundant)

**Impact**: As per user's note, "bottom nav buttons are extra/unnecessary"

**Resolution**: Remove bottom nav button, keep dashboard tab as primary access.

---

### Finding #4: Dashboard Header Frequency
**Issue**: Header displays on EVERY dashboard view (sticky positioning).

**Impact**: High-frequency exposure of location-specific branding.

**Resolution**: Highest priority for cleanup.

---

## Proposed Implementation Scope

### Phase 1: Core Changes
1. **Remove dashboard header branding** (highest impact)
2. **Simplify bottom navigation** (3 items instead of 5)
3. **Update report footer** (consistency)

### Phase 2: Future Considerations
1. Make branding configurable for multi-barangay deployments
2. Support environment variables for logo/name
3. Consider database configuration for large-scale deployments

---

## Impact Assessment

### What Changes
- Dashboard header appearance
- Bottom navigation layout (fewer items)
- Report PDF footer text

### What Stays the Same
- Dashboard tabs (Services/Requests/Payments)
- Requests page functionality (still accessible via dashboard tab)
- Profile page
- Announcements page
- All backend functionality

### User Flow Impact
- **Services Access**: Unchanged (Home button → dashboard shows services)
- **Requests Access**: Changed (dashboard tab instead of bottom nav button)
- **Profile/News**: Unchanged

### Breaking Changes
- Users with bookmarks to bottom nav "Requests" button: Still works (page exists)
- Users expecting "Services" button: Can find services on Home/dashboard

---

## Files Requiring Modification

| File | Lines | Type | Priority |
|------|-------|------|----------|
| `/app/dashboard/page.tsx` | 72-85 | Remove/Replace | HIGH |
| `/components/bottom-nav.tsx` | 8-14 | Remove | HIGH |
| `/app/staff/reports/page.tsx` | 277 | Replace | MEDIUM |

---

## Questions Requiring User Input

**7 Clarifying Questions** have been documented in `clarifying-questions.md`:

1. **Header replacement strategy** (most important)
   - Remove entirely? Keep logo only? Replace with generic text?

2. **Home button behavior**
   - Any special functionality or just navigate to dashboard?

3. **Requests access pattern confirmation**
   - Dashboard tab only, or keep multiple access points?

4. **Report branding** (staff portal)
   - Generic text, configurable, or remove entirely?

5. **Logo file handling**
   - Remove, replace with neutral logo, or make configurable?

6. **Multi-barangay architecture**
   - Build in configuration support now, or do later?

7. **Navigation confirmation**
   - Confirm removal of Services and Requests buttons?

---

## Recommended Next Steps

1. **User answers clarifying questions** (via orchestrator)
2. **Refine specification** based on answers
3. **Implementation phase** (modify 3 core files)
4. **Testing** (responsive design, navigation links, active states)
5. **Deployment** (build and verify)

---

## Research Artifacts

Location: `/home/user/barangayformdemo/agent-os/specs/2026-01-04-dashboard-branding-navigation/`

- ✓ `requirements.md` - Comprehensive requirements with technical analysis
- ✓ `clarifying-questions.md` - 7 prioritized questions for user
- ✓ `RESEARCH_SUMMARY.md` - This document
- ✓ `/assets/` - Folder for diagrams/mockups (if needed)

---

## Statistics

- **Files Analyzed**: 50+ files
- **Branding References Found**: 26 files
- **Primary Files to Modify**: 3 files
- **Total Lines to Change**: ~25 lines
- **Estimated Implementation Time**: 30-45 minutes
- **Estimated Testing Time**: 20-30 minutes

---

## Context for Orchestration

This research phase is complete and ready for orchestrator to:
1. Present clarifying questions to user
2. Collect user answers
3. Update requirements.md with decisions
4. Pass to implementation phase
