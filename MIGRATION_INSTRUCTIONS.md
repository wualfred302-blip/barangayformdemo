# QRT ID user_id Column Migration Instructions

## Overview
This migration adds a `user_id` column to the `qrt_ids` table to properly track which user created each QRT ID request. This fixes the issue where QRT cards never show because all rows load as "anonymous" instead of being associated with the requesting user.

## Changes Made

### 1. Updated Migration Scripts
- `scripts/001_create_qrt_ids_table.sql` - Added `user_id TEXT` column and index
- `scripts/005_fix_qrt_schema.sql` - Added `user_id TEXT` column and index
- `scripts/006_add_user_id_column.sql` - New migration to add column to existing tables

### 2. Updated Application Code
- `lib/qrt-context.tsx` - Now includes `user_id: request.userId` in insert payload (line 259)
- Mapping functions already handle `user_id` correctly

### 3. No Changes Needed
- `app/qrt-id/page.tsx` - Already filters by `getUserQRTIds(user.id)`, will work once schema is updated

## How to Apply to Supabase

### Option A: If you have NO existing QRT ID data (recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the updated schema script:
   \`\`\`sql
   -- Copy the contents of scripts/005_fix_qrt_schema.sql
   -- This will drop and recreate the table with user_id column
   \`\`\`

### Option B: If you have existing QRT ID data you want to keep
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the migration script:
   \`\`\`sql
   -- Copy the contents of scripts/006_add_user_id_column.sql
   -- This will add the user_id column without dropping the table
   \`\`\`

### Step 2: Verify the Migration
After running either option, verify the column was added:

\`\`\`sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'qrt_ids'
AND column_name = 'user_id';
\`\`\`

You should see:
\`\`\`
column_name | data_type
------------|----------
user_id     | text
\`\`\`

### Step 3: Handle Existing Data (if applicable)
If you have existing QRT ID records and know which users created them, you can update them:

\`\`\`sql
-- Example: Update a specific QRT ID with known user_id
UPDATE public.qrt_ids
SET user_id = 'the-actual-user-id'
WHERE qrt_code = 'QRT-2024-123456';

-- Or update by full name if you can map users that way
-- UPDATE public.qrt_ids
-- SET user_id = 'user-id-here'
-- WHERE full_name = 'John Doe' AND user_id IS NULL;
\`\`\`

**Note:** Rows with `NULL` user_id will not show up in the "My QRT IDs" page for any user.

### Step 4: Test the Application
1. Deploy your updated code (or restart your local dev server)
2. Log in as a user
3. Request a new QRT ID
4. Navigate to "My QRT IDs" page
5. Verify the new QRT ID appears in the list

## Rollback (if needed)

If you need to rollback this migration:

\`\`\`sql
-- Remove the user_id column
ALTER TABLE public.qrt_ids DROP COLUMN IF EXISTS user_id;

-- Remove the index
DROP INDEX IF EXISTS idx_qrt_ids_user_id;
\`\`\`

Then revert the code changes in `lib/qrt-context.tsx` by removing the `user_id` line from the insert payload.

## Expected Behavior After Migration

### Before (broken):
- User requests QRT ID → Saved to database without `user_id`
- User goes to "My QRT IDs" → Page filters by `user.id`
- No matches found because all rows have `userId: "anonymous"`
- User sees "No QRT IDs found"

### After (fixed):
- User requests QRT ID → Saved to database with `user_id: user.id`
- User goes to "My QRT IDs" → Page filters by `user.id`
- Matches found where `row.user_id === user.id`
- User sees their QRT ID cards

## Questions?

If you encounter any issues:
1. Check the Supabase logs for SQL errors
2. Verify the `user_id` column exists: `\d qrt_ids` in SQL editor
3. Check that new inserts include user_id by viewing the most recent row
4. Ensure the user is authenticated when requesting a QRT ID
