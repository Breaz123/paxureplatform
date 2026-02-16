-- Verlof (Leave) System Migration
-- Creates verlof table and related policies
--
-- IMPORTANT: This migration assumes:
-- 1. The user_role enum already exists (from migration 20240101000000_initial_schema.sql)
-- 2. All required enum values exist, including 'admin' (from migration 20240101000007_add_admin_role.sql)
--
-- If you get errors about missing enum values, ensure you have run:
-- - 20240101000000_initial_schema.sql (creates enum with: business_developer, operationeel_verantwoordelijke, coach, hulpcoach, maatwerker)
-- - 20240101000007_add_admin_role.sql (adds 'admin' to enum)
--
-- Note: PostgreSQL requires enum values to be committed before they can be used in policies,
-- so we cannot add enum values in the same transaction as creating policies that use them.

-- Verlof table
CREATE TABLE IF NOT EXISTS public.verlof (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  medewerker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_datum DATE NOT NULL,
  eind_datum DATE NOT NULL,
  type TEXT DEFAULT 'verlof', -- verlof, ziekte, feestdag, etc.
  opmerking TEXT,
  goedgekeurd BOOLEAN DEFAULT false,
  goedgekeurd_door UUID REFERENCES public.profiles(id),
  goedgekeurd_op TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (eind_datum >= start_datum)
);

-- Index for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_verlof_medewerker ON public.verlof(medewerker_id);
CREATE INDEX IF NOT EXISTS idx_verlof_dates ON public.verlof(start_datum, eind_datum);
CREATE INDEX IF NOT EXISTS idx_verlof_date_range ON public.verlof USING GIST (daterange(start_datum, eind_datum, '[]'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_verlof_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_verlof_updated_at ON public.verlof;
CREATE TRIGGER update_verlof_updated_at
  BEFORE UPDATE ON public.verlof
  FOR EACH ROW
  EXECUTE FUNCTION update_verlof_updated_at();

-- RLS Policies
ALTER TABLE public.verlof ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all verlof entries
DROP POLICY IF EXISTS "Users can view verlof" ON public.verlof;
CREATE POLICY "Users can view verlof"
  ON public.verlof
  FOR SELECT
  USING (true);

-- Policy: Users with planning rights can insert verlof
DROP POLICY IF EXISTS "Planning users can insert verlof" ON public.verlof;
CREATE POLICY "Planning users can insert verlof"
  ON public.verlof
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Policy: Users can insert their own verlof
DROP POLICY IF EXISTS "Users can insert own verlof" ON public.verlof;
CREATE POLICY "Users can insert own verlof"
  ON public.verlof
  FOR INSERT
  WITH CHECK (medewerker_id = auth.uid());

-- Policy: Planning users can update verlof
DROP POLICY IF EXISTS "Planning users can update verlof" ON public.verlof;
CREATE POLICY "Planning users can update verlof"
  ON public.verlof
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Policy: Users can update their own verlof
DROP POLICY IF EXISTS "Users can update own verlof" ON public.verlof;
CREATE POLICY "Users can update own verlof"
  ON public.verlof
  FOR UPDATE
  USING (medewerker_id = auth.uid() OR created_by = auth.uid());

-- Policy: Planning users can delete verlof
DROP POLICY IF EXISTS "Planning users can delete verlof" ON public.verlof;
CREATE POLICY "Planning users can delete verlof"
  ON public.verlof
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Policy: Users can delete their own verlof
DROP POLICY IF EXISTS "Users can delete own verlof" ON public.verlof;
CREATE POLICY "Users can delete own verlof"
  ON public.verlof
  FOR DELETE
  USING (medewerker_id = auth.uid() OR created_by = auth.uid());

