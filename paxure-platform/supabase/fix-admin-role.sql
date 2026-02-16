-- Script to manually set a user's role to 'admin'
-- Replace 'YOUR_USER_EMAIL' with your actual email address

-- First, make sure 'admin' exists in the enum
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'admin' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'admin';
  END IF;
END $$;

-- Update your profile to admin role
-- IMPORTANT: Replace 'YOUR_USER_EMAIL' with your actual email address
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'YOUR_USER_EMAIL';  -- Replace with your email

-- Verify the update
SELECT 
  id,
  email,
  full_name,
  role
FROM public.profiles
WHERE email = 'YOUR_USER_EMAIL';  -- Replace with your email

