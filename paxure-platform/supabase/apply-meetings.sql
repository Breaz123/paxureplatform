-- Run this in Supabase Dashboard > SQL Editor to create the meetings table and policies.
-- Use this if migrations were not applied (e.g. "Meetingverslag opslaan mislukt").

-- Ensure trigger function exists (from initial schema)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Meetings table for meeting reports (verslagen)
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titel TEXT NOT NULL,
  datum TIMESTAMPTZ NOT NULL,
  notities TEXT,
  actiepunten TEXT[],
  aanwezigen TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_datum ON public.meetings(datum);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON public.meetings(created_by);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so we can recreate them
DROP POLICY IF EXISTS "Authenticated users can view meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can manage meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can insert own meeting" ON public.meetings;
DROP POLICY IF EXISTS "Users can update delete meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete meetings" ON public.meetings;

-- All authenticated users can view meetings
CREATE POLICY "Authenticated users can view meetings" ON public.meetings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Any authenticated user can INSERT a meeting when they set themselves as creator
CREATE POLICY "Users can insert own meeting" ON public.meetings
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Only creator or managers can UPDATE and DELETE
CREATE POLICY "Users can update delete meetings" ON public.meetings
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('operationeel_verantwoordelijke', 'business_developer', 'admin')
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('operationeel_verantwoordelijke', 'business_developer', 'admin')
    )
  );

CREATE POLICY "Users can delete meetings" ON public.meetings
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('operationeel_verantwoordelijke', 'business_developer', 'admin')
    )
  );

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_meetings_updated_at ON public.meetings;
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
