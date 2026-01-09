# QRT ID Card Delivery System

**Status:** Planning Phase
**Created:** January 9, 2026
**Last Updated:** January 9, 2026

---

## Overview

This specification covers three interconnected improvements to the QRT ID system:

1. **Fix Card Display Bug** - Resolve missing QRT/certificate cards in requests section
2. **Redesign QRT Request Page** - Apply teal theme and dashboard/registration design patterns
3. **Implement Card Delivery System** - Build complete physical card issuance and delivery workflow

---

## Key Changes at a Glance

### 1. Card Display Bug Fix
- **Issue:** Cards not showing in `/app/requests` due to optional `user.id`
- **Fix:** Make `user.id` required, update registration/login APIs to return ID
- **Impact:** All user requests display correctly
- **Files Changed:** 4 (auth-context, register API, login API, requests page)

### 2. QRT Request Page Redesign
- **Current:** Basic emerald/blue theme, simple layout
- **Target:** Teal gradient theme matching dashboard, multi-section layout
- **New Features:**
  - Delivery method selection (Pickup FREE vs Home Delivery ₱50)
  - Custom delivery address option
  - Card preview section
  - Section separators and uppercase headings
- **Files Changed:** 1 (qrt-id/request/page.tsx)

### 3. Card Delivery System
- **New Workflow:**
  ```
  Request → Review → Approve → Print → Ready/Delivery → Delivered
  ```
- **For Residents:**
  - Choose pickup (FREE) or delivery (₱50)
  - Track delivery status with timeline
  - View estimated delivery date

- **For Staff:**
  - Fulfillment dashboard at `/staff/qrt-fulfillment`
  - Approve/reject requests
  - Update status through workflow
  - Bulk actions and print labels
  - Delivery notes and tracking

- **Database:**
  - 13 new columns in `qrt_ids` table
  - Auto-timestamp triggers
  - Optional audit trail table

- **Files Changed:** 5+ (new staff page, context updates, detail page, migrations)

---

## Implementation Phases

### Phase 1: Bug Fix (CRITICAL)
**Priority:** HIGH | **Time:** 2-4 hours

Fix card display bug by making `user.id` required and updating APIs.

### Phase 2: Page Redesign
**Priority:** MEDIUM | **Time:** 4-6 hours

Redesign QRT request page with teal theme and delivery options.

### Phase 3: Database Migration
**Priority:** HIGH | **Time:** 1-2 hours

Add delivery tracking fields to database.

### Phase 4: Context Updates
**Priority:** MEDIUM | **Time:** 2-3 hours

Update QRT context with delivery methods.

### Phase 5: Staff Interface
**Priority:** HIGH | **Time:** 6-8 hours

Build complete fulfillment dashboard for staff.

### Phase 6: Resident Tracking
**Priority:** LOW | **Time:** 3-4 hours

Add delivery timeline to resident detail view.

### Phase 7: Testing
**Priority:** REQUIRED | **Time:** 2-3 hours

End-to-end testing and polish.

**Total Estimated Time:** 20-30 hours

---

## Key Design Decisions

### Color Scheme
- **Primary:** #14B8A6 (teal)
- **Gradient:** from-[#14B8A6] via-[#06B6D4] to-[#22D3EE]
- **Icons:** #0D9488 (dark teal)
- **Status badges:** Contextual colors per status

### Delivery Options
- **Barangay Hall Pickup:** FREE, ready in 5-7 days
- **Home Delivery:** ₱50 fee, 5-7 business days, requires payment

### Status Flow
```
submitted → pending_approval → approved → printing →
ready_for_pickup/out_for_delivery → delivered
```

### Payment
- Pickup: No payment required (immediate approval)
- Delivery: ₱50 fee (pay before printing or on delivery)

---

## Success Metrics

✅ **Card display bug fixed:**
- Users see all their requests in /requests page
- No empty arrays or missing data

✅ **Design consistency achieved:**
- QRT request page uses teal theme
- Matches dashboard/registration aesthetic
- All icon badges use teal color scheme

✅ **Delivery system functional:**
- Users can request pickup or delivery
- Staff can manage fulfillment workflow
- Status updates save and display correctly
- Print labels work for physical cards

✅ **Production ready:**
- Mobile responsive
- No console errors
- All TypeScript types correct
- Accessible (keyboard + screen reader)

---

## Files Overview

### New Files (5)
```
/scripts/009_add_delivery_fields_to_qrt.sql
/app/staff/qrt-fulfillment/page.tsx
/components/qrt-delivery-timeline.tsx
/components/qrt-status-update-modal.tsx
/lib/pdf-generator.ts
```

### Modified Files (12)
```
/lib/auth-context.tsx
/app/api/register/route.ts
/app/api/login/route.ts
/app/requests/page.tsx
/app/qrt-id/request/page.tsx
/app/qrt-id/[id]/page.tsx
/lib/qrt-context.tsx
/components/qrt-card-mini.tsx
/app/staff/secretary/page.tsx
/app/staff/captain/page.tsx
```

**Total:** ~1,500 new lines, ~300 modified lines

---

## Risk Assessment

### Technical Risks
- **Database migration failure** → Test on local Supabase first
- **User IDs not persisting** → Add logging to track localStorage
- **Print labels not working** → Use well-tested PDF library (jsPDF)

### UX Risks
- **Users confused by options** → Clear descriptions and badges
- **Staff overwhelmed by queue** → Smart filtering and bulk actions
- **Status not updated** → Automatic reminders for staff

---

## Future Enhancements

**Post-Launch:**
- SMS notifications for status changes
- Courier API integration for tracking
- Online payment gateway
- Analytics dashboard
- Resident feedback/ratings
- Batch processing optimization

---

## Quick Links

- **Full Specification:** [requirements.md](./requirements.md)
- **Clarifying Questions:** [clarifying-questions.md](./clarifying-questions.md)
- **Current Codebase:** `/app/qrt-id/`, `/app/staff/`, `/lib/qrt-context.tsx`

---

## Contact

For questions or clarifications about this spec, refer to the detailed requirements document or consult with the team lead.

---

**Last Updated:** January 9, 2026
**Specification Version:** 1.0
