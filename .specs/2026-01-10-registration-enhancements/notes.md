# Registration Enhancements - Feature Spec

**Date:** 2026-01-10
**Status:** Planning

## Overview

This spec covers improvements to the registration section of the Barangay Form application, focusing on UX enhancements, address handling, identity verification, and data accuracy.

---

## Feature Scope

### 1. Get Started Button Styling
- **Current:** Blue/red gradient
- **Target:** Blue/green gradient to match "Linkod App" branding
- **Primary accent color:** `#22c55e` (green-500)
- Update button gradient to use blue-to-green color scheme

### 2. Address Seeding and Autocomplete
- Seed database with all Philippine barangay addresses
- Implement cascading dropdown system:
  - Region → Province → City/Municipality → Barangay
- Auto-match parsed ID information to matching addresses
- Provide autocomplete suggestions as user types

### 3. Selfie Capture Section
- Add selfie capture functionality for QRT ID verification
- Implement automatic lighting detection
  - Warn user if lighting is too dark/bright
- Face clarity validation
  - Ensure face is clearly visible and in frame
  - Check for blur/motion artifacts

### 4. Zipcode Auto-Matching
- Automatically determine zipcode based on selected/parsed address
- Match parsed ID information to appropriate zipcode
- Validate zipcode accuracy against address database

---

## Technical Considerations

- Philippine Geographic Standards (PSGC) data source for addresses
- Camera API integration for selfie capture
- Image processing for lighting/face detection
- Form validation and UX feedback

---

## Next Steps

- [ ] Detailed technical design
- [ ] UI/UX mockups
- [ ] Implementation tasks breakdown
- [ ] Testing criteria
