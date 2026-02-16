-- Debug script: Check if profiles exist and what the issue might be
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Check if your profile exists
SELECT 
  'Your Profile Check' as check_type,
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
FROM public.profiles 
WHERE email = 'siemon.basstanie@kalibermaatwerk.be';

-- Step 2: Check all profiles in the database
SELECT 
  'All Profiles' as check_type,
  COUNT(*) as total_profiles
FROM public.profiles;

-- Step 3: Check if the create_profile_safe function exists
SELECT 
  'Function Check' as check_type,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'create_profile_safe';

-- Step 4: Test the function directly (will create your profile if it doesn't exist)
SELECT 
  'Function Test' as check_type,
  *
FROM public.create_profile_safe(
  (SELECT id FROM auth.users WHERE email = 'siemon.basstanie@kalibermaatwerk.be' LIMIT 1),
  'siemon.basstanie@kalibermaatwerk.be',
  'Siemon Basstanie',
  'admin'::user_role
);

-- Step 5: Verify your profile now exists
SELECT 
  'Final Check' as check_type,
  id,
  email,
  full_name,
  role
FROM public.profiles 
WHERE email = 'siemon.basstanie@kalibermaatwerk.be';

