-- Migration: Ensure capaciteiten columns exist in profiles table
-- This is a safety migration to ensure all capaciteiten columns are present
-- Run this if you're getting "column not found" errors

-- Add capaciteiten columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS capaciteiten_goed TEXT[] DEFAULT '{}';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS capaciteiten_gemiddeld TEXT[] DEFAULT '{}';

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS capaciteiten_slecht TEXT[] DEFAULT '{}';

-- Add comments if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description 
    WHERE objoid = 'public.profiles'::regclass 
    AND objsubid = (
      SELECT attnum FROM pg_attribute 
      WHERE attrelid = 'public.profiles'::regclass 
      AND attname = 'capaciteiten_goed'
    )
  ) THEN
    COMMENT ON COLUMN public.profiles.capaciteiten_goed IS 'Array van vaardigheden waar de medewerker goed in is';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description 
    WHERE objoid = 'public.profiles'::regclass 
    AND objsubid = (
      SELECT attnum FROM pg_attribute 
      WHERE attrelid = 'public.profiles'::regclass 
      AND attname = 'capaciteiten_gemiddeld'
    )
  ) THEN
    COMMENT ON COLUMN public.profiles.capaciteiten_gemiddeld IS 'Array van vaardigheden waar de medewerker gemiddeld in is';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_description 
    WHERE objoid = 'public.profiles'::regclass 
    AND objsubid = (
      SELECT attnum FROM pg_attribute 
      WHERE attrelid = 'public.profiles'::regclass 
      AND attname = 'capaciteiten_slecht'
    )
  ) THEN
    COMMENT ON COLUMN public.profiles.capaciteiten_slecht IS 'Array van vaardigheden waar de medewerker slecht in is of verbetering nodig heeft';
  END IF;
END $$;


