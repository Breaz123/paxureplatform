-- STEP 2: Update policies to include 'administratief_bediende'
-- Run this AFTER step 1 has been successfully completed
-- Only run this if step 1 completed without errors

-- Weekplanning policies
DROP POLICY IF EXISTS "Coaches can manage weekplanning" ON public.weekplanning;
CREATE POLICY "Coaches can manage weekplanning" ON public.weekplanning
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Maandplanning policies
DROP POLICY IF EXISTS "Coaches can manage maandplanning" ON public.maandplanning;
CREATE POLICY "Coaches can manage maandplanning" ON public.maandplanning
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Documents policies
DROP POLICY IF EXISTS "Coaches can manage documents" ON public.documents;
CREATE POLICY "Coaches can manage documents" ON public.documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Klanten policies
DROP POLICY IF EXISTS "Coaches can manage klanten" ON public.klanten;
CREATE POLICY "Coaches can manage klanten" ON public.klanten
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- SOPs policies
DROP POLICY IF EXISTS "Coaches can manage sops" ON public.sops;
CREATE POLICY "Coaches can manage sops" ON public.sops
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Opleidingen policies
DROP POLICY IF EXISTS "Coaches can manage opleidingen" ON public.opleidingen;
CREATE POLICY "Coaches can manage opleidingen" ON public.opleidingen
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Verlof policies
DROP POLICY IF EXISTS "Coaches can manage verlof" ON public.verlof;
CREATE POLICY "Coaches can manage verlof" ON public.verlof
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Profiles policies (update existing)
DROP POLICY IF EXISTS "Coaches can insert profiles" ON public.profiles;
CREATE POLICY "Coaches can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

DROP POLICY IF EXISTS "Coaches can update profiles" ON public.profiles;
CREATE POLICY "Coaches can update profiles" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

DROP POLICY IF EXISTS "Coaches can manage profiles" ON public.profiles;
CREATE POLICY "Coaches can manage profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

