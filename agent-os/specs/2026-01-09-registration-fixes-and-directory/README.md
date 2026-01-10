# Registration Fixes and Directory Lists

**Spec ID**: 2026-01-09-registration-fixes-and-directory
**Date Created**: January 9, 2026
**Status**: Initialized
**Priority**: Critical

---

## Overview

This specification addresses critical issues with the barangay registration system, focusing on fixing a blocking bug with the privacy policy checkbox, completing directory lists, auditing database-to-form mappings, and fixing UI alignment issues.

---

## Quick Summary

### Critical Issue
The privacy and policy checkbox is not registering during user registration even when checked. This is the **only missing parameter preventing successful registration** and requires immediate attention.

### Additional Scope
- Complete barangay directory lists
- Audit all database tables and forms to ensure 1:1 field mapping
- Fix privacy policy text spacing and alignment issues

---

## Spec Documents

### 1. [Requirements](./requirements.md)
Detailed problem statement, objectives, scope, and technical investigation areas.

### 2. [Clarifying Questions](./clarifying-questions.md)
Questions that need to be answered to guide implementation decisions.

### 3. [Tasks](./tasks.md)
Comprehensive task breakdown organized by implementation phases.

### 4. [Research Summary](./research-summary.md) *(To Be Created)*
Technical findings from investigating the codebase and identifying root causes.

---

## Problem Breakdown

### 1. Privacy Policy Checkbox Bug (CRITICAL)
- **Symptom**: Users can check the checkbox but registration still fails
- **Impact**: Blocks all new user registrations
- **Root Cause**: Unknown (requires investigation)
- **Suspected Issues**:
  - Checkbox value not captured in form state
  - Value not sent in API request
  - Missing database field
  - Backend not processing the value

### 2. Incomplete Directory Lists
- **Issue**: Barangay directory lists are not complete
- **Impact**: Missing data affects directory functionality
- **Needs**: Identification of missing data and completion strategy

### 3. Form/Table Mapping Issues
- **Issue**: Potential misalignment between form fields and database schema
- **Impact**: Could cause registration failures or data loss
- **Needs**: Comprehensive audit and documentation of all mappings

### 4. Privacy Policy UI Issues
- **Issue**: Poor spacing and alignment of privacy policy text
- **Impact**: Affects user experience and visual presentation
- **Needs**: CSS/styling fixes for proper alignment

---

## Implementation Strategy

### Phase 1: Research (4-6 hours)
- Investigate the codebase to understand current implementation
- Identify root causes of all issues
- Document findings and create implementation plan

### Phase 2: Critical Fix (3-4 hours)
- Fix the privacy policy checkbox bug
- Test thoroughly
- Deploy independently if possible

### Phase 3: UI Fix (1-2 hours)
- Fix alignment and spacing issues
- Test across devices and browsers

### Phase 4: Directory Completion (4-6 hours)
- Identify and gather missing directory data
- Import/seed data into system
- Verify completeness

### Phase 5: Mapping Audit (6-8 hours)
- Audit all form-to-table mappings
- Fix identified issues
- Update documentation

### Phase 6: Testing (4-6 hours)
- Comprehensive end-to-end testing
- Cross-browser and device testing
- Performance and accessibility testing

### Phase 7: Deployment (2-3 hours)
- Documentation updates
- Staged deployment
- Production verification

---

## Success Metrics

- [ ] Users can successfully complete registration with privacy policy consent captured
- [ ] Privacy policy checkbox value properly saved to database
- [ ] All barangay directory lists are complete and functional
- [ ] All registration forms have verified 1:1 mapping with database tables
- [ ] Privacy policy UI is properly aligned and spaced
- [ ] Zero registration failures due to missing or misconfigured fields
- [ ] All tests passing
- [ ] No regressions in existing functionality

---

## Key Files to Investigate

### Registration System
- Registration form components (TBD)
- Privacy policy checkbox component (TBD)
- Form submission handlers (TBD)
- Registration API endpoints (TBD)

### Database
- User/registration table schemas (TBD)
- Migration files (TBD)
- Supabase configuration (TBD)

### Directory System
- Directory list components (TBD)
- Directory data sources (TBD)
- Directory seeding scripts (TBD)

### Styling
- Privacy policy component styles (TBD)
- Form layout styles (TBD)
- Global CSS/Tailwind configuration (TBD)

---

## Dependencies

- Supabase database access
- Next.js frontend framework
- Form validation library (to be identified)
- UI component library (to be identified)

---

## Risk Assessment

### High Risk
- Privacy checkbox fix could have unintended side effects
- Database migrations could affect existing users
- Changes to validation could break existing flows

### Mitigation Strategies
- Thorough testing before deployment
- Create database backups before migrations
- Stage changes in non-production environment first
- Create rollback plan
- Monitor closely after deployment

---

## Timeline

**Estimated Total Time**: 24-35 hours

**Critical Path**:
1. Research and identify checkbox bug (4-6h)
2. Fix checkbox bug (3-4h)
3. Test and deploy fix (2-3h)

**Target Completion**: TBD based on priority and resources

---

## Related Specs

- None identified yet (this appears to be foundational registration work)

---

## Notes

- This is a **blocking critical bug** that prevents user registration
- Privacy checkbox fix should be prioritized above all other work in this spec
- Consider deploying the checkbox fix independently before other improvements
- Thorough testing is essential as this affects the core registration flow
- All changes should be carefully reviewed due to the critical nature of registration

---

## Status Updates

### January 9, 2026 - Spec Initialized
- Created spec folder structure
- Documented requirements and problem statement
- Created clarifying questions
- Outlined implementation tasks
- Ready for research phase

---

## Next Actions

1. Begin research phase to investigate checkbox bug
2. Trace data flow from UI through to database
3. Identify root cause of registration failure
4. Document findings in research-summary.md
5. Get answers to clarifying questions
6. Prioritize and begin implementation
