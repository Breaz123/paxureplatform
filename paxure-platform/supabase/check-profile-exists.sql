-- Check if your profile exists and what role it has
-- Replace 'YOUR_EMAIL' with your actual email address

-- Check if profile exists
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles
WHERE email = 'YOUR_EMAIL';  -- Replace with your email

-- Check all profiles (if you have admin access)
SELECT 
  id,
  email,
  full_name,
  role
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- Check if your auth user exists but profile doesn't
SELECT 
  au.id,
  au.email,
  au.created_at as auth_created_at,
  p.id as profile_id,
  p.role as profile_role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE au.email = 'YOUR_EMAIL';  -- Replace with your email

