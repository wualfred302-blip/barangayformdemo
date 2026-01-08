# QRT ID Form Refinement - Requirements Analysis

## Project Overview
Refinement of the QRT ID Form (/app/qrt-id/request/page.tsx) to improve user experience and visual design by simplifying the progress indicator, fixing layout whitespace issues, and implementing government-standard address fields for Philippine residents.

---

## 1. Current State Analysis

### 1.1 Progress Indicator (Lines 300-333)
**Current Implementation:**
- Two-part progress display: percentage counter + step header + multi-element bar
- Percentage counter: Shows "(currentStep - 1) / 2 * 100" calculation - mathematically incorrect
  - Step 1: 0% → Step 2: 50% → Step 3: 100% (gaps in progression)
- Step header: "Step X of 3" text label above
- Visual bar: Shows 3 individual bars (lines 323-331) + gradient progress bar (lines 313-320)
- Located in fixed container (lines 300-333) with extra spacing (py-8)
- Total: 4 visual elements taking up significant screen real estate

**Issues Identified:**
- Percentage calculation is confusing and not intuitive
- Redundant visual elements (multiple progress indicators)
- Excessive vertical spacing around progress section
- Too many informational layers

### 1.2 Form Layout and Spacing
**Current Issues:**
- Main container uses: `space-y-4` between cards (line 344)
- Each Card uses: `space-y-6` within content (lines 348, 453, 587)
- Large `gap-4` and `gap-3` between form elements
- Excessive bottom padding on page (pb-40 for nav, line 290)
- No consistent spacing hierarchy
- Large gaps create "whitespace" perception between logical sections

**File Structure:**
- Step 1 (Personal Details): 2 cards (Personal Details + Physical Details)
- Step 2 (Emergency Contact): 1 card + info alert
- Step 3 (Review): Multiple cards + payment selection

### 1.3 Current Address Field Implementation (Lines 433-446)
**Single textarea field:**
\`\`\`
Current Address (formData.address)
- Uses Textarea component
- Placeholder: "Street, Barangay, City, Province"
- Minimum height: 100px
- No structured field separation
- Limited for government form standards
\`\`\`

**Issues:**
- Single unstructured field not suitable for official government forms
- Difficult to parse address components programmatically
- Missing required address components for Philippine addresses
- No validation per field

### 1.4 Emergency Contact Address (Lines 644-658)
**Similar issue:**
- Also uses unstructured textarea
- Placeholder suggests format but doesn't enforce it

---

## 2. Proposed Changes

### 2.1 Progress Indicator Simplification
**Target Design:**
- Remove percentage counter circle entirely
- Remove "Step X of 3" text header
- Keep ONLY the 3 step visual bars (current lines 323-331)
- Optional: Add subtle current step highlighting/animation
- Reduce vertical spacing: `py-4` instead of `py-8`

**Benefits:**
- Cleaner interface (reduces cognitive load)
- Maintains progress visualization without redundancy
- Saves ~40-50px vertical space on smaller screens

### 2.2 Address Field Restructuring (Philippine Government Format)
**Replace textarea with structured fields:**

**Current Address Section (Step 1):**
\`\`\`
1. Address Line / House Number (required)
2. Street / Barangay (required)
3. City / Municipality (required)
4. Province (required)
5. Postal Code (required) - 4 digits
\`\`\`

**Emergency Contact Address Section (Step 2):**
- Same 5-field structure (consistency)

**Field Organization:**
- Row 1: Address Line + Street (2-column grid on desktop, 1-column on mobile)
- Row 2: City + Province (2-column grid)
- Row 3: Postal Code (full-width)
- Add validation for each field
- Use Select for Province/City (predetermined options)

### 2.3 Spacing and Layout Optimization
**Current Spacing Adjustments:**
- Reduce `space-y-4` to `space-y-3` between cards (main container)
- Reduce `space-y-6` to `space-y-5` within cards (CardContent)
- Adjust gap between field groups from `gap-4` to `gap-3`
- Reduce bottom padding: `pb-40` to `pb-32` (accounting for fixed nav)

**Responsive Adjustments:**
- Maintain current mobile-first approach
- Grid colspans remain: 2-column desktop, 1-column mobile

---

## 3. Files That Need Modification

### 3.1 Primary File
**`/app/qrt-id/request/page.tsx`** - Main form component
- Lines 300-333: Progress indicator section (remove header, percentage, simplify bars)
- Lines 181-202: Form state (add address sub-fields)
- Lines 433-446: Current address field (replace textarea with field group)
- Lines 644-658: Emergency contact address field (same restructure)
- Lines 240-248: Validation functions (update for new fields)
- Throughout: Adjust spacing classes

### 3.2 Related Files (may need updates)
**`/lib/qrt-types.ts`** (lines 7-28)
- QRTPersonalInfo interface: Update address field(s) structure
- QRTEmergencyContact interface: Update address field(s) structure

**`/lib/qrt-context.tsx`** (lines 74-110)
- dbRowToQRTIDRequest function: Map database columns to new address fields
- qrtRequestToDbRow function: Map new fields to database columns

**Database/Supabase Schema** (if needed)
- May need migration for breaking down address field into components
- OR: Keep single address field in DB and parse/format on form

---

## 4. Technical Considerations

### 4.1 Address Field Data Structure Options
**Option A: Structured in Form, Flat in Storage (Recommended)**
- Keep database simple with single address field
- Combine fields on form submit: `${addressLine}, ${street}, ${city}, ${province} ${postalCode}`
- Parse on retrieval if needed for display

**Option B: Structured Throughout**
- Update database schema with separate columns
- Requires migration script
- Better for querying by province/city
- More complex

**Option C: Hybrid (JSON Storage)**
- Store as JSON in single column
- Parse/stringify on form interactions

### 4.2 Validation Requirements
**Address Fields:**
- Address Line: Min 3 chars, max 100 chars
- Street/Barangay: Min 3 chars, max 100 chars
- City: Required, select from predefined list
- Province: Required, select from predefined list
- Postal Code: 4-digit format (numeric only), required

**Form Integration:**
- Validation in validateStep1() and validateStep2()
- Show errors when moving to next step
- Color feedback (red border/bg on error)

### 4.3 Philippine Address Reference
**Required Provinces (partial list for dropdown):**
- Metro Manila
- Bulacan
- Cavite
- Laguna
- Quezon
- Pampanga
- Tarlac
- Nueva Ecija
- etc.

**Cities vary by Province** - May need cascading dropdown or single combined selection

---

## 5. Acceptance Criteria

### Progress Indicator
- [X] Displays only 3 step bars (horizontal bars)
- [X] No percentage counter visible
- [X] No "Step X of 3" text header
- [X] Smooth animation on step change
- [X] Reduced vertical padding (py-4 vs py-8)

### Address Fields
- [X] Step 1: 5 separate fields for address components
- [X] Step 2: 5 separate fields for emergency contact address
- [X] All fields have proper labels and placeholders
- [X] Province/City use Select dropdowns (predefined options)
- [X] Postal code validates as 4-digit numeric
- [X] Responsive: 2-column on desktop, 1-column on mobile
- [X] All fields appear in Step 3 review summary

### Layout/Spacing
- [X] Consistent spacing between form sections
- [X] No excessive whitespace gaps
- [X] Proper vertical rhythm throughout form
- [X] Mobile responsiveness maintained
- [X] Fixed bottom nav remains functional

### Form Functionality
- [X] Validation updated for new address fields
- [X] Form submission includes all address components
- [X] Data persists through form steps
- [X] Error states display correctly

---

## 6. Design Reference

### Spacing Scale (Updated)
- Container gap between cards: `space-y-3` (12px) - reduces from `space-y-4`
- Within card sections: `space-y-5` (20px) - reduces from `space-y-6`
- Field groups: `gap-3` (12px) - reduces from `gap-4`
- Label to input: `space-y-2` (8px) - keeps consistent

### Component Hierarchy
- Header: Sticky, 56px height
- Progress: Compact section, ~80px
- Form sections: Cards with internal padding
- Bottom nav: Fixed, ~60px

---

## 7. Mobile Considerations
- Progress bars stack properly on narrow screens
- Address fields follow 1-column layout on mobile
- Ensure postal code field is large enough for input
- No horizontal scrolling on address fields
- Maintain touch target sizes (44px minimum)

---

## 8. Next Steps for Implementation
1. Update form state interface in qrt-context.ts/qrt-types.ts
2. Modify progress indicator section in request/page.tsx
3. Replace textarea address fields with field groups
4. Update validation functions
5. Test responsive layout on multiple screen sizes
6. Verify form submission and data flow
7. Test with real user workflow (payment integration)
