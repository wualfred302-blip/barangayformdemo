-- QRT IDs table to store all ID requests and issued IDs
CREATE TABLE IF NOT EXISTS public.qrt_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qrt_code TEXT UNIQUE NOT NULL,
  verification_code TEXT UNIQUE NOT NULL,

  -- User tracking
  user_id TEXT,

  -- Personal Information
  full_name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  civil_status TEXT NOT NULL,
  birth_place TEXT NOT NULL,
  address TEXT NOT NULL,
  height TEXT,
  weight TEXT,
  years_resident INTEGER,
  citizenship TEXT,
  
  -- Emergency Contact
  emergency_contact_name TEXT,
  emergency_contact_address TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  
  -- ID Data
  photo_url TEXT,
  id_front_image_url TEXT,
  id_back_image_url TEXT,
  qr_code_data TEXT NOT NULL,
  
  -- Status and Dates
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'issued')),
  request_type TEXT NOT NULL DEFAULT 'regular' CHECK (request_type IN ('regular', 'rush')),
  issued_date TEXT,
  expiry_date TEXT,
  
  -- Payment Info
  payment_reference TEXT,
  payment_transaction_id TEXT,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on qrt_code for fast lookups during verification
CREATE INDEX IF NOT EXISTS idx_qrt_ids_qrt_code ON public.qrt_ids(qrt_code);
CREATE INDEX IF NOT EXISTS idx_qrt_ids_verification_code ON public.qrt_ids(verification_code);
CREATE INDEX IF NOT EXISTS idx_qrt_ids_status ON public.qrt_ids(status);
CREATE INDEX IF NOT EXISTS idx_qrt_ids_user_id ON public.qrt_ids(user_id);

-- Enable Row Level Security
ALTER TABLE public.qrt_ids ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert new QRT ID requests (public form submission)
CREATE POLICY "Allow public insert" ON public.qrt_ids
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow anyone to read QRT IDs (for verification by barangay captain)
CREATE POLICY "Allow public read" ON public.qrt_ids
  FOR SELECT
  USING (true);

-- Policy: Allow anyone to update QRT IDs (for status updates after payment)
CREATE POLICY "Allow public update" ON public.qrt_ids
  FOR UPDATE
  USING (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on row update
DROP TRIGGER IF EXISTS update_qrt_ids_updated_at ON public.qrt_ids;
CREATE TRIGGER update_qrt_ids_updated_at
  BEFORE UPDATE ON public.qrt_ids
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
