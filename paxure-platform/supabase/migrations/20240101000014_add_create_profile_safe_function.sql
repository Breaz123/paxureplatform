-- Migration: Add create_profile_safe function
-- This function allows creating profiles while bypassing RLS using SECURITY DEFINER
-- Used by the API to create profiles for new medewerkers and auto-create missing profiles

-- Drop the old function if it exists (in case return type changed)
DROP FUNCTION IF EXISTS public.create_profile_safe(UUID, TEXT, TEXT, user_role);

-- Create the function
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

-- Grant execute permission to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.create_profile_safe(UUID, TEXT, TEXT, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_profile_safe(UUID, TEXT, TEXT, user_role) TO service_role;

