# QRT ID Form Refinement - Specification Package

## Project Overview
Complete refinement of the QRT ID Request Form to improve user experience, simplify progress indicators, fix layout issues, and implement government-standard address fields for Philippine residents.

**Status:** Spec-shaping phase complete - Awaiting user clarification on key technical decisions

---

## Documentation Files

### 1. **requirements.md** (252 lines)
Comprehensive technical requirements document with:
- Current state analysis (progress indicator, layout, address fields)
- Proposed changes with rationale
- Files requiring modification with specific line references
- Technical considerations and implementation options
- Data structure alternatives (3 options)
- Acceptance criteria checklist
- Design reference and spacing scale
- Mobile considerations

**Key Sections:**
- Section 1: Current State Analysis (lines 8-60)
- Section 2: Proposed Changes (lines 64-110)
- Section 3: Files to Modify (lines 114-136)
- Section 4: Technical Considerations (lines 140-183)
- Section 5: Acceptance Criteria (lines 187-216)

**Use Case:** Implementation team reference; contains specific line numbers and code locations

---

### 2. **clarifying-questions.md** (158 lines)
Five critical clarifying questions for the user covering:

1. **Philippine Address Field Specification** (Question 1)
   - Cascading dropdowns vs simple lists
   - Barangay inclusion decision
   - Postal code validation strategy

2. **Address Data Storage & Compatibility** (Question 2)
   - Option A: Combine fields in form, store as single string (recommended)
   - Option B: Create separate database columns (requires migration)
   - Option C: JSON storage in single column

3. **Province & City Dropdown Data** (Question 3)
   - Hardcoded vs Supabase sourced data
   - Cascading city selection based on province
   - Postal code format validation

4. **Mobile Responsiveness & Field Layout** (Question 4)
   - Always 1-column vs responsive 2-column desktop layout
   - Postal code field width strategy
   - Very small screen handling

5. **Form Validation & Error Handling Strategy** (Question 5)
   - Validation timing (real-time vs submit-time)
   - Character limits and requirements
   - Cross-field validation needs

**Use Case:** Present to user to gather missing requirements before implementation

---

### 3. **research-summary.md** (256 lines)
Executive summary of research findings with:
- Key findings (3 main issues confirmed)
- Codebase analysis with file locations
- Technical decision points and options
- Component impact map
- Implementation complexity estimates (9-20 hours)
- Dependency chain for implementation
- Risk assessment by complexity level
- Mobile considerations
- Reference document locations

**Key Insights:**
- Progress indicator has 4 redundant visual elements
- Spacing uses uniform 16-24px gaps without hierarchy
- Address fields missing required Philippine government standard fields
- Estimated effort: 9-20 hours depending on technical choices

**Use Case:** For orchestrator and team leads; provides context on scope and complexity

---

## Current Implementation Analysis

### Files Examined
1. `/app/qrt-id/request/page.tsx` (966 lines)
   - Main form component with 3-step wizard
   - Uses React hooks for state management
   - Integrates with QRT context for data persistence

2. `/lib/qrt-types.ts` (103 lines)
   - Type definitions for QRT requests
   - Interfaces for personal info and emergency contact

3. `/lib/qrt-context.tsx` (580 lines)
   - Context provider for QRT state management
   - Database integration with Supabase
   - Mapping functions for database row conversion

4. `/components/ui/` (standard UI components)
   - Input, Select, Textarea, Card, Button, Label

---

## Key Findings Summary

### Problem 1: Progress Indicator Redundancy
**Current:** 4 visual elements (percentage counter, step header, progress bar, step bars)
**Issue:** Takes 120px vertical space with duplicate information
**Solution:** Keep only 3-step bar visualization

### Problem 2: Layout Whitespace
**Current:** Uniform `space-y-4` (16px) and `space-y-6` (24px) throughout
**Issue:** Creates "floating" appearance without visual hierarchy
**Solution:** Reduce to `space-y-3` and `space-y-5`; use color/layout for grouping

### Problem 3: Address Fields
**Current:** Single textarea with placeholder suggestion
**Issue:** Doesn't meet government form standards; can't validate individually
**Solution:** 5 separate fields (Line, Street, City, Province, PostalCode)

---

## Implementation Roadmap

### Phase 1: User Clarification (Next)
- Present clarifying-questions.md to user
- Gather decisions on:
  - Data storage approach (Options A/B/C)
  - Dropdown data source (hardcoded vs Supabase)
  - Mobile layout strategy
  - Validation strictness

### Phase 2: Specification Finalization
- Update requirements.md with user decisions
- Create implementation spec with concrete decisions
- Define database schema (if Option B chosen)

### Phase 3: Implementation (9-20 hours)
1. Update interfaces in qrt-types.ts
2. Modify qrt-context.tsx mapping functions
3. Refactor request/page.tsx:
   - Simplify progress indicator (2-4 hours)
   - Adjust spacing (1-2 hours)
   - Add address fields (4-6 hours)
   - Update validation (1-2 hours)
   - Test responsive design (2-3 hours)

### Phase 4: Testing & Integration
- Form validation across all steps
- Mobile responsiveness (multiple breakpoints)
- Payment flow integration
- Data persistence verification

---

## Technical Decision Matrix

| Decision | Option A (Recommended) | Option B | Option C |
|----------|----------------------|----------|----------|
| **Data Storage** | Form fields → Combined string | Separate DB columns | JSON in single column |
| **Effort** | 9-11 hours | 13-17 hours | 9-13 hours |
| **Complexity** | Low | High | Medium |
| **Migration** | None | Required | None |
| **Queryability** | Limited | Full | Medium |
| **Recommendation** | Start here | Only if needed | Alternative to B |

---

## Field Structure (5-Field Address)

### Step 1: Current Address
1. Address Line / House Number (text, required, 3-100 chars)
2. Street / Barangay (text, required, 3-100 chars)
3. City / Municipality (select, required, predefined options)
4. Province (select, required, predefined options)
5. Postal Code (numeric, required, 4 digits)

### Step 2: Emergency Contact Address
- Same 5-field structure for consistency

### Step 3: Summary
- Display all 5 fields in review section
- Allow editing by returning to respective step

---

## Mobile Responsiveness Strategy

### Desktop (768px+)
- Address Line + Street: 2-column grid
- City + Province: 2-column grid
- Postal Code: Full-width

### Mobile (< 768px)
- All fields: 1-column (simplest UX)
- Maintains 44px touch target minimum
- No horizontal scrolling

### Very Small Screens (< 360px)
- Consider even tighter spacing
- Ensure postal code field remains usable

---

## Validation Rules

### Address Line
- Min: 3 characters
- Max: 100 characters
- Required: Yes

### Street/Barangay
- Min: 3 characters
- Max: 100 characters
- Required: Yes

### City
- Required: Yes
- Must be from predefined list
- Optional: Filter by selected province

### Province
- Required: Yes
- Must be from predefined list
- Suggested: Use cascading to filter cities

### Postal Code
- Required: Yes
- Format: 4 digits (numeric only)
- Validation: On blur or submit (depends on user preference)

---

## Acceptance Criteria Checklist

### Progress Indicator
- [ ] Only 3-step bars visible (no percentage counter)
- [ ] No "Step X of 3" text header
- [ ] Smooth animation on step change
- [ ] Reduced vertical padding (py-4 vs py-8)

### Address Fields
- [ ] Step 1: 5 separate address component fields
- [ ] Step 2: 5 separate emergency contact address fields
- [ ] All fields have proper labels and placeholders
- [ ] Province/City use Select dropdowns
- [ ] Postal code validates as 4-digit numeric
- [ ] Responsive 2-column desktop, 1-column mobile
- [ ] All fields appear in Step 3 review

### Layout/Spacing
- [ ] Consistent spacing between form sections
- [ ] No excessive whitespace gaps
- [ ] Proper vertical rhythm throughout
- [ ] Mobile responsiveness maintained
- [ ] Fixed bottom nav remains functional

### Functionality
- [ ] Validation updated for new address fields
- [ ] Form submission includes all address components
- [ ] Data persists through form steps
- [ ] Error states display correctly
- [ ] Payment flow integration works

---

## Questions?

### For Orchestrator/PM
- See `clarifying-questions.md` for user presentation material
- See `research-summary.md` for technical context

### For Implementation Team
- See `requirements.md` for detailed technical specifications
- See file references with specific line numbers for code locations

### For User/Product Owner
- Review `clarifying-questions.md` and provide answers
- Answers will refine implementation approach

---

## File References

| File | Lines | Purpose |
|------|-------|---------|
| `/app/qrt-id/request/page.tsx` | 300-333 | Progress indicator (simplify) |
| `/app/qrt-id/request/page.tsx` | 181-202 | Form state (expand address) |
| `/app/qrt-id/request/page.tsx` | 433-446 | Address textarea (restructure) |
| `/app/qrt-id/request/page.tsx` | 644-658 | Emergency contact address (restructure) |
| `/lib/qrt-types.ts` | 7-28 | Type definitions (update) |
| `/lib/qrt-context.tsx` | 74-149 | Database mapping (update) |

---

**Created:** 2026-01-04
**Status:** Ready for user clarification
**Next Action:** Present clarifying-questions.md to user
