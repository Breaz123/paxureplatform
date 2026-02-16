-- Fix invalid role values in profiles table
-- This script updates invalid role values to valid ones

-- First, show what needs to be fixed
SELECT 
  'Profiles with invalid roles that need to be fixed:' as info,
  id,
  email,
  role::text as current_invalid_role
FROM public.profiles
WHERE role::text NOT IN (
  SELECT enumlabel::text 
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
);

-- Update 'hoofdmaatwerkcoach' to 'coach' (or another appropriate role)
-- You can change 'coach' to any other valid role if needed
UPDATE public.profiles
SET role = 'coach'::user_role
WHERE role::text = 'hoofdmaatwerkcoach';

-- Verify the fix
SELECT 
  'After fix - all roles should be valid:' as info,
  role::text as role_value,
  COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY count DESC;

