-- Check if profile exists for siemon.basstanie@kalibermaatwerk.be
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Find the user in auth.users
SELECT 
  id, 
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE email = 'siemon.basstanie@kalibermaatwerk.be';

-- Step 2: Check if profile exists for this user
SELECT 
  p.id, 
  p.email, 
  p.full_name, 
  p.role,
  p.created_at
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'siemon.basstanie@kalibermaatwerk.be';

-- Step 3: If no profile exists, create one with admin role
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as full_name,
  'admin'::user_role as role
FROM auth.users
WHERE email = 'siemon.basstanie@kalibermaatwerk.be'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin'::user_role,
  email = EXCLUDED.email;

-- Step 4: Verify profile was created/updated
SELECT 
  p.id, 
  p.email, 
  p.full_name, 
  p.role,
  p.created_at
FROM public.profiles p
WHERE p.email = 'siemon.basstanie@kalibermaatwerk.be';

-- Step 5: Check all profiles in the database
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles
ORDER BY created_at DESC;

