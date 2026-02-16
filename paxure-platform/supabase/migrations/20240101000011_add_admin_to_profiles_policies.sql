-- Migration: Add 'admin' role to profiles management policies
-- This ensures admin users can insert and update profiles
-- This updates both the old policies (from 20240101000005) and the new policies (from 20240101000007)

-- Update old policies: "Coaches can insert profiles" and "Coaches can update profiles"
-- Allow coaches and above (including admin) to INSERT profiles (for creating new medewerkers)
DROP POLICY IF EXISTS "Coaches can insert profiles" ON public.profiles;
CREATE POLICY "Coaches can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Allow coaches and above (including admin) to UPDATE any profile (for editing medewerkers)
-- Note: Users can still update their own profile via the "Users can update own profile" policy
DROP POLICY IF EXISTS "Coaches can update profiles" ON public.profiles;
CREATE POLICY "Coaches can update profiles" ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Update new policies: "Coaches can manage profiles" and "Coaches can view all profiles"
-- Allow coaches and above (including admin) to manage profiles
DROP POLICY IF EXISTS "Coaches can manage profiles" ON public.profiles;
CREATE POLICY "Coaches can manage profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'coach', 'hulpcoach', 'operationeel_verantwoordelijke', 'business_developer')
    )
  );

-- Allow coaches and above (including admin) to view all profiles
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

