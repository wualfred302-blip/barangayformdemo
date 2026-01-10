# Clarifying Questions - Registration Fixes and Directory Lists

**Date**: January 9, 2026
**Spec Folder**: `agent-os/specs/2026-01-09-registration-fixes-and-directory/`

---

## Privacy Policy Checkbox Issue

### Question 1: Expected Checkbox Behavior
**What is the expected behavior when a user checks the privacy policy checkbox?**
- Should the checkbox be required (user cannot proceed without checking)?
- Should checking it store a timestamp of when consent was given?
- Should it store a boolean true/false or a more detailed consent record?
- Is there a version number for the privacy policy that should be tracked?

### Question 2: Error Handling
**What should happen if a user tries to register without checking the privacy policy?**
- Show a validation error?
- Disable the submit button?
- Display a tooltip or message?
- What is the error message text?

### Question 3: Database Field
**Is there already a database field for privacy policy consent?**
- If yes, what is the table and field name?
- If no, should we create one? What type (boolean, timestamp, text)?
- Should this be part of the users table or a separate consent tracking table?

---

## Barangay Directory Lists

### Question 4: Directory Scope
**What specific directory lists need to be completed?**
- Staff directory?
- QRT members directory?
- Residents directory?
- Officials directory?
- Emergency contacts directory?
- Other directories?

### Question 5: Directory Data Sources
**Where should the directory data come from?**
- Should directories pull from existing registration data?
- Is there external data to import?
- Should directories be manually maintained by staff?
- Are there specific data fields required for each directory type?

### Question 6: Directory Completeness
**What does "complete" mean for each directory?**
- Full listing of all barangay members?
- Minimum number of entries?
- Specific categories or groupings?
- Required metadata or fields for each entry?

---

## Table and Form Mapping Audit

### Question 7: Registration Forms Inventory
**What are ALL the registration forms in the system?**
- User registration form?
- QRT ID registration form?
- Official registration form?
- Staff onboarding form?
- Other forms?

### Question 8: Validation Requirements
**What validation rules should be enforced?**
- Which fields are required vs optional?
- Are there specific format requirements (phone numbers, addresses, etc.)?
- Should validation be client-side, server-side, or both?
- Are there any conditional field requirements?

### Question 9: Data Migration Concerns
**Are there existing users who might have missing data?**
- Should we backfill any missing fields?
- How should we handle legacy data that doesn't match new requirements?
- Do we need a migration script?

---

## Privacy Policy UI Alignment

### Question 10: Design Specifications
**What is the desired layout for the privacy policy section?**
- Should the checkbox be inline with the text or on a separate line?
- What is the preferred alignment (left, center, justified)?
- Should there be specific spacing between the checkbox and text?
- Are there design mockups or examples to follow?

### Question 11: Link Behavior
**How should the privacy policy link work?**
- Open in a new tab/window?
- Show a modal with the full policy?
- Navigate to a dedicated policy page?
- Should users be able to read the policy without losing their form data?

### Question 12: Mobile Responsiveness
**How should the privacy policy section display on mobile devices?**
- Should the layout change for smaller screens?
- Are there specific breakpoints to consider?
- Should text size or spacing adjust for mobile?

---

## General Questions

### Question 13: Testing Requirements
**What testing should be performed after fixes?**
- Should there be automated tests written?
- Manual testing scenarios?
- Specific browsers or devices to test on?
- Should existing users be tested for data integrity?

### Question 14: Deployment Considerations
**Are there any deployment or rollout concerns?**
- Should changes be staged or deployed all at once?
- Is there a maintenance window required?
- Should there be a rollback plan?
- Are there any dependencies on other systems?

### Question 15: Priority and Timeline
**What is the priority order for these fixes?**
- Should the checkbox fix be deployed immediately?
- Can directory completion happen in phases?
- What is the deadline or urgency level?
- Are there any business dependencies or events driving the timeline?

---

## To Be Answered

Please provide answers to these questions to help guide the implementation phase. Additional questions may arise during the research and investigation phase.
