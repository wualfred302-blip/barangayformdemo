# QRT ID Card Delivery System - Requirements Specification

**Version:** 1.0
**Date:** January 9, 2026
**Status:** Planning Phase

---

## Executive Summary

This specification covers three interconnected improvements to the QRT ID system:

1. **Fix Card Display Bug** - Resolve issue where QRT and certificate cards don't show in requests section
2. **Redesign QRT ID Request Page** - Apply dashboard/registration design patterns with teal theme
3. **Implement Card Delivery System** - Build full delivery workflow from request to physical card fulfillment

**Goal:** Transform the QRT ID system from a digital-only card generator to a complete physical card issuance and delivery platform with staff fulfillment tracking.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Root Cause Analysis](#2-root-cause-analysis)
3. [Design System Requirements](#3-design-system-requirements)
4. [Card Display Bug Fix](#4-card-display-bug-fix)
5. [QRT ID Request Page Redesign](#5-qrt-id-request-page-redesign)
6. [Card Delivery System](#6-card-delivery-system)
7. [Staff Fulfillment Interface](#7-staff-fulfillment-interface)
8. [Database Schema Changes](#8-database-schema-changes)
9. [Implementation Phases](#9-implementation-phases)
10. [Testing Requirements](#10-testing-requirements)
11. [File Changes](#11-file-changes)

---

## 1. Problem Statement

### 1.1 Current Issues

**A. Card Display Bug**
- QRT ID cards and certificates not showing in `/app/requests/page.tsx`
- Root cause: `user.id` is optional in User interface and may be undefined
- When `user?.id` is falsy, filtering returns empty arrays
- Users cannot see their request history

**B. Design Inconsistency**
- QRT ID request page uses basic styling, doesn't match dashboard teal theme
- Missing the polished visual design from dashboard and registration pages
- Icons use different color schemes (emerald/blue/purple/amber vs teal)

**C. Missing Physical Card Workflow**
- System only generates digital QRT IDs
- No way to request physical card delivery
- No address confirmation for delivery
- No delivery method selection (pickup vs home delivery)
- No staff interface to manage card printing and delivery
- No tracking for card production status

### 1.2 User Impact

**Residents:**
- Cannot see their request history (broken cards display)
- Cannot request physical ID card delivery
- No visibility into card production/delivery status
- Inconsistent visual experience across pages

**Staff:**
- No centralized dashboard for QRT fulfillment
- Cannot track which cards need printing
- No way to mark cards as printed/delivered
- Cannot manage delivery queue

---

## 2. Root Cause Analysis

### 2.1 Card Display Bug Investigation

**File:** `/lib/auth-context.tsx`

**Issue:** User interface defines `id` as optional:
```typescript
interface User {
  id?: string  // ⚠️ Optional - can be undefined
  fullName: string
  mobileNumber: string
  email: string
  address: string
  role?: UserRole
}
```

**Impact on Requests Page** (`/app/requests/page.tsx:57-59`):
```typescript
const myQrtIds = user?.id ? getUserQRTIds(user.id) : []
const myCertificates = user?.id ? getCertificatesByUserId(user.id) : certificates
```

**When `user.id` is undefined:**
- `myQrtIds` returns empty array `[]`
- `myCertificates` returns ALL certificates instead of user-specific (incorrect)
- No error is thrown, but data is wrong or missing

**Root Causes:**
1. Registration API might not return `id` in response
2. localStorage doesn't persist `id` field
3. Login API doesn't include `id` in user object
4. Database query doesn't select `id` field

### 2.2 Design System Analysis

**Current QRT Request Page Design:**
- ✅ Uses Card components correctly
- ✅ Has sticky header pattern
- ✅ Fixed bottom navigation
- ⚠️ Uses emerald (#10B981) instead of teal (#14B8A6)
- ⚠️ Icon badges use multiple colors (emerald, blue, purple, amber)
- ❌ Missing section separators with border-b-2
- ❌ Missing gradient accent cards
- ❌ No form sections with uppercase headings

**Target Design (from Dashboard/Registration):**
- Teal primary color: #14B8A6
- Teal-cyan gradients: from-[#14B8A6] via-[#06B6D4] to-[#22D3EE]
- Dark teal icons: #0D9488
- Section separators: border-b-2 border-gray-200 pb-3
- Uppercase section headings: text-sm font-black uppercase tracking-widest
- Consistent icon badge colors using teal scheme

---

## 3. Design System Requirements

### 3.1 Color Palette (from Design System Analysis)

**Primary Teal:**
```
- Primary: #14B8A6 (active states, buttons, focus rings)
- Secondary: #06B6D4 (gradient middle)
- Light: #22D3EE (gradient end)
- Dark: #0D9488 (icons, text accents)
```

**Icon Badge Colors (Teal Theme):**
```
- User/Profile: bg-teal-50 text-teal-600
- Phone: bg-cyan-50 text-cyan-600
- Email: bg-sky-50 text-sky-600
- Location: bg-teal-100 text-teal-700
- ID Card: bg-gradient-to-br from-[#14B8A6] to-[#22D3EE]
```

### 3.2 Component Patterns

**Card Styling:**
```typescript
className="overflow-hidden border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[24px] bg-white"
```

**Section Heading:**
```typescript
<h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">
  Section Title
</h2>
<div className="border-b-2 border-gray-200 pb-3 mb-6" />
```

**Primary Button:**
```typescript
className="h-14 w-full rounded-2xl bg-[#14B8A6] hover:bg-[#0D9488] text-white text-lg font-bold"
```

**Gradient Accent Card:**
```typescript
className="bg-gradient-to-br from-[#14B8A6] via-[#06B6D4] to-[#22D3EE] p-6 rounded-2xl text-white"
```

### 3.3 Spacing & Layout

**Page Structure:**
```
- Header: sticky top-0 h-14 bg-white/80 backdrop-blur-md
- Main: px-4 py-6 space-y-6 max-w-2xl mx-auto
- Sections: space-y-6
- Within sections: space-y-4
- Fixed bottom: pb-[max(16px,env(safe-area-inset-bottom))]
```

**Form Layout:**
```
- Grid: grid-cols-2 gap-4 (for two-column forms)
- Input height: h-12
- Button height: h-14
- Border radius: rounded-2xl (buttons), rounded-[24px] (cards)
```

---

## 4. Card Display Bug Fix

### 4.1 Required Changes

**A. Update User Interface to Require ID**

**File:** `/lib/auth-context.tsx:7-14`

**Change:**
```typescript
// BEFORE
interface User {
  id?: string  // Optional
  fullName: string
  mobileNumber: string
  email: string
  address: string
  role?: UserRole
}

// AFTER
interface User {
  id: string  // Required
  fullName: string
  mobileNumber: string
  email: string
  address: string
  role?: UserRole
}
```

**B. Update Registration API to Return ID**

**File:** `/app/api/register/route.ts`

**Current Behavior:** API inserts user but response doesn't include generated ID

**Required Change:**
```typescript
// After INSERT, fetch the created user's ID
const { data: userData, error: fetchError } = await supabase
  .from('residents')
  .select('id, full_name, mobile_number, email, address')
  .eq('mobile_number', cleanData.mobileNumber)
  .single()

if (fetchError || !userData) {
  return Response.json({ success: false, error: "user_fetch_failed" }, { status: 500 })
}

return Response.json({
  success: true,
  user: {
    id: userData.id,  // ✅ Include ID
    fullName: userData.full_name,
    mobileNumber: userData.mobile_number,
    email: userData.email,
    address: userData.address,
  }
}, { status: 201 })
```

**C. Update Login API to Include ID**

**File:** `/app/api/login/route.ts`

**Required Change:** Ensure login response includes `id` field from database

```typescript
const { data: user, error } = await supabase
  .from('residents')
  .select('id, full_name, mobile_number, email, address, password_hash')
  .eq('mobile_number', mobile_number)
  .single()

// ... password verification ...

return Response.json({
  success: true,
  user: {
    id: user.id,  // ✅ Include ID
    fullName: user.full_name,
    mobileNumber: user.mobile_number,
    email: user.email,
    address: user.address,
  }
})
```

**D. Verify Database Schema**

**File:** `/scripts/` (existing migration files)

**Check:** Ensure `residents` table has `id` column (should be UUID primary key)

```sql
-- Expected schema
CREATE TABLE residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  mobile_number TEXT UNIQUE NOT NULL,
  email TEXT,
  address TEXT,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**E. Update Requests Page Error Handling**

**File:** `/app/requests/page.tsx:57-59`

**Change:**
```typescript
// BEFORE
const myQrtIds = user?.id ? getUserQRTIds(user.id) : []
const myCertificates = user?.id ? getCertificatesByUserId(user.id) : certificates

// AFTER (user.id is now required, no fallback needed)
const myQrtIds = getUserQRTIds(user.id)
const myCertificates = getCertificatesByUserId(user.id)
```

### 4.2 Testing Verification

**Test Cases:**
1. ✅ Register new user → verify response includes `id` field
2. ✅ Login existing user → verify response includes `id` field
3. ✅ Navigate to `/requests` → verify cards display correctly
4. ✅ Create certificate request → verify it appears in list
5. ✅ Create QRT request → verify it appears in list
6. ✅ Check browser localStorage → verify `barangay_user` has `id` field

---

## 5. QRT ID Request Page Redesign

### 5.1 Current vs Target Design

**Current Design** (`/app/qrt-id/request/page.tsx`):
- Simple card layout
- Emerald/blue/purple icon badges
- Basic checkbox for address confirmation
- Minimal spacing

**Target Design:**
- Multi-section layout matching registration page
- Teal-themed icon badges
- Section separators with borders
- Gradient accent cards
- Delivery method selection
- Delivery address confirmation
- Visual hierarchy with uppercase headings

### 5.2 New Page Structure

**Layout Sections:**

1. **Header** (existing, keep as is)
   - Sticky header with back button
   - Title: "Request QRT ID"

2. **Personal Information Section** (existing, redesign)
   - Heading: "YOUR INFORMATION"
   - Border separator
   - Icon badges in teal theme
   - Fields: Full Name, Phone, Email

3. **Delivery Address Section** (NEW)
   - Heading: "DELIVERY ADDRESS"
   - Border separator
   - Show current address from registration
   - Option to use different delivery address
   - Address input with autocomplete (if different)

4. **Delivery Method Section** (NEW)
   - Heading: "DELIVERY METHOD"
   - Border separator
   - Two options with radio buttons:
     - **Barangay Hall Pickup** (FREE)
       - Description: "Pick up your QRT ID card at the Barangay Hall within 7 days"
       - Icon: Building2
       - Badge: "FREE"
     - **Home Delivery** (₱50)
       - Description: "Card will be delivered to your address within 5-7 business days"
       - Icon: Truck
       - Badge: "₱50"

5. **Card Preview Section** (NEW)
   - Gradient accent card
   - Preview what QRT ID will look like
   - Shows: QRT code format, verification code format
   - "This is a preview. Actual card will be generated after request approval."

6. **Terms & Confirmation** (redesign existing)
   - Checkbox: "I confirm the information above is correct"
   - Checkbox: "I understand the card will be ready for pickup/delivery in 5-7 business days"
   - Info box with teal accent

7. **Fixed Bottom Buttons** (existing, update colors)
   - Cancel (outline)
   - Submit Request (teal primary)

### 5.3 Component Updates

**Icon Badge Pattern:**

**BEFORE:**
```tsx
<div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
  <User className="h-5 w-5" />
</div>
```

**AFTER (Teal Theme):**
```tsx
<div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
  <User className="h-5 w-5" />
</div>
```

**Section Separator Pattern:**
```tsx
<div className="space-y-6">
  <div>
    <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
      Section Title
    </h2>
    <div className="border-b-2 border-gray-200 my-3" />
  </div>

  {/* Section content */}
</div>
```

**Delivery Method Card:**
```tsx
<label className={cn(
  "flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all",
  selected
    ? "border-[#14B8A6] bg-teal-50"
    : "border-gray-200 bg-white hover:border-gray-300"
)}>
  <input
    type="radio"
    name="delivery_method"
    value="pickup"
    className="mt-1 h-5 w-5 text-[#14B8A6] focus:ring-[#14B8A6]"
  />
  <div className="flex-1">
    <div className="flex items-center gap-2 mb-1">
      <Building2 className="h-5 w-5 text-teal-600" />
      <span className="font-bold text-gray-900">Barangay Hall Pickup</span>
      <span className="ml-auto px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold">
        FREE
      </span>
    </div>
    <p className="text-sm text-gray-600">
      Pick up your QRT ID card at the Barangay Hall within 7 days
    </p>
  </div>
</label>
```

### 5.4 Form State Management

**New State Variables:**
```typescript
const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup")
const [deliveryAddress, setDeliveryAddress] = useState("")
const [useCustomAddress, setUseCustomAddress] = useState(false)
const [termsAccepted, setTermsAccepted] = useState(false)
const [infoConfirmed, setInfoConfirmed] = useState(false)
```

**Validation:**
```typescript
const canSubmit =
  termsAccepted &&
  infoConfirmed &&
  (deliveryMethod === "pickup" || (deliveryMethod === "delivery" && deliveryAddress)) &&
  !isLoading
```

### 5.5 Updated QRT Request Data Structure

**Add to QRTIDRequest interface:**
```typescript
// Delivery fields
deliveryMethod: "pickup" | "delivery"
deliveryAddress: string  // Same as address or custom
deliveryFee: number  // 0 for pickup, 50 for delivery
deliveryStatus?: "pending" | "processing" | "ready_for_pickup" | "out_for_delivery" | "delivered"
deliveryNotes?: string
deliveryDate?: string
```

---

## 6. Card Delivery System

### 6.1 Delivery Workflow

**Status Flow:**
```
1. submitted        → User submits request
2. pending_approval → Staff reviews request
3. approved         → Request approved, ready for printing
4. printing         → Card is being printed
5. ready_for_pickup → Card ready at barangay hall (if pickup)
6. out_for_delivery → Card with courier (if delivery)
7. delivered        → Card successfully received
8. cancelled        → Request cancelled
```

### 6.2 Delivery Tracking Features

**For Residents:**
- View delivery status in `/qrt-id/[id]` detail page
- Timeline showing progress:
  - Request Submitted ✓
  - Under Review (pending)
  - Card Printing (printing)
  - Ready for Pickup / Out for Delivery
  - Delivered ✓
- Notification when status changes (future feature)
- Estimated delivery date display

**For Staff:**
- Queue view of all QRT requests grouped by status
- Ability to:
  - Approve/reject requests
  - Mark as printing
  - Mark as ready for pickup
  - Assign to courier (for delivery)
  - Mark as delivered
  - Add delivery notes
- Print batch labels for cards
- Export delivery manifest

### 6.3 Delivery Fee Handling

**Pickup Method:**
- Fee: ₱0 (FREE)
- Payment: None required
- Status: Immediately moves to `approved` after submission

**Home Delivery Method:**
- Fee: ₱50
- Payment Options:
  - Pay on delivery (COD)
  - Pay at barangay hall before printing
  - Online payment (future feature)
- Status: Stays in `pending_approval` until payment confirmed

**Implementation:**
```typescript
const qrtRequestData = {
  // ... existing fields ...
  deliveryMethod: deliveryMethod,
  deliveryAddress: useCustomAddress ? deliveryAddress : user.address,
  deliveryFee: deliveryMethod === "pickup" ? 0 : 50,
  deliveryStatus: deliveryMethod === "pickup" ? "approved" : "pending_approval",
  amount: deliveryMethod === "pickup" ? 0 : 50,
  paymentReference: deliveryMethod === "pickup" ? `FREE-${Date.now()}` : `PENDING-${Date.now()}`,
}
```

---

## 7. Staff Fulfillment Interface

### 7.1 New Staff Page: QRT Fulfillment Dashboard

**Route:** `/app/staff/qrt-fulfillment/page.tsx` (NEW)

**Access:** Available to all staff roles (captain, secretary, treasurer)

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│ [← Back]  QRT ID Fulfillment                              [🔄]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ [All] [Pending Review] [Printing] [Ready] [Out for Delivery]   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ QRT-2026-000001                       [Pending Review]  │   │
│ │ Juan Dela Cruz                                          │   │
│ │ Requested: Jan 9, 2026 • Pickup                        │   │
│ │ [Approve] [Reject]                                      │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │ QRT-2026-000002                       [Approved]        │   │
│ │ Maria Santos                                            │   │
│ │ Requested: Jan 8, 2026 • Home Delivery (₱50)          │   │
│ │ Payment: Pending                                        │   │
│ │ [Mark as Printing] [View Details]                      │   │
│ └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Status Management Actions

**Pending Review:**
- Actions: Approve, Reject, Request More Info
- Button colors: Green (Approve), Red (Reject)
- Shows: User info, delivery method, payment status

**Approved:**
- Actions: Mark as Printing, Edit Details
- Auto-action: Send notification to user
- Shows: Estimated ready date

**Printing:**
- Actions: Mark as Ready for Pickup / Ready for Delivery
- Shows: Print queue position, batch number
- Bulk action: Print Labels (generates PDF)

**Ready for Pickup:**
- Actions: Mark as Delivered, Add Pickup Notes
- Shows: Days waiting, pickup reminder sent
- QR code scan integration for verification

**Out for Delivery:**
- Actions: Mark as Delivered, Update Courier Notes
- Shows: Courier name, contact, tracking number
- Delivery address with map (future)

**Delivered:**
- Read-only view
- Shows: Delivery date, received by, signature (future)

### 7.3 Card Detail Modal

**Triggered by:** Click on any card in the list

**Content:**
```
┌──────────────────────────────────────────────────────────────┐
│ QRT-2026-000001                                       [✕]    │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ RESIDENT INFORMATION                                         │
│ ───────────────────────────────────────────────────────────  │
│ Name: Juan Dela Cruz                                         │
│ Address: 123 Main St, Barangay Mawaque                      │
│ Phone: 0917-123-4567                                        │
│ Email: juan@example.com                                     │
│                                                              │
│ REQUEST DETAILS                                              │
│ ───────────────────────────────────────────────────────────  │
│ Request Date: Jan 9, 2026 10:30 AM                         │
│ Delivery Method: Barangay Hall Pickup                       │
│ Delivery Address: (Same as registered address)             │
│ Payment: FREE (Pickup)                                      │
│                                                              │
│ STATUS TIMELINE                                              │
│ ───────────────────────────────────────────────────────────  │
│ ● Submitted - Jan 9, 2026 10:30 AM                         │
│ ○ Approved - Pending                                        │
│ ○ Printing - Pending                                        │
│ ○ Ready for Pickup - Pending                                │
│ ○ Delivered - Pending                                       │
│                                                              │
│ STAFF NOTES                                                  │
│ ───────────────────────────────────────────────────────────  │
│ [Text area for staff notes]                                 │
│                                                              │
│ [Cancel] [Approve Request]                                   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 7.4 Bulk Actions

**Selection:**
- Checkbox on each card
- "Select All" option
- Selected count indicator

**Actions:**
```
[✓ 5 selected]
  [Approve Selected]
  [Mark as Printing]
  [Print Labels]
  [Export CSV]
```

**Print Labels Feature:**
- Generates PDF with QR codes and addresses
- One label per card (for envelope/card holder)
- Includes: QRT Code, Full Name, Delivery Method, Delivery Address
- Printable format (A4 with label template)

---

## 8. Database Schema Changes

### 8.1 Update `qrt_ids` Table

**File:** Create new migration `/scripts/009_add_delivery_fields_to_qrt.sql`

```sql
-- Add delivery-related fields to qrt_ids table
ALTER TABLE public.qrt_ids
  ADD COLUMN IF NOT EXISTS delivery_method TEXT NOT NULL DEFAULT 'pickup' CHECK (delivery_method IN ('pickup', 'delivery')),
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_fee INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending_approval' CHECK (
    delivery_status IN (
      'submitted',
      'pending_approval',
      'approved',
      'printing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'cancelled'
    )
  ),
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
  ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS courier_name TEXT,
  ADD COLUMN IF NOT EXISTS courier_contact TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.staff(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS received_by TEXT;

-- Create index for faster delivery status queries
CREATE INDEX IF NOT EXISTS idx_qrt_ids_delivery_status ON public.qrt_ids(delivery_status);
CREATE INDEX IF NOT EXISTS idx_qrt_ids_delivery_method ON public.qrt_ids(delivery_method);

-- Add trigger to auto-update delivery_date when status changes
CREATE OR REPLACE FUNCTION update_qrt_delivery_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.delivery_status = 'approved' AND OLD.delivery_status != 'approved' THEN
    NEW.approved_at = now();
  END IF;

  IF NEW.delivery_status = 'printing' AND OLD.delivery_status != 'printing' THEN
    NEW.printed_at = now();
  END IF;

  IF NEW.delivery_status IN ('delivered') AND OLD.delivery_status NOT IN ('delivered') THEN
    NEW.delivered_at = now();
    NEW.delivery_date = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qrt_delivery_timestamp_trigger
  BEFORE UPDATE ON public.qrt_ids
  FOR EACH ROW
  EXECUTE FUNCTION update_qrt_delivery_timestamps();

COMMENT ON COLUMN public.qrt_ids.delivery_method IS 'Pickup at barangay hall or home delivery';
COMMENT ON COLUMN public.qrt_ids.delivery_fee IS 'Delivery fee in pesos (0 for pickup, 50 for delivery)';
COMMENT ON COLUMN public.qrt_ids.delivery_status IS 'Current delivery status in fulfillment workflow';
```

### 8.2 Create `qrt_status_history` Table (Optional but Recommended)

**Purpose:** Track full audit trail of status changes

```sql
CREATE TABLE IF NOT EXISTS public.qrt_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qrt_id UUID NOT NULL REFERENCES public.qrt_ids(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES public.staff(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,

  CONSTRAINT qrt_status_history_status_check CHECK (
    new_status IN (
      'submitted',
      'pending_approval',
      'approved',
      'printing',
      'ready_for_pickup',
      'out_for_delivery',
      'delivered',
      'cancelled'
    )
  )
);

CREATE INDEX idx_qrt_status_history_qrt_id ON public.qrt_status_history(qrt_id);
CREATE INDEX idx_qrt_status_history_changed_at ON public.qrt_status_history(changed_at DESC);

COMMENT ON TABLE public.qrt_status_history IS 'Audit trail for QRT ID delivery status changes';
```

---

## 9. Implementation Phases

### Phase 1: Bug Fix & Foundation (HIGH PRIORITY)
**Estimated Time:** 2-4 hours

**Tasks:**
1. ✅ Fix User interface to require `id` field
2. ✅ Update registration API to return `id`
3. ✅ Update login API to return `id`
4. ✅ Update requests page to remove optional chaining for `user.id`
5. ✅ Test end-to-end: register → login → view requests
6. ✅ Verify cards display correctly

**Deliverables:**
- Cards display bug fixed
- User always has valid ID
- Requests page shows all user's requests

---

### Phase 2: QRT Request Page Redesign (MEDIUM PRIORITY)
**Estimated Time:** 4-6 hours

**Tasks:**
1. ✅ Create new section structure with separators
2. ✅ Update color scheme from emerald to teal
3. ✅ Add delivery method selection (pickup vs delivery)
4. ✅ Add delivery address section with custom address option
5. ✅ Add card preview gradient section
6. ✅ Update form validation
7. ✅ Update submit button to teal
8. ✅ Add delivery fee calculation
9. ✅ Update QRT request data structure

**Deliverables:**
- Redesigned QRT request page matching dashboard theme
- Delivery method selection functional
- Form submits with delivery preferences

---

### Phase 3: Database Schema Migration (HIGH PRIORITY)
**Estimated Time:** 1-2 hours

**Tasks:**
1. ✅ Create migration file `009_add_delivery_fields_to_qrt.sql`
2. ✅ Add delivery fields to `qrt_ids` table
3. ✅ Create indexes for performance
4. ✅ Add triggers for auto-timestamps
5. ✅ Run migration in Supabase SQL Editor
6. ✅ Verify fields added correctly
7. ✅ (Optional) Create `qrt_status_history` table

**Deliverables:**
- Database supports delivery tracking
- Triggers update timestamps automatically
- Indexes improve query performance

---

### Phase 4: QRT Context Updates (MEDIUM PRIORITY)
**Estimated Time:** 2-3 hours

**Tasks:**
1. ✅ Update QRTIDRequest interface with delivery fields
2. ✅ Update `addQRTRequest()` to save delivery data
3. ✅ Add `updateDeliveryStatus()` method
4. ✅ Add `getQRTsByDeliveryStatus()` method for staff
5. ✅ Update detail page to show delivery status
6. ✅ Add delivery timeline component

**Deliverables:**
- Context supports delivery workflow
- Staff can update delivery statuses
- Residents can view delivery progress

---

### Phase 5: Staff Fulfillment Interface (HIGH PRIORITY)
**Estimated Time:** 6-8 hours

**Tasks:**
1. ✅ Create `/app/staff/qrt-fulfillment/page.tsx`
2. ✅ Implement tab filtering by status
3. ✅ Build card list with status badges
4. ✅ Add action buttons per status
5. ✅ Create detail modal
6. ✅ Implement status update handlers
7. ✅ Add bulk selection and actions
8. ✅ Implement print labels feature (PDF generation)
9. ✅ Add search and filtering
10. ✅ Add to staff navigation

**Deliverables:**
- Staff can manage QRT fulfillment workflow
- Bulk actions for efficiency
- Print labels for physical cards
- Full audit trail

---

### Phase 6: Resident Delivery Tracking (LOW PRIORITY)
**Estimated Time:** 3-4 hours

**Tasks:**
1. ✅ Update `/app/qrt-id/[id]/page.tsx` detail view
2. ✅ Add delivery timeline component
3. ✅ Show delivery status prominently
4. ✅ Add estimated delivery date
5. ✅ Show delivery address
6. ✅ Add courier info (if out for delivery)
7. ✅ Add "Track Delivery" button (future: integrate with courier API)

**Deliverables:**
- Residents see delivery progress
- Clear status timeline
- Contact information for queries

---

### Phase 7: Testing & Polish (REQUIRED)
**Estimated Time:** 2-3 hours

**Tasks:**
1. ✅ End-to-end testing: Request → Approval → Printing → Delivery
2. ✅ Test both pickup and delivery workflows
3. ✅ Verify payment flows (FREE vs ₱50)
4. ✅ Test bulk actions
5. ✅ Verify status transitions
6. ✅ Test print labels generation
7. ✅ Mobile responsiveness check
8. ✅ Accessibility audit
9. ✅ Performance testing (large lists)

**Deliverables:**
- Fully tested delivery system
- No critical bugs
- Smooth user experience

---

## 10. Testing Requirements

### 10.1 Unit Tests (Optional but Recommended)

**Test Files to Create:**
- `lib/__tests__/qrt-context.test.tsx` - Test delivery status updates
- `app/staff/qrt-fulfillment/__tests__/page.test.tsx` - Test staff actions

### 10.2 Manual Testing Checklist

**Card Display Bug:**
- [ ] Register new user → user object has `id` field
- [ ] Login existing user → user object has `id` field
- [ ] Navigate to /requests → cards display
- [ ] Create certificate → appears in list
- [ ] Create QRT request → appears in list

**QRT Request Page Redesign:**
- [ ] Page uses teal color scheme
- [ ] Icon badges use teal-themed colors
- [ ] Section separators display correctly
- [ ] Delivery method selection works
- [ ] Custom address toggle works
- [ ] Form validation prevents submission without required fields
- [ ] Submit button color changes based on state

**Delivery System:**
- [ ] Pickup request creates QRT with status "approved"
- [ ] Delivery request creates QRT with status "pending_approval"
- [ ] Staff can view all requests in fulfillment dashboard
- [ ] Staff can approve/reject requests
- [ ] Staff can update delivery status
- [ ] Status timeline updates correctly
- [ ] Bulk actions work for multiple selections
- [ ] Print labels generates PDF correctly
- [ ] Residents see updated status in detail page

### 10.3 Edge Cases to Test

**Authentication:**
- [ ] What if localStorage is cleared? (should redirect to login)
- [ ] What if user.id is manually deleted from localStorage? (should re-login)

**Delivery:**
- [ ] What if delivery address is empty?
- [ ] What if user submits delivery without selecting method?
- [ ] What if staff tries to mark as delivered before printing?
- [ ] What if resident cancels after approval?

**Payment:**
- [ ] What if user selects delivery but doesn't want to pay?
- [ ] How to handle partial payments?
- [ ] What if payment is made but request is rejected?

---

## 11. File Changes

### 11.1 New Files to Create

```
/scripts/009_add_delivery_fields_to_qrt.sql
/app/staff/qrt-fulfillment/page.tsx
/components/qrt-delivery-timeline.tsx
/components/qrt-status-update-modal.tsx
/lib/pdf-generator.ts (for print labels)
```

### 11.2 Files to Modify

**Core System:**
- `/lib/auth-context.tsx` - Make `id` required in User interface
- `/app/api/register/route.ts` - Return `id` in response
- `/app/api/login/route.ts` - Return `id` in response
- `/app/requests/page.tsx` - Remove optional chaining for `user.id`

**QRT System:**
- `/app/qrt-id/request/page.tsx` - Complete redesign with delivery options
- `/app/qrt-id/[id]/page.tsx` - Add delivery status and timeline
- `/lib/qrt-context.tsx` - Add delivery fields and methods
- `/components/qrt-card-mini.tsx` - Show delivery status badge

**Staff System:**
- `/app/staff/secretary/page.tsx` - Add link to QRT Fulfillment
- `/app/staff/captain/page.tsx` - Add QRT fulfillment quick stats

**Types:**
- `/types/qrt.ts` (create if doesn't exist) - Define delivery-related types

### 11.3 Estimated Line Changes

```
New lines added: ~1,500
Lines modified: ~300
Lines deleted: ~50
Total files changed: 12
```

---

## 12. Success Criteria

### 12.1 Functional Requirements

✅ **Cards display bug is fixed:**
- Users can see their certificate and QRT requests in /requests page
- No empty arrays or missing data

✅ **QRT request page matches design system:**
- Teal color scheme applied consistently
- Icon badges use teal-themed colors
- Section separators and headings match dashboard/registration

✅ **Delivery system is functional:**
- Users can choose pickup or delivery
- Delivery fee calculated correctly (₱0 or ₱50)
- Custom delivery address option works
- Staff can manage fulfillment workflow
- Status updates trigger timestamp changes

✅ **Staff interface is usable:**
- Staff can view all QRT requests
- Filtering by status works
- Status updates save to database
- Bulk actions work efficiently
- Print labels generate correctly

✅ **Resident tracking is visible:**
- Users see delivery status in detail page
- Timeline shows progress clearly
- Estimated delivery date displayed

### 12.2 Non-Functional Requirements

✅ **Performance:**
- Requests page loads in < 2 seconds
- Staff fulfillment dashboard loads in < 3 seconds
- No lag when updating status

✅ **Usability:**
- Mobile-responsive on all pages
- Touch targets minimum 44px
- Keyboard navigation works
- Screen readers can access all content

✅ **Maintainability:**
- Code follows existing patterns
- TypeScript types are correct
- No console errors
- Comments explain complex logic

---

## 13. Risks & Mitigation

### 13.1 Technical Risks

**Risk:** Database migration fails
**Mitigation:** Test migration on local Supabase instance first, backup production data

**Risk:** User IDs not persisting after fix
**Mitigation:** Add logging to track when ID is set/lost, monitor localStorage

**Risk:** Print labels feature doesn't work in browser
**Mitigation:** Use well-tested PDF library (jsPDF or react-pdf), test across browsers

### 13.2 User Experience Risks

**Risk:** Users confused by delivery options
**Mitigation:** Clear descriptions, visual indicators (FREE badge), help text

**Risk:** Staff overwhelmed by fulfillment queue
**Mitigation:** Smart filtering, bulk actions, estimated queue times

**Risk:** Delivery status not updated
**Mitigation:** Automatic reminders for staff, escalation for delayed cards

---

## 14. Future Enhancements

**Post-Launch Features:**

1. **SMS Notifications**
   - Send SMS when status changes
   - Reminder when ready for pickup (3 days before expiry)
   - Delivery confirmation code

2. **Courier Integration**
   - API integration with local courier services
   - Real-time tracking
   - Proof of delivery photos

3. **Payment Gateway**
   - Online payment for delivery fee
   - Payment verification automation
   - Refund processing

4. **Analytics Dashboard**
   - Average fulfillment time
   - Most common delivery method
   - Peak request hours
   - Bottleneck identification

5. **Resident Feedback**
   - Rate delivery experience
   - Report issues
   - Request reprint

6. **Batch Processing**
   - Auto-group requests by location
   - Optimize delivery routes
   - Scheduled printing batches

---

## 15. Appendix

### 15.1 Color Reference

```css
/* Teal Theme */
--teal-primary: #14B8A6;
--teal-secondary: #06B6D4;
--teal-light: #22D3EE;
--teal-dark: #0D9488;

/* Icon Badges */
--teal-50: #F0FDFA;
--teal-100: #CCFBF1;
--teal-600: #0D9488;
--cyan-50: #ECFEFF;
--cyan-600: #0891B2;
--sky-50: #F0F9FF;
--sky-600: #0284C7;
```

### 15.2 Status Badge Colors

```typescript
const statusColors = {
  submitted: "bg-gray-100 text-gray-700",
  pending_approval: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  printing: "bg-purple-100 text-purple-700",
  ready_for_pickup: "bg-teal-100 text-teal-700",
  out_for_delivery: "bg-orange-100 text-orange-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
}
```

### 15.3 API Endpoints Needed

**For Staff:**
```
GET  /api/qrt/all?status=pending_approval      - Get all QRT requests by status
PUT  /api/qrt/:id/status                       - Update delivery status
POST /api/qrt/bulk-update                      - Bulk status update
GET  /api/qrt/:id/history                      - Get status history
GET  /api/qrt/print-labels?ids=1,2,3          - Generate print labels PDF
```

**For Residents:**
```
GET /api/qrt/my-requests                       - Get user's QRT requests
GET /api/qrt/:id                               - Get single QRT with delivery info
```

---

## Document Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | Jan 9, 2026 | Initial specification | Claude Sonnet 4.5 |

---

**End of Requirements Specification**
