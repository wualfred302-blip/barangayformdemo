# QRT Form Refinement - Research Summary

## Overview
Comprehensive research and requirements analysis completed for the QRT ID Form Refinement specification, focusing on progress indicator simplification, layout optimization, and government-standard address fields implementation.

---

## Key Findings

### 1. Progress Indicator Problems (Confirmed)
**Issue:** The progress indicator has redundant visual elements taking up excessive screen space

**Current State:**
- Percentage counter (mathematically incorrect: 0% → 50% → 100%)
- Step header ("Step 1 of 3")
- Gradient progress bar
- 3 individual step bars
- Total vertical space: ~120px (including padding)

**Root Cause:** Multiple visual elements attempting to show the same information in different ways

**Solution:** Remove percentage counter and step header, keep only the 3-step bar visualization

---

### 2. Layout Whitespace Issue (Confirmed)
**Issue:** Excessive gaps between form sections create "floating" appearance

**Current State:**
- `space-y-4` between cards (16px) × multiple sections
- `space-y-6` within cards (24px) × section groups
- `pb-40` bottom padding (160px) for fixed nav accommodation
- No visual hierarchy in spacing

**Root Cause:** Uniform large spacing without differentiation between logical groups

**Solution:** Reduce spacing scale and create visual grouping through color/layout rather than whitespace

---

### 3. Address Field Gaps (Confirmed)
**Issue:** Single textarea doesn't meet government form standards

**Current Implementation:**
- Single field for entire address
- Placeholder suggests format: "Street, Barangay, City, Province"
- No individual field validation
- Difficult to parse for official documents

**Missing Fields for Philippine Government Compliance:**
1. Address Line / House Number
2. Street / Barangay
3. City / Municipality
4. Province
5. Postal Code (4-digit format)

**Root Cause:** Form designed for simple use case; hasn't been updated for official requirements

**Solution:** Replace textarea with 5-field structured form matching Philippine address standard

---

## Codebase Analysis

### Primary File: `/app/qrt-id/request/page.tsx`
**Size:** 966 lines
**Key Sections:**
- Lines 300-333: Progress indicator (needs simplification)
- Lines 181-202: Form state initialization (needs address field expansion)
- Lines 433-446: Current address field (needs restructuring)
- Lines 644-658: Emergency contact address (needs restructuring)
- Lines 240-248: Validation functions (needs updates)
- Throughout: Spacing classes (needs adjustment)

### Related Files Requiring Changes
1. **`/lib/qrt-types.ts`** (48 lines)
   - QRTPersonalInfo interface (line 7-21)
   - QRTEmergencyContact interface (lines 23-28)

2. **`/lib/qrt-context.tsx`** (580 lines)
   - dbRowToQRTIDRequest mapping function (lines 74-111)
   - qrtRequestToDbRow mapping function (lines 113-149)

3. **Database Schema** (if choosing Option B)
   - Requires migration to add separate address columns
   - Or keep single field with combined addresses

---

## Technical Decision Points

### A. Address Storage Strategy (3 Options)
| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| **A** (Recommended) | Form fields → Combined string in DB | No migration, simple | Can't query by component |
| **B** | Form fields → Separate DB columns | Queryable, clean | Requires migration |
| **C** | Form fields → JSON in single column | Flexible, no migration | Harder to query |

### B. Province/City Data Source (2 Options)
| Option | Approach | Pros | Cons |
|--------|----------|------|------|
| **Hardcoded** | Static list in component | Simple, no latency | Requires code update to add cities |
| **Supabase** | Query from database table | Flexible, updateable | Requires data table, loading state |

### C. City Filtering
- **Without cascading:** Single long list of all cities
- **With cascading:** Cities filter by province selection (better UX, more complex)

---

## Component Impact Map

\`\`\`
request/page.tsx (966 lines)
├── Form State
│   ├── Personal Info
│   │   ├── fullName ✓
│   │   ├── birthDate ✓
│   │   ├── gender ✓
│   │   ├── civilStatus ✓
│   │   ├── address → addressLine, street, city, province, postalCode (NEW)
│   │   ├── height ✓
│   │   ├── weight ✓
│   │   ├── yearsResident ✓
│   │   └── photoBase64 ✓
│   ├── Emergency Contact
│   │   ├── emergencyContactName ✓
│   │   ├── emergencyContactPhone ✓
│   │   ├── emergencyContactRelationship ✓
│   │   └── emergencyContactAddress → contactAddressLine, contactStreet, contactCity, contactProvince, contactPostalCode (NEW)
│   └── Payment
│       └── requestType ✓
├── Validation Functions
│   ├── validateStep1() - UPDATE
│   └── validateStep2() - UPDATE
├── Progress Indicator - SIMPLIFY
│   ├── Remove percentage counter
│   ├── Remove step header
│   └── Keep 3-step bars
└── Layout - ADJUST SPACING
    ├── Reduce space-y-4 to space-y-3
    ├── Reduce space-y-6 to space-y-5
    └── Reduce pb-40 to pb-32
\`\`\`

---

## Implementation Complexity Estimate

### Low Complexity
- Simplify progress indicator (1-2 hours)
- Adjust spacing throughout form (1-2 hours)
- Total: 2-4 hours

### Medium Complexity
- Add 5 address fields with validation (4-6 hours)
- Update Step 3 review summary (1-2 hours)
- Test responsive layout (2-3 hours)
- Total: 7-11 hours

### Higher Complexity (If Chosen)
- Database migration (if Option B selected): +4-6 hours
- Supabase data table setup (if using Supabase): +2-3 hours
- City cascading dropdown (if needed): +3-5 hours

**Total Estimated Effort:** 9-20 hours depending on options chosen

---

## Dependency Chain

1. **Answer clarifying questions** (determine strategy)
2. **Update qrt-types.ts** (new address field interfaces)
3. **Update qrt-context.tsx** (database mapping functions)
4. **Modify request/page.tsx** (form implementation)
5. **Test form flow** (all steps, validation, submission)
6. **Test mobile responsiveness** (multiple screen sizes)
7. **Integrate with payment flow** (verify data persists)

---

## Risk Assessment

### Low Risk
- Progress indicator simplification (purely visual)
- Spacing adjustments (CSS only)

### Medium Risk
- Form state expansion (requires validation updates)
- New address field validation (multiple validation rules)

### Higher Risk (If Chosen)
- Database migration (data consistency concerns)
- City cascading dropdown (complex data dependencies)

---

## Mobile Considerations

**Current Mobile Layout:**
- Single column for all form inputs
- Responsive touch-friendly sizing
- No horizontal scroll

**New Address Fields Impact:**
- 5 new fields to accommodate
- Recommend 1-column layout on mobile (simplest)
- Consider 2-column on desktop for efficiency
- Ensure postal code field is 44px+ height (touch target)

---

## Next Steps

### For Orchestrator to Present to User
1. Present requirements.md for context
2. Ask clarifying questions in order:
   - Question 1: Philippine address field specification
   - Question 2: Address data storage & compatibility
   - Question 3: Province/City dropdown data source
   - Question 4: Mobile responsiveness strategy
   - Question 5: Validation strictness level

### For Implementor After Questions Answered
1. Create address field component or helper functions
2. Update form state interfaces
3. Implement field-specific validation
4. Update Step 3 summary to display new fields
5. Create test cases for all validation scenarios
6. Verify payment flow integration

---

## Reference Documents

**In This Spec:**
- `requirements.md` - Detailed technical requirements and analysis
- `clarifying-questions.md` - 5 key questions for user input

**In Codebase:**
- `/app/qrt-id/request/page.tsx` - Main form component (966 lines)
- `/lib/qrt-types.ts` - Type definitions (103 lines)
- `/lib/qrt-context.tsx` - State management (580 lines)

---

## Summary

The QRT ID Form requires three main improvements:
1. **Progress indicator** - Remove redundant visual elements
2. **Layout spacing** - Reduce whitespace and improve visual hierarchy
3. **Address fields** - Implement 5-field government-standard address form

All changes are isolated to form presentation layer, with minimal impact to backend systems if using Option A (recommended) for address storage.

Once clarifying questions are answered, implementation can proceed with clear technical direction.
