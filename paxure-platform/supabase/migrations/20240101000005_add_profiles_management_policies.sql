-- Migration: Add RLS policies for coaches to manage profiles
-- This allows coaches and above to INSERT and UPDATE profiles for other users
-- Fixes "User not allowed" error when creating or editing medewerkers

-- Allow all authenticated users to view all profiles (for dropdowns, etc.)
DROP POLICY IF EXISTS "All authenticated users can view profiles" ON public.profiles;
CREATE POLICY "All authenticated users can view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow coaches and above to INSERT profiles (for creating new medewerkers)
DROP POLICY IF EXISTS "Coaches can insert profiles" ON public.profiles;
CREATE POLICY "Coaches can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Allow coaches and above to UPDATE any profile (for editing medewerkers)
DROP POLICY IF EXISTS "Coaches can update profiles" ON public.profiles;
CREATE POLICY "Coaches can update profiles" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

