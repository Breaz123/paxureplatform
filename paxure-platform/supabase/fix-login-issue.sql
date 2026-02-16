-- Fix login issue by ensuring:
-- 1. User can read their own profile (RLS policy)
-- 2. Profile exists for the user
-- 3. Admin role exists in enum

-- Step 1: Make sure admin role exists in enum
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

-- Step 2: Ensure users can always read their own profile
-- This policy should already exist, but we'll recreate it to be sure
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Step 3: Create missing profiles for existing users
-- This will create profiles for any auth.users that don't have one
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
  'maatwerker'::user_role as role
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Check which users need profiles
SELECT 
  au.id,
  au.email,
  CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'OK' END as profile_status,
  p.role as current_role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
ORDER BY au.created_at DESC;

-- Step 5: Verify RLS policies are correct
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles'
AND policyname LIKE '%view own%'
ORDER BY policyname;

