-- QRT ID System Migration
-- Creates tables, functions, and triggers for QRT ID management

-- Create QRT IDs table
CREATE TABLE IF NOT EXISTS public.qrt_ids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qrt_code TEXT UNIQUE,
    user_id TEXT NOT NULL,

    -- Personal Information
    full_name TEXT NOT NULL,
    birth_date TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    civil_status TEXT NOT NULL,
    birth_place TEXT NOT NULL,
    address TEXT NOT NULL,
    height TEXT NOT NULL,
    weight TEXT NOT NULL,
    years_resident INTEGER NOT NULL,
    citizenship TEXT NOT NULL,

    -- Emergency Contact Information
    emergency_contact_name TEXT NOT NULL,
    emergency_contact_address TEXT NOT NULL,
    emergency_contact_phone TEXT NOT NULL,
    emergency_contact_relationship TEXT NOT NULL,

    -- Image URLs
    photo_url TEXT NOT NULL,
    id_front_image_url TEXT,
    id_back_image_url TEXT,

    -- QR Code Data
    qr_code_data TEXT,

    -- Status Management
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'issued')),

    -- Dates
    issued_date DATE,
    expiry_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create QRT Counter table for auto-incrementing QRT codes
CREATE TABLE IF NOT EXISTS public.qrt_counter (
    id INTEGER PRIMARY KEY DEFAULT 1,
    current_number INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT qrt_single_row CHECK (id = 1)
);

-- Insert initial counter row
INSERT INTO public.qrt_counter (id, current_number)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Function to generate QRT code
CREATE OR REPLACE FUNCTION generate_qrt_code()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Update counter and get next number
    UPDATE public.qrt_counter
    SET current_number = current_number + 1
    WHERE id = 1
    RETURNING current_number INTO next_number;

    -- Format as QRT-YYYY-NNNNNN
    RETURN 'QRT-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(next_number::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-generate QRT code
CREATE OR REPLACE FUNCTION set_qrt_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.qrt_code IS NULL THEN
        NEW.qrt_code := generate_qrt_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for QRT code generation
DROP TRIGGER IF EXISTS generate_qrt_serial ON public.qrt_ids;
CREATE TRIGGER generate_qrt_serial
    BEFORE INSERT ON public.qrt_ids
    FOR EACH ROW
    EXECUTE FUNCTION set_qrt_code();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_qrt_ids_status ON public.qrt_ids(status);
CREATE INDEX IF NOT EXISTS idx_qrt_ids_created_at ON public.qrt_ids(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qrt_ids_qrt_code ON public.qrt_ids(qrt_code);
CREATE INDEX IF NOT EXISTS idx_qrt_ids_user_id ON public.qrt_ids(user_id);

-- Update function to set updated_at timestamp
CREATE OR REPLACE FUNCTION update_qrt_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_qrt_timestamp ON public.qrt_ids;
CREATE TRIGGER update_qrt_timestamp
    BEFORE UPDATE ON public.qrt_ids
    FOR EACH ROW
    EXECUTE FUNCTION update_qrt_updated_at();
