-- STEP 1: Add 'administratief_bediende' to the user_role ENUM
-- Run this FIRST in Supabase SQL Editor
-- Wait for it to complete successfully before running step 2

DO $$ 
BEGIN
  -- Check if 'administratief_bediende' already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'administratief_bediende' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'administratief_bediende';
  END IF;
END $$;

