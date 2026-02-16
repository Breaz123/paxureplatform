-- Diagnostic script to check enum status
-- Run this to see what's wrong with the user_role enum

-- Check if enum exists
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') 
    THEN 'Enum EXISTS' 
    ELSE 'Enum DOES NOT EXIST' 
  END as enum_status;

-- If enum exists, show all its values
SELECT 
  enumlabel as enum_value,
  enumsortorder as sort_order
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
ORDER BY enumsortorder;

-- Check if profiles table exists and what role values it has
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles')
    THEN 'Profiles table EXISTS' 
    ELSE 'Profiles table DOES NOT EXIST' 
  END as profiles_table_status;

-- If profiles table exists, check what role values are in use
SELECT 
  role::text as current_role_value,
  COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY count DESC;

-- Check for invalid role values (if any)
SELECT 
  id,
  email,
  role::text as current_role
FROM public.profiles
WHERE role::text NOT IN (
  SELECT enumlabel::text 
  FROM pg_enum 
  WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
);

