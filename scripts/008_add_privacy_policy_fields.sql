ALTER TABLE public.residents
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT DEFAULT 'v1.0';

-- Backfill existing users (implicit consent)
UPDATE public.residents
  SET privacy_policy_accepted = true,
      privacy_policy_accepted_at = created_at,
      privacy_policy_version = 'v1.0'
  WHERE privacy_policy_accepted = false;

-- Add index
CREATE INDEX idx_residents_privacy ON public.residents(privacy_policy_accepted);
