# Phase 1 Completion Guide

**Quick guide to complete the data seeding and unblock production deployment**

---

## Current Situation

Phase 1 (Data Seeding) was NOT executed. The database currently has:
- 82/82 provinces ✅
- 39/1,634 cities ❌ (2.4% coverage)
- 27/42,000+ barangays ❌ (0.1% coverage)

This means the system only works for Metro Manila and partial Pampanga.

---

## Solution: Execute the Seed Script

The seed script already exists and is correct. It just needs to be run.

### Step 1: Verify Environment Variables

Make sure you have these in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Optional but recommended for faster seeding
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Step 2: Run the Seed Script

```bash
cd /home/user/barangayformdemo
npx tsx scripts/seed-addresses.ts
```

**Expected Output:**
```
=== PSGC Address Seeding Script ===

Fetching provinces from PSGC API...
Inserting 82 provinces...
✓ Inserted 82 provinces

Fetching cities/municipalities from PSGC API...
Inserting 1634 cities/municipalities...
  Batch 1/4 done
  Batch 2/4 done
  Batch 3/4 done
  Batch 4/4 done
✓ Inserted 1634 cities/municipalities

Fetching barangays from PSGC API...
Inserting 42036 barangays...
  Batch 1/43 done
  Batch 2/43 done
  ...
  Batch 43/43 done
✓ Inserted 42036 barangays

=== Seeding Complete ===
Provinces: 82
Cities/Municipalities: 1634
Barangays: 42036
```

**Estimated Time:** 5-10 minutes (depends on network speed and database performance)

### Step 3: Verify Completion

Run the validation script:

```bash
npx tsx scripts/validate-phase3.ts
```

**Expected Output:**
```
📊 Database Record Counts:
  Provinces: 82 / 82 (100%)
  Cities: 1634 / 1,634 ✅
  Barangays: 42036 / 42,000+ ✅

📈 Coverage Percentage:
  Cities: 100.0%
  Barangays: 100.0%

✅ FULL NATIONAL COVERAGE ACHIEVED
```

All regional tests should now pass:
- ✅ Luzon: Manila, Quezon City, Baguio, Zambales/Subic
- ✅ Visayas: Cebu, Iloilo
- ✅ Mindanao: Davao, Cagayan de Oro
- ✅ Edgar Garcia scenario (Zambales → Subic → Ilwas)

---

## Troubleshooting

### Issue: Permission Denied

**Error:**
```
Error: You do not have permission to perform this operation
```

**Solution:**
Use the service role key instead of anon key:

```bash
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> npx tsx scripts/seed-addresses.ts
```

### Issue: API Timeout

**Error:**
```
Attempt 1 failed for https://psgc.cloud/api/barangays, retrying...
```

**Solution:**
- The script has automatic retry logic (3 attempts)
- If still failing, check internet connection
- PSGC API may be down - try again later

### Issue: Duplicate Key Errors

**Error:**
```
Error: duplicate key value violates unique constraint
```

**Solution:**
- Script uses `upsert` with conflict resolution
- Safe to re-run - will update existing records
- If persists, check for data corruption in database

### Issue: Out of Memory

**Error:**
```
JavaScript heap out of memory
```

**Solution:**
- Increase Node memory limit:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npx tsx scripts/seed-addresses.ts
```

---

## What Happens After Seeding

Once seeding completes successfully:

1. **Users can register from anywhere in the Philippines**
   - All provinces selectable
   - All cities/municipalities selectable
   - All barangays selectable

2. **OCR address matching works nationwide**
   - Edgar Garcia scenario (Zambales) will work
   - Fuzzy matching for any Philippine address
   - ZIP codes auto-fill for all cities

3. **Production deployment unblocked**
   - System ready for nationwide use
   - No more "city not found" errors
   - Complete address autocomplete coverage

---

## Verification Checklist

After running the seed script, verify:

- [ ] Database has 1,634 cities
- [ ] Database has 42,000+ barangays
- [ ] Can select Manila (NCR)
- [ ] Can select Quezon City (NCR)
- [ ] Can select Baguio (Cordillera)
- [ ] Can select Subic (Zambales)
- [ ] Can select Cebu City (Visayas)
- [ ] Can select Davao City (Mindanao)
- [ ] Edgar Garcia scenario works
- [ ] ZIP codes populate correctly
- [ ] Validation script passes all tests

---

## Next Steps After Completion

1. **Mark Phase 1 as Complete**
   - Update task status in `/agent-os/specs/2026-01-08-address-system-fixes/tasks.md`

2. **Deploy to Production**
   - All phases complete
   - System ready for nationwide use

3. **Monitor Production**
   - Watch for address search errors
   - Monitor API performance
   - Collect user feedback

---

## Quick Command Reference

```bash
# Execute seed script
npx tsx scripts/seed-addresses.ts

# Verify completion
npx tsx scripts/validate-phase3.ts

# Check database counts (alternative)
npx tsx -e "
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
(async () => {
  const cities = await supabase.from('address_cities').select('*', { count: 'exact', head: true });
  const barangays = await supabase.from('address_barangays').select('*', { count: 'exact', head: true });
  console.log('Cities:', cities.count);
  console.log('Barangays:', barangays.count);
})();
"
```

---

**Need Help?**
- Full validation report: `/docs/PHASE_3_VALIDATION_REPORT.md`
- Executive summary: `/docs/PHASE_3_EXECUTIVE_SUMMARY.md`
- Seed script: `/scripts/seed-addresses.ts`
- Validation script: `/scripts/validate-phase3.ts`
