# Registration Fixes and Directory Lists - Requirements

**Date**: January 9, 2026
**Status**: Initialized - Awaiting Research
**Spec Folder**: `agent-os/specs/2026-01-09-registration-fixes-and-directory/`

---

## Executive Summary

This spec covers critical fixes and improvements to the barangay registration system and directory functionality. The primary focus is on fixing the privacy and policy checkbox registration issue that is blocking user registration, completing the barangay directory lists, auditing database tables and forms for proper 1:1 mapping, and fixing UI alignment issues with the privacy policy text.

---

## Problem Statement

### Critical Issues

1. **Privacy Policy Checkbox Not Registering**
   - Users can check the privacy and policy checkbox during registration
   - The checkbox state is not being captured or sent with the registration form
   - This is the ONLY missing parameter preventing successful registration
   - Needs immediate investigation and fix

2. **Incomplete Barangay Directory Lists**
   - Barangay directory lists are incomplete
   - Need to complete all directory entries for proper system functionality

3. **Form and Table Mapping Audit**
   - Need to audit all database tables and registration forms
   - Ensure 1:1 field mapping with no missing or misaligned fields
   - Verify no registration issues exist due to data model mismatches

4. **Privacy Policy UI Alignment**
   - The privacy and policy checkbox text has spacing/alignment issues
   - Not properly aligned with the rest of the paragraph
   - Affects visual presentation and user experience

---

## Objectives

### Primary Objectives

1. Fix the privacy and policy checkbox to properly register user consent
2. Complete all barangay directory lists
3. Conduct comprehensive audit of table-to-form field mappings
4. Fix privacy policy text spacing and alignment

### Success Criteria

- Users can successfully register with privacy policy consent properly captured
- All barangay directory lists are complete and functional
- All registration forms have verified 1:1 mapping with database tables
- Privacy policy text is properly aligned and spaced
- Zero registration failures due to missing or misconfigured fields

---

## Scope

### In Scope

- Privacy and policy checkbox functionality fix
- Barangay directory completion
- Database schema to form field audit
- Privacy policy UI alignment fixes
- Registration flow testing and validation

### Out of Scope

- Major redesigns of the registration system
- Changes to privacy policy content (only layout/alignment)
- New features or functionality beyond fixing current issues

---

## Technical Investigation Required

### 1. Privacy Policy Checkbox Issue

**Files to Investigate**:
- Registration form components
- Form submission handlers
- Database schema for user/registration tables
- Privacy policy checkbox component
- Form validation logic

**Questions to Answer**:
- Where is the checkbox rendered?
- What is the field name/value being tracked?
- Is the checkbox state in the form data object?
- Is it being sent in the API request?
- Is there a database field to receive this value?
- Are there validation rules preventing submission?

### 2. Barangay Directory Lists

**Files to Investigate**:
- Directory data files or database tables
- Directory list components
- Data seeding scripts
- Directory API endpoints

**Questions to Answer**:
- What directory lists exist currently?
- What data is missing from each directory?
- Where is directory data stored (database, static files)?
- What is the expected complete structure?

### 3. Table and Form Mapping Audit

**Files to Investigate**:
- All registration-related database schemas
- All registration form components
- Type definitions and interfaces
- Form validation schemas

**Questions to Answer**:
- What are all the registration forms in the system?
- What database tables do they map to?
- Are all form fields represented in the database?
- Are there any nullable/required field mismatches?
- Are there any type mismatches?

### 4. Privacy Policy Alignment

**Files to Investigate**:
- Privacy policy component/section
- Registration form styling
- Checkbox component styling

**Questions to Answer**:
- Where is the spacing issue occurring?
- What CSS classes or inline styles are applied?
- Is it a flexbox/grid alignment issue?
- Is there extra margin/padding causing misalignment?

---

## Research Phase Tasks

1. Locate and analyze registration form implementation
2. Trace privacy policy checkbox data flow from UI to database
3. Review database schema for privacy consent field
4. Identify all barangay directory lists and their data sources
5. Create inventory of all registration forms and their corresponding database tables
6. Document current field mappings and identify gaps
7. Analyze privacy policy UI styling and layout
8. Document all findings in research-summary.md

---

## Next Steps

1. Conduct technical research and investigation
2. Document findings in research-summary.md
3. Create clarifying-questions.md if needed
4. Develop implementation tasks in tasks.md
5. Begin implementation based on prioritized fixes

---

## Related Files (To Be Discovered)

- Registration form components (TBD)
- Privacy policy component (TBD)
- User/registration database schemas (TBD)
- Directory list components (TBD)
- Form validation logic (TBD)

---

## Notes

- This is a critical bug fix that is blocking user registration
- Priority should be given to the checkbox fix as it's preventing system usage
- Audit should be thorough to prevent similar issues in the future
- All fixes should be tested thoroughly before deployment
