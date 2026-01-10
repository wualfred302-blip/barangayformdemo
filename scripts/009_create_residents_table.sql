-- =====================================================
-- RESIDENTS TABLE MIGRATION
-- Creates the residents table for barangay registration system
-- This table stores all registered resident information
-- =====================================================

-- Create residents table
CREATE TABLE IF NOT EXISTS public.residents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Authentication
  mobile_number TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  pin_hash TEXT NOT NULL,

  -- Personal Information
  full_name TEXT NOT NULL,
  email TEXT,
  birth_date TEXT,

  -- Address
  address TEXT,
  house_lot_no TEXT,
  street TEXT,
  purok TEXT,
  barangay TEXT,
  city_municipality TEXT,
  province TEXT,
  zip_code TEXT,

  -- Identification
  id_type TEXT NOT NULL,
  id_number TEXT NOT NULL,
  id_document_url TEXT,
  qr_code TEXT,

  -- Privacy Policy
  privacy_policy_accepted BOOLEAN NOT NULL DEFAULT false,
  privacy_policy_accepted_at TIMESTAMPTZ,
  privacy_policy_version TEXT DEFAULT 'v1.0',

  -- Security (for login attempts and account locking)
  failed_login_attempts INTEGER DEFAULT 0,
  lockout_until TIMESTAMPTZ,
  last_login TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_residents_mobile ON public.residents(mobile_number);
CREATE INDEX IF NOT EXISTS idx_residents_privacy ON public.residents(privacy_policy_accepted);
CREATE INDEX IF NOT EXISTS idx_residents_purok ON public.residents(purok);
CREATE INDEX IF NOT EXISTS idx_residents_full_name ON public.residents(full_name);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_residents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_residents_timestamp ON public.residents;
CREATE TRIGGER update_residents_timestamp
  BEFORE UPDATE ON public.residents
  FOR EACH ROW
  EXECUTE FUNCTION update_residents_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.residents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for residents
-- Note: These policies allow authenticated users to view their own data
-- Staff may need additional policies for managing resident records

-- Allow residents to view their own profile
CREATE POLICY "Residents can view own profile"
  ON public.residents FOR SELECT
  USING (mobile_number = current_setting('request.jwt.claims', true)::json->>'mobile_number');

-- Allow residents to update their own profile
CREATE POLICY "Residents can update own profile"
  ON public.residents FOR UPDATE
  USING (mobile_number = current_setting('request.jwt.claims', true)::json->>'mobile_number');

-- Allow public insert for registration (anonymous users can register)
CREATE POLICY "Anyone can register"
  ON public.residents FOR INSERT
  WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE public.residents IS 'Stores all registered resident information including authentication credentials, personal details, and address information';
