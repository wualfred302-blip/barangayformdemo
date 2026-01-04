# QRT ID Card Redesign - Research & Requirements

**Date**: January 4, 2026
**Status**: Research Phase - Spec Shaping
**Spec Folder**: `agent-os/specs/2026-01-04-qrt-card-redesign/`

---

## Executive Summary

This document outlines the research findings for the QRT ID Card redesign project. The goal is to enhance the current QRT ID card by adding precinct identification, Mawaque app branding, and official government branding (Bagong Pilipinas logo). The design should integrate with the staff dashboard for precinct-based management and filtering.

---

## Current State Analysis

### 1. Card Generation Architecture

#### Location
- **Main Component**: `/home/user/barangayformdemo/components/id-card-preview.tsx`
- **Canvas Generator**: `/home/user/barangayformdemo/lib/qrt-id-generator-canvas.ts`
- **Display/Detail Page**: `/home/user/barangayformdemo/app/qrt-id/[id]/page.tsx`

#### Current Card Structure
The QRT ID card is generated using HTML5 Canvas (856px × 540px landscape format):

**Front Side**:
- Green header bar (emerald-600 to emerald-500 gradient)
- Bagong Pilipinas logo at top center (45×40px)
- Header text: "REPUBBLICA NG PILIPINAS" and "BARANGAY MAWAQUE"
- Photo placeholder (180×220px, left side with emerald border)
- Personal information section (name, DOB, gender, civil status, birthplace, address)
- Vertical QRT code on left edge (rotated text)
- Verification code box (emerald gradient, 180×60px)
- Footer bar (dark gray) with issue date and disclaimers

**Back Side**:
- Red header bar (red-600 to red-700 gradient)
- "EMERGENCY CONTACT INFORMATION" header
- Emergency contact details (name, relationship, phone, address)
- QR code section (260×260px white box with border)
- Important notices section (dark background with yellow/light gray text)

#### Current Canvas Drawing Functions
- `roundRect()`: Helper for drawing rounded rectangles
- `loadImage()`: Loads images asynchronously (with CORS support)
- `generateQRTIDImages()`: Main function that creates front and back images
- `downloadImage()`: Downloads images as PNG files

### 2. Data Model

#### QRT ID Request Interface
Located in `/home/user/barangayformdemo/lib/qrt-types.ts` and `/home/user/barangayformdemo/lib/qrt-context.tsx`

**Current Fields** (relevant to card):
```typescript
- qrtCode: string
- verificationCode: string
- fullName: string
- birthDate: string
- address: string
- gender: string
- civilStatus: string
- birthPlace: string
- photoUrl: string
- idFrontImageUrl?: string
- idBackImageUrl?: string
- qrCodeData: string
- status: "pending" | "processing" | "ready" | "issued"
- issuedDate?: string
- expiryDate?: string
```

**Missing Field**: No `precinctNumber` or precinct-related field currently exists in the data model.

### 3. Staff Dashboard

#### Location
- **Staff QRT Management**: `/home/user/barangayformdemo/app/staff/qrt-management/page.tsx`

#### Current Features
- List and Kanban views for QRT ID requests
- Filtering by status (pending, processing, ready, issued)
- Filtering by request type (regular, rush)
- Search functionality (by QRT code, name, address)
- Status update buttons (Approve, Generate, Issue)
- Mock data (3 sample requests)

#### Current Limitations
- **NO precinct filtering or classification**
- **NO precinct data in mock data**
- Limited to status and type filtering
- No precinct column in list view
- No precinct-based sorting

### 4. Available Logo Assets

Located in `/home/user/barangayformdemo/public/images/`:
- ✓ `bagongpilipinas-logo-main.png` (544KB) - Already used in card header
- ✓ `linkod-app-logo-main.png` (722KB) - Possible Mawaque app logo
- ✓ `mawaque-logo.png` (1.08MB) - Barangay Mawaque logo
- ✓ `mawaque-20logo.jpeg` (475KB) - Alternative Mawaque logo
- ✓ `logo.png` (722KB) - General logo

---

## Proposed Changes

### Phase 1: Data Model Enhancement

**Files to Modify**:
1. `/home/user/barangayformdemo/lib/qrt-types.ts`
   - Add `precinctNumber: string` field to `QRTIDRequest` interface

2. `/home/user/barangayformdemo/lib/qrt-context.tsx`
   - Update `dbRowToQRTIDRequest()` to map precinct data from database row
   - Add precinct field to context type definition

### Phase 2: Canvas Generator Updates

**File to Modify**:
- `/home/user/barangayformdemo/lib/qrt-id-generator-canvas.ts`

**Changes**:
1. Add Mawaque app logo placement on top LEFT of card (currently empty space)
2. Adjust Bagong Pilipinas logo to top MIDDLE positioning
3. Add precinct number display on BOTTOM LEFT of card
4. Update `QRTIDData` interface to include `precinctNumber: string`
5. Ensure logo and precinct placement persists during card generation

### Phase 3: Component Updates

**Files to Modify**:
1. `/home/user/barangayformdemo/components/id-card-preview.tsx`
   - Update to receive and display precinct number
   - May need minimal changes if only passing props

2. `/home/user/barangayformdemo/app/qrt-id/[id]/page.tsx`
   - Pass precinct data to IDCardPreview component

### Phase 4: Staff Dashboard Enhancement

**File to Modify**:
- `/home/user/barangayformdemo/app/staff/qrt-management/page.tsx`

**Changes**:
1. Add precinct number to QRT request mock data
2. Add precinct column to list view
3. Add precinct filter dropdown/select
4. Add precinct to Kanban view as badge or grouping
5. Implement precinct-based filtering logic

---

## Technical Considerations

### 1. Canvas Drawing Coordinates
- **Card Dimensions**: 856px (width) × 540px (height)
- **Top-left origin** (0, 0)
- **Bottom-left** = approximately (32-50px from left, 500-520px from top)

### 2. Logo Sizing & Placement
Current Bagong Pilipinas logo placement (line 84-85):
```javascript
frontCtx.drawImage(logo, 20, 10, 45, 40)  // x=20, y=10, w=45, h=40
```

**Required adjustments**:
- Mawaque logo: Top LEFT (new placement)
- Bagong Pilipinas: Keep or adjust center positioning
- Ensure no overlap with existing elements

### 3. Precinct Number Display

**Bottom-left placement considerations**:
- Font size: Needs to be clearly readable (suggest 18-24px bold)
- Color: Match card design (emerald for front, dark for back)
- Background: Optional badge/box for emphasis
- Positioning: ~20-50px from bottom, ~20-50px from left edge

### 4. Database Integration

**Assumption**: Precinct number comes from a database field
- Need to confirm: Is precinct data already in database?
- If not: Need database migration to add `precinct_number` column to QRT table

---

## Files Requiring Modification

### High Priority
1. **lib/qrt-types.ts** - Add precinct field to interface
2. **lib/qrt-id-generator-canvas.ts** - Update card generation logic
3. **app/staff/qrt-management/page.tsx** - Add precinct UI elements

### Medium Priority
4. **app/qrt-id/[id]/page.tsx** - Pass precinct data to card
5. **lib/qrt-context.tsx** - Database mapping for precinct

### Low Priority (Documentation)
6. Continue/update markdown documentation

---

## Clarifying Questions for User

### Question 1: Precinct Number Source & Format
**What is the source and format of precinct numbers?**
- Are they generated automatically or manually assigned?
- Format examples: 1-10, P001-P999, "Precinct 1", etc.?
- Are they numeric-only or alphanumeric?
- Should a QRT member have one precinct or multiple precincts?

### Question 2: Logo File Specifications
**Which specific logo files should be used, and are they already optimized?**
- For "Mawaque app logo": Should we use `linkod-app-logo-main.png` or `mawaque-logo.png`?
- What are the desired dimensions on the card? (Current Bagong Pilipinas is 45×40px)
- Should logos be displayed at full opacity or with transparency/reduced opacity?
- Are the existing PNG files the final versions, or do you have updated assets?

### Question 3: Staff Dashboard Precinct Management
**How should precinct numbers function in the staff dashboard?**
- Should staff filter by precinct to see only their assigned precinct's QRT members?
- Should there be role-based access (e.g., Precinct Coordinator role)?
- Should the dashboard allow bulk operations by precinct (generate multiple IDs)?
- Should precinct be displayed as a column, badge, or grouping mechanism?

### Question 4: Precinct Display on Card - Styling & Emphasis
**How should the precinct number stand out on the card?**
- Should it have a background box/badge (like the verification code)?
- What color scheme? (Emerald to match card theme, or distinct color?)
- Font size and weight preferences?
- Should it include a label like "PRECINCT:" or just the number?

### Question 5: Database & Data Integration
**Is the precinct field already in the database, or does it need to be added?**
- If not in database: Should this be added as a database migration?
- Should precinct assignment happen during QRT registration or later by staff?
- Is there a barangay-wide precinct system in place that we should reference?

---

## Implementation Timeline (Estimated)

1. **Data Model Updates**: 1-2 hours
2. **Canvas Generator Updates**: 2-3 hours
3. **Staff Dashboard Enhancement**: 2-3 hours
4. **Component Integration**: 1-2 hours
5. **Testing & Refinement**: 2 hours

**Total Estimated**: 8-11 hours

---

## Related Documentation

- Current QRT ID Generation: `/home/user/barangayformdemo/lib/qrt-id-generator-canvas.ts`
- QRT Context & State Management: `/home/user/barangayformdemo/lib/qrt-context.tsx`
- Staff Management Page: `/home/user/barangayformdemo/app/staff/qrt-management/page.tsx`
- Recent related commits: "Update QRT ID generator", "sync updates from main"

---

## Next Steps (After Clarifications)

1. Confirm precinct data model and format
2. Finalize logo selections and dimensions
3. Get approval on card layout changes
4. Proceed with implementation in prescribed order
5. Create unit tests for precinct filtering
6. Update documentation and user guides
