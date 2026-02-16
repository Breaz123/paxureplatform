-- Emergency fix: Create profile for a specific user and set to admin
-- Replace 'YOUR_EMAIL' with your actual email address

-- Step 1: Find your user ID
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL';

-- Step 2: Create or update your profile
-- Replace 'YOUR_USER_ID' with the ID from step 1
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as full_name,
  'admin'::user_role as role
FROM auth.users
WHERE email = 'YOUR_EMAIL'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin'::user_role,
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, profiles.full_name);

-- Step 3: Verify
SELECT * FROM public.profiles WHERE email = 'YOUR_EMAIL';

-- Step 4: Check if you can read your own profile (test RLS)
-- This should return your profile
SELECT * FROM public.profiles WHERE id = auth.uid();

