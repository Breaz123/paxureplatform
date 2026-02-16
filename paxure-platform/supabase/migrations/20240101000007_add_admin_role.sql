-- Migration: Add 'admin' role to user_role ENUM and update all policies
-- This migration adds 'admin' as a valid role and grants admin users all management permissions

-- Add 'admin' to the user_role ENUM type
DO $$ 
BEGIN
  -- Check if 'admin' already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'admin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'admin';
  END IF;
END $$;

-- Update all policies to include 'admin' role
-- Note: We need to recreate policies because PostgreSQL doesn't support ALTER POLICY for role lists

-- Weekplanning policies
DROP POLICY IF EXISTS "Coaches can manage weekplanning" ON public.weekplanning;
CREATE POLICY "Coaches can manage weekplanning" ON public.weekplanning
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Maandplanning policies
DROP POLICY IF EXISTS "Coaches can manage maandplanning" ON public.maandplanning;
CREATE POLICY "Coaches can manage maandplanning" ON public.maandplanning
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Documents policies
DROP POLICY IF EXISTS "Coaches can manage documents" ON public.documents;
CREATE POLICY "Coaches can manage documents" ON public.documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Klanten policies
DROP POLICY IF EXISTS "Coaches can manage klanten" ON public.klanten;
CREATE POLICY "Coaches can manage klanten" ON public.klanten
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- SOPs policies
DROP POLICY IF EXISTS "Coaches can manage sops" ON public.sops;
CREATE POLICY "Coaches can manage sops" ON public.sops
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Opleidingen policies
DROP POLICY IF EXISTS "Coaches can manage opleidingen" ON public.opleidingen;
CREATE POLICY "Coaches can manage opleidingen" ON public.opleidingen
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

DROP POLICY IF EXISTS "Coaches can manage registraties" ON public.opleiding_registraties;
CREATE POLICY "Coaches can manage registraties" ON public.opleiding_registraties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Evaluaties policies
DROP POLICY IF EXISTS "Coaches can manage evaluaties" ON public.evaluaties;
CREATE POLICY "Coaches can manage evaluaties" ON public.evaluaties
  FOR ALL USING (
    coach_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Profiles management policies
DROP POLICY IF EXISTS "Coaches can manage profiles" ON public.profiles;
CREATE POLICY "Coaches can manage profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

DROP POLICY IF EXISTS "Coaches can view all profiles" ON public.profiles;
CREATE POLICY "Coaches can view all profiles" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Storage policies (if they exist)
-- Note: These might need to be updated manually in Supabase Dashboard → Storage → Policies

