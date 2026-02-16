-- Migration: Fix infinite recursion in profiles RLS policies
-- The problem: Policies use EXISTS (SELECT FROM profiles) which causes recursion
-- Solution: Use check_user_role() function which bypasses RLS with SECURITY DEFINER

-- First, ensure the check_user_role function exists
CREATE OR REPLACE FUNCTION public.check_user_role(allowed_roles text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  user_role text;
  user_id uuid;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();
  
  -- Read directly from profiles table (bypasses RLS because of SECURITY DEFINER)
  -- The function runs as the function owner (postgres), not the calling user
  SELECT p.role::text INTO user_role
  FROM public.profiles p
  WHERE p.id = user_id;
  
  -- Return true if role matches any of the allowed roles
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN user_role = ANY(allowed_roles);
END;
$$;

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.check_user_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_role(text[]) TO service_role;

-- Now fix the policies that cause recursion
-- Drop the problematic policies
DROP POLICY IF EXISTS "Coaches can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can view all profiles" ON public.profiles;

-- Recreate them using the check_user_role function (no recursion)
CREATE POLICY "Coaches can insert profiles" ON public.profiles
  FOR INSERT 
  WITH CHECK (
    public.check_user_role(ARRAY['admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer'])
  );

CREATE POLICY "Coaches can update profiles" ON public.profiles
  FOR UPDATE 
  USING (
    auth.uid() = id OR
    public.check_user_role(ARRAY['admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer'])
  );

-- Note: "Coaches can manage profiles" and "Coaches can view all profiles" are redundant
-- because "All authenticated users can view profiles" already exists and covers viewing
-- and the INSERT/UPDATE policies above cover management

