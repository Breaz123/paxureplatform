-- Create a function to insert profiles that bypasses RLS
-- This function uses SECURITY DEFINER to run as the function owner (postgres)
-- which bypasses all RLS policies
-- Run this in Supabase Dashboard → SQL Editor

-- First, drop the old function if it exists (in case return type changed)
DROP FUNCTION IF EXISTS public.create_profile_safe(UUID, TEXT, TEXT, user_role);

-- Now create the new function
CREATE OR REPLACE FUNCTION public.create_profile_safe(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_role user_role DEFAULT 'maatwerker'::user_role
)
RETURNS TABLE(
  result_id UUID,
  result_email TEXT,
  result_full_name TEXT,
  result_role user_role,
  result_created_at TIMESTAMPTZ,
  result_updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update profile
  RETURN QUERY
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    p_user_id,
    p_email,
    COALESCE(p_full_name, split_part(p_email, '@', 1)),
    p_role
  )
  ON CONFLICT (id) 
  DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW()
  RETURNING 
    profiles.id,
    profiles.email,
    profiles.full_name,
    profiles.role,
    profiles.created_at,
    profiles.updated_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_profile_safe(UUID, TEXT, TEXT, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile_safe(UUID, TEXT, TEXT, user_role) TO service_role;

-- Test the function (optional - uncomment to test)
-- SELECT * FROM public.create_profile_safe(
--   auth.uid(),
--   (SELECT email FROM auth.users WHERE id = auth.uid()),
--   NULL,
--   'admin'::user_role
-- );

