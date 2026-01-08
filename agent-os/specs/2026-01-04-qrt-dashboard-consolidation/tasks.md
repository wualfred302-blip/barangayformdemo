# Tasks: QRT ID Dashboard Consolidation

## Task Group 1: Data Integration & Type Definitions
- [ ] **Define unified data types for consolidated requests**
  - [ ] Create `CombinedRequest` union type to represent certificates, bayanihan, and QRT IDs
  - [ ] Define status mapping across all three document types (pending/processing/ready/issued/completed/resolved)
  - [ ] Export type definitions in appropriate lib file for reuse

- [ ] **Verify context availability in requests page**
  - [ ] Import and test `useQRT()` context in `/app/requests/page.tsx`
  - [ ] Verify `useCertificates()` and `useBayanihan()` contexts are already available
  - [ ] Confirm all three contexts provide loading and error states

## Task Group 2: Core Requests Page Consolidation
- [ ] **Integrate QRT IDs into combined requests array**
  - [ ] Import QRT context and types into `/app/requests/page.tsx`
  - [ ] Create array combining certificates, bayanihan, and QRT ID requests
  - [ ] Implement sorting by creation date across all three data types
  - [ ] Ensure data is properly typed as `CombinedRequest` union type

- [ ] **Update filter logic to support QRT status groups**
  - [ ] Extend existing filter mechanism (all/processing/ready) to handle QRT statuses
  - [ ] Map QRT statuses (pending/processing/ready/issued) to display groups
  - [ ] Test that "Processing" group shows pending and processing QRT IDs
  - [ ] Test that "Ready" group shows ready and issued QRT IDs
  - [ ] Verify existing certificate and bayanihan filtering still works

- [ ] **Render QRT ID cards in consolidated list**
  - [ ] Add QRT ID card component to the requests list JSX
  - [ ] Use CreditCard icon (#10B981 green) for QRT ID cards
  - [ ] Include QRT status badge component in card display
  - [ ] Display QRT ID number and creation date in card
  - [ ] Implement click handler to navigate to `/qrt-id/[id]` detail page
  - [ ] Style QRT cards consistently with certificate and bayanihan cards

- [ ] **Handle loading and error states for all three sources**
  - [ ] Display loading skeleton/spinner while any of the three contexts are loading
  - [ ] Handle and display errors from any of the three data sources
  - [ ] Test behavior when one or more contexts fail to load
  - [ ] Ensure empty states work correctly when no requests exist

## Task Group 3: Empty State & Call-to-Action Updates
- [ ] **Update empty state messaging and actions**
  - [ ] Modify empty state text to indicate users can request any document type
  - [ ] Create action button(s) for requesting new QRT ID
  - [ ] Ensure "Request Certificate" and "Bayanihan" buttons remain available
  - [ ] Test empty state displays when no requests of any type exist
  - [ ] Test empty state with mix of request types present

## Task Group 4: Color & Style Consistency
- [ ] **Align color scheme across all request types**
  - [ ] Audit current green colors: QRT (#10B981) vs Certificate (#00C73C)
  - [ ] Decide on single color scheme for consolidated view or maintain distinction
  - [ ] Update QRT status badge color if unifying color scheme
  - [ ] Verify all status badges use consistent colors across request types
  - [ ] Test visual hierarchy and distinction between request type icons

## Task Group 5: Navigation & Entry Points
- [ ] **Update dashboard service grid navigation**
  - [ ] Modify "Request ID" service grid icon to navigate to `/requests` (consolidated view)
  - [ ] OR update to show all request options if keeping separate flow
  - [ ] Verify service grid still provides quick-access experience
  - [ ] Test that all service icons navigate to correct destinations

- [ ] **Verify and update request creation return navigation**
  - [ ] Test `/qrt-id/request` form returns to `/requests` after submission
  - [ ] Verify certificate request form return navigation
  - [ ] Verify bayanihan request form return navigation
  - [ ] Ensure back buttons in request forms navigate logically

## Task Group 6: QRT ID Detail Page & Routing
- [ ] **Ensure QRT ID detail pages remain accessible**
  - [ ] Verify `/qrt-id/[id]` detail page still works when navigated from `/requests`
  - [ ] Test detail page loads correct QRT ID data
  - [ ] Confirm back navigation from detail page works
  - [ ] Verify detail page can be accessed directly via URL

## Task Group 7: Legacy QRT ID Section Handling
- [ ] **Plan deprecation of standalone QRT ID section**
  - [ ] Decide whether to remove `/qrt-id` page or convert to redirect
  - [ ] If redirecting: implement redirect from `/qrt-id` to `/requests?filter=qrt`
  - [ ] OR remove `/qrt-id/page.tsx` entirely if fully consolidated
  - [ ] Keep `/qrt-id/request/page.tsx` for request creation flow
  - [ ] Document deprecation strategy for users with bookmarks

## Task Group 8: Bottom Navigation Verification
- [ ] **Verify bottom navigation still works correctly**
  - [ ] Test "Requests" button in bottom nav navigates to `/requests`
  - [ ] Confirm consolidated view displays properly from bottom nav
  - [ ] Verify "Home", "Services", "News", "Profile" navigation unaffected
  - [ ] Test across different device sizes

## Task Group 9: Testing & Validation
- [ ] **Integration testing of consolidated view**
  - [ ] Test filter switching (all → processing → ready) with mixed request types
  - [ ] Verify data loads correctly from all three contexts simultaneously
  - [ ] Test navigation to detail pages for each request type
  - [ ] Test empty states and edge cases (no data, partial data, errors)

- [ ] **Cross-browser and device testing**
  - [ ] Test consolidated view on mobile, tablet, desktop
  - [ ] Verify responsive layout works with longer lists
  - [ ] Test bottom navigation accessibility on mobile

- [ ] **Navigation flow testing**
  - [ ] Test end-to-end flow: Dashboard → Services → Request ID → Consolidated View
  - [ ] Test end-to-end flow: Dashboard → Requests Tab → Consolidated View
  - [ ] Test request creation flows from consolidated view
  - [ ] Test back navigation from detail pages
  - [ ] Test direct URL access to detail pages

## Task Group 10: Documentation & Cleanup
- [ ] **Update codebase documentation**
  - [ ] Add comments explaining unified request data structure in requests page
  - [ ] Document status mapping between different request types
  - [ ] Update any architectural diagrams or flow docs
  - [ ] Add inline comments for complex filtering logic

- [ ] **Remove or clean up unused code**
  - [ ] Evaluate if original `/app/qrt-id/page.tsx` can be removed
  - [ ] Clean up any duplicate filtering or sorting logic
  - [ ] Remove unused imports from requests page
  - [ ] Verify no dead code paths remain

- [ ] **Update git status and commit**
  - [ ] Verify all modified files compile without errors
  - [ ] Check for any TypeScript errors in modified pages
  - [ ] Run any existing linting tools to ensure code quality
  - [ ] Prepare commit message documenting consolidation changes
