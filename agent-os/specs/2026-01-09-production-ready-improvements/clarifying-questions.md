# Clarifying Questions and Decisions

## Initial Context
The user provided a screenshot of the homepage and described the following requirements:
1. Swap Request ID and Bayanihan positions in the homepage
2. Disable payments completely but keep the section with "Coming Soon"
3. Revamp Request ID process to use registration data (confirm address only)
4. Make Barangay Updates functional/dynamic with Supabase
5. Make profile dynamic to registration information (not hardcoded)
6. Enforce privacy policy acceptance before saving registration data

---

## Question 1: Request ID Flow - How much should users fill out?

**Asked**: For the Request ID flow using registration data - how much of the form should users still fill out?

**Options Presented**:
- **Just confirm current address (Recommended)** ✅ SELECTED
  - Show their registration info pre-filled, only ask them to confirm if their address is still current. Simplest flow since we already have their data.
- Pre-fill everything, let them edit
  - Show the full form but pre-populated with registration data. They can update any field if needed before submitting.
- Skip form entirely, just generate ID
  - Since we have all data from registration, just let them request the ID with one click. Ask for address confirmation in a simple modal.

**User's Choice**: ✅ **Just confirm current address (Recommended)**

**Rationale**: Simplest UX - users just need to verify their address is still current. All other data comes from registration. Reduces friction and form fatigue.

**Implementation Impact**:
- Complete rewrite of `/app/qrt-id/request/page.tsx`
- Remove 3-step wizard
- Single page with: user info display + address confirmation checkbox + submit button
- Generate QRT ID instantly (no payment step)

---

## Question 2: Payment Flow - What happens to requests that currently require payment?

**Asked**: When disabling payments - what should happen to certificate/QRT ID requests that currently require payment?

**Options Presented**:
- **Make all requests free (Recommended)** ✅ SELECTED
  - Remove payment step entirely. After requesting certificate/ID, directly process and issue it for free.
- Show 'Coming Soon' for paid requests
  - Keep certificate/ID request forms but show 'Payment coming soon' message. Don't issue documents until payment is implemented.
- Keep offline payment option
  - Remove online payment processor but allow requests to go through. Show message like 'Pay at barangay hall' and mark as pending payment.

**User's Choice**: ✅ **Make all requests free (Recommended)**

**Rationale**: Remove friction completely. Focus on getting users to use the system. Payment can be re-enabled later if needed.

**Implementation Impact**:
- Remove redirect to payment page in certificate requests
- Remove redirect to payment page in QRT ID requests
- Set amount = 0 for all new requests
- Set payment_reference = "FREE-{timestamp}"
- Issue documents immediately (certificates: status = "processing", QRT IDs: status = "ready")
- Convert `/app/payment/page.tsx` to "Coming Soon"
- Convert `/app/payment/history/page.tsx` to "Coming Soon"

---

## Question 3: Barangay Updates CMS - Full system now or start simpler?

**Asked**: For Barangay Updates - should I create a full Supabase-backed CMS system now or start simpler?

**Options Presented**:
- **Full Supabase CMS (Recommended)** ✅ SELECTED
  - Create announcements table, migrate staff interface to use database. Captain can post and it's persistent. Show 'No updates yet' if table is empty.
- Keep current, just show empty state
  - Don't change the storage mechanism now, just update UI to show 'No updates yet' when there are no announcements.

**User's Choice**: ✅ **Full Supabase CMS (Recommended)**

**Rationale**: Production-ready requires persistent data. localStorage is not suitable for production. Announcements need to persist across devices and sessions.

**Implementation Impact**:
- Create `/supabase/migrations/007_create_announcements_table.sql`
- Complete rewrite of `/lib/announcements-context.tsx` to use Supabase
- Update `/app/dashboard/page.tsx` with proper empty states
- Staff CMS at `/app/staff/announcements/page.tsx` will use new Supabase backend
- Add RLS policies for public read, staff manage
- Add indexes for performance

---

## Question 4: Privacy Policy Enforcement - Where to prevent data save?

**Asked**: For privacy policy enforcement - where should we prevent the data save?

**Options Presented**:
- **Block submit button until checked (Recommended)** ✅ SELECTED
  - Disable the submit button until privacy checkbox is checked. Current validation already prevents submit, just need to add storage check.
- Check before API call only
  - Allow button click but add validation in the registration API before saving to Supabase. Return error if not accepted.

**User's Choice**: ✅ **Block submit button until checked (Recommended)**

**Rationale**: Defense in depth - prevent at UI level AND add API validation. Better UX to show button disabled rather than allowing click then showing error.

**Implementation Impact**:
- Add `disabled={isLoading || !formData.agreedToTerms}` to submit button
- Add visual warning message when checkbox unchecked
- Add CSS for disabled button state
- Add API validation in `/app/api/register/route.ts`
- Create migration to add privacy columns to residents table
- Backfill existing users with privacy_policy_accepted = true

---

## Question 5: Payment History Page - Keep, convert, or remove?

**Asked**: What should happen to the Payment History page (/payment/history) that shows past transactions?

**Options Presented**:
- Keep it functional (Recommended)
  - Users who already paid can still view their receipts and transaction history. New users won't have any payments to see.
- Convert to 'Coming Soon'
  - Replace the entire payment history page with a 'Coming Soon' message, matching the main payment page.
- Remove the tab entirely
  - Remove 'Payments' from the dashboard tabs completely. No access to payment history at all.

**User's Response**: "Retain the tab on the dashboard, just remove the payment functionality. Completely. the payment processor. Everything."

**Interpretation**: ✅ **Convert to 'Coming Soon' + Keep tab visible**

**Rationale**: User wants payment processor completely gone, but keep the UI structure (tab) for potential future use.

**Implementation Impact**:
- Convert `/app/payment/history/page.tsx` to "Coming Soon" page
- Keep "Payments" tab on dashboard (routes to `/payment/history`)
- Tab shows coming soon message instead of transaction history
- Remove all payment processor logic (GCash, Maya, Bank Transfer)
- Keep payment-related data in database (non-breaking, for future use)

---

## Additional Context from User

**User's Background**:
> "I want to give you complete agency, here are the tasks I want you to complete with a method I want you to follow, but at the end of the day you are my enterprise software engineer thats worked for vercel/airbnb."

**Interpretation**: User expects:
- Production-quality code (Vercel/Airbnb standards)
- Clean architecture and best practices
- Comprehensive error handling
- Backward compatibility considerations
- Proper testing and rollback strategies
- Zero data loss during migrations

**Implementation Philosophy**:
- Defense in depth (UI + API validation)
- Graceful degradation (fallbacks for missing data)
- Performance-first (database indexes, efficient queries)
- User-centric (clear empty states, helpful error messages)
- Production-ready (monitoring, rollback plans, testing)

---

## User's Methodology Requirements

**Agent Roles** (specified by user):
- **Sonnet** for orchestration (planning, coordination)
- **Sonnet** for detailed planning
- **Haiku** for code implementation, research, and fetching
- **Sonnet** for thorough code review (comparing against spec)

**Workflow**:
1. Plan phase: Sonnet creates comprehensive spec
2. Implementation phase: Haiku implements following the spec
3. Review phase: Sonnet reviews Haiku's work against spec
4. Iteration: Sonnet coordinates fixes if needed

---

## Key Design Decisions Summary

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| Request ID Flow | Confirm address only | Simplest UX, uses registration data |
| Payment System | Remove completely, make FREE | Zero friction, production launch ready |
| Payment Pages | Convert to "Coming Soon" | Keep UI structure for future |
| Payment Tab | Keep visible | User explicitly requested |
| Announcements Storage | Full Supabase CMS | Production requires persistence |
| Privacy Enforcement | UI block + API validation | Defense in depth, better UX |
| Privacy for Existing Users | Backfill with true | Implicit consent acceptable |
| Profile Barangay | Extract from address | Dynamic data, not hardcoded |
| Empty States | Informative messages | Better UX than blank screens |
| Data Migration | Start fresh for announcements | localStorage data non-critical |

---

## Assumptions Validated

✅ **User wants production-ready app**
- All decisions favor production quality over demo features
- Supabase for persistence over localStorage
- Legal compliance (privacy) prioritized
- Clean UX with proper empty states

✅ **Free services for initial launch**
- Remove payment friction completely
- Can re-enable payments later if needed
- Keep payment infrastructure in codebase (inactive)

✅ **Simplify user flows**
- Use registration data (avoid redundant entry)
- Reduce steps in Request ID flow (8 steps → 4 steps)
- Instant issuance (no waiting for payment)

✅ **Data persistence critical**
- Announcements must survive browser clears
- Captain's posts need to persist across sessions
- Database-backed solution required

✅ **Legal compliance non-negotiable**
- Privacy policy acceptance before data save
- Timestamp and version tracking
- Cannot skip or bypass consent

---

## Unresolved Questions (None)

All critical questions have been answered by the user. Spec is complete and ready for implementation.

---

## Next Steps

1. ✅ Spec complete (`requirements.md`, `README.md`, this file)
2. ⏭️ User reviews and approves spec
3. ⏭️ Run `/create-tasks` to generate implementation task list
4. ⏭️ Run `/orchestrate-tasks` to begin implementation
5. ⏭️ Haiku implements following the spec
6. ⏭️ Sonnet reviews Haiku's work
7. ⏭️ Deploy to production
