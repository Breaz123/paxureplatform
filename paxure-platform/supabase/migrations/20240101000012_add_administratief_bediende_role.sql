-- Migration: Add 'administratief_bediende' role to user_role ENUM
-- This adds the new role for administrative staff
--
-- IMPORTANT: Enum values must be committed before they can be used in policies.
-- This migration is split into two parts that must be run separately:
-- 
-- PART 1: Add the enum value (run this first)
-- PART 2: Update policies (run this after PART 1 is committed)

-- ============================================
-- PART 1: Add enum value
-- ============================================
-- Run this part first, then wait for it to complete before running PART 2

DO $$ 
BEGIN
  -- Check if 'administratief_bediende' already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'administratief_bediende' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'administratief_bediende';
  END IF;
END $$;

-- ============================================
-- PART 2: Update policies
-- ============================================
-- IMPORTANT: Only run this part AFTER PART 1 has been successfully committed
-- If you get an error about "unsafe use of new value", it means PART 1 hasn't been committed yet
-- In Supabase SQL Editor, run PART 1 first, wait for success, then run PART 2

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
