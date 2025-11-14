-- Migration: Add missing RLS policies for multiple tables
-- This fixes the issue where these tables had RLS enabled but no policies defined

-- Opleidingen policies
DROP POLICY IF EXISTS "Authenticated users can view opleidingen" ON public.opleidingen;
CREATE POLICY "Authenticated users can view opleidingen" ON public.opleidingen
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Coaches can manage opleidingen" ON public.opleidingen;
CREATE POLICY "Coaches can manage opleidingen" ON public.opleidingen
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Vaardighedenmatrix policies
DROP POLICY IF EXISTS "Authenticated users can view vaardighedenmatrix" ON public.vaardighedenmatrix;
CREATE POLICY "Authenticated users can view vaardighedenmatrix" ON public.vaardighedenmatrix
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Coaches can manage vaardighedenmatrix" ON public.vaardighedenmatrix;
CREATE POLICY "Coaches can manage vaardighedenmatrix" ON public.vaardighedenmatrix
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Opleiding registraties policies
DROP POLICY IF EXISTS "Users can view own registraties" ON public.opleiding_registraties;
CREATE POLICY "Users can view own registraties" ON public.opleiding_registraties
  FOR SELECT USING (
    medewerker_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

DROP POLICY IF EXISTS "Coaches can manage registraties" ON public.opleiding_registraties;
CREATE POLICY "Coaches can manage registraties" ON public.opleiding_registraties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Klanten policies
DROP POLICY IF EXISTS "Authenticated users can view klanten" ON public.klanten;
CREATE POLICY "Authenticated users can view klanten" ON public.klanten
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Coaches can manage klanten" ON public.klanten;
CREATE POLICY "Coaches can manage klanten" ON public.klanten
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- SOPs policies
DROP POLICY IF EXISTS "Authenticated users can view sops" ON public.sops;
CREATE POLICY "Authenticated users can view sops" ON public.sops
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Coaches can manage sops" ON public.sops;
CREATE POLICY "Coaches can manage sops" ON public.sops
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Weekplanning policies
DROP POLICY IF EXISTS "Authenticated users can view weekplanning" ON public.weekplanning;
CREATE POLICY "Authenticated users can view weekplanning" ON public.weekplanning
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Coaches can manage weekplanning" ON public.weekplanning;
CREATE POLICY "Coaches can manage weekplanning" ON public.weekplanning
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Maandplanning policies
DROP POLICY IF EXISTS "Authenticated users can view maandplanning" ON public.maandplanning;
CREATE POLICY "Authenticated users can view maandplanning" ON public.maandplanning
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Coaches can manage maandplanning" ON public.maandplanning;
CREATE POLICY "Coaches can manage maandplanning" ON public.maandplanning
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Evaluaties policies
DROP POLICY IF EXISTS "Users can view own evaluaties" ON public.evaluaties;
CREATE POLICY "Users can view own evaluaties" ON public.evaluaties
  FOR SELECT USING (
    medewerker_id = auth.uid() OR
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('operationeel_verantwoordelijke', 'business_developer')
    )
  );

DROP POLICY IF EXISTS "Coaches can manage evaluaties" ON public.evaluaties;
CREATE POLICY "Coaches can manage evaluaties" ON public.evaluaties
  FOR ALL USING (
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('operationeel_verantwoordelijke', 'business_developer')
    )
  );

