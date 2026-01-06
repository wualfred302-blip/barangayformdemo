# Certificate Database Migration

## Migration Required: 006_add_certificate_fields.sql

The `certificates` table in Supabase is missing several columns that the application needs.

### To Apply This Migration:

1. **Open Supabase Dashboard:**
   - Go to: https://rwjynnebxruknwhqowjp.supabase.co/project/_/sql

2. **Open SQL Editor:**
   - Click on "SQL Editor" in the left sidebar

3. **Run the Migration:**
   - Copy the contents of `scripts/006_add_certificate_fields.sql`
   - Paste it into the SQL editor
   - Click "Run" or press Ctrl+Enter

4. **Verify:**
   - You should see success messages for each statement
   - The table should now have all the required columns

### What This Migration Does:

- Adds 17 missing columns to the `certificates` table:
  - `custom_purpose`, `payment_transaction_id`, `purok`
  - `years_of_residency`, `residency_since`, `resident_name`
  - `sex`, `sex_orientation`, `civil_status`, `birthplace`
  - `occupation`, `monthly_income`
  - `valid_id_type`, `valid_id_number`
  - `staff_signature`, `signed_by`, `signed_by_role`, `signed_at`

- Creates performance indexes on:
  - `user_id` (for user-based filtering)
  - `created_at` (for sorting)
  - `status` (for filtering by status)

### Alternative: Using PostgreSQL Client

If you have `psql` installed and your Supabase connection string:

```bash
psql "postgresql://postgres:[YOUR_PASSWORD]@db.rwjynnebxruknwhqowjp.supabase.co:5432/postgres" < scripts/006_add_certificate_fields.sql
```

Replace `[YOUR_PASSWORD]` with your Supabase database password.
