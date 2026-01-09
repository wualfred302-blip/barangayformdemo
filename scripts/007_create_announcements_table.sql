CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('general', 'health', 'emergency', 'event', 'notice')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')) DEFAULT 'normal',
  image_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES public.residents(id),
  author_name TEXT,
  approved_by UUID,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_announcements_published ON public.announcements(is_published, created_at DESC);
CREATE INDEX idx_announcements_pinned ON public.announcements(is_pinned) WHERE is_published = true;
CREATE INDEX idx_announcements_category ON public.announcements(category) WHERE is_published = true;

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_announcements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_announcements_updated_at();

-- RLS Policies
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published announcements"
  ON public.announcements FOR SELECT
  USING (is_published = true);

CREATE POLICY "Staff can manage announcements"
  ON public.announcements FOR ALL
  USING (true)
  WITH CHECK (true);

-- Grants
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;
