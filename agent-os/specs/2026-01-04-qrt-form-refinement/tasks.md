# Tasks: QRT ID Form Refinement

## Task Group 1: Type Definitions & Data Structure
- [ ] **Update address field structure in type definitions**
  - [ ] Modify QRTPersonalInfo interface in qrt-types.ts to replace single `address` field with 5 separate fields: `addressLine`, `street`, `city`, `province`, `postalCode`
  - [ ] Modify QRTEmergencyContact interface in qrt-types.ts to replace single `emergencyContactAddress` with 5 separate fields: `emergencyContactAddressLine`, `emergencyContactStreet`, `emergencyContactCity`, `emergencyContactProvince`, `emergencyContactPostalCode`
  - [ ] Update QRTIDRequest interface in qrt-types.ts to include all new address fields
  - [ ] Update matching QRTIDRequest interface in qrt-context.tsx to align with type definitions

## Task Group 2: Context & Database Mapping
- [ ] **Update database mapping functions in qrt-context.tsx**
  - [ ] Modify `dbRowToQRTIDRequest()` function to map new address field columns and parse existing single address field as fallback
  - [ ] Modify `qrtRequestToDbRow()` function to combine 5 address fields into single database address field using format: `${addressLine}, ${street}, ${city}, ${province} ${postalCode}`
  - [ ] Add helper function `formatAddressFromFields()` to consistently format address components
  - [ ] Add helper function `parseAddressToFields()` to parse single address string back to 5 fields when loading from database

## Task Group 3: Progress Indicator Simplification
- [ ] **Simplify progress indicator in request/page.tsx (lines 300-333)**
  - [ ] Remove percentage counter circle display entirely (lines 311-320)
  - [ ] Remove "Step X of 3" text header (lines 301-309)
  - [ ] Keep only the 3 step visual bars (current lines 323-331)
  - [ ] Reduce vertical padding from `py-8` to `py-4` on progress container
  - [ ] Ensure step bars remain responsive on mobile and desktop viewports
  - [ ] Optional: Add subtle highlight animation for current step bar

## Task Group 4: Form State & Initial Data
- [ ] **Update form state initialization in request/page.tsx (lines 181-202)**
  - [ ] Add 5 new address fields to formData state for current address (addressLine, street, city, province, postalCode)
  - [ ] Add 5 new address fields to formData state for emergency contact address (emergencyContactAddressLine, emergencyContactStreet, emergencyContactCity, emergencyContactProvince, emergencyContactPostalCode)
  - [ ] Update initial state values for all address fields as empty strings
  - [ ] Update useEffect hook that loads data from context to parse single address field into 5 separate fields

## Task Group 5: Address Field Component Implementation - Current Address
- [ ] **Replace current address textarea with structured field group (lines 433-446)**
  - [ ] Remove Textarea component for address field
  - [ ] Create new structured address field group with 5 Input fields:
    - [ ] Address Line / House Number (placeholder: "e.g., 123 Main St")
    - [ ] Street / Barangay (placeholder: "e.g., Purok 1")
    - [ ] City / Municipality (Select dropdown with CITIES_BY_PROVINCE data)
    - [ ] Province (Select dropdown with PROVINCES data)
    - [ ] Postal Code (Input with 4-digit numeric only validation)
  - [ ] Arrange fields in responsive grid:
    - [ ] Row 1: Address Line + Street (2-column on desktop, 1-column on mobile)
    - [ ] Row 2: City + Province (2-column on desktop, 1-column on mobile)
    - [ ] Row 3: Postal Code (full-width)
  - [ ] Add proper labels and placeholders for each field
  - [ ] Ensure proper spacing between fields using consistent gap values

## Task Group 6: Address Field Component Implementation - Emergency Contact Address
- [ ] **Replace emergency contact address textarea with structured field group (lines 644-658)**
  - [ ] Remove Textarea component for emergency contact address field
  - [ ] Create new structured address field group with same 5-field structure as current address:
    - [ ] Address Line / House Number
    - [ ] Street / Barangay
    - [ ] City / Municipality (Select dropdown)
    - [ ] Province (Select dropdown)
    - [ ] Postal Code
  - [ ] Use same responsive grid layout as current address fields
  - [ ] Add proper labels and placeholders for each field
  - [ ] Ensure consistent styling with current address fields

## Task Group 7: Validation Updates
- [ ] **Update validation functions for new address structure**
  - [ ] Update `validateStep1()` function (lines 240-248) to validate all 5 current address fields:
    - [ ] Address Line: Min 3 chars, max 100 chars, required
    - [ ] Street/Barangay: Min 3 chars, max 100 chars, required
    - [ ] City: Required, must be in CITIES_BY_PROVINCE list
    - [ ] Province: Required, must be in PROVINCES list
    - [ ] Postal Code: 4-digit numeric format, required
  - [ ] Update validation error messages to reference specific field names
  - [ ] Update `validateStep2()` function to validate all 5 emergency contact address fields with same rules
  - [ ] Ensure validation runs before allowing user to proceed to next step
  - [ ] Display field-specific error states (red borders/backgrounds on invalid fields)

## Task Group 8: Form Event Handlers
- [ ] **Update form input change handlers**
  - [ ] Add change handlers for all 5 new current address fields
  - [ ] Add change handlers for all 5 new emergency contact address fields
  - [ ] Ensure handlers update formData state with new field values
  - [ ] Add City dropdown handler to populate cities based on selected Province
  - [ ] Add Province dropdown handler to reset City selection when Province changes

## Task Group 9: Form Submission & Data Mapping
- [ ] **Update form submission logic**
  - [ ] Modify form submission handler to combine 5 address fields into single `address` field using formatAddressFromFields()
  - [ ] Modify form submission handler to combine 5 emergency contact address fields into single `emergencyContactAddress` field
  - [ ] Ensure formatted address strings are sent to database in expected format
  - [ ] Test that address data persists correctly through submission flow

## Task Group 10: Review Step Display
- [ ] **Update Step 3 review summary to display new address fields**
  - [ ] Update review section to show all 5 current address fields in readable format
  - [ ] Update review section to show all 5 emergency contact address fields in readable format
  - [ ] Format address fields for display (e.g., combine into readable address blocks)
  - [ ] Ensure review section is responsive and properly formatted on mobile
  - [ ] Add option to edit address fields from review step (if edit functionality exists)

## Task Group 11: Spacing & Layout Optimization
- [ ] **Optimize overall form spacing and layout**
  - [ ] Reduce `space-y-4` to `space-y-3` between cards in main container (line 344)
  - [ ] Reduce `space-y-6` to `space-y-5` within Card CardContent sections (lines 348, 453, 587)
  - [ ] Reduce `gap-4` to `gap-3` between field groups throughout form
  - [ ] Reduce bottom padding from `pb-40` to `pb-32` to account for fixed nav (line 290)
  - [ ] Verify all address field groups use consistent gap spacing
  - [ ] Ensure no excessive whitespace between logical sections

## Task Group 12: Responsive Design & Mobile Testing
- [ ] **Ensure responsive behavior across breakpoints**
  - [ ] Test address field grid on mobile (1-column layout) - all address fields stack vertically
  - [ ] Test address field grid on tablet (2-column layout) - Address Line + Street in row 1, City + Province in row 2
  - [ ] Test address field grid on desktop (2-column layout) - same as tablet
  - [ ] Verify Postal Code field is full-width on all screen sizes
  - [ ] Ensure Select dropdowns (City/Province) are touch-friendly on mobile
  - [ ] Verify no horizontal scrolling on any address fields
  - [ ] Ensure minimum touch target size of 44px for all interactive elements

## Task Group 13: Testing & Validation
- [ ] **Test complete form flow with new address structure**
  - [ ] Test navigating between form steps with valid address data
  - [ ] Test validation errors show when address fields are incomplete
  - [ ] Test validation errors show when Postal Code is not 4-digit numeric format
  - [ ] Test form submission successfully combines address fields
  - [ ] Test data persists when loading existing QRT request
  - [ ] Test address fields parse correctly from single address field in database
  - [ ] Test form with City/Province dropdowns populate correctly
  - [ ] Test Province change clears City selection appropriately
  - [ ] Test review step displays formatted address correctly

## Task Group 14: Visual & UX Refinement
- [ ] **Polish visual appearance and user experience**
  - [ ] Verify progress indicator displays cleanly with only 3 step bars
  - [ ] Verify smooth step transitions without visual jarring
  - [ ] Check color consistency for valid/invalid address field states
  - [ ] Ensure error messages are clear and help users fix issues
  - [ ] Verify labels and placeholders provide adequate guidance
  - [ ] Test that spacing feels consistent throughout entire form
  - [ ] Verify fixed bottom navigation doesn't overlap form content

## Task Group 15: Data Integration & Payment Flow
- [ ] **Ensure address changes work with payment and QRT ID issuance**
  - [ ] Test that address data flows correctly to payment step
  - [ ] Test that address data is included in QRT ID generation
  - [ ] Test that address appears correctly in NanoBanana card request data
  - [ ] Verify database stores formatted address string correctly
  - [ ] Test retrieving saved QRT request loads and parses address fields correctly
