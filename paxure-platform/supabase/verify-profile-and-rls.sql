-- Verification script: Check if your profile exists and RLS policies are correct
-- Run this in Supabase Dashboard → SQL Editor while logged in

-- Step 1: Check if your profile exists
SELECT 
  'Profile Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) 
    THEN '✓ Profile exists'
    ELSE '✗ Profile does NOT exist'
  END as status,
  id,
  email,
  full_name,
  role
FROM public.profiles 
WHERE id = auth.uid();

-- Step 2: Check your current user ID and email
SELECT 
  'Auth User Check' as check_type,
  auth.uid() as user_id,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

-- Step 3: Check RLS policies on profiles table
SELECT 
  'RLS Policies Check' as check_type,
  policyname,
  cmd as operation,
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

-- Step 4: Test if you can read your own profile (RLS test)
SELECT 
  'RLS Read Test' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
    THEN '✓ Can read own profile'
    ELSE '✗ Cannot read own profile (RLS issue)'
  END as status;

-- Step 5: Check if check_user_role function exists
SELECT 
  'Function Check' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'check_user_role'
    )
    THEN '✓ check_user_role function exists'
    ELSE '✗ check_user_role function does NOT exist'
  END as status;

-- Step 6: If profile doesn't exist, show instructions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) THEN
    RAISE NOTICE '⚠️ Your profile does NOT exist!';
    RAISE NOTICE 'Run create-current-user-profile.sql to create it.';
  ELSE
    RAISE NOTICE '✓ Your profile exists!';
  END IF;
END $$;

