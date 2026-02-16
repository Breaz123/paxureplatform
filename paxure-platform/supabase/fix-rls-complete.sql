-- Complete RLS fix for profiles table
-- This fixes the "User not allowed" error and ensures users can read their own profile
-- It also allows coaches to manage profiles without infinite recursion
--
-- Step 1: Drop ALL existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "All authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Step 2: Create simple, non-recursive policies
-- Users can ALWAYS view their own profile (no role check needed)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Users can ALWAYS update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Users can insert their own profile (for auto-creation)
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- All authenticated users can view all profiles (for dropdowns, etc.)
-- This is safe because it doesn't check roles and prevents recursion
CREATE POLICY "All authenticated users can view profiles" ON public.profiles
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Step 3: Create a security definer function to check user role without RLS
-- This function bypasses RLS by using SECURITY DEFINER and reading directly
-- The function runs as the function owner (postgres), not the calling user
-- This prevents infinite recursion when policies try to check user roles
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
  -- The function runs as the function owner, not the calling user
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_user_role(text[]) TO authenticated;

-- Step 4: Coaches and above can insert profiles for others
-- This uses the function which bypasses RLS, preventing recursion
CREATE POLICY "Coaches can insert profiles" ON public.profiles
  FOR INSERT 
  WITH CHECK (
    public.check_user_role(ARRAY['admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer'])
  );

-- Step 5: Coaches and above can update any profile
-- Allow users to update their own profile OR coaches to update others
CREATE POLICY "Coaches can update profiles" ON public.profiles
  FOR UPDATE 
  USING (
    auth.uid() = id OR
    public.check_user_role(ARRAY['admin', 'coach', 'hulpcoach', 'administratief_bediende', 'operationeel_verantwoordelijke', 'business_developer'])
  );

-- Step 6: Verify policies
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as has_using,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as has_with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
