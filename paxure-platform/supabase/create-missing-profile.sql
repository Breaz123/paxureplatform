-- Create a profile for a user if it doesn't exist
-- This can happen if the profile wasn't created during signup
-- Replace 'YOUR_EMAIL' and 'YOUR_USER_ID' with actual values

-- First, find your user ID
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL';  -- Replace with your email

-- Then create the profile (replace YOUR_USER_ID with the ID from above)
-- And replace 'admin' with the role you want
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  'admin'::user_role as role  -- Change 'admin' to your desired role
FROM auth.users
WHERE email = 'YOUR_EMAIL'  -- Replace with your email
AND id NOT IN (SELECT id FROM public.profiles);

-- Verify the profile was created
SELECT * FROM public.profiles WHERE email = 'YOUR_EMAIL';  -- Replace with your email

