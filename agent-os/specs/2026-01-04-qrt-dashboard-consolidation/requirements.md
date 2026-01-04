# QRT ID Dashboard Consolidation

## Objective
Centralize the QRT ID section within the requests section for easier document navigation and improved user experience.

## Description
This specification outlines the consolidation of the QRT ID Dashboard, bringing the QRT ID management section into a centralized location within the main requests interface. This enhancement aims to streamline user workflows by reducing navigation complexity and making QRT ID operations more accessible and intuitive.

## Key Goals
- Consolidate QRT ID management into the requests section
- Improve document navigation and discoverability
- Enhance user experience through streamlined workflows
- Maintain data integrity and functionality during consolidation

---

## Current State Analysis

### QRT ID Section Location & Structure
**Current Path:** `/qrt-id` (separate section)
- **Page:** `/app/qrt-id/page.tsx` - Lists all QRT IDs with filtering (all/processing/ready)
- **Request Page:** `/app/qrt-id/request/page.tsx` - Multi-step form for requesting new QRT ID (3 steps: personal details, emergency contact, review)
- **Detail Page:** `/app/qrt-id/[id]/page.tsx` - Shows individual QRT ID details
- **Context:** `lib/qrt-context.tsx` - Manages QRT ID data, verification, and state
- **Status Badge:** `components/qrt-status-badge.tsx` - Visual status indicator
- **Color Scheme:** Green (#10B981) accent color

### Requests Section Location & Structure
**Current Path:** `/requests`
- **Page:** `/app/requests/page.tsx` - Unified view combining certificates and bayanihan requests
- **Filtering:** Same pattern (all/processing/ready with "Completed" label)
- **Data Sources:**
  - Certificates from `lib/certificate-context`
  - Bayanihan requests from `lib/bayanihan-context`
  - Combined and sorted by creation date
- **Color Scheme:** Green (#00C73C) accent color (slightly different)
- **Request Types Displayed:**
  - Certificates (with FileText icon)
  - Bayanihan assistance (with HandHeart icon)

### Navigation Flow
**Current Navigation Paths:**
1. Dashboard (`/dashboard`) - Main hub with service grid tabs
   - Tab: "Services" (active by default) - Shows 8 service icons including "Request ID" linking to `/qrt-id/request`
   - Tab: "Requests" - Navigates to `/requests`
   - Tab: "Payments" - Navigates to `/payment/history`
2. QRT ID Section - Separate navigation path (accessible via service icon on dashboard)
   - My QRT IDs (`/qrt-id`)
   - Request New QRT ID (`/qrt-id/request`)
   - View QRT ID Detail (`/qrt-id/[id]`)
3. Requests Section - Separate view (accessible via tab on dashboard)
   - My Requests (`/requests`)
   - View Certificate Detail (`/certificate/[id]`)
   - View Bayanihan Request (links to `/bayanihan`)
4. Bottom Navigation - Consistent across all pages
   - Home, Services, Requests, News, Profile
   - Does NOT have dedicated QRT ID navigation

### Related Components
- **UI Components:** Card, Button, Label, Input, Select, Textarea
- **Icons:** CreditCard, FileText, ChevronRight, ArrowLeft, etc. (from lucide-react)
- **Animations:** Framer Motion (slideUp animation in request page)
- **State Management:** React Context API
- **Database:** Supabase (qrt_ids table, qrt_verification_logs table)

---

## Proposed Changes

### 1. Consolidation Strategy
**Option A: Add QRT IDs as a Third Content Type in Requests Page**
- Modify `/app/requests/page.tsx` to include QRT IDs alongside certificates and bayanihan
- Combine three data sources (certificates, bayanihan, QRT IDs) into a single filtered view
- Maintain existing filter structure (all/processing/ready)
- Use same card layout pattern with appropriate icons and status badges

**Option B: Tab-Based Navigation within Requests**
- Add tabs within `/app/requests/page.tsx` for "All Requests", "Certificates", "Bayanihan", "QRT IDs"
- Allow users to filter by document type
- Maintain consolidated access while providing granular views

**Option C: Smart Aggregation with Request Type Toggle**
- Single combined list with visual indicators for document type
- Filter across all document types simultaneously
- Show "Request New" buttons for each type in empty state

### 2. Navigation Updates
- **Dashboard Service Grid:** Keep "Request ID" icon but update to go to consolidated view or show all request options
- **Bottom Navigation:** No changes needed (already routes to `/requests`)
- **Request Detail Pages:** May need to support QRT IDs directly from requests section
- **Service Entry Points:**
  - "Request Certificate" → `/request`
  - "Request ID" → `/requests` (consolidated) or dedicated entry
  - "Bayanihan" → `/requests` (consolidated)

### 3. Data Integration
- **Unified List Structure:** Combine QRT IDs with certificates and bayanihan requests
  ```typescript
  type CombinedRequest =
    | { type: 'certificate', data: Certificate }
    | { type: 'bayanihan', data: BayanihanRequest }
    | { type: 'qrt', data: QRTIDRequest }
  ```
- **Sorting:** By creation date (existing pattern)
- **Filtering:** Maintain current status-based filters
- **Status Mapping:**
  - QRT: pending/processing/ready/issued → Processing/Ready groups
  - Certificate: processing/ready → Processing/Ready groups
  - Bayanihan: pending/in_progress/resolved/rejected → Processing/Completed groups

### 4. UI/UX Considerations
- **Icon Distinction:** QRT IDs use CreditCard icon (green #10B981)
- **Status Badge Alignment:** Ensure color consistency between QRT and other request types
- **Empty States:** Provide actionable buttons for creating each request type
- **Request Creation:** Clarify entry points for new requests (keep service grid or add buttons in consolidated view)

---

## Files That Need Modification

### Primary Files
1. **`/app/requests/page.tsx`**
   - Import QRT context and types
   - Add QRT IDs to combined requests array
   - Update filter logic to include QRT statuses
   - Add QRT ID cards to the rendered list
   - Update empty state with QRT ID action

2. **`/lib/qrt-context.tsx`**
   - No changes required (provides all necessary data)

3. **`/app/qrt-id/page.tsx`**
   - Option A: Convert to redirect to `/requests?filter=qrt` or remove
   - Option B: Keep as backup or detail view

4. **`/app/qrt-id/request/page.tsx`**
   - No structural changes; still used for request creation
   - Update back navigation to potentially return to requests

5. **`/components/bottom-nav.tsx`**
   - Possibly no changes needed (already routes to `/requests`)
   - Verify navigation logic works with consolidated view

### Secondary Files
6. **`/app/dashboard/page.tsx`**
   - Optional: Update service grid to clarify "Request ID" entry point
   - Consider restructuring if all requests go through consolidated view

7. **`/components/qrt-status-badge.tsx`**
   - May need export adjustment if used in requests page
   - Color consistency check with certificate/bayanihan badges

### Testing & Documentation
8. **Navigation tests** - Verify all entry points work
9. **Filter tests** - Ensure QRT ID filtering works with new combined list
10. **Integration tests** - Test data loading from both contexts

---

## Technical Considerations

### Data Fetching
- QRT IDs load from `useQRT()` context
- Certificates load from `useCertificates()` context
- Bayanihan requests load from `useBayanihan()` context
- All three contexts must be available in requests page

### State Management
- Current implementation uses React Context for each domain
- Consider whether consolidated view needs a new context or wrapper
- Must handle loading states for all three data sources

### Routing & Navigation
- Current QRT ID detail page: `/qrt-id/[id]` - May need mapping from requests
- Bayanihan detail: Links to `/bayanihan` (not detail page)
- Certificate detail: `/certificate/[id]`
- Decision: Should QRT ID detail remain at `/qrt-id/[id]` or move?

### Style Consistency
- QRT ID uses green (#10B981) - matches most request elements
- Certificate uses green (#00C73C) - slightly different shade
- Need to decide on single color scheme or maintain distinction

### Backward Compatibility
- Users may have bookmarks/shortcuts to `/qrt-id`
- Consider redirect strategy for old QRT ID section
- Analytics tracking for navigation changes

---

## Implementation Priority

### Phase 1: Core Consolidation
- Modify `/app/requests/page.tsx` to include QRT IDs
- Test combined list functionality
- Verify all three data sources load correctly

### Phase 2: Navigation Updates
- Update dashboard service grid
- Test entry points from all sources
- Update back navigation from request forms

### Phase 3: Refinement
- Polish UI/UX for new consolidated view
- Add micro-interactions for type switching
- Optimize performance for large request lists

### Phase 4: Cleanup (Optional)
- Decide fate of `/qrt-id` section
- Remove or redirect old QRT ID pages
- Update any internal links

---

## Questions for User Review

See clarifying questions section below.

---

**Created:** 2026-01-04
**Status:** Pending Research Completion
**Last Updated:** 2026-01-04
