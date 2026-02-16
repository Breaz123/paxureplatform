-- Fix RLS policies to ensure users can read their own profile
-- This script ensures the correct order and priority of policies

-- First, drop all existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "All authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Coaches can view all profiles" ON public.profiles;

-- Recreate policies in the correct order (most specific first)
-- 1. Users can always view their own profile (highest priority)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 2. All authenticated users can view all profiles (for dropdowns, etc.)
-- This is needed for coaches to check their own role when inserting/updating profiles
CREATE POLICY "All authenticated users can view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Note: The "Coaches can view all profiles" policy is redundant since
-- "All authenticated users can view profiles" already covers this

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

