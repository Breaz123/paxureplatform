-- Diagnostic script to check user role and permissions
-- Replace 'YOUR_USER_EMAIL' with your actual email address

-- Check your user profile and role
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles
WHERE email = 'YOUR_USER_EMAIL';  -- Replace with your email

-- Check all admin users
SELECT 
  id,
  email,
  full_name,
  role
FROM public.profiles
WHERE role = 'admin';

-- Check current policies for profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

