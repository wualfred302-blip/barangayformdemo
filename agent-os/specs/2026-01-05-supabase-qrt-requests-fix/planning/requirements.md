# Requirements: Fix Supabase QRT ID and /requests Section Issues

## Problem Statement

Users are experiencing persistent issues when submitting barangay clearance/QRT ID requests:

1. **Empty /requests Section**: After submitting a QRT ID request and completing payment, the /requests page shows "No requests found" even though 43 QRT IDs exist in the Supabase database
2. **Supabase MCP Authentication Failure**: The Supabase MCP plugin requires localhost OAuth authentication which fails in browser-based IDEs (like the user's Firebase IDE environment)
3. **Token Drain**: The recurring investigation and debugging of these issues consumes excessive tokens

## User Impact

- **User frustration**: Users complete the entire request and payment flow but cannot see their submissions
- **Loss of confidence**: Users believe their requests were lost
- **Development friction**: Cannot use Supabase MCP tools for schema inspection and debugging
- **Cost impact**: Repeated debugging sessions drain token budgets

## Root Causes Identified

### Issue 1: User ID Mismatch in Filtering
**Discovery**: Database contains 43 QRT IDs with `user_id` values like `user_1767563860928` (timestamp-based IDs)

**Problem**: The `/requests` page filters QRT IDs using `getUserQRTIds(user.id)` but the `user.id` from the auth context doesn't match the `user_id` stored in the database

**Location**:
- `/app/requests/page.tsx` (line 57)
- `/lib/qrt-context.tsx` (getUserQRTIds function)

**Impact**: All QRT IDs are filtered out, resulting in empty display

### Issue 2: Supabase MCP Authentication
**Problem**: The `supabase@claude-plugins-official` plugin attempts to launch a localhost OAuth flow which fails in browser IDEs

**Current State**: Plugin is enabled in `.claude/settings.local.json` but unusable

**Impact**: Cannot use MCP tools for direct database inspection, schema queries, or SQL execution

### Issue 3: Silent Data Persistence Issues (Secondary)
**Problem**: Even though data IS being saved (43 records exist), the application flow doesn't provide clear feedback about success/failure

**Impact**: Users and developers can't easily verify if operations succeeded

## Requirements

### Requirement 1: Fix User ID Filtering (CRITICAL)
**Goal**: Ensure users can see their own QRT ID requests in the /requests section

**Acceptance Criteria**:
- [ ] Users see QRT IDs they created in the /requests page
- [ ] User ID matching works consistently across authentication and database storage
- [ ] Filtering logic correctly matches user identity with database records
- [ ] No false negatives (hiding records that should appear)
- [ ] No false positives (showing other users' records)

**Technical Approach**:
- Investigate user ID generation in both auth context and QRT creation flow
- Ensure consistent user ID format throughout the application
- Fix getUserQRTIds filtering logic
- Add user ID debugging capabilities

### Requirement 2: Bypass Supabase MCP Authentication
**Goal**: Provide direct Supabase access without MCP OAuth requirements

**Acceptance Criteria**:
- [ ] Can inspect database schema without MCP authentication
- [ ] Can query tables directly via command-line tools
- [ ] Can execute SQL migrations via scripts
- [ ] Can verify data persistence programmatically
- [ ] No dependency on localhost OAuth flows

**Technical Approach**:
- Create direct Supabase client scripts using environment variables
- Provide CLI tools for common database operations
- Document alternative workflows for schema inspection
- Optionally disable Supabase MCP plugin to avoid confusion

### Requirement 3: Add Data Verification Tools
**Goal**: Provide visibility into database state for debugging

**Acceptance Criteria**:
- [ ] Can list all QRT IDs with user associations
- [ ] Can check user ID format and consistency
- [ ] Can verify records were saved after form submission
- [ ] Can inspect schema structure programmatically
- [ ] Tools work in browser IDE environment

**Technical Approach**:
- Create inspection scripts (already started: `scripts/inspect-supabase-schema.js`)
- Add user-specific data queries
- Provide comparison tools for auth user vs database user IDs

### Requirement 4: Fix Email Field Schema Mismatch (LOW PRIORITY)
**Goal**: Align TypeScript interface with database schema

**Acceptance Criteria**:
- [ ] No undefined fields in database mappings
- [ ] TypeScript interface matches actual database columns
- [ ] No silent null assignments

**Technical Approach**:
- Either add email column to database schema OR remove from TypeScript interface
- Update dbRowToQRTID mapping function

### Requirement 5: Improve Error Visibility
**Goal**: Make data persistence failures obvious to users and developers

**Acceptance Criteria**:
- [ ] Users see clear success/error messages after form submission
- [ ] Developers can easily diagnose why /requests is empty
- [ ] Console logs provide actionable debugging information
- [ ] Error states are surfaced in the UI

**Technical Approach**:
- Add user-facing success toasts after QRT creation
- Enhance error logging with context
- Add debugging mode for developers
- Display helpful messages when /requests is empty

## Constraints

- **Browser IDE Environment**: Solution must work without localhost access
- **Supabase Free Tier**: Limited to free tier capabilities
- **No Breaking Changes**: Fix must not disrupt existing working features
- **Token Efficiency**: Solutions should minimize future debugging token usage
- **User Transparency**: Users should understand what's happening with their data

## Success Metrics

1. **Primary**: Users can see their QRT ID requests in /requests after submission
2. **Secondary**: Developers can inspect database without MCP authentication
3. **Tertiary**: Future similar issues can be debugged in <5 minutes

## Out of Scope

- Migration of existing 43 QRT IDs (unless required for user ID fix)
- Complete QRT ID flow redesign
- Payment system changes
- Authentication system changes
- Performance optimization

## Related Issues

- Certificate requests similar user filtering (already fixed in previous session)
- Payment integration (working correctly)
- User authentication (working correctly)

## Technical Context

**Current Database State**:
- 43 QRT IDs in `qrt_ids` table
- All have status: "ready"
- User IDs format: `user_[timestamp]` (e.g., `user_1767563860928`)
- No email field in schema (but expected by code)

**Stack**:
- Next.js 15.1.11 with App Router
- Supabase (PostgreSQL)
- React Context API for state management
- TypeScript
- Browser-based IDE environment

**Existing Tools Created**:
- `scripts/inspect-supabase-schema.js` - Direct schema inspection (✅ working)
