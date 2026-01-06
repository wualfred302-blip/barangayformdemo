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
