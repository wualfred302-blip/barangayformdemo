# Supabase Migration Plan for Certificate Fix

## Overview
This migration fixes the issue where newly created certificates don't appear in the user's requests list. The root cause was:
1. Certificates were only stored in localStorage (not Supabase)
2. No user-based filtering (all users saw all certificates)

## Solution Implemented
Full Supabase integration with user-based filtering (Option B from the plan).

---

## STEP 1: Run SQL Migration on Supabase

Execute this SQL in your Supabase database:

```sql
-- Migration to add missing fields to certificates table
-- Created: 2026-01-05

-- Add missing columns to certificates table
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS custom_purpose TEXT,
  ADD COLUMN IF NOT EXISTS payment_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS purok TEXT,
  ADD COLUMN IF NOT EXISTS years_of_residency INTEGER,
  ADD COLUMN IF NOT EXISTS residency_since TEXT,
  ADD COLUMN IF NOT EXISTS resident_name TEXT,
  ADD COLUMN IF NOT EXISTS sex TEXT,
  ADD COLUMN IF NOT EXISTS sex_orientation TEXT,
  ADD COLUMN IF NOT EXISTS civil_status TEXT,
  ADD COLUMN IF NOT EXISTS birthplace TEXT,
  ADD COLUMN IF NOT EXISTS occupation TEXT,
  ADD COLUMN IF NOT EXISTS monthly_income DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS valid_id_type TEXT,
  ADD COLUMN IF NOT EXISTS valid_id_number TEXT,
  ADD COLUMN IF NOT EXISTS staff_signature TEXT,
  ADD COLUMN IF NOT EXISTS signed_by TEXT,
  ADD COLUMN IF NOT EXISTS signed_by_role TEXT,
  ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

-- Add index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);

-- Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_certificates_created_at ON public.certificates(created_at DESC);

-- Add index on status for filtering
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);
```

---

## STEP 2: Verify Migration Success

After running the SQL migration, verify that:

1. **Columns were added successfully:**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'certificates'
   ORDER BY ordinal_position;
   ```

   Expected columns should include:
   - `id` (uuid)
   - `user_id` (uuid)
   - `certificate_type` (text)
   - `purpose` (text)
   - `custom_purpose` (text) ← NEW
   - `request_type` (text)
   - `amount` (numeric)
   - `payment_reference` (text)
   - `payment_transaction_id` (text) ← NEW
   - `serial_number` (text)
   - `status` (text)
   - `created_at` (timestamp with time zone)
   - `ready_at` (timestamp with time zone)
   - `purok` (text) ← NEW
   - `years_of_residency` (integer) ← NEW
   - `residency_since` (text) ← NEW
   - `resident_name` (text) ← NEW
   - `sex` (text) ← NEW
   - `sex_orientation` (text) ← NEW
   - `civil_status` (text) ← NEW
   - `birthplace` (text) ← NEW
   - `occupation` (text) ← NEW
   - `monthly_income` (numeric) ← NEW
   - `valid_id_type` (text) ← NEW
   - `valid_id_number` (text) ← NEW
   - `staff_signature` (text) ← NEW
   - `signed_by` (text) ← NEW
   - `signed_by_role` (text) ← NEW
   - `signed_at` (timestamp with time zone) ← NEW

2. **Indexes were created:**
   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE tablename = 'certificates';
   ```

   Should see:
   - `idx_certificates_user_id`
   - `idx_certificates_created_at`
   - `idx_certificates_status`

---

## STEP 3: Code Changes Summary (Already Completed)

The following code changes have already been made in the codebase:

### File: `lib/certificate-context.tsx`
- ✅ Added Supabase client import
- ✅ Added `userId` field to `CertificateRequest` interface
- ✅ Replaced localStorage load with Supabase query (lines 105-131)
- ✅ Updated `addCertificate()` to insert into Supabase (lines 133-183)
- ✅ Updated `updateCertificateStatus()` to update Supabase (lines 185-239)
- ✅ Added `getCertificatesByUserId()` function (lines 258-260)
- ✅ Added `refreshCertificates()` function (lines 262-282)
- ✅ Added `isLoaded` state (line 66, 295)

### File: `app/payment/page.tsx`
- ✅ Added `useAuth` import (line 13)
- ✅ Added `const { user } = useAuth()` hook (line 56)
- ✅ Added `userId: user?.id` to certificate object (line 330)
- ✅ Changed `addCertificate()` to `await addCertificate()` (line 347)

### File: `app/requests/page.tsx`
- ✅ Added `getCertificatesByUserId` to context destructuring (line 24)
- ✅ Added user filtering logic (lines 59-60):
  ```javascript
  const myCertificates = user?.id ? getCertificatesByUserId(user.id) : certificates
  ```
- ✅ Updated combinedRequests to use `myCertificates` instead of `certificates` (line 63)

---

## STEP 4: Testing Checklist

After the migration is complete, test the following:

### Test 1: Certificate Creation
1. Log in as User A
2. Go to `/request` and create a new certificate
3. Complete the payment process
4. **Expected:** Certificate is saved to Supabase `certificates` table with `user_id` = User A's ID

### Test 2: Certificate Display
1. Still logged in as User A
2. Navigate to `/requests`
3. **Expected:** The newly created certificate appears in the list

### Test 3: User Isolation
1. Log in as User B (different user)
2. Navigate to `/requests`
3. **Expected:** User B does NOT see User A's certificate
4. Create a new certificate as User B
5. **Expected:** User B sees only their own certificate

### Test 4: Database Persistence
1. Create a certificate
2. Clear browser localStorage (DevTools → Application → Local Storage → Clear)
3. Refresh the page
4. **Expected:** Certificate still appears (loaded from Supabase, not localStorage)

### Test 5: Cross-Device/Browser
1. Create a certificate on Chrome
2. Log in with the same user on Firefox (or different device)
3. Navigate to `/requests`
4. **Expected:** Certificate appears on the new browser/device

---

## STEP 5: Verify Database Records

After testing, check the Supabase database:

```sql
-- View all certificates with user info
SELECT
  c.id,
  c.user_id,
  c.resident_name,
  c.certificate_type,
  c.status,
  c.created_at,
  c.purok,
  c.years_of_residency
FROM certificates c
ORDER BY c.created_at DESC
LIMIT 10;
```

**Expected:**
- Each certificate should have a `user_id` populated
- All new fields should have data where applicable
- Certificates created after the migration should have all fields

---

## STEP 6: Rollback Plan (If Needed)

If something goes wrong, you can rollback the column additions:

```sql
-- WARNING: This will delete the columns and their data
-- Only use if you need to rollback

ALTER TABLE public.certificates
  DROP COLUMN IF EXISTS custom_purpose,
  DROP COLUMN IF EXISTS payment_transaction_id,
  DROP COLUMN IF EXISTS purok,
  DROP COLUMN IF EXISTS years_of_residency,
  DROP COLUMN IF EXISTS residency_since,
  DROP COLUMN IF EXISTS resident_name,
  DROP COLUMN IF EXISTS sex,
  DROP COLUMN IF EXISTS sex_orientation,
  DROP COLUMN IF EXISTS civil_status,
  DROP COLUMN IF EXISTS birthplace,
  DROP COLUMN IF EXISTS occupation,
  DROP COLUMN IF EXISTS monthly_income,
  DROP COLUMN IF EXISTS valid_id_type,
  DROP COLUMN IF EXISTS valid_id_number,
  DROP COLUMN IF EXISTS staff_signature,
  DROP COLUMN IF EXISTS signed_by,
  DROP COLUMN IF EXISTS signed_by_role,
  DROP COLUMN IF EXISTS signed_at;

DROP INDEX IF EXISTS idx_certificates_user_id;
DROP INDEX IF EXISTS idx_certificates_created_at;
DROP INDEX IF EXISTS idx_certificates_status;
```

---

## Summary

**What was fixed:**
1. ✅ Certificates now save to Supabase database (not just localStorage)
2. ✅ User-based filtering implemented (users only see their own certificates)
3. ✅ Certificates persist across devices and browsers
4. ✅ Staff can access certificates from the database
5. ✅ All certificate form fields now stored in database

**What the other LLM needs to do:**
1. Execute the SQL migration in STEP 1
2. Verify success using STEP 2
3. Run the tests in STEP 4
4. Verify database records in STEP 5

**Files already modified in codebase:**
- `lib/certificate-context.tsx` (Supabase integration)
- `app/payment/page.tsx` (pass user_id)
- `app/requests/page.tsx` (user filtering)
- `scripts/006_add_certificate_fields.sql` (migration SQL)
- `scripts/README-MIGRATION.md` (migration instructions)

Good luck! 🚀
