# Address Autocomplete System - Bug Fixes & Data Completion

**Status:** 🔧 IN PROGRESS
**Priority:** HIGH (Production Blocking)
**Date Created:** 2026-01-08

---

## Critical Issues Identified

### 1. Incomplete Address Data Coverage
- ❌ Luzon area addresses not fully seeded
- ❌ Users cannot select cities in many regions
- ❌ Barangay navigation blocked when city not in database
- ⚠️ Current coverage: Only 2.4% cities (39/1,634)

### 2. UI/UX Issues
- ❌ Birth date field: Text disappears when auto-filled from OCR
- ❌ ID Type dropdown: Vertically smaller than surrounding fields (inconsistent height)
- ❌ Privacy/Policy text: Broken/malformed display

---

## Task Breakdown

### Phase 1: Data Seeding - Complete National Coverage

#### Task 1.1: Full National Address Data Seed ⏳

**Agent:** Haiku
**Priority:** CRITICAL
**Dependencies:** None
**Estimated Tokens:** 8,000

**Description:**
Seed complete Philippine address data (all provinces, cities, barangays) to ensure nationwide coverage.

**Current Coverage:**
- Provinces: 82/82 (100%) ✅
- Cities: 39/1,634 (2.4%) ❌
- Barangays: 27/42,000 (0.06%) ❌

**Target Coverage:**
- Provinces: 82/82 (100%) ✅
- Cities: 1,634/1,634 (100%) 🎯
- Barangays: 42,000+/42,000+ (100%) 🎯

**Acceptance Criteria:**
- ✅ All 1,634 cities/municipalities from PSGC Cloud API seeded
- ✅ All 42,000+ barangays from PSGC Cloud API seeded
- ✅ All records have valid PSGC codes
- ✅ All cities have ZIP codes populated
- ✅ Foreign key relationships intact
- ✅ No duplicate records
- ✅ Luzon region fully covered (test: can select any Luzon city)
- ✅ Script execution completes successfully
- ✅ Database record counts verified:
  ```sql
  SELECT 'cities' as table, COUNT(*) FROM address_cities;
  -- Expected: ~1,634

  SELECT 'barangays' as table, COUNT(*) FROM address_barangays;
  -- Expected: ~42,000
  ```

**Implementation:**
1. Review existing seed script at `/scripts/seed-addresses.ts`
2. If script doesn't exist, create it following the spec architecture
3. Execute full data seed from PSGC Cloud API:
   - Provinces: `https://psgc.cloud/api/provinces`
   - Cities: `https://psgc.cloud/api/cities-municipalities`
   - Barangays: `https://psgc.cloud/api/barangays`
4. Use batch inserts (1,000 records per batch for barangays)
5. Log progress and any errors
6. Verify data integrity post-seed

**Test Cases:**
- Can select "Manila" city in NCR
- Can select "Quezon City" in NCR
- Can select "Baguio" city in Cordillera
- Can select any city in Luzon
- Barangay dropdown populates after city selection
- ZIP codes auto-fill correctly

**Deliverable:**
- Fully seeded database with 100% national coverage
- Execution log showing successful completion
- Data validation report

---

### Phase 2: UI/UX Bug Fixes

#### Task 2.1: Fix Birth Date Field Auto-fill Display ⏳

**Agent:** Haiku
**Priority:** HIGH
**Dependencies:** None
**Estimated Tokens:** 5,000

**Description:**
Fix the birth date field where text disappears when automatically filled from OCR scan.

**Issue:**
When OCR scans an ID and auto-fills the birth date, the text becomes invisible or disappears from the input field (see screenshot evidence).

**Root Cause Investigation:**
1. Check `/app/register/page.tsx` birth date field styling
2. Check if OCR highlight class conflicts with input value display
3. Check z-index, color, opacity issues
4. Check if `wasScanned` state causes text color to match background

**Acceptance Criteria:**
- ✅ Birth date remains visible when auto-filled from OCR
- ✅ Text color contrasts properly with background (green highlight)
- ✅ Field maintains consistent styling with other auto-filled fields
- ✅ Manual entry still works correctly
- ✅ Date picker remains functional
- ✅ Tested on multiple ID types (Philippine National ID, Driver's License)

**Implementation:**
- Locate birth date input in `/app/register/page.tsx`
- Check if `border-emerald-300 bg-emerald-50/50` class is applied
- Ensure text color is `text-gray-900` or similar (not white/transparent)
- Test with OCR scan to verify visibility
- Verify placeholder vs value styling

**Test:**
1. Scan Philippine National ID with birth date "MARCH 15, 1971"
2. Verify date appears in field with green highlight
3. Text should be dark and readable

---

#### Task 2.2: Fix ID Type Dropdown Height Inconsistency ⏳

**Agent:** Haiku
**Priority:** MEDIUM
**Dependencies:** None
**Estimated Tokens:** 4,000

**Description:**
Fix the ID Type dropdown that appears significantly smaller vertically compared to surrounding input fields, creating visual inconsistency.

**Issue:**
The ID Type dropdown bar is shorter (less vertical height) than the Full Name, ID Number, and Birth Date fields, creating a misaligned appearance.

**Acceptance Criteria:**
- ✅ ID Type dropdown has same height as surrounding fields
- ✅ Visual alignment consistent across all form fields
- ✅ Dropdown icon properly centered vertically
- ✅ Touch target remains accessible (min 44px height)
- ✅ Responsive on mobile devices

**Implementation:**
1. Locate ID Type dropdown in `/app/register/page.tsx`
2. Check if it uses different component (Select vs Input)
3. Apply consistent height class (e.g., `h-12` or `min-h-[48px]`)
4. Ensure padding matches other fields (`py-3` or `px-4`)
5. Verify shadcn/ui Select component styling

**Likely Fix:**
```typescript
// Ensure Select component has same classes as Input
<Select>
  <SelectTrigger className="h-12 w-full"> {/* Match Input height */}
    <SelectValue placeholder="Select ID type" />
  </SelectTrigger>
  ...
</Select>
```

**Test:**
- All form fields should have uniform height
- Visual inspection confirms alignment

---

#### Task 2.3: Fix Privacy Policy Text Display ⏳

**Agent:** Haiku
**Priority:** MEDIUM
**Dependencies:** None
**Estimated Tokens:** 3,000

**Description:**
Fix the broken/malformed privacy and policy sentence display.

**Issue:**
Privacy policy text appears broken or improperly formatted (user reported but didn't specify exact issue - investigate).

**Investigation:**
1. Search for "privacy" or "policy" text in `/app/register/page.tsx`
2. Check for:
   - Line breaks in wrong places
   - Missing spaces
   - Truncated text
   - Overflow issues
   - Link formatting problems

**Acceptance Criteria:**
- ✅ Privacy policy text displays correctly on all screen sizes
- ✅ No broken line breaks or word wrapping issues
- ✅ Links are clickable and properly formatted
- ✅ Text is readable and grammatically correct
- ✅ Mobile responsive (doesn't overflow on small screens)

**Common Issues to Check:**
- Text wrapping with `whitespace-pre-wrap` or `break-words`
- Link styling with `underline` and `text-blue-600`
- Container width constraints
- Font size readability

**Test:**
- View on desktop (1920x1080)
- View on mobile (375x667)
- Click any policy links to ensure they work

---

### Phase 3: Validation & Code Review

#### Task 3.1: Comprehensive Testing ⏳

**Agent:** Sonnet (Code Reviewer)
**Priority:** HIGH
**Dependencies:** 1.1, 2.1, 2.2, 2.3
**Estimated Tokens:** 10,000

**Description:**
Comprehensive validation of all fixes with end-to-end testing.

**Acceptance Criteria:**

**Data Coverage Testing:**
- ✅ Can select cities from all Luzon regions:
  - NCR (Metro Manila)
  - Region I (Ilocos)
  - Region II (Cagayan Valley)
  - Region III (Central Luzon)
  - Region IV-A (CALABARZON)
  - Region IV-B (MIMAROPA)
  - Region V (Bicol)
  - CAR (Cordillera)
- ✅ Can select cities from Visayas regions
- ✅ Can select cities from Mindanao regions
- ✅ Barangay dropdown populates correctly for all cities
- ✅ ZIP codes auto-fill for all cities
- ✅ No broken cascading selection

**UI Testing:**
- ✅ Birth date field remains visible when OCR-filled
- ✅ All form fields have consistent height
- ✅ Privacy policy text displays correctly
- ✅ OCR highlights work (green borders)
- ✅ Manual input fallback still functional

**Regression Testing:**
- ✅ Province → City → Barangay cascading works
- ✅ Changing province clears city and barangay
- ✅ Changing city clears barangay
- ✅ ZIP code updates when city changes
- ✅ Form submission works with full addresses
- ✅ Validation fires correctly

**Test Scenarios:**
1. **Luzon Coverage Test:**
   - Scan Edgar Garcia's ID (Zambales)
   - Verify "Zambales" → "Subic" → "Ilwas" all selectable
   - Verify ZIP "2209" auto-fills

2. **UI Consistency Test:**
   - Scan any ID
   - Verify birth date is visible (dark text on green background)
   - Verify all fields have same height
   - Verify privacy text is readable

3. **Manual Entry Test:**
   - Select "Manila" (NCR)
   - Select "Quezon City" (NCR)
   - Select any barangay in Quezon City
   - Verify ZIP auto-fills

4. **Edge Case Test:**
   - Try selecting city in Cordillera region
   - Try selecting city in Mindanao
   - Verify all work correctly

**Deliverable:**
- ✅ Test report with all scenarios passed
- ✅ Screenshots showing fixed UI issues
- ✅ Database verification queries showing full coverage
- ✅ Code review summary

---

## Success Criteria

✅ **Data Coverage:** 100% national coverage (1,634 cities, 42,000+ barangays)
✅ **UI Fixed:** Birth date visible, consistent field heights, privacy text readable
✅ **No Regressions:** All existing functionality still works
✅ **Production Ready:** System works for users nationwide, not just Pampanga

---

## Execution Strategy

**Parallel Execution:**
- Task 1.1 (Data Seed) can run independently
- Tasks 2.1, 2.2, 2.3 (UI fixes) can run in parallel

**Sequential Dependency:**
- Task 3.1 (Validation) must wait for all other tasks to complete

**Agent Allocation:**
- Haiku: Execute all implementation tasks (1.1, 2.1, 2.2, 2.3)
- Sonnet: Code review and validation (3.1)

**Estimated Timeline:**
- Phase 1: 5-10 minutes (data seeding)
- Phase 2: 15-30 minutes (UI fixes)
- Phase 3: 15-20 minutes (testing)
- **Total:** 35-60 minutes

---

## Risk Mitigation

**Data Seeding Risks:**
- PSGC API timeout → Retry with exponential backoff
- Database connection issues → Use connection pooling
- Memory constraints → Batch inserts (1,000 records)

**UI Fix Risks:**
- Breaking existing styles → Test thoroughly before committing
- Mobile responsiveness → Test on multiple screen sizes
- Browser compatibility → Test on Chrome, Safari, Firefox

---

**End of Task Breakdown**
