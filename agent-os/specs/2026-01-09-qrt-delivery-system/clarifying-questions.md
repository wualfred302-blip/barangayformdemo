# Clarifying Questions - QRT ID Card Delivery System

**Date:** January 9, 2026

---

## User's Original Request

> "Help me refine the request id section. Make the design signature similar to the dashboard and the registration section, also I need your help to design like a card delivery system. Where we get their address, and we send the order via another interface on the app, within the staff login section."

**Additional Context:**
- User mentioned: "did you fix the issues of the cards not showing up on the requests section?"
- User wants me to: "Just complete the work. I'll talk to you once you are done"

---

## Questions & Decisions

### 1. Card Display Bug

**Q:** Should I investigate and fix the card display issue in the requests section as part of this work?

**Decision:** ✅ YES - User explicitly asked about it, indicating it's a problem that needs fixing. Including it as Phase 1 (highest priority) since it blocks users from seeing their requests.

---

### 2. Design Consistency

**Q:** What specific design elements from dashboard/registration should be applied to the QRT request page?

**Decision:** Based on design system analysis:
- ✅ Teal color scheme (#14B8A6, #06B6D4, #22D3EE)
- ✅ Section separators with `border-b-2 border-gray-200`
- ✅ Uppercase section headings (`text-sm font-black uppercase tracking-widest`)
- ✅ Gradient accent cards for CTAs
- ✅ Consistent icon badge colors (teal theme)
- ✅ Card styling: `rounded-[24px]` with `shadow-[0_4px_20px_rgba(0,0,0,0.03)]`

---

### 3. Delivery Options

**Q:** What delivery methods should be offered?

**Decision:** Two options:
1. ✅ **Barangay Hall Pickup** (FREE)
   - Resident picks up card at barangay office
   - No delivery fee
   - Ready in 5-7 days
   - Immediate approval after request

2. ✅ **Home Delivery** (₱50)
   - Card delivered to resident's address
   - ₱50 delivery fee
   - 5-7 business days
   - Requires payment before printing

**Rationale:** Pickup is free to encourage residents, delivery option for convenience with reasonable fee.

---

### 4. Address Collection

**Q:** Should we collect a different delivery address or use the registration address?

**Decision:** ✅ **Use registration address by default, allow custom address**
- Show current address from registration
- Checkbox: "Use different delivery address"
- If checked, show address input field with autocomplete
- Store both registration address and delivery address

**Rationale:** Most users will use their registration address, but some may want delivery elsewhere (workplace, relative's house, etc.)

---

### 5. Payment Handling

**Q:** How should the ₱50 delivery fee be collected?

**Decision:** ✅ **Multiple payment options (phased)**
- **Phase 1 (MVP):** Mark as "Pending Payment" → Staff verifies payment before printing
- **Phase 2 (Future):** Cash on delivery (COD)
- **Phase 3 (Future):** Online payment gateway integration

**For MVP:**
- Request stays in "pending_approval" status until staff confirms payment
- Staff adds payment notes when marking as approved

---

### 6. Staff Workflow

**Q:** What actions should staff be able to perform in the fulfillment interface?

**Decision:** ✅ **Full workflow management:**
- View all requests filtered by status
- Approve/reject pending requests
- Mark requests as printing
- Mark as ready for pickup
- Assign to courier (for delivery)
- Mark as delivered
- Add delivery notes
- Bulk actions (approve multiple, print labels)
- Search and filter requests

**Rationale:** Complete control over the fulfillment process with efficiency features (bulk actions).

---

### 7. Status Tracking

**Q:** Should we implement an audit trail for status changes?

**Decision:** ✅ **YES - Two-level approach:**
1. **Basic:** Add timestamp columns (approved_at, printed_at, delivered_at) to qrt_ids table
2. **Advanced (Optional):** Create separate `qrt_status_history` table for full audit trail

**Rationale:** Basic timestamps are sufficient for MVP, but audit trail is valuable for compliance and troubleshooting.

---

### 8. Physical Card Production

**Q:** How do we handle the actual printing of physical cards?

**Decision:** ✅ **Print Labels Feature:**
- Staff can select multiple requests
- Generate PDF with labels (one per card)
- Label includes: QRT Code, Full Name, Delivery Method, Address
- Staff prints labels and attaches to card holders/envelopes
- Manual printing process (no printer integration in Phase 1)

**Future Enhancement:** Direct printer integration, batch processing optimization

---

### 9. Notification System

**Q:** Should residents be notified of status changes?

**Decision:** ✅ **NOT IN PHASE 1 (Future enhancement)**
- Phase 1: Residents manually check status in app
- Future: SMS notifications when status changes (approved, ready for pickup, out for delivery, delivered)

**Rationale:** Focus on core functionality first, add notifications as enhancement.

---

### 10. Courier Management

**Q:** How detailed should courier tracking be?

**Decision:** ✅ **Basic in Phase 1:**
- Courier name (text field)
- Courier contact (text field)
- Tracking number (text field)
- Delivery notes (text area)

**Future:** API integration with courier services for real-time tracking

---

### 11. Card Expiry and Pickup Deadline

**Q:** What happens if a card isn't picked up within the 7-day window?

**Decision:** ⚠️ **OUT OF SCOPE for Phase 1**
- Phase 1: No automatic expiry enforcement
- Future: Add pickup deadline, send reminders, mark as expired

**Rationale:** Focus on building the core workflow first.

---

### 12. Error Handling

**Q:** What if the resident's address is incomplete or invalid?

**Decision:** ✅ **Validation at multiple levels:**
1. **Registration:** Already validates address during account creation
2. **QRT Request:** Show address from registration, require confirmation
3. **Staff Review:** Staff can reject request and add notes if address is problematic

**Rationale:** Layered validation reduces errors.

---

### 13. Design System Integration

**Q:** Should I change existing emerald colors to teal everywhere?

**Decision:** ✅ **Only on QRT request page**
- QRT request page: Full teal redesign
- Other pages: Keep existing colors (already updated to teal in previous work on dashboard)
- Maintain consistency within each page

**Rationale:** User specifically asked to make QRT request page match dashboard (which already uses teal).

---

### 14. Mobile Responsiveness

**Q:** Should the staff fulfillment interface work on mobile?

**Decision:** ✅ **YES - Mobile responsive**
- Staff may need to access fulfillment dashboard on tablets/phones
- Use responsive card grid layout
- Touch-friendly 44px minimum targets
- Scrollable horizontal tabs for status filters

**Rationale:** Staff should be able to update statuses from any device.

---

## Assumptions

Based on the user's request and existing codebase patterns:

1. ✅ **Assume:** User wants immediate implementation, not just planning
   - User said: "Just complete the work. I'll talk to you once you are done"
   - Proceed with implementation after plan approval

2. ✅ **Assume:** Physical cards will be printed by barangay staff
   - No third-party printing service integration needed
   - Staff manages printing in-house

3. ✅ **Assume:** Delivery is handled by barangay or local courier
   - No integration with major courier APIs (LBC, J&T, etc.) in Phase 1
   - Simple text fields for courier info

4. ✅ **Assume:** User wants production-ready code
   - User mentioned "get app closer to production" in previous context
   - Include proper error handling, validation, TypeScript types

5. ✅ **Assume:** Use existing Supabase infrastructure
   - No new external services or APIs
   - Database migrations via SQL scripts

6. ✅ **Assume:** Follow existing code patterns
   - Use same context pattern as certificates and bayanihan
   - Match existing staff dashboard layout
   - Consistent with current authentication flow

---

## Open Questions (Require User Input)

**None at this time.** The specification is comprehensive enough to proceed with implementation. If clarifications are needed during implementation, I will ask the user.

---

## User Feedback

**Status:** Awaiting user review of this specification

**User should confirm:**
- [ ] Spec covers all desired features
- [ ] Delivery options (pickup/delivery) are correct
- [ ] Pricing (FREE/₱50) is acceptable
- [ ] Staff workflow matches expectations
- [ ] Implementation phases are appropriate

---

**Last Updated:** January 9, 2026
