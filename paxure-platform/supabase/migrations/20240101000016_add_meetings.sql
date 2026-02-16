-- Meetings table for meeting reports (verslagen)
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titel TEXT NOT NULL,
  datum TIMESTAMPTZ NOT NULL,
  notities TEXT,
  actiepunten TEXT[],
  aanwezigen TEXT,
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meetings_datum ON public.meetings(datum);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by ON public.meetings(created_by);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view all meetings
DROP POLICY IF EXISTS "Authenticated users can view meetings" ON public.meetings;
CREATE POLICY "Authenticated users can view meetings" ON public.meetings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Drop legacy policy if it existed from a previous run
DROP POLICY IF EXISTS "Users can manage meetings" ON public.meetings;

-- Any authenticated user can insert a meeting when they are the creator
DROP POLICY IF EXISTS "Users can insert own meeting" ON public.meetings;
CREATE POLICY "Users can insert own meeting" ON public.meetings
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Creator or managers can update
DROP POLICY IF EXISTS "Users can update delete meetings" ON public.meetings;
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

-- Creator or managers can delete
DROP POLICY IF EXISTS "Users can delete meetings" ON public.meetings;
CREATE POLICY "Users can delete meetings" ON public.meetings
  FOR DELETE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('operationeel_verantwoordelijke', 'business_developer', 'admin')
    )
  );

DROP TRIGGER IF EXISTS update_meetings_updated_at ON public.meetings;
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
