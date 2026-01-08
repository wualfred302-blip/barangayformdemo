# Tasks: QRT ID Card Redesign

## Task Group 1: Data Model Enhancement
- [ ] **Add precinct field to QRT data types**
  - [ ] Update `lib/qrt-types.ts` to add `precinctNumber: string` field to `QRTIDRequest` interface
  - [ ] Add JSDoc comments explaining precinct field purpose and format
  - [ ] Ensure precinct field is optional initially for backward compatibility

- [ ] **Update QRT context for precinct data mapping**
  - [ ] Modify `lib/qrt-context.tsx` to include precinct field in type definitions
  - [ ] Update `dbRowToQRTIDRequest()` function to map precinct data from database rows
  - [ ] Add precinct to context state management if applicable
  - [ ] Verify all QRT request creations properly handle precinct field

## Task Group 2: Canvas Generator Updates
- [ ] **Enhance canvas generator to support precinct data**
  - [ ] Update `QRTIDData` interface in `lib/qrt-id-generator-canvas.ts` to include `precinctNumber: string`
  - [ ] Review current canvas dimensions (856px × 540px) and available space for new elements

- [ ] **Add Mawaque app logo to top LEFT of card**
  - [ ] Determine correct logo asset to use (linkod-app-logo-main.png vs mawaque-logo.png)
  - [ ] Load Mawaque logo image in canvas generator with proper CORS handling
  - [ ] Position logo at top LEFT with appropriate sizing (reference Bagong Pilipinas logo 45×40px)
  - [ ] Adjust logo opacity/transparency if needed to match card design
  - [ ] Test logo rendering on both front and back card sides

- [ ] **Reposition Bagong Pilipinas logo to top MIDDLE of card**
  - [ ] Calculate new center position for Bagong Pilipinas logo
  - [ ] Update canvas drawing code to move logo from current position to top MIDDLE
  - [ ] Verify logo placement maintains proper alignment with other header elements
  - [ ] Ensure logo doesn't overlap with newly positioned Mawaque logo on LEFT

- [ ] **Add precinct number display to bottom LEFT of card**
  - [ ] Determine precinct number styling (font size 18-24px bold, color matching card theme)
  - [ ] Draw precinct number text on bottom LEFT of card front (20-50px from bottom, 20-50px from left)
  - [ ] Apply appropriate color scheme (emerald for front, dark for back)
  - [ ] Decide if precinct display needs background badge/box for emphasis
  - [ ] Add label prefix if needed (e.g., "PRECINCT:" or just the number)
  - [ ] Test precinct rendering with various number formats

- [ ] **Test canvas generation with new elements**
  - [ ] Generate test cards with sample precinct numbers
  - [ ] Verify all new elements (logos, precinct number) render correctly
  - [ ] Test layout doesn't break with different precinct number lengths
  - [ ] Verify logo and precinct persist during download as PNG

## Task Group 3: Component Integration
- [ ] **Update ID card preview component for precinct support**
  - [ ] Modify `components/id-card-preview.tsx` to accept and handle `precinctNumber` prop
  - [ ] Pass precinct data through to canvas generator functions
  - [ ] Ensure preview updates when precinct data changes

- [ ] **Update QRT ID detail page to pass precinct data**
  - [ ] Modify `app/qrt-id/[id]/page.tsx` to fetch precinct data from QRT context
  - [ ] Pass `precinctNumber` prop to `IDCardPreview` component
  - [ ] Handle cases where precinct data may be missing or undefined
  - [ ] Test card preview renders with precinct information

## Task Group 4: Staff Dashboard Enhancement
- [ ] **Add precinct data to staff dashboard state and mock data**
  - [ ] Update mock QRT request data in `app/staff/qrt-management/page.tsx` to include `precinctNumber` for each sample request
  - [ ] Add precinct field to any request interface definitions in dashboard component
  - [ ] Ensure precinct data flows through existing data display logic

- [ ] **Add precinct column to list view**
  - [ ] Add new "Precinct" column header to list view table
  - [ ] Display `precinctNumber` value in list view for each QRT request
  - [ ] Position precinct column logically (suggested: after QRT code, before status)
  - [ ] Apply consistent styling and alignment with other columns

- [ ] **Implement precinct filtering functionality**
  - [ ] Create precinct filter dropdown/select menu in dashboard filters section
  - [ ] Populate filter dropdown with available precinct values from request data
  - [ ] Implement filter logic to show only requests matching selected precinct(s)
  - [ ] Add "All Precincts" or "Clear Filter" option to reset precinct filter
  - [ ] Test filtering with single and multiple precinct scenarios

- [ ] **Update Kanban view to include precinct information**
  - [ ] Add precinct as badge or text element on Kanban cards
  - [ ] Optionally group Kanban columns by precinct if applicable to workflow
  - [ ] Verify Kanban cards display precinct alongside existing status information
  - [ ] Test Kanban filtering respects precinct filter selection

- [ ] **Enhance search functionality to include precinct**
  - [ ] Update search logic to search within precinct numbers
  - [ ] Allow users to search by precinct value in search bar
  - [ ] Ensure search results include precinct information
  - [ ] Test search returns correct results when filtering by precinct

## Task Group 5: Testing & Quality Assurance
- [ ] **Test precinct field data flow**
  - [ ] Verify precinct data loads correctly from QRT context
  - [ ] Test precinct field propagates through all modified components
  - [ ] Verify missing precinct data is handled gracefully (no errors)
  - [ ] Test with various precinct number formats and lengths

- [ ] **Test card generation and visual rendering**
  - [ ] Generate QRT ID cards with precinct information displayed
  - [ ] Verify logo placements don't cause visual overlap or misalignment
  - [ ] Test card download functionality preserves all visual elements
  - [ ] Generate multiple test cards with different precinct numbers
  - [ ] Verify card appearance matches design specifications

- [ ] **Test staff dashboard functionality**
  - [ ] Verify precinct column displays correctly in list view
  - [ ] Test precinct filter dropdown works and filters accurately
  - [ ] Test Kanban view displays precinct information
  - [ ] Test search includes precinct in results
  - [ ] Verify all views update when precinct filter changes
  - [ ] Test with mock data containing multiple different precinct values

- [ ] **Cross-browser and responsive testing**
  - [ ] Test card preview and generation in Chrome, Firefox, Safari
  - [ ] Verify dashboard layout remains responsive with new precinct column
  - [ ] Test on mobile/tablet viewports if applicable
  - [ ] Verify logos render correctly across different browsers

## Task Group 6: Documentation & Cleanup
- [ ] **Update code documentation**
  - [ ] Add JSDoc comments to new precinct-related functions in canvas generator
  - [ ] Document precinct field in QRT types file
  - [ ] Add code comments explaining logo positioning logic
  - [ ] Update component props documentation to include precinct parameter

- [ ] **Update project documentation**
  - [ ] Create or update implementation guide documenting precinct feature
  - [ ] Document logo asset decisions and reasoning
  - [ ] Update dashboard feature documentation with precinct filtering guide
  - [ ] Add screenshots/examples of new card layout in spec documentation

- [ ] **Code cleanup and final verification**
  - [ ] Remove any debug console.log statements
  - [ ] Verify no unused imports in modified files
  - [ ] Check for any hardcoded values that should be configurable
  - [ ] Run linter/formatter on all modified files to ensure consistency
