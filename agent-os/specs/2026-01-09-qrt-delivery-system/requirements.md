# QRT ID Auto-Generation on Dashboard

**Date:** January 9, 2026
**Status:** Ready for Implementation
**Scope:** Simplified - Dashboard card only

---

## Overview

When a user registers, their QRT ID card automatically appears on the home dashboard as a prominent, hero-like element. No separate request step needed.

**Dropped from scope:**
- ❌ Staff fulfillment interface
- ❌ Home delivery option
- ❌ Delivery address input
- ❌ Status tracking timeline
- ❌ Payment processing

---

## Requirements

### 1. Auto-Create QRT ID on Registration

**Current Flow:**
```
Register → Dashboard shows CTA → User clicks → Request page → Creates QRT ID
```

**New Flow:**
```
Register → QRT ID auto-created → Dashboard immediately shows card
```

**Implementation:**
- In `/app/api/register/route.ts`: After successful registration, auto-create QRT ID record
- Generate QRT code: `QRT-{YEAR}-{SEQUENCE}` (e.g., QRT-2026-000001)
- Generate verification code: 6-character alphanumeric
- Status: `ready` (immediately available)
- No payment, no approval needed

### 2. Bigger Dashboard Card (Hero Display)

**Current sizing:**
```
h-[160px] mobile, h-[200px] tablet, h-[240px] desktop
```

**New sizing (prominent hero):**
```
h-[200px] mobile, h-[280px] tablet, h-[320px] desktop
```

**Design updates:**
- More visual prominence
- Larger QR code display
- User info visible on card face
- Teal gradient background matching dashboard theme
- 3D flip animation preserved

### 3. Card Design Component

**Front Side:**
```
┌────────────────────────────────────────────────────────┐
│  BARANGAY MAWAQUE                              [Logo]  │
│  Quick Response Team ID                                │
│                                                        │
│  ┌──────────┐                                         │
│  │          │   JUAN DELA CRUZ                        │
│  │  Photo   │   QRT-2026-000001                       │
│  │          │   Born: January 15, 1990               │
│  └──────────┘   Address: Purok 5, Brgy Mawaque       │
│                                                        │
│  ┌────────┐                                           │
│  │ QR     │   Valid Until: December 2026             │
│  │ Code   │                                           │
│  └────────┘                                           │
└────────────────────────────────────────────────────────┘
```

**Back Side:**
```
┌────────────────────────────────────────────────────────┐
│  EMERGENCY CONTACT                                     │
│  ─────────────────────────────────────────────────    │
│  Contact: [Emergency contact name]                     │
│  Phone: [Emergency contact phone]                      │
│                                                        │
│  VERIFICATION                                          │
│  ─────────────────────────────────────────────────    │
│  Code: ABC123                                          │
│  Verify at: barangaymawaque.ph/verify                 │
│                                                        │
│  This card is property of Barangay Mawaque.           │
│  If found, please return to the Barangay Hall.        │
└────────────────────────────────────────────────────────┘
```

### 4. Design System

**Colors (Teal family):**
- Primary: `#14B8A6` (teal-500)
- Secondary: `#06B6D4` (cyan-500)
- Accent: `#22D3EE` (cyan-400)
- Dark: `#0D9488` (teal-600)
- Light background: `#F0FDFA` (teal-50)

**Typography:**
- Card title: `text-xs font-bold uppercase tracking-wider`
- Name: `text-lg font-bold`
- Details: `text-sm text-gray-600`

**Shadows & Effects:**
- Card shadow: `shadow-[0_8px_30px_rgba(0,0,0,0.08)]`
- Rounded corners: `rounded-3xl`
- Gradient: `bg-gradient-to-br from-[#14B8A6] via-[#06B6D4] to-[#22D3EE]`

---

## Files to Modify

### 1. `/app/api/register/route.ts`
- Add QRT ID auto-creation after successful registration
- Generate unique QRT code and verification code
- Save to qrt_ids table (or context)

### 2. `/components/qrt-card-mini.tsx`
- Rename to `/components/qrt-card-hero.tsx`
- Increase dimensions for hero display
- Add actual card design (not just image placeholder)
- Show user info, QR code, branding

### 3. `/app/dashboard/page.tsx`
- Update to use new `QRTCardHero` component
- Remove CTA state (card always shows after registration)

### 4. `/lib/qrt-context.tsx`
- Ensure QRT ID loads correctly from registration data
- No changes to data structure needed

---

## Success Criteria

✅ User registers → QRT ID card immediately visible on dashboard
✅ Card is prominently displayed (hero size)
✅ Card shows real user data (name, QRT code, QR code)
✅ 3D flip animation works smoothly
✅ Design matches teal theme from dashboard
✅ Mobile responsive (scales appropriately)
✅ No CTA/"Request ID" shown (card auto-exists)

---

## Implementation Order

1. Create new `QRTCardHero` component with bigger design
2. Update registration API to auto-create QRT ID
3. Update dashboard to use new component
4. Test full flow: Register → Dashboard → See card

---

**Estimated Time:** 2-3 hours
**Complexity:** Low-Medium
**Risk:** Low (isolated changes, no breaking existing features)
