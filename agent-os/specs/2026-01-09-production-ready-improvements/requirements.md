# Production-Ready Barangay App Improvements - Requirements

## Project Overview
Transform the barangay app from demo to production-ready by implementing 6 critical improvements: UI position swaps, removing payment processing (making all services FREE), simplifying Request ID flow to use registration data, implementing Supabase-backed announcements CMS, making profile fully dynamic, and enforcing privacy policy acceptance before data storage.

**Target Outcome**: Production-ready app with zero payment friction, streamlined user flows, persistent announcements system, and legal compliance for data privacy.

---

## 1. Current State Analysis

### 1.1 Homepage Service Grid
**File**: `/app/dashboard/page.tsx` (lines 108-119)

**Current Layout**:
- Row 1: Request Certificate, **Bayanihan**, File Blotter, **Request ID**
- Row 2: Health Center, Events, Permits, Taxes

**Issue**: User wants Request ID and Bayanihan to swap positions for better UX flow.

### 1.2 Payment System (Current Implementation)
**Files**:
- `/app/payment/page.tsx` - Payment processor (GCash, Maya, Bank Transfer)
- `/app/payment/history/page.tsx` - Transaction history
- `/app/request/page.tsx` (lines 91-114) - Certificate requests redirect to payment
- `/app/qrt-id/request/page.tsx` (lines 1050-1118) - QRT ID requests redirect to payment
- `/lib/payment-context.tsx` - Payment state management
- `/lib/payment-utils.ts` - Payment utilities

**Current Flow**:
1. User requests certificate or QRT ID
2. Form completion
3. Redirect to `/payment?type=certificate` or `/payment?type=qrt`
4. Select payment method (Standard/Express pricing)
5. Process payment
6. Issue document

**Pricing**:
- Certificates: Regular ₱50, Rush ₱100
- QRT ID: Standard ₱100, Express ₱200

**Issue**: Payment adds friction. User wants to remove ALL payment processing, make services FREE, but keep "Payments" tab visible showing "Coming Soon" message.

### 1.3 Request ID (QRT ID) Flow
**File**: `/app/qrt-id/request/page.tsx`

**Current Implementation**: Complex 3-step wizard
- **Step 1 (lines 354-532)**: Personal Information
  - Full name, birth date, gender, civil status
  - Current address (textarea, unstructured)
  - Height, weight, years resident
  - Photo upload
- **Step 2 (lines 536-668)**: Emergency Contact
  - Contact person name, phone, relationship
  - Emergency contact address
  - Notes about health-related use
- **Step 3 (lines 672-1116)**: Review & Payment
  - Summary of all data
  - Request type selection (Standard ₱100 / Express ₱200)
  - Payment processing

**Issue**:
- Redundant data collection (already collected during registration)
- User wants simplified flow: Just confirm if current address is still accurate
- Use registration data for everything else
- Make it FREE (no payment step)

### 1.4 Registration and Privacy Policy
**Files**:
- `/app/register/page.tsx` (lines 763-769)
- `/app/api/register/route.ts`

**Current Implementation**:
- Privacy checkbox exists (line 756-762)
- Validation checks if checkbox is checked (line 287-290)
- **BUT**: Data saves to Supabase regardless of checkbox state
- No database column to track privacy acceptance
- No timestamp of when consent was given

**Database Table**: `residents`
**Missing Fields**:
- `privacy_policy_accepted` (BOOLEAN)
- `privacy_policy_accepted_at` (TIMESTAMPTZ)
- `privacy_policy_version` (TEXT)

**Issue**: Legal compliance requires explicit consent BEFORE saving data. Currently saves data first, then checks validation.

### 1.5 Barangay Updates/Announcements
**Files**:
- `/app/announcements/page.tsx` - Public view
- `/app/staff/announcements/page.tsx` - Staff CMS (full CRUD interface)
- `/lib/announcements-context.tsx` - State management
- `/app/dashboard/page.tsx` (lines 224-228, 272-275) - Display sections

**Current Implementation**:
- Uses **localStorage** + in-memory state
- No database persistence
- Data lost on browser clear/device change
- Staff can create/edit/publish announcements
- Two display sections:
  - "Barangay Updates" - Shows pinned/urgent announcements
  - "Announcements" - Shows regular published announcements

**Announcement Structure** (from context):
\`\`\`typescript
{
  id, title, content, category, priority, imageUrl,
  isPublished, isPinned, authorId, authorName,
  publishedAt, expiresAt, createdAt, updatedAt
}
\`\`\`

**Categories**: general, health, emergency, event, notice
**Priority**: low, normal, high, urgent

**Issue**:
- No database persistence (localStorage only)
- User wants full Supabase-backed CMS
- Should show "No updates yet" when empty (not current hardcoded messages)

### 1.6 Profile Page
**File**: `/app/profile/page.tsx` (line 81)

**Current Implementation**:
\`\`\`typescript
<p className="text-sm text-white/80">Barangay Mawaque Resident</p>
\`\`\`

**Data Available**:
- Profile already displays dynamic data from auth context:
  - `user.fullName` ✅
  - `user.email` ✅
  - `user.mobileNumber` ✅
  - `user.address` ✅
- BUT: Subtitle "Barangay Mawaque Resident" is **hardcoded**

**Registration Data** (from `/app/register/page.tsx`):
- User registers with full address including barangay field
- Address stored in `residents` table includes barangay component
- Example format: "123 Main St, Purok 1, Barangay Mawaque, Quezon City, Metro Manila 1100"

**Issue**: Barangay name should be extracted from user's registration address, not hardcoded.

---

## 2. Requirements Breakdown

### 2.1 Homepage UI Swap
**Priority**: LOW (cosmetic)
**Effort**: 5 minutes
**Risk**: None

**Requirements**:
- Swap positions in services array
- Position 2: Request ID (moved from position 4)
- Position 4: Bayanihan (moved from position 2)
- Maintain all other positions and functionality
- No routing changes needed

**Acceptance Criteria**:
- [ ] Dashboard loads with Request ID in position 2
- [ ] Bayanihan appears in position 4
- [ ] All icons and labels render correctly
- [ ] All routing still works

### 2.2 Remove Payment System Completely
**Priority**: CRITICAL
**Effort**: 4-6 hours
**Risk**: HIGH (affects multiple flows)

**User Decision**: "Make all requests free, remove payment processor completely"

**Requirements**:

#### 2.2.1 Payment Page
- Convert `/app/payment/page.tsx` to "Coming Soon" page
- Show message: "All barangay services are currently FREE"
- Add back button to dashboard
- Remove all payment processor logic (GCash, Maya, Bank)

#### 2.2.2 Payment History Page
- Convert `/app/payment/history/page.tsx` to "Coming Soon" page
- Show message: "Payment tracking will be available once online payment processing is implemented"
- Keep "Payments" tab visible on dashboard (user requirement)
- Tab still routes to `/payment/history` but shows coming soon

#### 2.2.3 Certificate Requests (FREE)
**File**: `/app/request/page.tsx`

**Changes**:
- Remove redirect to payment page
- Create certificate immediately on form submit
- Set `amount: 0`
- Set `paymentReference: "FREE-{timestamp}"`
- Set `status: "processing"` (ready for staff to process)
- Button text: "Submit Request (FREE)"
- Remove request type selection (Regular/Rush)

**Flow**: Form → Validation → Create Certificate → Redirect to Certificate Details

#### 2.2.4 QRT ID Requests (FREE)
**File**: `/app/qrt-id/request/page.tsx`

**Changes**:
- Remove Step 3 payment selection entirely
- Generate QRT ID immediately after confirmation
- Set `amount: 0`
- Set `status: "ready"` (immediately available)
- Button text: "Generate QRT ID (FREE)"
- No pricing tiers (Standard/Express)

**Flow**: Address Confirmation → Generate ID → Redirect to QRT ID Details

#### 2.2.5 Dashboard Integration
- Keep "Payments" tab visible
- Routes to `/payment/history` (showing coming soon)
- No other payment-related UI changes needed

**Acceptance Criteria**:
- [ ] Payment page shows "Coming Soon" message
- [ ] Payment history page shows "Coming Soon" message
- [ ] "Payments" tab still visible on dashboard
- [ ] Certificate requests create immediately (FREE)
- [ ] QRT ID requests generate immediately (FREE)
- [ ] No redirect to payment pages
- [ ] All amounts set to 0 in database
- [ ] Payment references use "FREE-{timestamp}" format
- [ ] Button text updated to include "(FREE)"

### 2.3 Simplified Request ID Flow
**Priority**: MEDIUM
**Effort**: 3-4 hours
**Risk**: MEDIUM (major UX change)

**User Decision**: "Just confirm current address - show registration data, simplest flow"

**Requirements**:

#### 2.3.1 Remove 3-Step Wizard
**Current**: Step 1 (Personal) → Step 2 (Emergency) → Step 3 (Review/Payment)
**New**: Single page with address confirmation

#### 2.3.2 New Flow Design
**Single Page Layout**:
1. **Header**: "Request QRT ID"
2. **User Info Display** (read-only, from registration):
   - Full name
   - Mobile number
   - Email (if provided)
   - Current address (with icon)
3. **Address Confirmation**:
   - Checkbox: "I confirm that the address shown above is my current residence"
   - Visual emphasis (border, background color)
4. **Action Buttons**:
   - Cancel (back to dashboard)
   - "Generate QRT ID (FREE)" (disabled until checkbox checked)

#### 2.3.3 Data Source
Pull from auth context (`useAuth()`):
- `user.fullName`
- `user.mobileNumber`
- `user.email`
- `user.address`
- `user.birthDate` (if available)
- `user.photoUrl` (from registration)

#### 2.3.4 Generation Logic
- No payment step
- No emergency contact collection (can be added later if needed)
- Create QRT ID record immediately
- Status: "ready"
- Amount: 0
- Payment reference: "FREE-{timestamp}"

**Acceptance Criteria**:
- [ ] 3-step wizard removed
- [ ] Single page with user info display
- [ ] Address confirmation checkbox required
- [ ] Submit button disabled until checkbox checked
- [ ] Uses registration data (no re-entry)
- [ ] Generates QRT ID immediately (FREE)
- [ ] Redirects to QRT ID details page
- [ ] No payment step involved

### 2.4 Privacy Policy Enforcement
**Priority**: HIGH (legal compliance)
**Effort**: 1-2 hours
**Risk**: LOW

**User Decision**: "Block submit button until checked, add API validation"

**Requirements**:

#### 2.4.1 Database Schema Changes
**Create Migration**: `/supabase/migrations/008_add_privacy_policy_fields.sql`

\`\`\`sql
ALTER TABLE public.residents
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT DEFAULT 'v1.0';

-- Backfill existing users (implicit consent)
UPDATE public.residents
  SET privacy_policy_accepted = true,
      privacy_policy_accepted_at = created_at,
      privacy_policy_version = 'v1.0'
  WHERE privacy_policy_accepted = false;

-- Add index
CREATE INDEX idx_residents_privacy ON public.residents(privacy_policy_accepted);
\`\`\`

#### 2.4.2 Registration Form UI
**File**: `/app/register/page.tsx`

**Line 763-769** - Update submit button:
\`\`\`typescript
<Button
  type="submit"
  disabled={isLoading || !formData.agreedToTerms}  // ADD condition
  className="... disabled:bg-gray-400 disabled:cursor-not-allowed"  // ADD disabled styles
>
\`\`\`

**Add warning message** (before button):
\`\`\`typescript
{!formData.agreedToTerms && (
  <p className="text-sm text-amber-600 font-medium">
    ⚠️ Please accept the Privacy Policy to create your account
  </p>
)}
\`\`\`

#### 2.4.3 Registration API Validation
**File**: `/app/api/register/route.ts`

**After line 59** - Add privacy validation:
\`\`\`typescript
// Validate privacy policy acceptance
const privacyPolicyAccepted = cleanData.agreedToTerms === true
if (!privacyPolicyAccepted) {
  return Response.json(
    {
      success: false,
      error: "privacy_not_accepted",
      message: "You must accept the Privacy Policy to register"
    },
    { status: 400 }
  )
}
\`\`\`

**Lines 174-196** - Add to INSERT statement:
\`\`\`typescript
privacy_policy_accepted: true,
privacy_policy_accepted_at: new Date().toISOString(),
privacy_policy_version: 'v1.0',
\`\`\`

**Acceptance Criteria**:
- [ ] Database columns added to residents table
- [ ] Existing users backfilled with acceptance = true
- [ ] Submit button disabled until checkbox checked
- [ ] Visual warning shown when unchecked
- [ ] API validates privacy acceptance before saving
- [ ] Returns error if not accepted
- [ ] Saves acceptance timestamp and version
- [ ] No data saved to Supabase until accepted

### 2.5 Dynamic Profile Barangay
**Priority**: LOW (polish)
**Effort**: 15 minutes
**Risk**: None

**Requirements**:

#### 2.5.1 Extract Barangay from Address
**File**: `/app/profile/page.tsx` (line 81)

**Replace hardcoded text**:
\`\`\`typescript
// BEFORE:
<p className="text-sm text-white/80">Barangay Mawaque Resident</p>

// AFTER:
<p className="text-sm text-white/80">
  Barangay {extractBarangay(user.address)} Resident
</p>
\`\`\`

**Add helper function**:
\`\`\`typescript
const extractBarangay = (address: string): string => {
  if (!address) return "Mawaque"

  // Match "Barangay X" or "Brgy X" pattern
  const match = address.match(/(?:Barangay|Brgy\.?)\s+([^,]+)/i)
  if (match) return match[1].trim()

  // Fallback to default
  return "Mawaque"
}
\`\`\`

#### 2.5.2 Address Format Examples
**Registration stores addresses like**:
- "123 Main St, Purok 1, Barangay Mawaque, Quezon City, Metro Manila 1100"
- "45 Rizal Ave, Brgy. San Antonio, Manila, Metro Manila"
- "Unit 5, Barangay Central, Pasig City"

**Expected Extractions**:
- "Barangay Mawaque Resident"
- "Barangay San Antonio Resident"
- "Barangay Central Resident"

**Acceptance Criteria**:
- [ ] Barangay extracted from user address
- [ ] Displays correctly in profile subtitle
- [ ] Handles missing barangay gracefully (fallback to "Mawaque")
- [ ] Works with different address formats
- [ ] Case-insensitive matching

### 2.6 Supabase-Backed Announcements CMS
**Priority**: HIGH (critical feature)
**Effort**: 5-6 hours
**Risk**: MEDIUM

**User Decision**: "Full Supabase CMS with announcements table, show 'No updates yet' if empty"

**Requirements**:

#### 2.6.1 Database Schema
**Create Migration**: `/supabase/migrations/007_create_announcements_table.sql`

\`\`\`sql
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'health', 'emergency', 'event', 'notice')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES public.residents(id),
  author_name TEXT,
  approved_by UUID,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_announcements_published ON public.announcements(is_published, created_at DESC);
CREATE INDEX idx_announcements_pinned ON public.announcements(is_pinned) WHERE is_published = true;
CREATE INDEX idx_announcements_category ON public.announcements(category) WHERE is_published = true;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();

-- RLS Policies
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published announcements"
  ON public.announcements FOR SELECT
  USING (is_published = true);

CREATE POLICY "Staff can manage announcements"
  ON public.announcements FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grants
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;
\`\`\`

#### 2.6.2 Replace Announcements Context
**File**: `/lib/announcements-context.tsx`

**Requirements**:
- Remove ALL localStorage logic
- Replace with Supabase queries
- Keep same interface (backwards compatibility)
- Transform snake_case (DB) ↔ camelCase (React)

**Operations**:
- `loadAnnouncements()`: Fetch from Supabase on mount
- `addAnnouncement()`: INSERT to Supabase
- `updateAnnouncement()`: UPDATE in Supabase
- `deleteAnnouncement()`: DELETE from Supabase
- `refreshAnnouncements()`: Re-fetch from Supabase
- `getPublishedAnnouncements()`: Filter published only

**State Management**:
- `announcements: Announcement[]` - Fetched from DB
- `isLoading: boolean` - Loading state
- `error: string | null` - Error handling

#### 2.6.3 Dashboard Empty States
**File**: `/app/dashboard/page.tsx`

**Lines 224-228** - Barangay Updates (pinned/urgent):
\`\`\`typescript
{priorityAnnouncements.length === 0 ? (
  <Card className="flex flex-col items-center justify-center p-8 text-center bg-gray-50">
    <div className="rounded-full bg-blue-100 p-4 mb-4">
      <Bell className="h-8 w-8 text-blue-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Updates Yet</h3>
    <p className="text-sm text-gray-600">
      Check back later for important announcements from the Barangay Captain
    </p>
  </Card>
) : (
  // existing carousel
)}
\`\`\`

**Lines 272-275** - Announcements (regular):
\`\`\`typescript
{regularAnnouncements.length === 0 ? (
  <Card className="flex flex-col items-center justify-center p-8 text-center bg-gray-50">
    <div className="rounded-full bg-gray-100 p-4 mb-4">
      <Inbox className="h-8 w-8 text-gray-600" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Announcements</h3>
    <p className="text-sm text-gray-600">
      There are no announcements at this time
    </p>
  </Card>
) : (
  // existing carousel
)}
\`\`\`

#### 2.6.4 Staff CMS Integration
**File**: `/app/staff/announcements/page.tsx`

**Requirements**:
- No changes needed (already has CRUD UI)
- Just test that it works with new Supabase context
- Verify create/edit/delete/publish functionality
- Ensure published announcements appear on dashboard

**Acceptance Criteria**:
- [ ] Announcements table created in Supabase
- [ ] RLS policies enable public read, staff manage
- [ ] Announcements context uses Supabase (not localStorage)
- [ ] Dashboard shows empty states when no announcements
- [ ] Staff CMS can create announcements (persists to DB)
- [ ] Staff CMS can edit announcements
- [ ] Staff CMS can delete announcements
- [ ] Staff CMS can publish/unpublish
- [ ] Published announcements appear on dashboard
- [ ] Pinned announcements show in "Barangay Updates"
- [ ] Regular announcements show in "Announcements"
- [ ] Error handling for failed DB queries

---

## 3. Files That Need Modification

### 3.1 Database Migrations
- **CREATE**: `/supabase/migrations/007_create_announcements_table.sql`
- **CREATE**: `/supabase/migrations/008_add_privacy_policy_fields.sql`

### 3.2 API Routes
- `/app/api/register/route.ts` - Add privacy validation, save privacy fields

### 3.3 Pages (Major Changes)
- `/app/register/page.tsx` - Disable submit until privacy checked, add warning
- `/app/dashboard/page.tsx` - Swap service positions, update empty states
- `/app/profile/page.tsx` - Extract dynamic barangay
- `/app/request/page.tsx` - Remove payment flow, make FREE, create directly
- `/app/qrt-id/request/page.tsx` - **COMPLETE REWRITE**: Simplify to single page
- `/app/payment/page.tsx` - Convert to "Coming Soon"
- `/app/payment/history/page.tsx` - Convert to "Coming Soon"

### 3.4 Contexts
- `/lib/announcements-context.tsx` - **COMPLETE REWRITE**: Replace localStorage with Supabase

### 3.5 Components (May Need Creation)
- **CREATE**: `/components/coming-soon-page.tsx` - Reusable coming soon component

---

## 4. Technical Considerations

### 4.1 Database Migration Strategy
**Order**:
1. Run migrations on staging first
2. Test all features in staging
3. Backup production database
4. Run migrations on production
5. Verify data integrity

**Rollback Plan**:
\`\`\`sql
-- If needed to rollback announcements table
DROP TABLE IF EXISTS public.announcements CASCADE;

-- If needed to rollback privacy fields
ALTER TABLE public.residents
  DROP COLUMN IF EXISTS privacy_policy_accepted,
  DROP COLUMN IF EXISTS privacy_policy_accepted_at,
  DROP COLUMN IF EXISTS privacy_policy_version;
\`\`\`

### 4.2 Data Migration (Existing Announcements)
**Challenge**: Announcements currently in localStorage need migration

**Options**:
1. **Manual Migration** (Recommended for small datasets):
   - Staff re-creates important announcements in new system
   - Fresh start with database-backed system

2. **Automated Migration**:
   - Create migration script to read localStorage
   - Bulk insert to Supabase
   - Run once from staff dashboard

**Decision**: Start fresh (no migration) - localStorage announcements are temporary/non-critical

### 4.3 Backward Compatibility
**Registration**:
- Existing users without privacy acceptance: Backfill to `true` with timestamp = `created_at`
- Rationale: Implicit consent from existing registrations

**Payments**:
- In-progress paid requests: Set amount to 0, payment reference to "FREE-{id}"
- Past payment history: Keep in database for records (read-only)

**QRT IDs**:
- Existing QRT requests: Keep as-is (already issued)
- New flow only applies to new requests

### 4.4 Error Handling
**Supabase Connection Failures**:
- Announcements: Show empty state with "Unable to load announcements"
- Registration: Show error toast, don't proceed
- QRT ID: Show error message, allow retry

**Validation Errors**:
- Privacy not accepted: Show inline warning + disabled button
- Address confirmation: Require checkbox before submit
- API errors: Display user-friendly messages

### 4.5 Performance Considerations
**Announcements**:
- Index on `is_published` + `created_at` for fast queries
- Limit initial load to recent 50 announcements
- Pagination for staff CMS if > 100 announcements

**Database Queries**:
- Use Supabase `.select()` with specific columns (not `*`)
- Add `.order()` for consistent results
- Use `.single()` for single-row queries

---

## 5. User Flow Changes

### 5.1 New Certificate Request Flow
**BEFORE**:
1. Dashboard → Request Certificate
2. Fill form (personal info, certificate type, purpose)
3. Click "Proceed to Payment"
4. Redirect to `/payment?type=certificate`
5. Select request type (Regular ₱50 / Rush ₱100)
6. Choose payment method
7. Process payment
8. Certificate issued

**AFTER**:
1. Dashboard → Request Certificate
2. Fill form (personal info, certificate type, purpose)
3. Click "Submit Request (FREE)"
4. Certificate created immediately with status "processing"
5. Redirect to certificate details page
6. Certificate ready for staff to process (no payment needed)

**Time Saved**: 3 steps removed, instant submission

### 5.2 New QRT ID Request Flow
**BEFORE**:
1. Dashboard → Request ID
2. Step 1: Enter personal info (name, DOB, address, height, weight, photo)
3. Step 2: Enter emergency contact details
4. Step 3: Review all data
5. Select request type (Standard ₱100 / Express ₱200)
6. Redirect to payment page
7. Process payment
8. QRT ID issued

**AFTER**:
1. Dashboard → Request ID
2. View pre-filled info from registration
3. Check "I confirm my current address"
4. Click "Generate QRT ID (FREE)"
5. QRT ID generated instantly
6. Redirect to QRT ID details page

**Time Saved**: From 8 steps to 4 steps, uses existing data, no payment

### 5.3 New Registration Flow
**BEFORE**:
1. Fill registration form
2. Upload ID scan (optional OCR)
3. Check privacy policy checkbox (can uncheck)
4. Click "Create Account"
5. Data saves to database
6. Redirect to success page

**AFTER**:
1. Fill registration form
2. Upload ID scan (optional OCR)
3. Check privacy policy checkbox (REQUIRED)
4. Submit button disabled until checked
5. Click "Create Account" (only enabled when checked)
6. API validates privacy acceptance
7. Data saves to database with privacy timestamp
8. Redirect to success page

**Change**: Enforced privacy acceptance BEFORE data save (legal compliance)

---

## 6. Acceptance Criteria (Master Checklist)

### 6.1 Homepage
- [ ] Request ID and Bayanihan positions swapped in service grid
- [ ] All services route correctly
- [ ] No visual regressions

### 6.2 Payments Removal
- [ ] Payment page shows "Coming Soon" with appropriate message
- [ ] Payment history page shows "Coming Soon"
- [ ] "Payments" tab still visible on dashboard
- [ ] Payments tab routes to history page (coming soon)
- [ ] Certificate requests are FREE (no payment redirect)
- [ ] QRT ID requests are FREE (no payment redirect)
- [ ] All new requests save with amount = 0
- [ ] Payment references use "FREE-{timestamp}" format

### 6.3 Request ID Simplification
- [ ] 3-step wizard removed completely
- [ ] Single-page layout with user info display
- [ ] User info pulled from registration (auth context)
- [ ] Address confirmation checkbox required
- [ ] Submit button disabled until checkbox checked
- [ ] QRT ID generated immediately (FREE)
- [ ] No emergency contact collection
- [ ] Redirects to QRT ID details after generation
- [ ] All data populated correctly in final QRT ID

### 6.4 Privacy Policy Enforcement
- [ ] Database columns added: privacy_policy_accepted, privacy_policy_accepted_at, privacy_policy_version
- [ ] Existing users backfilled with acceptance = true
- [ ] Submit button disabled until checkbox checked
- [ ] Warning message shown when unchecked
- [ ] Button styling shows disabled state
- [ ] API validates privacy acceptance before saving
- [ ] API returns 400 error if not accepted
- [ ] Privacy timestamp and version saved to database
- [ ] No data saved to Supabase until accepted

### 6.5 Profile Barangay
- [ ] Barangay name extracted from user address
- [ ] Displays correctly in subtitle
- [ ] Handles missing barangay (fallback to "Mawaque")
- [ ] Case-insensitive matching works
- [ ] Works with multiple address formats

### 6.6 Announcements CMS
- [ ] Announcements table created in Supabase
- [ ] Table has all required columns and constraints
- [ ] Indexes created for performance
- [ ] RLS policies configured correctly
- [ ] Announcements context uses Supabase (not localStorage)
- [ ] Context loads announcements on mount
- [ ] Staff can create announcements (saves to DB)
- [ ] Staff can edit announcements (updates DB)
- [ ] Staff can delete announcements (removes from DB)
- [ ] Staff can publish/unpublish announcements
- [ ] Published announcements appear on dashboard
- [ ] Pinned/urgent show in "Barangay Updates" section
- [ ] Regular show in "Announcements" section
- [ ] Empty states show "No updates yet" when no announcements
- [ ] Empty states have appropriate icons and messaging
- [ ] Error handling for failed DB queries
- [ ] Loading states displayed during fetches

### 6.7 Cross-Browser Testing
- [ ] Tested on Chrome
- [ ] Tested on Firefox
- [ ] Tested on Safari
- [ ] Tested on mobile browsers
- [ ] No console errors

### 6.8 Data Integrity
- [ ] Existing residents not affected by migrations
- [ ] Existing certificates/QRT IDs remain intact
- [ ] No data loss during deployment
- [ ] Database backups created before migrations

---

## 7. Testing Strategy

### 7.1 Unit Testing Focus Areas
- Privacy policy validation (API route)
- Barangay extraction helper function
- Announcements CRUD operations
- Form validation logic

### 7.2 Integration Testing
- Complete registration flow with privacy enforcement
- Certificate request flow (free, no payment)
- QRT ID request flow (simplified, free)
- Announcements publish → dashboard display
- Staff CMS → public view

### 7.3 Manual Testing Checklist

#### Registration
- [ ] Try to submit without privacy checkbox → Button disabled
- [ ] Check privacy box → Button enabled
- [ ] Submit → Data saved with privacy timestamp
- [ ] Verify database has privacy fields populated

#### Certificate Request
- [ ] Fill certificate form
- [ ] Submit → No redirect to payment
- [ ] Certificate created with amount = 0
- [ ] Redirect to certificate details
- [ ] Verify status = "processing"

#### QRT ID Request
- [ ] Navigate to Request ID
- [ ] See simplified single-page form
- [ ] Info pre-filled from registration
- [ ] Try to submit without address confirmation → Button disabled
- [ ] Check address confirmation → Button enabled
- [ ] Submit → QRT ID generated instantly
- [ ] Redirect to QRT ID details
- [ ] Verify amount = 0, status = "ready"

#### Profile
- [ ] View profile page
- [ ] Verify barangay name is dynamic (not "Mawaque" if different)
- [ ] Test with different address formats

#### Announcements (Staff)
- [ ] Login as staff
- [ ] Create new announcement
- [ ] Verify saves to Supabase (check database)
- [ ] Publish announcement
- [ ] View dashboard → Announcement appears
- [ ] Pin announcement → Appears in "Barangay Updates"
- [ ] Unpin → Moves to "Announcements" section
- [ ] Delete announcement → Removed from dashboard
- [ ] Clear all announcements → Empty state displays

#### Announcements (Public)
- [ ] View dashboard with no announcements → Empty states shown
- [ ] Staff publishes announcement → Appears on dashboard
- [ ] Pinned shows in correct section
- [ ] Regular shows in correct section

#### Payments
- [ ] Click "Payments" tab → Routes to payment history
- [ ] Payment history shows "Coming Soon"
- [ ] Navigate to `/payment` directly → Shows "Coming Soon"
- [ ] Back buttons work correctly

### 7.4 Edge Cases
- [ ] User with no address → Profile shows "Barangay Mawaque Resident"
- [ ] User with malformed address → Graceful fallback
- [ ] Network failure during announcement fetch → Error message shown
- [ ] Supabase connection issue → Graceful degradation
- [ ] Multiple simultaneous QRT requests → No conflicts
- [ ] Very long announcement content → Proper truncation/display

---

## 8. Deployment Plan

### Phase 1: Database Migrations (CRITICAL - DO FIRST)
1. **Backup production database**
   \`\`\`bash
   pg_dump $PROD_DB_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   \`\`\`

2. **Run migrations on staging**
   \`\`\`bash
   psql $STAGING_DB_URL -f supabase/migrations/007_create_announcements_table.sql
   psql $STAGING_DB_URL -f supabase/migrations/008_add_privacy_policy_fields.sql
   \`\`\`

3. **Verify tables created**
   \`\`\`bash
   psql $STAGING_DB_URL -c "\d announcements"
   psql $STAGING_DB_URL -c "\d residents" | grep privacy
   \`\`\`

4. **Test on staging environment**
   - Create test announcement
   - Register test user
   - Verify data persists

5. **Run migrations on production** (after staging verified)
   \`\`\`bash
   psql $PROD_DB_URL -f supabase/migrations/007_create_announcements_table.sql
   psql $PROD_DB_URL -f supabase/migrations/008_add_privacy_policy_fields.sql
   \`\`\`

### Phase 2: Code Deployment
1. **Create deployment branch**
   \`\`\`bash
   git checkout -b production-ready-improvements
   \`\`\`

2. **Commit changes in logical groups**
   \`\`\`bash
   git commit -m "feat: add privacy policy enforcement"
   git commit -m "feat: remove payment system, make services free"
   git commit -m "feat: simplify QRT ID request flow"
   git commit -m "feat: implement Supabase-backed announcements CMS"
   git commit -m "feat: make profile barangay dynamic"
   git commit -m "chore: swap homepage service positions"
   \`\`\`

3. **Deploy to staging**
   \`\`\`bash
   vercel --scope=staging
   \`\`\`

4. **Run full testing suite** (see section 7.3)

5. **Deploy to production**
   \`\`\`bash
   vercel --prod
   \`\`\`

### Phase 3: Post-Deployment Verification
1. **Monitor Supabase metrics**
   - Query performance
   - Connection pool usage
   - Error rates

2. **Check application logs**
   - API errors
   - Failed database queries
   - User-facing errors

3. **Verify key flows**
   - New user registration
   - Certificate request
   - QRT ID request
   - Announcement creation

4. **User acceptance testing**
   - Have stakeholder test all features
   - Gather feedback
   - Address any issues

---

## 9. Rollback Strategy

### If Database Issues Occur
\`\`\`sql
-- Rollback announcements table
DROP TABLE IF EXISTS public.announcements CASCADE;

-- Rollback privacy policy fields
ALTER TABLE public.residents
  DROP COLUMN IF EXISTS privacy_policy_accepted,
  DROP COLUMN IF EXISTS privacy_policy_accepted_at,
  DROP COLUMN IF EXISTS privacy_policy_version;

-- Restore from backup if needed
psql $PROD_DB_URL < backup_YYYYMMDD_HHMMSS.sql
\`\`\`

### If Code Issues Occur
\`\`\`bash
# Revert to previous deployment
vercel rollback

# OR revert git commits
git revert HEAD~6..HEAD
git push origin main

# Redeploy old version
vercel --prod
\`\`\`

### If Partial Rollback Needed
Each feature is independent, can rollback individually:
- Privacy enforcement: Revert registration page + API changes
- Announcements: Revert context file + dashboard changes
- Request flows: Revert individual page files
- Keep database changes (non-breaking)

---

## 10. Success Metrics

### Post-Deployment KPIs
- **Registration completion rate**: Should increase (easier privacy acceptance)
- **QRT ID requests**: Should increase (simpler flow, no payment)
- **Certificate requests**: Should increase (free, no friction)
- **Announcements published**: Track usage by barangay captain/staff
- **Page load time**: Should remain < 2 seconds
- **Database query time**: Should be < 500ms
- **Error rate**: Should remain < 1%

### User Satisfaction Indicators
- Fewer support requests about payment issues
- Faster request completion times
- Positive feedback on simplified flows
- Increased engagement with announcements

---

## 11. Future Enhancements (Out of Scope)

The following are NOT included in this spec but may be considered later:
- Re-enable payment processing (when ready)
- Add emergency contact collection back to QRT ID (optional field)
- Announcement email notifications
- Push notifications for urgent announcements
- Advanced announcement scheduling
- Announcement analytics/views tracking
- User profile editing
- Address update flow for existing users
- Multi-language support
- Dark mode

---

## 12. Notes and Assumptions

### Assumptions
- Supabase is properly configured and accessible
- User authentication (useAuth) is working correctly
- Existing localStorage data (announcements) is non-critical and can be discarded
- Existing users have implicitly consented to privacy policy (backfill acceptable)
- Staff have appropriate permissions to manage announcements
- No ongoing paid requests at time of deployment

### Design Decisions
- **Free vs Paid**: All services FREE (user requirement - reduce friction for production launch)
- **QRT ID Simplification**: Use registration data (user requirement - avoid redundant data entry)
- **Announcements Storage**: Supabase over localStorage (user requirement - persistence and scalability)
- **Privacy Enforcement**: Block submit + API validation (defense in depth)
- **Empty States**: Informative messages over blank screens (better UX)
- **Payments Coming Soon**: Keep tab visible for future re-enablement

### Technical Debt
- Payment system code kept but inactive (can be re-enabled later)
- Emergency contact data not collected for QRT ID (acceptable for now)
- Hardcoded province/city lists (future: dynamic from database)
- No audit trail for announcement changes (future enhancement)

---

**End of Requirements Document**
