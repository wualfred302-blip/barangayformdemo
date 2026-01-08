# Clarifying Questions for QRT Form Refinement

Based on the research and analysis of the current QRT ID form implementation, here are 5 key clarifying questions for the user:

---

## Question 1: Philippine Address Field Specification
**Scope:** How should we structure the address fields for maximum government compliance?

**Current Analysis:**
- The form currently uses a single textarea placeholder: "Street, Barangay, City, Province"
- Philippines uses a hierarchical address format: House/Street → Barangay → City/Municipality → Province → Postal Code

**Clarification Needed:**
1. Should all 5 fields be individually selectable (especially City and Province)?
2. Should we implement a **cascading dropdown** where selecting a Province filters available Cities?
3. Or should we use a single free-text **City + Province combined field** with autocomplete?
4. Do you need the Barangay field as a separate dropdown (if so, it would cascade from City selection)?
5. Should we validate that postal codes match the selected province/city?

**Impact:** This determines complexity of dropdown data management and validation logic.

---

## Question 2: Address Data Storage & Compatibility
**Scope:** How should we store the newly structured address data in the backend?

**Current Implementation:**
- Address currently stored as single string field in Supabase
- Form shows summary with combined address string in Step 3 review

**Clarification Needed:**
1. **Option A (Recommended - Minimal Changes):**
   - Keep single `address` column in database
   - Combine fields on submit: "123 Main Street, Barangay Mawaque, Mabalacat, Pampanga 2301"
   - Pros: No database migration, minimal backend impact
   - Cons: Can't query by individual components

2. **Option B (Full Restructuring):**
   - Create separate columns: `address_line`, `street_barangay`, `city`, `province`, `postal_code`
   - Pros: Better queryability, cleaner data structure
   - Cons: Requires database migration, changes to context/types

3. **Option C (JSON Storage):**
   - Store address as JSON in single column: `{ "line": "...", "barangay": "...", ...}`
   - Pros: Flexibility, no migration
   - Cons: Harder to query

**Impact:** Choose this first - it affects all downstream changes.

---

## Question 3: Province & City Dropdown Data
**Scope:** What's your data preference for province and city lists?

**Clarification Needed:**
1. Should we use a **hardcoded list** (PHP Complete Provincial List)?
   - Simplest to implement
   - Static data in component or separate constant file

2. Or should this data come from **Supabase table**?
   - More flexible (can add/update cities without code changes)
   - Requires querying on component mount
   - May show loading state while fetching

3. Do you need **cascading cities** (Cities filtered by Province)?
   - Significantly increases data complexity
   - Better UX (users see only relevant cities)
   - Requires city-to-province mapping

4. Postal code format - Is **4 digits always correct** for all Philippine addresses?
   - Or should it be variable length?
   - Validate on blur or only on submit?

**Impact:** This affects dropdown size, performance, and data dependencies.

---

## Question 4: Mobile Responsiveness & Field Layout
**Scope:** How should address fields adapt on mobile vs desktop?

**Current Analysis:**
- Current textarea is full-width on all screen sizes
- Most form inputs use 2-column layout on desktop, 1-column on mobile

**Clarification Needed:**
1. For the **5 new address fields**, should we use:
   - **Layout A:** Always 1-column (simplest, touch-friendly)
     - All fields stack vertically
     - Easier to read on mobile

   - **Layout B:** 2-column on desktop, 1-column on mobile (current approach)
     - Row 1: Address Line + Street (2 cols)
     - Row 2: City + Province (2 cols)
     - Row 3: Postal Code (full-width)

   - **Layout C:** Compact mobile layout
     - City + Province together on one row (narrow columns)
     - Tighter spacing on mobile

2. Should postal code be **smaller width** on desktop (since it's only 4 digits)?
   - Or full-width like other fields?

3. On **very small screens** (< 360px), should any fields collapse further?

**Impact:** This affects visual design and overall form feel on mobile devices.

---

## Question 5: Form Validation & Error Handling Strategy
**Scope:** How strict should validation be for address fields?

**Current Analysis:**
- Form shows errors only when user tries to proceed to next step
- Error display: red border + red background on fields
- Currently validates: fullName, birthDate, gender, civilStatus, address, photoBase64

**Clarification Needed:**
1. **Postal Code validation:**
   - Strict: Must be exactly 4 digits, numeric only, required
   - Or flexible: Allow up to 5 characters, alphanumeric?
   - Validate on blur (immediate feedback) or submit (current approach)?

2. **Free-text fields** (Address Line, Street/Barangay):
   - Minimum character requirement (current: none suggested)?
   - Maximum character limit?
   - Any format restrictions (e.g., no special characters)?

3. **Dropdown validation:**
   - City/Province: Should these show validation errors or just prevent submission?
   - Current approach: Show red background on unfilled selects

4. **Cross-field validation:**
   - Should postal code validation check against selected Province (verify it exists)?
   - Or just format validation?

5. **Show validation errors:**
   - As user types/selects (real-time)?
   - Only when trying to proceed (current approach)?
   - On field blur (intermediate)?

**Impact:** This affects form UX feel (strict/professional vs forgiving/flexible).

---

## Summary for Orchestrator
These 5 questions cover:
1. **Address Structure** - How to organize the 5 fields
2. **Data Storage** - Where/how to store in database
3. **Data Sources** - Where provinces/cities come from
4. **Mobile Design** - How fields adapt to screen size
5. **Validation** - How strict error checking should be

Once answered, implementation can proceed with clear technical direction for:
- Backend data model changes
- Form component layout
- Validation logic
- Data migration (if needed)
