-- Migration: Create ID Delivery Requests Table
-- Description: Stores delivery requests for physical ID cards
-- Date: 2026-01-10

-- Create id_delivery_requests table
CREATE TABLE IF NOT EXISTS id_delivery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qrt_id UUID NOT NULL REFERENCES qrt_ids(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  barangay_code TEXT NOT NULL,

  -- Delivery Address (structured)
  delivery_province TEXT NOT NULL,
  delivery_province_code TEXT,
  delivery_city TEXT NOT NULL,
  delivery_city_code TEXT,
  delivery_barangay TEXT NOT NULL,
  delivery_barangay_code TEXT,
  delivery_street_address TEXT NOT NULL,
  delivery_zip_code TEXT,
  delivery_landmark TEXT,

  -- Delivery Preferences
  preferred_date DATE,
  preferred_time_slot TEXT CHECK (preferred_time_slot IN ('morning', 'afternoon', 'evening')),
  delivery_notes TEXT,
  delivery_type TEXT NOT NULL DEFAULT 'delivery' CHECK (delivery_type IN ('delivery', 'pickup')),

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN (
    'requested',
    'printing',
    'printed',
    'out_for_delivery',
    'delivered',
    'delivery_failed',
    'pickup_required'
  )),
  failure_reason TEXT CHECK (failure_reason IN ('not_home', 'wrong_address', 'refused') OR failure_reason IS NULL),
  failed_attempts INTEGER NOT NULL DEFAULT 0,

  -- Updated Selfie (optional retake before printing)
  updated_photo_url TEXT,

  -- Delivery Confirmation (by user)
  delivery_confirmed_at TIMESTAMPTZ,
  delivery_photo_proof TEXT,
  delivery_signature TEXT,

  -- Staff Assignment
  assigned_staff_id TEXT,
  assigned_staff_name TEXT,

  -- Print Queue Reference
  print_batch_id TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_to_print_at TIMESTAMPTZ,
  printed_at TIMESTAMPTZ,
  out_for_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_delivery_requests_status ON id_delivery_requests(status);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_barangay ON id_delivery_requests(barangay_code);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_user ON id_delivery_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_qrt ON id_delivery_requests(qrt_id);
CREATE INDEX IF NOT EXISTS idx_delivery_requests_created ON id_delivery_requests(created_at DESC);

-- Create delivery_status_history table for audit trail
CREATE TABLE IF NOT EXISTS delivery_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_request_id UUID NOT NULL REFERENCES id_delivery_requests(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_request ON delivery_status_history(delivery_request_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created ON delivery_status_history(created_at DESC);

-- Enable Row Level Security
ALTER TABLE id_delivery_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for id_delivery_requests
-- Users can view their own delivery requests
CREATE POLICY "Users can view own delivery requests"
  ON id_delivery_requests
  FOR SELECT
  USING (true);

-- Users can insert their own delivery requests
CREATE POLICY "Users can create delivery requests"
  ON id_delivery_requests
  FOR INSERT
  WITH CHECK (true);

-- Users can update their own delivery requests (for confirmation)
CREATE POLICY "Users can update own delivery requests"
  ON id_delivery_requests
  FOR UPDATE
  USING (true);

-- RLS Policies for delivery_status_history
CREATE POLICY "Anyone can view status history"
  ON delivery_status_history
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert status history"
  ON delivery_status_history
  FOR INSERT
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_delivery_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_delivery_request_timestamp ON id_delivery_requests;
CREATE TRIGGER trigger_update_delivery_request_timestamp
  BEFORE UPDATE ON id_delivery_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_delivery_request_updated_at();

-- Function to log status changes
CREATE OR REPLACE FUNCTION log_delivery_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO delivery_status_history (
      delivery_request_id,
      previous_status,
      new_status,
      changed_by,
      change_reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(NEW.assigned_staff_name, 'system'),
      CASE
        WHEN NEW.status = 'delivery_failed' THEN NEW.failure_reason
        ELSE NULL
      END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-log status changes
DROP TRIGGER IF EXISTS trigger_log_delivery_status ON id_delivery_requests;
CREATE TRIGGER trigger_log_delivery_status
  AFTER UPDATE ON id_delivery_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_delivery_status_change();
