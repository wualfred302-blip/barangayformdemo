-- =====================================================
-- Add user_id column to qrt_ids table
-- This migration adds user tracking to existing QRT ID records
-- =====================================================

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'qrt_ids'
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.qrt_ids ADD COLUMN user_id TEXT;
    RAISE NOTICE 'Added user_id column to qrt_ids table';
  ELSE
    RAISE NOTICE 'user_id column already exists in qrt_ids table';
  END IF;
END $$;

-- Create index on user_id for fast filtering
CREATE INDEX IF NOT EXISTS idx_qrt_ids_user_id ON public.qrt_ids(user_id);

-- Note: Existing rows will have NULL user_id
-- If you need to populate user_id for existing rows, you'll need to:
-- 1. Identify how to map existing QRT IDs to users (e.g., by email, phone, or full_name)
-- 2. Run an UPDATE query to set user_id for those rows
-- Example (uncomment and modify if needed):
-- UPDATE public.qrt_ids
-- SET user_id = 'known-user-id'
-- WHERE full_name = 'John Doe' AND user_id IS NULL;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration complete: user_id column added to qrt_ids table';
  RAISE NOTICE 'New QRT ID requests will now include user_id for proper filtering';
  RAISE NOTICE 'Existing rows have NULL user_id - update manually if needed';
END $$;
