# Production-Ready Barangay App Improvements

## Overview
This spec outlines 6 critical improvements to transform the barangay app from demo to production-ready: UI position swaps, payment system removal (making all services FREE), Request ID flow simplification, Supabase-backed announcements CMS, dynamic profile data, and privacy policy enforcement.

## Goals
- ✅ Remove payment friction (make all services FREE)
- ✅ Simplify user flows (use registration data, avoid redundancy)
- ✅ Ensure data persistence (Supabase-backed announcements)
- ✅ Legal compliance (enforce privacy policy acceptance)
- ✅ Dynamic user experience (profile barangay from address)
- ✅ Professional UX (proper empty states, clear messaging)

## Status
📋 **Phase**: Spec Complete, Ready for Implementation

## Key Changes

### 1. Homepage UI Swap
**Impact**: LOW | **Effort**: 5 minutes
- Swap Request ID and Bayanihan positions in service grid

### 2. Remove Payment System
**Impact**: CRITICAL | **Effort**: 4-6 hours
- Convert payment pages to "Coming Soon"
- Make certificate requests FREE (instant creation)
- Make QRT ID requests FREE (instant generation)
- Keep "Payments" tab visible (routes to coming soon)

### 3. Simplify Request ID Flow
**Impact**: MEDIUM | **Effort**: 3-4 hours
- Replace 3-step wizard with single-page confirmation
- Use registration data (no re-entry)
- Just confirm current address
- Generate QRT ID instantly (FREE)

### 4. Privacy Policy Enforcement
**Impact**: HIGH | **Effort**: 1-2 hours
- Add database columns for privacy acceptance tracking
- Block registration submit until checkbox checked
- Add API validation before saving data
- Backfill existing users with implicit consent

### 5. Dynamic Profile Barangay
**Impact**: LOW | **Effort**: 15 minutes
- Extract barangay name from user's registration address
- Display dynamically in profile subtitle
- Graceful fallback to "Mawaque" if not found

### 6. Supabase-Backed Announcements CMS
**Impact**: HIGH | **Effort**: 5-6 hours
- Create announcements database table
- Replace localStorage with Supabase queries
- Staff can create/edit/publish announcements
- Show "No updates yet" empty states
- Persistent data across devices/sessions

## Total Effort
**Estimated**: 14-19 hours (2-3 working days for 1 developer)

## Files to Modify

### Database
- `/supabase/migrations/007_create_announcements_table.sql` (NEW)
- `/supabase/migrations/008_add_privacy_policy_fields.sql` (NEW)

### Pages
- `/app/dashboard/page.tsx` - Swap positions, empty states
- `/app/register/page.tsx` - Privacy enforcement UI
- `/app/profile/page.tsx` - Dynamic barangay
- `/app/request/page.tsx` - Remove payment, make FREE
- `/app/qrt-id/request/page.tsx` - Complete rewrite (simplified)
- `/app/payment/page.tsx` - Convert to coming soon
- `/app/payment/history/page.tsx` - Convert to coming soon

### API Routes
- `/app/api/register/route.ts` - Privacy validation

### Contexts
- `/lib/announcements-context.tsx` - Replace localStorage with Supabase

## Dependencies
- Supabase database access
- Existing auth context (useAuth)
- Existing QRT context
- Existing certificate context

## Testing Requirements
- Unit tests for privacy validation
- Unit tests for barangay extraction
- Integration tests for all flows
- Manual testing checklist (see requirements.md)
- Cross-browser testing
- Edge case testing

## Rollback Plan
- Database: SQL scripts to drop new columns/tables
- Code: Git revert or Vercel rollback
- Each feature is independent (can rollback individually)

## Deployment Order
1. **Phase 1**: Database migrations (CRITICAL - DO FIRST)
2. **Phase 2**: Code deployment to staging
3. **Phase 3**: Testing and verification
4. **Phase 4**: Production deployment
5. **Phase 5**: Post-deployment monitoring

## Success Criteria
- All services are FREE (no payment processing)
- Privacy policy enforced BEFORE data save
- QRT ID simplified to 1-page address confirmation
- Announcements persist in Supabase database
- Profile barangay dynamically pulled from user data
- Zero data loss during migration
- All existing features continue to work

## Documentation
- `requirements.md` - Detailed technical requirements
- `clarifying-questions.md` - User decisions and approach
- `research-summary.md` - Codebase exploration findings

## Next Steps
1. Review and approve this spec
2. Run `/create-tasks` to generate implementation tasks
3. Run `/orchestrate-tasks` to begin implementation
4. Haiku will implement, Sonnet will review
