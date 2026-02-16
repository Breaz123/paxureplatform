-- Test script to verify create_profile_safe function works
-- Run this in Supabase SQL Editor to test the function

-- First, check if the function exists
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'create_profile_safe';

-- Test the function with a dummy user ID (replace with actual user ID from auth.users)
-- This will show if the function can be called without errors
-- Note: Replace '00000000-0000-0000-0000-000000000000' with an actual user ID from auth.users

-- First, get a user ID to test with
SELECT id, email FROM auth.users LIMIT 1;

-- Then test the function (uncomment and replace USER_ID with actual ID)
-- SELECT * FROM public.create_profile_safe(
--   'USER_ID_HERE'::uuid,
--   'test@example.com',
--   'Test User',
--   'admin'::user_role
-- );

-- Check if check_user_role function exists
SELECT 
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'check_user_role';

-- Check current RLS policies on profiles
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

