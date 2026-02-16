-- Script to create a profile for the current logged-in user
-- This bypasses RLS by using SECURITY DEFINER
-- Run this in Supabase Dashboard → SQL Editor while logged in

-- Step 1: Check if your profile exists
SELECT 
  id, 
  email, 
  full_name, 
  role 
FROM public.profiles 
WHERE id = auth.uid();

-- Step 2: If no profile exists, create one
-- This will create a profile with role 'coach' so you can manage medewerkers
-- Change 'coach' to 'admin' if you want admin access
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as full_name,
  'coach'::user_role as role  -- Change to 'admin' if you want admin access
FROM auth.users
WHERE id = auth.uid()
ON CONFLICT (id) 
DO UPDATE SET 
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

-- Step 3: Verify your profile was created
SELECT 
  id, 
  email, 
  full_name, 
  role,
  created_at,
  updated_at
FROM public.profiles 
WHERE id = auth.uid();

-- Step 4: If you want to change your role to admin (optional)
-- UPDATE public.profiles 
-- SET role = 'admin'::user_role
-- WHERE id = auth.uid();

